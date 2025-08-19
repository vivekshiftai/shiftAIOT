// PDF Processing Service - Consolidated
// This service handles all PDF processing operations including MinerU integration

import { getApiConfig } from '../../config/api';

// PDF Processing API Service
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

export interface PDFImage {
  filename: string;
  data: string; // Base64 encoded image data
  mime_type: string;
  size: number;
}

export interface PDFQueryResponse {
  success: boolean;
  message: string;
  response: string;
  chunks_used: string[];
  images: PDFImage[];
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

// Consolidated PDF Processing Service
export class PDFProcessingService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiConfig().PDF_PROCESSING_API_URL;
  }

  // Upload PDF to MinerU processing service
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading PDF to MinerU service:', `${this.baseUrl}/upload-pdf`);

      const response = await fetch(`${this.baseUrl}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinerU API call failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF uploaded to MinerU successfully:', result);
      return result as PDFUploadResponse;

    } catch (error) {
      console.error('PDF upload to MinerU failed:', error);
      throw error;
    }
  }

  // Query PDF content with MinerU
  async queryPDF(request: PDFQueryRequest): Promise<PDFQueryResponse> {
    try {
      console.log('Querying PDF with MinerU:', request);

      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinerU query failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF query with MinerU successful:', result);
      return result as PDFQueryResponse;

    } catch (error) {
      console.error('PDF query with MinerU failed:', error);
      throw error;
    }
  }

  // List all processed PDFs from MinerU
  async listPDFs(page: number = 1, limit: number = 10): Promise<PDFListResponse> {
    try {
      console.log('Listing PDFs from MinerU service');

      const response = await fetch(`${this.baseUrl}/pdfs?page=${page}&limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinerU list failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF list from MinerU successful:', result);
      return result as PDFListResponse;

    } catch (error) {
      console.error('PDF list from MinerU failed:', error);
      throw error;
    }
  }

  // Generate IoT Rules from PDF using MinerU
  async generateRules(pdfName: string): Promise<RulesGenerationResponse> {
    try {
      console.log('Generating IoT rules with MinerU for:', pdfName);

      const response = await fetch(`${this.baseUrl}/generate/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_name: pdfName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinerU rules generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('IoT rules generation with MinerU successful:', result);
      return result as RulesGenerationResponse;

    } catch (error) {
      console.error('IoT rules generation with MinerU failed:', error);
      throw error;
    }
  }

  // Generate Maintenance Schedule from PDF using MinerU
  async generateMaintenance(pdfName: string): Promise<MaintenanceGenerationResponse> {
    try {
      console.log('Generating maintenance schedule with MinerU for:', pdfName);

      const response = await fetch(`${this.baseUrl}/generate/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_name: pdfName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinerU maintenance generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Maintenance generation with MinerU successful:', result);
      return result as MaintenanceGenerationResponse;

    } catch (error) {
      console.error('Maintenance generation with MinerU failed:', error);
      throw error;
    }
  }

  // Generate Safety Information from PDF using MinerU
  async generateSafety(pdfName: string): Promise<SafetyGenerationResponse> {
    try {
      console.log('Generating safety information with MinerU for:', pdfName);

      const response = await fetch(`${this.baseUrl}/generate/safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdf_name: pdfName }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MinerU safety generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Safety generation with MinerU successful:', result);
      return result as SafetyGenerationResponse;

    } catch (error) {
      console.error('Safety generation with MinerU failed:', error);
      throw error;
    }
  }

  // Health check for MinerU service
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      console.log('Checking MinerU service health');

      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`MinerU health check failed: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log('MinerU health check successful:', result);
      return result as HealthCheckResponse;
    } catch (error) {
      console.error('MinerU health check failed:', error);
      throw error;
    }
  }

  // Get MinerU service information
  async getServiceInfo(): Promise<any> {
    try {
      console.log('Getting MinerU service info');

      const response = await fetch(`${this.baseUrl}/`);
      if (!response.ok) {
        throw new Error(`MinerU service info failed: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log('MinerU service info successful:', result);
      return result;
    } catch (error) {
      console.error('MinerU service info failed:', error);
      throw error;
    }
  }
}

// Export a default instance
export const pdfProcessingService = new PDFProcessingService();
