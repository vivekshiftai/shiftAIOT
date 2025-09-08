import { api } from './api';

export interface UnifiedQueryRequest {
  query: string;
}

export interface UnifiedQueryResponse {
  success: boolean;
  query: string;
  queryType: 'DATABASE' | 'PDF' | 'MIXED' | 'LLM_ANSWER' | 'UNKNOWN';
  response: string;
  processingTime: number;
  databaseResults?: Array<Record<string, any>>;
  rowCount?: number;
  sqlQuery?: string;
  error?: string;
}

export interface QuerySuggestionsResponse {
  success: boolean;
  suggestions: string[];
  context?: string;
  error?: string;
}

/**
 * Service for unified queries (both PDF and database)
 */
export class UnifiedQueryService {
  /**
   * Send a unified query that can be routed to either PDF or database
   */
  static async sendUnifiedQuery(request: UnifiedQueryRequest): Promise<UnifiedQueryResponse> {
    try {
      
      const response = await api.post('/knowledge/unified-query', request);
      
      
      // Validate response structure
      if (!response.data) {
        throw new Error('Empty response from backend');
      }
      
      if (response.data.success === false) {
        throw new Error(response.data.error || 'Backend returned error');
      }
      
      return response.data as UnifiedQueryResponse;
      
    } catch (error: any) {
      console.error('❌ Unified query failed:', error);
      
      // Provide more detailed error information
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
   * Get query suggestions
   */
  static async getQuerySuggestions(context?: string): Promise<QuerySuggestionsResponse> {
    try {
      console.log('🔍 Getting query suggestions with context:', context);
      
      // Check if we have a valid token before making the request
      const token = localStorage.getItem('token');
      console.log('🔍 Token check for query suggestions:', token ? 'exists' : 'not found');
      
      const params = context ? { context } : {};
      const response = await api.get('/knowledge/suggestions', { params });
      
      console.log('✅ Query suggestions response:', response.data);
      return response.data as QuerySuggestionsResponse;
      
    } catch (error: any) {
      console.error('❌ Failed to get query suggestions:', error);
      
      // Provide more detailed error information
      if (error.response) {
        console.error('Backend response status:', error.response.status);
        console.error('Backend response data:', error.response.data);
        console.error('Backend response headers:', error.response.headers);
        
        // Check if it's an authentication error
        if (error.response.status === 401) {
          console.error('🔐 Authentication error - checking token validity');
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found. Please log in again.');
          } else {
            throw new Error('Authentication token is invalid or expired. Please log in again.');
          }
        }
        
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
   * Get query type icon
   */
  static getQueryTypeIcon(type: string): string {
    switch (type) {
      case 'DATABASE':
        return '📊';
      case 'PDF':
        return '📄';
      case 'MIXED':
        return '🔄';
      case 'LLM_ANSWER':
        return '🤖';
      default:
        return '❓';
    }
  }

  /**
   * Get query type color
   */
  static getQueryTypeColor(type: string): string {
    switch (type) {
      case 'DATABASE':
        return 'text-blue-600';
      case 'PDF':
        return 'text-green-600';
      case 'MIXED':
        return 'text-purple-600';
      case 'LLM_ANSWER':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * Format database results for display
   */
  static formatDatabaseResults(results: Array<Record<string, any>>, maxResults: number = 5): string {
    if (!results || results.length === 0) {
      return 'No results found.';
    }
    
    let formatted = `Found ${results.length} result${results.length === 1 ? '' : 's'}:\n\n`;
    
    const displayResults = results.slice(0, maxResults);
    
    displayResults.forEach((result, index) => {
      formatted += `${index + 1}. `;
      
      const keyValues = Object.entries(result)
        .filter(([, value]) => value !== null && value !== undefined)
        .map(([key, value]) => `${key}: ${value}`)
        .slice(0, 3); // Show first 3 fields
      
      formatted += keyValues.join(', ');
      
      if (Object.keys(result).length > 3) {
        formatted += ` (+${Object.keys(result).length - 3} more fields)`;
      }
      
      formatted += '\n';
    });
    
    if (results.length > maxResults) {
      formatted += `\n... and ${results.length - maxResults} more results.`;
    }
    
    return formatted;
  }
}
