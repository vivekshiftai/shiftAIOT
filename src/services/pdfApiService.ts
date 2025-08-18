import { getApiConfig } from '../config/api';

// PDF Processing API Service
// This service handles communication with external PDF processing API only

export interface PDFUploadRequest {
  file: File;
}

export interface PDFUploadResponse {
  success: boolean;
  message: string;
  pdf_name: string;
  chunks_processed: number;
  processing_time: string;
  collection_name: string;
}

export interface PDFQueryRequest {
  pdf_name: string;
  query: string;
  top_k?: number;
}

export interface PDFQueryResponse {
  success: boolean;
  message: string;
  response: string;
  chunks_used: string[];
  images: string[];
  tables: string[];
  processing_time: string;
}

export interface PDFListResponse {
  success: boolean;
  pdfs: Array<{
    collection_name: string;
    pdf_name: string;
    created_at: string;
    chunk_count: number;
  }>;
  total_count: number;
}

export interface IoTRule {
  condition: string;
  action: string;
  category: string;
  priority: string;
}

export interface MaintenanceTask {
  task: string;
  frequency: string;
  category: string;
  description: string;
}

export interface SafetyInformation {
  type: string;
  title: string;
  description: string;
  category: string;
}

export interface RulesGenerationResponse {
  success: boolean;
  pdf_name: string;
  rules: IoTRule[];
  processing_time: string;
}

export interface MaintenanceGenerationResponse {
  success: boolean;
  pdf_name: string;
  maintenance_tasks: MaintenanceTask[];
  processing_time: string;
}

export interface SafetyGenerationResponse {
  success: boolean;
  pdf_name: string;
  safety_information: SafetyInformation[];
  processing_time: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  components: {
    upload: string;
    query: string;
    pdfs: string;
    rules: string;
    maintenance: string;
    safety: string;
  };
}

// Simplified PDF API Service - External API Calls Only
export class PDFApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiConfig().PDF_PROCESSING_API_URL;
  }

  // Upload PDF to external API
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    try {
      console.log('PDF API Service: Starting upload to', `${this.baseUrl}/upload/pdf`);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/upload/pdf`, {
        method: 'POST',
        body: formData,
      });

      console.log('PDF API Service: Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF API Service: Upload failed:', response.status, response.statusText, errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF API Service: Upload successful:', result);
      return result as PDFUploadResponse;

    } catch (error) {
      console.error('PDF API Service: Upload error:', error);
      throw error;
    }
  }

  // Query PDF content
  async queryPDF(request: PDFQueryRequest): Promise<PDFQueryResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result as PDFQueryResponse;

    } catch (error) {
      console.error('PDF query API error:', error);
      throw error;
    }
  }

  // List all PDFs
  async listPDFs(page: number = 1, limit: number = 10): Promise<PDFListResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/pdfs?page=${page}&limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result as PDFListResponse;

    } catch (error) {
      console.error('PDF list API error:', error);
      throw error;
    }
  }

  // Generate IoT Rules from PDF
  async generateRules(pdfName: string): Promise<RulesGenerationResponse> {
    try {
      console.log('PDF API Service: Generating rules for', pdfName, 'at', `${this.baseUrl}/generate-rules/${encodeURIComponent(pdfName)}`);
      
      const response = await fetch(`${this.baseUrl}/generate-rules/${encodeURIComponent(pdfName)}`, {
        method: 'POST',
      });

      console.log('PDF API Service: Rules generation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF API Service: Rules generation failed:', response.status, response.statusText, errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF API Service: Rules generation successful:', result);
      return result as RulesGenerationResponse;

    } catch (error) {
      console.error('PDF API Service: Rules generation error:', error);
      throw error;
    }
  }

  // Generate Maintenance Schedule from PDF
  async generateMaintenance(pdfName: string): Promise<MaintenanceGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-maintenance/${encodeURIComponent(pdfName)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result as MaintenanceGenerationResponse;

    } catch (error) {
      console.error('PDF maintenance generation API error:', error);
      throw error;
    }
  }

  // Generate Safety Information from PDF
  async generateSafety(pdfName: string): Promise<SafetyGenerationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-safety/${encodeURIComponent(pdfName)}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      return result as SafetyGenerationResponse;

    } catch (error) {
      console.error('PDF safety generation API error:', error);
      throw error;
    }
  }

  // Health check for the external API
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }
      return await response.json() as HealthCheckResponse;
    } catch (error) {
      console.error('PDF API health check failed:', error);
      throw error;
    }
  }

  // Get service information
  async getServiceInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      if (!response.ok) {
        throw new Error(`Service info failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('PDF API service info failed:', error);
      throw error;
    }
  }
}

// Export a default instance
export const pdfApiService = new PDFApiService();
