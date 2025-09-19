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
    StoresBetween25And50: boolean;
    QuantityBetween50KAnd200K: boolean;
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
  customer_id: string;
  timestamp: string;
  CustomerInfo: CustomerInfo;
  CustomerClassification: CustomerClassification;
  AcceptedRecommendations: Recommendation[];
  RejectedRecommendations: Recommendation[];
  AlreadyPurchasedRecommendations: Recommendation[];
  Summary: {
    TotalUpSell: number;
    TotalCrossSell: number;
    TotalRejected: number;
    TotalAlreadyPurchased: number;
    TotalRecommendations: number;
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
      
      // Validate input
      if (!customerId || typeof customerId !== 'string') {
        throw new Error('Invalid customer ID provided');
      }
      
      const request: GenerateRecommendationsRequest = {
        customer_id: customerId
      };
      
      const response = await api.post('/api/strategy-agent/generate-recommendations', request);
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data received from backend');
      }
      
      // Remove PerformanceStats if present (as requested)
      if (data.PerformanceStats) {
        delete data.PerformanceStats;
        logInfo('StrategyAgent', 'Removed PerformanceStats from response as requested');
      }
      
      // Validate required fields
      if (!data.Summary || !data.CustomerInfo || !data.CustomerClassification) {
        throw new Error('Incomplete response data - missing required fields');
      }
      
      // Ensure arrays exist and validate structure
      const validatedData: StrategyAgentResponse = {
        ...data,
        AcceptedRecommendations: (data.AcceptedRecommendations || []).map((rec: any) => ({
          ...rec,
          ProductName: rec.ProductName || 'Unknown Product',
          QuantityRequired: rec.QuantityRequired || 0,
          Ingredients: rec.Ingredients || [],
          CrossSell: (rec.CrossSell || []).map((cs: any) => ({
            ...cs,
            SuggestedProduct: cs.SuggestedProduct || 'Unknown Product',
            Price: cs.Price || 0,
            Category: cs.Category || 'N/A',
            Similarity: cs.Similarity || 0,
            AIReasoning: cs.AIReasoning || 'No reasoning provided'
          }))
        })),
        RejectedRecommendations: (data.RejectedRecommendations || []).map((rec: any) => ({
          ...rec,
          ProductName: rec.ProductName || 'Unknown Product',
          QuantityRequired: rec.QuantityRequired || 0,
          Ingredients: rec.Ingredients || [],
          RejectedCrossSell: (rec.RejectedCrossSell || []).map((cs: any) => ({
            ...cs,
            SuggestedProduct: cs.SuggestedProduct || 'Unknown Product',
            Price: cs.Price || 0,
            Category: cs.Category || 'N/A',
            Similarity: cs.Similarity || 0,
            AIReasoning: cs.AIReasoning || 'No reasoning provided'
          }))
        })),
        AlreadyPurchasedRecommendations: (data.AlreadyPurchasedRecommendations || []).map((rec: any) => ({
          ...rec,
          ProductName: rec.ProductName || 'Unknown Product',
          QuantityRequired: rec.QuantityRequired || 0,
          Ingredients: rec.Ingredients || [],
          AlreadyPurchasedCrossSell: (rec.AlreadyPurchasedCrossSell || []).map((cs: any) => ({
            ...cs,
            SuggestedProduct: cs.SuggestedProduct || 'Unknown Product',
            Price: cs.Price || 0,
            Category: cs.Category || 'N/A',
            Similarity: cs.Similarity || 0,
            AIReasoning: cs.AIReasoning || 'No reasoning provided'
          }))
        })),
        Summary: {
          TotalUpSell: data.Summary.TotalUpSell || 0,
          TotalCrossSell: data.Summary.TotalCrossSell || 0,
          TotalRejected: data.Summary.TotalRejected || 0,
          TotalAlreadyPurchased: data.Summary.TotalAlreadyPurchased || 0,
          TotalRecommendations: data.Summary.TotalRecommendations || 0
        },
        CustomerInfo: {
          CustomerID: data.CustomerInfo?.CustomerID || 'N/A',
          CustomerName: data.CustomerInfo?.CustomerName || 'N/A'
        },
        CustomerClassification: {
          CustomerType: data.CustomerClassification?.CustomerType || 'N/A',
          TotalQuantitySold: data.CustomerClassification?.TotalQuantitySold || 0,
          NumberOfStores: data.CustomerClassification?.NumberOfStores || 0,
          ClassificationCriteria: data.CustomerClassification?.ClassificationCriteria || {
            StoresGreaterThan50: false,
            QuantityGreaterThan200K: false,
            StoresBetween25And50: false,
            QuantityBetween50KAnd200K: false
          }
        }
      };
      
      logInfo('StrategyAgent', 'Recommendations generated successfully', {
        customerId,
        totalRecommendations: validatedData.Summary.TotalRecommendations,
        accepted: validatedData.AcceptedRecommendations.length,
        rejected: validatedData.RejectedRecommendations.length,
        alreadyPurchased: validatedData.AlreadyPurchasedRecommendations.length
      });
      
      return validatedData;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to generate recommendations', error);
      
      if (error.response) {
        logError('StrategyAgent', 'Backend response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received from backend', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'Request setup error', error, { message: error.message });
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
        logError('StrategyAgent', 'PDF download response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`PDF download error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received for PDF download', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'PDF download request setup error', error, { message: error.message });
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
        logError('StrategyAgent', 'Health check response error', error, { status: error.response.status, data: error.response.data });
        return {
          status: 'unhealthy',
          error: `Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`
        };
      } else if (error.request) {
        logError('StrategyAgent', 'No response received for health check', error, { request: error.request });
        return {
          status: 'unhealthy',
          error: 'No response from backend - check if backend is running'
        };
      } else {
        logError('StrategyAgent', 'Health check request setup error', error, { message: error.message });
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
  static async getAvailableCustomers(): Promise<Array<{ id: string; name: string; type?: string; country?: string; region?: string; totalStores?: number }>> {
    try {
      logInfo('StrategyAgent', 'Getting available customers from backend');
      
      const response = await api.get('/api/strategy-agent/customers');
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      const customers = data.customers || [];
      
      // Transform the customer data to match our expected format
      const transformedCustomers = customers.map((customer: any) => ({
        id: customer.customer_id || customer.id,
        name: customer.customer_name || customer.name,
        type: customer.customer_type,
        country: customer.country,
        region: customer.region,
        totalStores: customer.total_stores
      }));
      
      logInfo('StrategyAgent', 'Available customers retrieved successfully', { 
        totalCustomers: transformedCustomers.length,
        totalCustomersFromAPI: data.total_customers || data.total,
        success: data.success,
        source: data.source || 'unknown'
      });
      
      return transformedCustomers;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to get available customers', error);
      
      // Fallback to static list if backend fails
      logInfo('StrategyAgent', 'Falling back to static customer list');
      return [
        { id: 'C001', name: 'Starbucks', type: 'Licensed', country: 'International', region: 'Middle East', totalStores: 99 },
        { id: 'C002', name: 'McDonald\'s', type: 'Corporate', country: 'United States', region: 'National', totalStores: 4 },
        { id: 'C003', name: 'Walmart', type: 'Corporate', country: 'United States', region: 'National', totalStores: 99 }
      ];
    }
  }
  
  /**
   * Get customer details by ID from backend
   */
  static async getCustomerDetails(customerId: string): Promise<any> {
    try {
      logInfo('StrategyAgent', `Getting customer details for ID: ${customerId}`);
      
      const response = await api.get(`/api/strategy-agent/customers/${customerId}`);
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const customerDetails = response.data;
      
      logInfo('StrategyAgent', 'Customer details retrieved successfully', { 
        customerId,
        customerName: customerDetails.customer_name
      });
      
      return customerDetails;
      
    } catch (error: any) {
      logError('StrategyAgent', `Failed to get customer details for ID: ${customerId}`, error);
      throw error;
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
        logError('StrategyAgent', 'Service info response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received for service info', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'Service info request setup error', error, { message: error.message });
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
        logError('StrategyAgent', 'Connection test response error', error, { status: error.response.status, data: error.response.data });
        return {
          connected: false,
          message: `Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`
        };
      } else if (error.request) {
        logError('StrategyAgent', 'No response received for connection test', error, { request: error.request });
        return {
          connected: false,
          message: 'No response from backend - check if backend is running'
        };
      } else {
        logError('StrategyAgent', 'Connection test request setup error', error, { message: error.message });
        return {
          connected: false,
          message: `Request failed: ${error.message}`
        };
      }
    }
  }

  /**
   * Get recommendations for all customers
   */
  static async getAllCustomerRecommendations(): Promise<{
    success: boolean;
    message: string;
    total_customers: number;
    recommendations: StrategyAgentResponse[];
  }> {
    try {
      logInfo('StrategyAgent', 'Getting recommendations for all customers from backend');
      
      const response = await api.get('/api/strategy-agent/recommendations/all');
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data received from backend');
      }
      
      // Remove PerformanceStats if present (as requested)
      if (data.recommendations && Array.isArray(data.recommendations)) {
        data.recommendations.forEach((rec: any) => {
          if (rec.PerformanceStats) {
            delete rec.PerformanceStats;
          }
        });
        logInfo('StrategyAgent', 'Removed PerformanceStats from all customer recommendations');
      }
      
      // Validate required fields
      if (!data.recommendations || !Array.isArray(data.recommendations)) {
        throw new Error('Incomplete response data - missing recommendations array');
      }
      
      // Transform and validate each recommendation
      const validatedRecommendations = data.recommendations.map((rec: any) => {
        // Ensure arrays exist and validate structure
        return {
          ...rec,
          AcceptedRecommendations: (rec.AcceptedRecommendations || []).map((item: any) => ({
            ...item,
            ProductName: item.ProductName || 'Unknown Product',
            QuantityRequired: item.QuantityRequired || 0,
            Ingredients: item.Ingredients || [],
            CrossSell: (item.CrossSell || []).map((cs: any) => ({
              ...cs,
              SuggestedProduct: cs.SuggestedProduct || 'Unknown Product',
              Price: cs.Price || 0,
              Category: cs.Category || 'N/A',
              Similarity: cs.Similarity || 0,
              AIReasoning: cs.AIReasoning || 'No reasoning provided'
            }))
          })),
          RejectedRecommendations: (rec.RejectedRecommendations || []).map((item: any) => ({
            ...item,
            ProductName: item.ProductName || 'Unknown Product',
            QuantityRequired: item.QuantityRequired || 0,
            Ingredients: item.Ingredients || [],
            RejectedCrossSell: (item.RejectedCrossSell || []).map((cs: any) => ({
              ...cs,
              SuggestedProduct: cs.SuggestedProduct || 'Unknown Product',
              Price: cs.Price || 0,
              Category: cs.Category || 'N/A',
              Similarity: cs.Similarity || 0,
              AIReasoning: cs.AIReasoning || 'No reasoning provided'
            }))
          })),
          AlreadyPurchasedRecommendations: (rec.AlreadyPurchasedRecommendations || []).map((item: any) => ({
            ...item,
            ProductName: item.ProductName || 'Unknown Product',
            QuantityRequired: item.QuantityRequired || 0,
            Ingredients: item.Ingredients || [],
            AlreadyPurchasedCrossSell: (item.AlreadyPurchasedCrossSell || []).map((cs: any) => ({
              ...cs,
              SuggestedProduct: cs.SuggestedProduct || 'Unknown Product',
              Price: cs.Price || 0,
              Category: cs.Category || 'N/A',
              Similarity: cs.Similarity || 0,
              AIReasoning: cs.AIReasoning || 'No reasoning provided'
            }))
          })),
          Summary: {
            TotalUpSell: rec.Summary?.TotalUpSell || 0,
            TotalCrossSell: rec.Summary?.TotalCrossSell || 0,
            TotalRejected: rec.Summary?.TotalRejected || 0,
            TotalAlreadyPurchased: rec.Summary?.TotalAlreadyPurchased || 0,
            TotalRecommendations: rec.Summary?.TotalRecommendations || 0
          },
          CustomerInfo: {
            CustomerID: rec.CustomerInfo?.CustomerID || 'N/A',
            CustomerName: rec.CustomerInfo?.CustomerName || 'N/A'
          },
          CustomerClassification: rec.CustomerClassification || {
            CustomerType: 'N/A',
            TotalQuantitySold: 0,
            NumberOfStores: 0,
            ClassificationCriteria: {
              StoresGreaterThan50: false,
              QuantityGreaterThan200K: false,
              StoresBetween25And50: false,
              QuantityBetween50KAnd200K: false
            }
          }
        };
      });
      
      logInfo('StrategyAgent', 'All customer recommendations retrieved successfully', { 
        totalCustomers: data.total_customers,
        success: data.success,
        message: data.message,
        source: data.source
      });
      
      return {
        success: data.success || true,
        message: data.message || 'Successfully loaded customer recommendations',
        total_customers: data.total_customers || validatedRecommendations.length,
        recommendations: validatedRecommendations
      };
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to get all customer recommendations', error);
      
      if (error.response) {
        logError('StrategyAgent', 'Backend response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received from backend', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'Request setup error', error, { message: error.message });
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Download PDF report for all customers
   */
  static async downloadAllCustomersPDFReport(): Promise<Blob> {
    try {
      logInfo('StrategyAgent', 'Downloading PDF report for all customers from backend');
      
      const response = await api.get('/api/strategy-agent/recommendations/download/all', {
        responseType: 'blob'
      });
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      logInfo('StrategyAgent', 'PDF report for all customers downloaded successfully', { 
        size: blob.size,
        type: blob.type 
      });
      
      return blob;
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to download PDF report for all customers', error);
      
      if (error.response) {
        logError('StrategyAgent', 'Backend response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received from backend', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'Request setup error', error, { message: error.message });
        throw new Error(`Request failed: ${error.message}`);
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

  /**
   * Regenerate recommendations for a specific customer
   */
  static async regenerateCustomerRecommendations(customerId: string, forceRegenerate: boolean = true): Promise<{
    success: boolean;
    message: string;
    customer_id: string;
    force_regenerate: boolean;
    timestamp: number;
    source: string;
  }> {
    try {
      logInfo('StrategyAgent', 'Regenerating recommendations for customer from backend', { customerId, forceRegenerate });
      
      const response = await api.post(`/api/strategy-agent/regenerate-recommendations/${customerId}`, {
        force_regenerate: forceRegenerate
      });
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data received from backend');
      }
      
      logInfo('StrategyAgent', 'Customer recommendations regeneration triggered successfully', { 
        customerId,
        success: data.success,
        message: data.message,
        force_regenerate: data.force_regenerate,
        source: data.source
      });
      
      return {
        success: data.success || false,
        message: data.message || 'Regeneration process started',
        customer_id: data.customer_id || customerId,
        force_regenerate: data.force_regenerate || forceRegenerate,
        timestamp: data.timestamp || Date.now(),
        source: data.source || 'backend'
      };
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to regenerate recommendations for customer', error, { customerId });
      
      if (error.response) {
        logError('StrategyAgent', 'Backend response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received from backend', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'Request setup error', error, { message: error.message });
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Check regeneration status for all customers
   */
  static async checkRegenerationStatus(): Promise<{
    success: boolean;
    message: string;
    is_completed: boolean;
    progress?: number;
    timestamp: number;
  }> {
    try {
      logInfo('StrategyAgent', 'Checking regeneration status from backend');
      
      const response = await api.get('/api/strategy-agent/regeneration-status');
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data received from backend');
      }
      
      logInfo('StrategyAgent', 'Regeneration status checked', { 
        success: data.success,
        is_completed: data.is_completed,
        progress: data.progress
      });
      
      return {
        success: data.success || false,
        message: data.message || 'Status check completed',
        is_completed: data.is_completed || false,
        progress: data.progress,
        timestamp: data.timestamp || Date.now()
      };
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to check regeneration status', error);
      
      if (error.response) {
        logError('StrategyAgent', 'Regeneration status check response error', error, { status: error.response.status, data: error.response.data });
        return {
          success: false,
          message: `Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`,
          is_completed: false,
          timestamp: Date.now()
        };
      } else if (error.request) {
        logError('StrategyAgent', 'No response received for regeneration status check', error, { request: error.request });
        return {
          success: false,
          message: 'No response from backend - check if backend is running',
          is_completed: false,
          timestamp: Date.now()
        };
      } else {
        logError('StrategyAgent', 'Regeneration status check request setup error', error, { message: error.message });
        return {
          success: false,
          message: `Request failed: ${error.message}`,
          is_completed: false,
          timestamp: Date.now()
        };
      }
    }
  }

  /**
   * Regenerate recommendations for all customers
   */
  static async regenerateAllRecommendations(forceRegenerate: boolean = true): Promise<{
    success: boolean;
    message: string;
    force_regenerate: boolean;
    timestamp: number;
    source: string;
    total_customers?: number;
    successful_customers?: number;
  }> {
    try {
      logInfo('StrategyAgent', 'Regenerating recommendations for all customers from backend', { forceRegenerate });
      
      const response = await api.post('/api/strategy-agent/regenerate-recommendations', {
        force_regenerate: forceRegenerate
      });
      
      if (response.status !== 200) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = response.data;
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response data received from backend');
      }
      
      logInfo('StrategyAgent', 'Recommendations regeneration triggered successfully', { 
        success: data.success,
        message: data.message,
        force_regenerate: data.force_regenerate,
        source: data.source
      });
      
      return {
        success: data.success || false,
        message: data.message || 'Regeneration process started',
        force_regenerate: data.force_regenerate || forceRegenerate,
        timestamp: data.timestamp || Date.now(),
        source: data.source || 'backend'
      };
      
    } catch (error: any) {
      logError('StrategyAgent', 'Failed to regenerate recommendations for all customers', error);
      
      if (error.response) {
        logError('StrategyAgent', 'Backend response error', error, { status: error.response.status, data: error.response.data });
        throw new Error(`Backend error (${error.response.status}): ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        logError('StrategyAgent', 'No response received from backend', error, { request: error.request });
        throw new Error('No response from backend - check if backend is running');
      } else {
        logError('StrategyAgent', 'Request setup error', error, { message: error.message });
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }

  /**
   * Helper method to trigger PDF download for all customers in browser
   */
  static triggerAllCustomersPDFDownload(blob: Blob, timestamp: string): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_customers_recommendations_report_${timestamp}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      logInfo('StrategyAgent', 'All customers PDF download triggered successfully');
    } catch (error) {
      logError('StrategyAgent', 'Failed to trigger all customers PDF download', error instanceof Error ? error : new Error('Unknown error'));
      throw new Error('Failed to trigger all customers PDF download');
    }
  }
}
