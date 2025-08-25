// API Configuration
// Update these endpoints to match your external services

export const API_CONFIG = {
  // Backend API (your Spring Boot application) - using VM IP for development
  BACKEND_BASE_URL: 'http://20.57.36.66:8100',
  
  // PDF Processing is handled by the backend, no direct frontend calls needed
  
  // Example endpoints:
  // PDF_PROCESSING_API_URL: 'https://your-pdf-service.com/api',
  // PDF_PROCESSING_API_URL: 'https://api.example.com/v1/pdf',
  
  // Timeouts - Removed for better user experience
  // REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Environment-specific configurations
export const getApiConfig = () => {
  const env = import.meta.env.MODE || 'production';
  
  switch (env) {
    case 'production':
      return {
        ...API_CONFIG,
        BACKEND_BASE_URL: 'http://20.57.36.66:8100', // Production backend URL
      };
    case 'development':
      return {
        ...API_CONFIG,
        BACKEND_BASE_URL: 'http://20.57.36.66:8100', // VM backend URL for development
      };
    default:
      return API_CONFIG;
  }
};

