import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI, userAPI } from '../services/api';
import { User } from '../types';
import { validateToken } from '../utils/authUtils';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { firstName: string; lastName: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  isUser: () => boolean;
  hasPermission: (permission: string) => boolean;
  refreshUserProfile: () => Promise<void>;
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

  // Validate token and load user profile
  const validateTokenAndLoadProfile = async (token: string): Promise<boolean> => {
    try {
      const result = await validateToken();
      
      if (result.isValid && result.user) {
        const profileData = result.user;
        
        const userData: User = {
          id: profileData.id,
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          email: profileData.email,
          role: profileData.role as 'ADMIN' | 'USER',
          organizationId: profileData.organizationId || '',
          enabled: profileData.enabled !== false,
          createdAt: profileData.createdAt || new Date().toISOString(),
          updatedAt: profileData.updatedAt || new Date().toISOString(),
          lastLogin: profileData.lastLogin
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        console.warn('Token validation failed:', result.error);
        return false;
      }
    } catch (error: any) {
      console.warn('Token validation failed:', error.message);
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (!token) {
        setIsLoading(false);
        return;
      }

      // Set token in API headers
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          
          // Validate token in background
          const isValid = await validateTokenAndLoadProfile(token);
          if (!isValid) {
            // Try token refresh
            try {
              const refreshResponse = await authAPI.refresh(token);
              const newToken = refreshResponse.data?.token;
              if (newToken) {
                localStorage.setItem('token', newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                
                // Try to validate with new token
                const newTokenValid = await validateTokenAndLoadProfile(newToken);
                if (!newTokenValid) {
                  console.warn('Token refresh succeeded but profile still unavailable');
                }
              }
            } catch (refreshError: any) {
              console.warn('Token refresh failed:', refreshError.message);
            }
          }
        } catch (parseError) {
          console.warn('Failed to parse saved user:', parseError);
          // Try to validate token and load profile
          await validateTokenAndLoadProfile(token);
        }
      } else {
        // No saved user, try to load profile with token
        await validateTokenAndLoadProfile(token);
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
      } catch (error) {
        console.warn('Proactive token refresh failed:', error);
        // Don't clear auth data, let the interceptor handle it
      }
    }, 10 * 60 * 1000); // every 10 minutes (reduced from 15 minutes)
    
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

  const refreshUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await validateTokenAndLoadProfile(token);
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
    }
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
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      signup, 
      logout, 
      isAdmin, 
      isUser, 
      hasPermission,
      refreshUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};