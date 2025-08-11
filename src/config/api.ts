// API Configuration
// Update these endpoints to match your external services

export const API_CONFIG = {
  // Backend API (your Spring Boot application)
  BACKEND_BASE_URL: 'http://localhost:8100/api',
  
  // External PDF Processing API
  PDF_PROCESSING_API_URL: 'YOUR_EXTERNAL_API_ENDPOINT', // Replace with your actual endpoint
  
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
        PDF_PROCESSING_API_URL: import.meta.env.VITE_PDF_API_URL || API_CONFIG.PDF_PROCESSING_API_URL,
      };
    case 'development':
      return {
        ...API_CONFIG,
        PDF_PROCESSING_API_URL: import.meta.env.VITE_PDF_API_URL || API_CONFIG.PDF_PROCESSING_API_URL,
      };
    default:
      return API_CONFIG;
  }
};

