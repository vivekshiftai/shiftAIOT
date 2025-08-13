import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
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
    const checkAuth = () => {
      console.log('AuthProvider - Checking authentication...');
      
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      console.log('AuthProvider - Saved user:', savedUser ? 'exists' : 'not found');
      console.log('AuthProvider - Token:', token ? 'exists' : 'not found');
      
      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('AuthProvider - Setting user:', parsedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error('AuthProvider - Failed to parse saved user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log('AuthProvider - No saved user or token, setting user to null');
        setUser(null);
      }
      
      console.log('AuthProvider - Setting isLoading to false');
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Add a listener for storage changes to keep user state in sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'token') {
        console.log('AuthProvider - Storage changed, rechecking auth');
        const savedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (savedUser && token) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch (error) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    // Listen for storage events (cross-tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events (same-tab)
    const handleCustomStorageChange = () => {
      console.log('AuthProvider - Custom storage change detected');
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (error) {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storageChange', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storageChange', handleCustomStorageChange);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext - Starting login process...');
      
      const response = await authAPI.login({ email, password });
      
      console.log('AuthContext - Login response received:', response.data);
      
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
      
      console.log('AuthContext - Created user object:', user);
      console.log('AuthContext - Storing token and user in localStorage...');
      
      // Store in localStorage first
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Dispatch custom event for same-tab storage change
      window.dispatchEvent(new Event('storageChange'));
      
      // Then update the state
      console.log('AuthContext - Setting user state...');
      setUser(user);
      
      console.log('AuthContext - Login completed successfully');
      
      // Force a small delay to ensure state is updated before any redirects
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error('AuthContext - Login failed with error:', error);
      throw error;
    }
  };

  const signup = async (data: { firstName: string; lastName: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => {
    
    try {
      const response = await authAPI.register(data);
      const user = response.data;
      
      // Don't automatically log in after signup - user should login separately
      setUser(null);
    } catch (error) {
      console.error('AuthProvider - Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Dispatch custom event for same-tab storage change
    window.dispatchEvent(new Event('storageChange'));
  };

  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const isUser = () => {
    return user?.role === 'USER';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    if (isAdmin()) {
      return true; // Admin has all permissions
    }
    
    // Check specific permissions for USER role
            switch (permission) {
          case 'DEVICE_READ':
          case 'RULE_READ':
          case 'NOTIFICATION_READ':
          case 'KNOWLEDGE_READ':
          case 'USER_READ':
            return true; // USER can read devices, rules, notifications, knowledge, and users
          case 'DEVICE_WRITE':
          case 'DEVICE_DELETE':
          case 'RULE_WRITE':
          case 'RULE_DELETE':
          case 'USER_WRITE':
          case 'USER_DELETE':
          case 'NOTIFICATION_WRITE':
          case 'KNOWLEDGE_WRITE':
          case 'KNOWLEDGE_DELETE':
            return false; // USER cannot perform write/delete actions
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
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};