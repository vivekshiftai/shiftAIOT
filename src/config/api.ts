// API Configuration
// All URLs are now configurable via environment variables

export const API_CONFIG = {
  // Backend API - configurable via environment variables
  // Fallback to VM IP for production deployment
  BACKEND_BASE_URL: import.meta.env.VITE_BACKEND_BASE_URL || 'http://20.57.36.66:8100',
  
  // PDF Processing and Strategy Agent are handled by the backend, no direct frontend calls needed
  
  // Retry configuration
  MAX_RETRIES: parseInt(import.meta.env.VITE_MAX_RETRIES || '3'),
  RETRY_DELAY: parseInt(import.meta.env.VITE_RETRY_DELAY || '1000'), // 1 second
};

// Environment-specific configurations
export const getApiConfig = () => {
  // All URLs are now configurable via environment variables
  // No need for hardcoded environment-specific URLs
  return {
    ...API_CONFIG,
    // Environment-specific overrides can be added here if needed
    // but it's better to use environment variables
  };
};

