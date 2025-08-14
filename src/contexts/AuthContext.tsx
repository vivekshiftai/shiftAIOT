import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI, userAPI } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { firstName: string; lastName: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isUser: () => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      }

      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          try {
            await userAPI.getProfile();
          } catch {
            try {
              const res = await authAPI.refresh(token);
              const newToken = res.data?.token;
              if (newToken) {
                localStorage.setItem('token', newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
              }
            } catch {
              // Do not clear session; keep user until explicit logout
            }
          }
        } catch {
          // If user parse fails, keep token and wait for app flows; do not clear
        }
      }

      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Proactive token refresh timer
  useEffect(() => {
    const interval = setInterval(async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await authAPI.refresh(token);
        const newToken = res.data?.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          window.dispatchEvent(new Event('storageChange'));
        }
      } catch {
        // ignore; interceptor will handle on demand
      }
    }, 15 * 60 * 1000); // every 15 minutes
    return () => clearInterval(interval);
  }, []);

  // Keep user state in sync with storage
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
      } else {
        delete api.defaults.headers.common.Authorization;
      }

      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storageChange', handleStorageChange as any);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storageChange', handleStorageChange as any);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authAPI.login({ email, password });
    const { token, id, name, email: userEmail, role, organizationId } = response.data;

    const user: User = {
      id,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      email: userEmail,
      role: role as 'ADMIN' | 'USER',
      organizationId,
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    window.dispatchEvent(new Event('storageChange'));
    setUser(user);
  };

  const signup = async (data: { firstName: string; lastName: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => {
    await authAPI.register(data);
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setUser(null);
    window.dispatchEvent(new Event('storageChange'));
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isUser = () => user?.role === 'USER';

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (isAdmin()) return true;
    switch (permission) {
      case 'DEVICE_READ':
      case 'RULE_READ':
      case 'NOTIFICATION_READ':
      case 'KNOWLEDGE_READ':
      case 'USER_READ':
        return true;
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, isAdmin, isUser, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};