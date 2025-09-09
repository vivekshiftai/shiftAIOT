import { api } from './api';
import { logError, logInfo } from '../utils/logger';

// Strategy Agent Response Interfaces
export interface CustomerInfo {
  CustomerID: string;
  CustomerName: string;
}

export interface CustomerClassification {
  CustomerType: string;
  TotalQuantitySold: number;
  NumberOfStores: number;
  ClassificationCriteria: {
    StoresGreaterThan50: boolean;
    QuantityGreaterThan200K: boolean;
  };
}

export interface CrossSellRecommendation {
  Ingredient: string;
  SuggestedProduct: string;
  ProductID: number;
  Similarity: number;
  Category: string;
  Price: number;
  AIReasoning: string;
  Status: 'Accepted' | 'Rejected' | 'Already Purchased';
}

export interface Recommendation {
  CustomerCatalogueItemID: string;
  ProductName: string;
  QuantityRequired: number;
  Ingredients: string[];
  CrossSell?: CrossSellRecommendation[];
  RejectedCrossSell?: CrossSellRecommendation[];
  AlreadyPurchasedCrossSell?: CrossSellRecommendation[];
}

export interface StrategyAgentResponse {
  success: boolean;
  message: string;
  customer_id: string;
  timestamp: string;
  CustomerInfo: CustomerInfo;
  CustomerClassification: CustomerClassification;
  AcceptedRecommendations: Recommendation[];
  RejectedRecommendations: Recommendation[];
  AlreadyPurchasedRecommendations: Recommendation[];
  Summary: {
    total_recommendations: number;
    total_rejected: number;
    total_already_purchased: number;
  };
  files_generated: {
    json_file: string;
    pdf_file: string;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  strategy_agent_status?: number;
  message?: string;
  error?: string;
}

export interface GenerateRecommendationsRequest {
  customer_id: string;
}

/**
 * Service for Strategy Agent API integration
 * All calls go through the backend proxy to avoid CORS issues
 */
export class StrategyAgentService {
  /**
   * Generate marketing intelligence recommendations for a customer
   */
  static async generateRecommendations(customerId: string): Promise<StrategyAgentResponse> {
    try {
      logInfo('StrategyAgent', `Generating recommendations for customer: ${customerId}`);
      
      const request: GenerateRecommendationsRequest = {
        customer_id: customerId
      };
      
      const response = await api.post('/api/strategy-agent/generate-recommendations', request);
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data: StrategyAgentResponse = response.data;
      
      logInfo('StrategyAgent', 'Recommendations generated successfully', {
        customerId,
        totalRecommendations: data.Summary.total_recommendations,
        accepted: data.AcceptedRecommendations.length,
        rejected: data.RejectedRecommendations.length,
        alreadyPurchased: data.AlreadyPurchasedRecommendations.length
      });
      
      return data;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to generate recommendations', error);
      
      if (error.response) {
        console.error('Backend response status:', error.response.status);
        console.error('Backend response data:', error.response.data);
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No response from backend - check if backend is running');
      } else {
        console.error('Request setup error:', error.message);
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }
  
  /**
   * Download PDF report for a customer
   */
  static async downloadPDFReport(customerId: string): Promise<Blob> {
    try {
      logInfo('StrategyAgent', `Downloading PDF report for customer: ${customerId}`);
      
      const response = await api.get(`/api/strategy-agent/recommendations/${customerId}/download`, {
        responseType: 'blob'
      });
      
      if (response.status !== 200) {
        throw new Error(`Failed to download PDF report: ${response.status} ${response.statusText}`);
      }
      
      logInfo('StrategyAgent', 'PDF report downloaded successfully', { customerId });
      
      return response.data;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to download PDF report', error);
      
      if (error.response) {
        console.error('PDF download response status:', error.response.status);
        console.error('PDF download response data:', error.response.data);
        throw new Error(`PDF download error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received for PDF download:', error.request);
        throw new Error('No response from backend - check if backend is running');
      } else {
        console.error('PDF download request setup error:', error.message);
        throw new Error(`PDF download request failed: ${error.message}`);
      }
    }
  }
  
  /**
   * Check Strategy Agent API health through backend proxy
   */
  static async healthCheck(): Promise<HealthCheckResponse> {
    try {
      logInfo('StrategyAgent', 'Checking Strategy Agent API health via backend');
      
      const response = await api.get('/api/strategy-agent/health');
      
      if (response.status !== 200) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      
      const data: HealthCheckResponse = response.data;
      
      logInfo('StrategyAgent', 'Health check completed', { 
        status: data.status,
        strategyAgentStatus: data.strategy_agent_status 
      });
      
      return data;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Health check failed', error);
      
      if (error.response) {
        console.error('Health check response status:', error.response.status);
        console.error('Health check response data:', error.response.data);
        return {
          status: 'unhealthy',
          error: `Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`
        };
      } else if (error.request) {
        console.error('No response received for health check:', error.request);
        return {
          status: 'unhealthy',
          error: 'No response from backend - check if backend is running'
        };
      } else {
        console.error('Health check request setup error:', error.message);
        return {
          status: 'unhealthy',
          error: `Request failed: ${error.message}`
        };
      }
    }
  }
  
  /**
   * Get available customers from backend
   */
  static async getAvailableCustomers(): Promise<Array<{ id: string; name: string }>> {
    try {
      logInfo('StrategyAgent', 'Getting available customers from backend');
      
      const response = await api.get('/api/strategy-agent/customers');
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      const customers = data.customers || [];
      
      logInfo('StrategyAgent', 'Available customers retrieved successfully', { 
        totalCustomers: customers.length 
      });
      
      return customers;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to get available customers', error);
      
      // Fallback to static list if backend fails
      logInfo('StrategyAgent', 'Falling back to static customer list');
      return [
        { id: 'C001', name: 'Starbucks' },
        { id: 'C002', name: 'McDonald\'s' },
        { id: 'C003', name: 'Subway' }
      ];
    }
  }
  
  /**
   * Get Strategy Agent service information
   */
  static async getServiceInfo(): Promise<any> {
    try {
      logInfo('StrategyAgent', 'Getting service information from backend');
      
      const response = await api.get('/api/strategy-agent/info');
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      logInfo('StrategyAgent', 'Service information retrieved successfully');
      
      return response.data;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to get service information', error);
      
      if (error.response) {
        console.error('Service info response status:', error.response.status);
        console.error('Service info response data:', error.response.data);
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        console.error('No response received for service info:', error.request);
        throw new Error('No response from backend - check if backend is running');
      } else {
        console.error('Service info request setup error:', error.message);
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Test Strategy Agent connection
   */
  static async testConnection(): Promise<{ connected: boolean; message: string }> {
    try {
      logInfo('StrategyAgent', 'Testing Strategy Agent connection via backend');
      
      const response = await api.post('/api/strategy-agent/test-connection');
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      logInfo('StrategyAgent', 'Connection test completed', { 
        connected: data.connected,
        message: data.message 
      });
      
      return {
        connected: data.connected,
        message: data.message
      };
      
    } catch (error: any) {
      logError('StrategyAgent', 'Connection test failed', error);
      
      if (error.response) {
        console.error('Connection test response status:', error.response.status);
        console.error('Connection test response data:', error.response.data);
        return {
          connected: false,
          message: `Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`
        };
      } else if (error.request) {
        console.error('No response received for connection test:', error.request);
        return {
          connected: false,
          message: 'No response from backend - check if backend is running'
        };
      } else {
        console.error('Connection test request setup error:', error.message);
        return {
          connected: false,
          message: `Request failed: ${error.message}`
        };
      }
    }
  }

  /**
   * Helper method to trigger PDF download in browser
   */
  static triggerPDFDownload(blob: Blob, customerId: string, timestamp: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `marketing_intelligence_report_${customerId}_${timestamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      logInfo('StrategyAgent', 'PDF download triggered successfully', { customerId });
    } catch (error) {
      logError('StrategyAgent', 'Failed to trigger PDF download', error instanceof Error ? error : new Error('Unknown error'));
      throw new Error('Failed to trigger PDF download');
    }
  }
}
