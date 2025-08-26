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
  clearAuthData: () => void;
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

  // Check for existing session on mount - NEVER auto-logout users
  useEffect(() => {
    const checkAuth = async () => {
      logInfo('Auth', 'Starting authentication check - NEVER auto-logout');
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      logInfo('Auth', `Token exists: ${!!token}`);
      logInfo('Auth', `Saved user exists: ${!!savedUser}`);

      // If we have a token, we ALWAYS try to keep the user logged in
      if (token) {
        // Set token in API headers
        tokenService.setAxiosAuthHeader(token);
        logInfo('Auth', 'Token set in API headers');

        // Try to load fresh profile from API
        try {
          const profileLoaded = await validateTokenAndLoadProfile();
          if (profileLoaded) {
            logInfo('Auth', '✅ Fresh profile loaded successfully from API');
            setIsLoading(false);
            return;
          }
        } catch (error) {
          logWarn('Auth', '⚠️ Failed to load profile from API, but keeping user logged in', undefined, error instanceof Error ? error : new Error('Unknown error'));
        }

        // If API fails, use saved user data - NEVER logout
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            logInfo('Auth', '✅ Setting user from localStorage - keeping user logged in', parsedUser);
            setUser(parsedUser);
            
            // Try token refresh in background (non-blocking)
            logInfo('Auth', '🔄 Attempting token refresh in background');
            setTimeout(async () => {
              try {
                const refreshResponse = await authAPI.refresh(token);
                const newToken = refreshResponse.data?.token;
                if (newToken) {
                  logInfo('Auth', '✅ Token refresh successful');
                  localStorage.setItem('token', newToken);
                  tokenService.setAxiosAuthHeader(newToken);
                  
                  // Try to load fresh profile with new token
                  const newProfileLoaded = await validateTokenAndLoadProfile();
                  if (newProfileLoaded) {
                    logInfo('Auth', '✅ Fresh profile loaded with new token');
                  }
                }
              } catch (refreshError: unknown) {
                logWarn('Auth', '⚠️ Token refresh failed, but keeping existing session', undefined, refreshError instanceof Error ? refreshError : new Error('Unknown error'));
                // NEVER logout on refresh failure - keep existing session
              }
            }, 1000); // Delay refresh to not block initial load
          } catch (parseError: unknown) {
            logWarn('Auth', '⚠️ Failed to parse saved user, but keeping token', undefined, parseError instanceof Error ? parseError : new Error('Unknown error'));
            // Even if user data is corrupted, keep the token and try to recover
            setUser(null);
          }
        } else {
          logInfo('Auth', '⚠️ No saved user data, but keeping token for recovery');
          setUser(null);
        }
      } else {
        logInfo('Auth', 'No token found - user not logged in');
        setUser(null);
      }

      logInfo('Auth', 'Authentication check complete - user session preserved');
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
      const { token, id, name, email: userEmail, role, organizationId, refreshToken } = response.data;

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
      tokenService.setToken(token, refreshToken);

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

  // ONLY function that should log out users - called when user clicks logout button
  const logout = () => {
    logInfo('Auth', '🚪 User explicitly logged out via logout button');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken'); // Clear refresh token too
    tokenService.removeToken();
    setUser(null);
    window.dispatchEvent(new Event('storageChange'));
  };

  // Clear all authentication data (for fixing JWT issues)
  const clearAuthData = () => {
    logInfo('Auth', '🧹 Clearing all authentication data');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
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
      clearAuthData,
      isAdmin, 
      isUser, 
      hasPermission,
      refreshUserProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};