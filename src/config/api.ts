// API Configuration
// Update these endpoints to match your external services

export const API_CONFIG = {
  // Backend API (your Spring Boot application)
  BACKEND_BASE_URL: 'http://20.57.36.66:8100',
  
  // PDF Processing is handled by the backend, no direct frontend calls needed
  
  // Example endpoints:
  // PDF_PROCESSING_API_URL: 'https://your-pdf-service.com/api',
  // PDF_PROCESSING_API_URL: 'https://api.example.com/v1/pdf',
  
  // Timeouts
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Environment-specific configurations
export const getApiConfig = () => {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...API_CONFIG,
      };
    case 'development':
      return {
        ...API_CONFIG,
      };
    default:
      return API_CONFIG;
  }
};

