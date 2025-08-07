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
      console.log('AuthProvider - Checking authentication status');
      
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('AuthProvider - Found saved user:', parsedUser.email);
          setUser(parsedUser);
        } catch (error) {
          console.error('AuthProvider - Failed to parse saved user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        console.log('AuthProvider - No saved session found');
        setUser(null);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    console.log('AuthProvider - Login attempt for:', email);
    
    try {
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
      
      console.log('AuthProvider - Login successful, user role:', user.role);
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
    } catch (error) {
      console.error('AuthProvider - Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: { firstName: string; lastName: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => {
    console.log('AuthProvider - Signup attempt for:', data.email, 'role:', data.role);
    
    try {
      const response = await authAPI.register(data);
      const user = response.data;
      
      console.log('AuthProvider - Signup successful, user role:', user.role);
      
      // Don't automatically log in after signup - user should login separately
      setUser(null);
    } catch (error) {
      console.error('AuthProvider - Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('AuthProvider - Logging out user');
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