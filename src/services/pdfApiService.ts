import { getApiConfig } from '../config/api';

// PDF Processing API Service
// This service handles communication with your external PDF processing API

export interface PDFProcessingRequest {
  deviceName: string;
  deviceType: string;
  manufacturer: string;
  model: string;
  files: File[];
  fileTypes: string[];
}

export interface PDFProcessingResponse {
  success: boolean;
  rules: Array<{
    name: string;
    description: string;
    condition: string;
    action: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    recommended: boolean;
  }>;
  message?: string;
  error?: string;
}

export class PDFApiService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiConfig().PDF_PROCESSING_API_URL;
  }

  async processPDF(request: PDFProcessingRequest): Promise<PDFProcessingResponse> {
    try {
      const formData = new FormData();
      
      // Add device information
      formData.append('deviceName', request.deviceName);
      formData.append('deviceType', request.deviceType);
      formData.append('manufacturer', request.manufacturer);
      formData.append('model', request.model);
      
      // Add files
      request.files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
        formData.append(`fileType_${index}`, request.fileTypes[index]);
      });

      const response = await fetch(`${this.baseUrl}/process-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as PDFProcessingResponse;

    } catch (error) {
      console.error('PDF processing API error:', error);
      throw error;
    }
  }

  // Health check for the external API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('PDF API health check failed:', error);
      return false;
    }
  }
}

// Export a default instance
export const pdfApiService = new PDFApiService();
