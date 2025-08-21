import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';
import { User } from '../types';
import { tokenService } from '../services/tokenService';
import { logInfo, logWarn, logError, logAuthSuccess, logAuthFailure } from '../utils/logger';

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
  const validateTokenAndLoadProfile = async (): Promise<boolean> => {
    logInfo('Auth', 'validateTokenAndLoadProfile called');
    try {
      const isValid = await tokenService.validateToken();
      logInfo('Auth', `Token validation result: ${isValid}`);
      
      if (isValid) {
        // Get user profile
        const response = await userAPI.getProfile();
        const profileData = response.data;
        logInfo('Auth', 'Profile data received', profileData);
        
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
        
        logInfo('Auth', 'Setting user data', userData);
        setUser(userData);
        tokenService.setUser(userData);
        return true;
      } else {
        logWarn('Auth', 'Token validation failed');
        return false;
      }
    } catch (error: unknown) {
      logWarn('Auth', 'Token validation failed', undefined, error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      logInfo('Auth', 'Starting authentication check');
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      logInfo('Auth', `Token exists: ${!!token}`);
      logInfo('Auth', `Saved user exists: ${!!savedUser}`);

      if (!token) {
        logInfo('Auth', 'No token found, setting loading to false');
        setIsLoading(false);
        return;
      }

      // Set token in API headers
      tokenService.setAxiosAuthHeader(token);
      logInfo('Auth', 'Token set in API headers');

      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          logInfo('Auth', 'Setting user from localStorage', parsedUser);
          setUser(parsedUser);
          
          // Validate token in background
          logInfo('Auth', 'Validating token in background');
          const isValid = await validateTokenAndLoadProfile();
          logInfo('Auth', `Token validation result: ${isValid}`);
          
          if (!isValid) {
            logInfo('Auth', 'Token invalid, attempting refresh');
            // Try token refresh
            try {
              const refreshResponse = await authAPI.refresh(token);
              const newToken = refreshResponse.data?.token;
              if (newToken) {
                logInfo('Auth', 'Token refresh successful');
                localStorage.setItem('token', newToken);
                tokenService.setAxiosAuthHeader(newToken);
                
                // Try to validate with new token
                const newTokenValid = await validateTokenAndLoadProfile();
                logInfo('Auth', `New token validation result: ${newTokenValid}`);
                if (!newTokenValid) {
                  logWarn('Auth', 'Token refresh succeeded but profile still unavailable');
                  // Never logout user automatically - keep existing user data
                }
              }
            } catch (refreshError: unknown) {
              logWarn('Auth', 'Token refresh failed', undefined, refreshError instanceof Error ? refreshError : new Error('Unknown error'));
              // Never logout user on refresh failure - keep existing session
            }
          }
        } catch (parseError: unknown) {
          logWarn('Auth', 'Failed to parse saved user', undefined, parseError instanceof Error ? parseError : new Error('Unknown error'));
          // Try to validate token and load profile, but never logout automatically
          await validateTokenAndLoadProfile();
        }
      } else {
        logInfo('Auth', 'No saved user, loading profile with token');
        // No saved user, try to load profile with token
        const profileLoaded = await validateTokenAndLoadProfile();
        if (!profileLoaded) {
          logWarn('Auth', 'Failed to load profile, but never logging out automatically');
          // Never logout user automatically - just keep loading state false
        }
      }

      logInfo('Auth', 'Authentication check complete, setting loading to false');
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
        tokenService.setAxiosAuthHeader(token);
      } else {
        tokenService.removeToken();
      }

      if (savedUser && token) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } catch (error: unknown) {
          logWarn('Auth', 'Failed to parse saved user', undefined, error instanceof Error ? error : new Error('Unknown error'));
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('storageChange', handleStorageChange as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('storageChange', handleStorageChange as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
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

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      tokenService.setAxiosAuthHeader(token);

      window.dispatchEvent(new Event('storageChange'));
      setUser(user);
    } catch (error: unknown) {
      logError('Auth', 'Login failed', error instanceof Error ? error : new Error('Unknown error'));
      // setError(error instanceof Error ? error.message : 'Login failed'); // This line was not in the new_code, so it's removed.
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { firstName: string; lastName: string; email: string; password: string; role: 'ADMIN' | 'USER' }) => {
    await authAPI.register(data);
    setUser(null);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    tokenService.removeToken();
    setUser(null);
    window.dispatchEvent(new Event('storageChange'));
  };

  const refreshUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      await validateTokenAndLoadProfile();
    } catch (error: unknown) {
      logWarn('Auth', 'Failed to refresh user profile', undefined, error instanceof Error ? error : new Error('Unknown error'));
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