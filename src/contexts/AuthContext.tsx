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
    console.log('AuthContext - validateTokenAndLoadProfile called');
    try {
      const result = await validateToken();
      console.log('AuthContext - validateToken result:', result);
      
      if (result.isValid && result.user) {
        const profileData = result.user;
        console.log('AuthContext - Profile data received:', profileData);
        
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
        
        console.log('AuthContext - Setting user data:', userData);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        console.warn('AuthContext - Token validation failed:', result.error);
        // Never logout user automatically - keep existing session
        return false;
      }
    } catch (error: any) {
      console.warn('AuthContext - Token validation failed:', error.message);
      // Never logout user on validation errors - keep existing session
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext - Starting authentication check');
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      console.log('AuthContext - Token exists:', !!token);
      console.log('AuthContext - Saved user exists:', !!savedUser);

      if (!token) {
        console.log('AuthContext - No token found, setting loading to false');
        setIsLoading(false);
        return;
      }

      // Set token in API headers
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      console.log('AuthContext - Token set in API headers');

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          console.log('AuthContext - Setting user from localStorage:', parsedUser);
          setUser(parsedUser);
          
          // Validate token in background
          console.log('AuthContext - Validating token in background');
          const isValid = await validateTokenAndLoadProfile(token);
          console.log('AuthContext - Token validation result:', isValid);
          
          if (!isValid) {
            console.log('AuthContext - Token invalid, attempting refresh');
            // Try token refresh
            try {
              const refreshResponse = await authAPI.refresh(token);
              const newToken = refreshResponse.data?.token;
              if (newToken) {
                console.log('AuthContext - Token refresh successful');
                localStorage.setItem('token', newToken);
                api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                
                // Try to validate with new token
                const newTokenValid = await validateTokenAndLoadProfile(newToken);
                console.log('AuthContext - New token validation result:', newTokenValid);
                if (!newTokenValid) {
                  console.warn('AuthContext - Token refresh succeeded but profile still unavailable');
                  // Never logout user automatically - keep existing user data
                }
              }
            } catch (refreshError: any) {
              console.warn('AuthContext - Token refresh failed:', refreshError.message);
              // Never logout user on refresh failure - keep existing session
            }
          }
        } catch (parseError) {
          console.warn('AuthContext - Failed to parse saved user:', parseError);
          // Try to validate token and load profile, but never logout automatically
          await validateTokenAndLoadProfile(token);
        }
      } else {
        console.log('AuthContext - No saved user, loading profile with token');
        // No saved user, try to load profile with token
        const profileLoaded = await validateTokenAndLoadProfile(token);
        if (!profileLoaded) {
          console.warn('AuthContext - Failed to load profile, but never logging out automatically');
          // Never logout user automatically - just keep loading state false
        }
      }

      console.log('AuthContext - Authentication check complete, setting loading to false');
      setIsLoading(false);
    };

    checkAuth();
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