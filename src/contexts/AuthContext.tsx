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
      
      // Set initial load flag to prevent redirects during startup
      sessionStorage.setItem('isInitialLoad', 'true');
      
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
      
      // Clear initial load flag after a short delay
      setTimeout(() => {
        sessionStorage.removeItem('isInitialLoad');
        console.log('AuthProvider - Initial load flag cleared');
      }, 2000);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext - Starting login process...');
      
      // Set login flag to prevent redirects during login
      sessionStorage.setItem('isLoggingIn', 'true');
      
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
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('AuthContext - Setting user state...');
      setUser(user);
      
      // Clear login flag after successful login
      sessionStorage.removeItem('isLoggingIn');
      
      console.log('AuthContext - Login completed successfully');
      
    } catch (error) {
      // Clear login flag on error
      sessionStorage.removeItem('isLoggingIn');
      
      console.error('AuthContext - Login failed with error:', error);
      console.error('AuthContext - Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status,
        statusText: (error as any)?.response?.statusText
      });
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
    window.location.href = '/login';
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
            return true; // USER can read devices, rules, notifications, and knowledge
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