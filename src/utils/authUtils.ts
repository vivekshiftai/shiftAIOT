import api, { authAPI, userAPI } from '../services/api';

export interface TokenValidationResult {
  isValid: boolean;
  user?: any;
  error?: string;
}

/**
 * Validates the current token and returns user data if valid
 */
export const validateToken = async (): Promise<TokenValidationResult> => {
  console.log('authUtils - validateToken called');
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('authUtils - No token found');
    return { isValid: false, error: 'No token found' };
  }

  console.log('authUtils - Token found, attempting to validate');
  try {
    // Set token in API headers
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    console.log('authUtils - Token set in API headers');
    
    // Try to get user profile
    console.log('authUtils - Calling userAPI.getProfile()');
    const response = await userAPI.getProfile();
    console.log('authUtils - Profile response received:', response.data);
    return { isValid: true, user: response.data };
  } catch (error: any) {
    console.log('authUtils - Profile request failed:', error.response?.status, error.message);
    if (error.response?.status === 401) {
      console.log('authUtils - 401 error, attempting token refresh');
      // Token is invalid, try to refresh
      try {
        const refreshResponse = await authAPI.refresh(token);
        const newToken = refreshResponse.data?.token;
        
        if (newToken) {
          console.log('authUtils - Token refresh successful');
          localStorage.setItem('token', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          
          // Try to get profile again with new token
          console.log('authUtils - Retrying profile request with new token');
          const profileResponse = await userAPI.getProfile();
          console.log('authUtils - Profile request with new token successful:', profileResponse.data);
          return { isValid: true, user: profileResponse.data };
        } else {
          console.log('authUtils - Token refresh failed - no new token received');
          return { isValid: false, error: 'Token refresh failed - no new token received' };
        }
      } catch (refreshError: any) {
        // Never automatically logout - keep session for graceful degradation
        console.warn('authUtils - Token refresh failed, but keeping session for graceful degradation:', refreshError.message);
        return { isValid: false, error: `Token refresh failed: ${refreshError.message}` };
      }
    } else {
      console.log('authUtils - Non-401 error:', error.message);
      // For non-401 errors, don't treat as authentication failure
      // This could be network issues, server errors, etc.
      return { isValid: false, error: `Profile validation failed: ${error.message}` };
    }
  }
};

/**
 * Ensures the current token is valid before making API calls
 */
export const ensureValidToken = async (): Promise<boolean> => {
  const result = await validateToken();
  return result.isValid;
};

/**
 * Handles authentication errors gracefully
 */
export const handleAuthError = (error: any, fallbackMessage: string = 'Authentication failed'): string => {
  // Don't show authentication errors to users - let them continue using the app
  if (error.response?.status === 401) {
    console.warn('Authentication error detected, but not showing to user');
    return 'Operation failed. Please try again.';
  } else if (error.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  } else if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  } else if (error.message?.includes('token')) {
    console.warn('Token error detected, but not showing to user');
    return 'Operation failed. Please try again.';
  }
  return error?.message || fallbackMessage;
};
