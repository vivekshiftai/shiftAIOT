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
  const token = localStorage.getItem('token');
  
  if (!token) {
    return { isValid: false, error: 'No token found' };
  }

  try {
    // Set token in API headers
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    
    // Try to get user profile
    const response = await userAPI.getProfile();
    return { isValid: true, user: response.data };
  } catch (error: any) {
    if (error.response?.status === 401) {
      // Token is invalid, try to refresh
      try {
        const refreshResponse = await authAPI.refresh(token);
        const newToken = refreshResponse.data?.token;
        
        if (newToken) {
          localStorage.setItem('token', newToken);
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          
          // Try to get profile again with new token
          const profileResponse = await userAPI.getProfile();
          return { isValid: true, user: profileResponse.data };
        } else {
          return { isValid: false, error: 'Token refresh failed - no new token received' };
        }
      } catch (refreshError: any) {
        return { isValid: false, error: `Token refresh failed: ${refreshError.message}` };
      }
    } else {
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
  if (error.response?.status === 401) {
    return 'Authentication failed. Please try again.';
  }
  return error?.message || fallbackMessage;
};
