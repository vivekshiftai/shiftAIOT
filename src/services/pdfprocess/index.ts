// PDF Processing Service - Backend Integration
// This service handles all PDF processing operations through our backend API

import { getApiConfig } from '../../config/api';

// PDF Processing API Service
export interface PDFUploadRequest {
  file: File;
  organizationId: string;
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
  current_page: number;
  total_pages: number;
}

export interface IoTRule {
  rule_name: string;
  threshold: string;
  metric: string;
  metric_value: string;
  description: string;
  consequence: string;
}

export interface MaintenanceTask {
  task: string;
  frequency: string;
  category: string;
  description: string;
  priority: string;
  estimated_duration: string;
  required_tools: string;
  safety_notes: string;
}

export interface SafetyInformation {
  name: string;
  about_reaction: string;
  causes: string;
  how_to_avoid: string;
  safety_info: string;
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

export interface PDFDeleteResponse {
  success: boolean;
  message: string;
  pdf_name: string;
  deleted_at: string;
}

export interface PDFGenerationRequest {
  pdf_name: string;
  device_id: string;
  organization_id: string;
}

export interface AsyncResponse<T> {
  taskId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: T;
  error?: string;
  created_at: string;
  completed_at?: string;
}

// Utility function to calculate next maintenance date based on frequency
export function calculateNextMaintenanceDate(frequency: string, fromDate: Date = new Date()): Date {
  const nextDate = new Date(fromDate);
  
  switch (frequency.toLowerCase()) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'semi-annually':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'annually':
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    case 'bi-weekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'every 2 weeks':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'every 3 months':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'every 6 months':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'every 12 months':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly if frequency is not recognized
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
}

// Consolidated PDF Processing Service
export class PDFProcessingService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || getApiConfig().BACKEND_BASE_URL;
  }

  // Upload PDF to backend processing service
  async uploadPDF(file: File, organizationId: string): Promise<PDFUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', organizationId);

      console.log('Uploading PDF to backend service:', `${this.baseUrl}/api/pdf/upload`);

      const response = await fetch(`${this.baseUrl}/api/pdf/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend API error response:', response.status, errorText);
        throw new Error(`PDF upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF uploaded to backend successfully:', result);
      return result as PDFUploadResponse;

    } catch (error) {
      console.error('PDF upload to backend failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          throw new Error('Backend service is unavailable. Please check your internet connection and try again.');
        }
      }
      throw error;
    }
  }

  // Query PDF content through backend
  async queryPDF(request: PDFQueryRequest): Promise<PDFQueryResponse> {
    try {
      console.log('Querying PDF through backend:', request);

      const response = await fetch(`${this.baseUrl}/api/pdf/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend query failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF query through backend successful:', result);
      return result as PDFQueryResponse;

    } catch (error) {
      console.error('PDF query through backend failed:', error);
      throw error;
    }
  }

  // List all processed PDFs from backend
  async listPDFs(page: number = 0, size: number = 10): Promise<PDFListResponse> {
    try {
      console.log('Listing PDFs from backend service');

      const response = await fetch(`${this.baseUrl}/api/pdf/list?page=${page}&size=${size}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend list failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF list from backend successful:', result);
      return result as PDFListResponse;

    } catch (error) {
      console.error('PDF list from backend failed:', error);
      throw error;
    }
  }

  // Generate IoT Rules from PDF through backend
  async generateRules(pdfName: string, deviceId: string, organizationId: string): Promise<AsyncResponse<RulesGenerationResponse>> {
    try {
      console.log('Generating IoT rules through backend for:', pdfName);

      const request: PDFGenerationRequest = {
        pdf_name: pdfName,
        device_id: deviceId,
        organization_id: organizationId
      };

      const response = await fetch(`${this.baseUrl}/api/pdf/generate-rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend rules generation error:', response.status, errorText);
        throw new Error(`Rules generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('IoT rules generation through backend successful:', result);
      return result as AsyncResponse<RulesGenerationResponse>;

    } catch (error) {
      console.error('IoT rules generation through backend failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          throw new Error('Backend service is unavailable. Please check your internet connection and try again.');
        }
      }
      throw error;
    }
  }

  // Generate Maintenance Schedule from PDF through backend
  async generateMaintenance(pdfName: string, deviceId: string, organizationId: string): Promise<AsyncResponse<MaintenanceGenerationResponse>> {
    try {
      console.log('Generating maintenance schedule through backend for:', pdfName);

      const request: PDFGenerationRequest = {
        pdf_name: pdfName,
        device_id: deviceId,
        organization_id: organizationId
      };

      const response = await fetch(`${this.baseUrl}/api/pdf/generate-maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend maintenance generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Maintenance generation through backend successful:', result);
      return result as AsyncResponse<MaintenanceGenerationResponse>;

    } catch (error) {
      console.error('Maintenance generation through backend failed:', error);
      throw error;
    }
  }

  // Generate Safety Information from PDF through backend
  async generateSafety(pdfName: string, deviceId: string, organizationId: string): Promise<AsyncResponse<SafetyGenerationResponse>> {
    try {
      console.log('Generating safety information through backend for:', pdfName);

      const request: PDFGenerationRequest = {
        pdf_name: pdfName,
        device_id: deviceId,
        organization_id: organizationId
      };

      const response = await fetch(`${this.baseUrl}/api/pdf/generate-safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend safety generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Safety generation through backend successful:', result);
      return result as AsyncResponse<SafetyGenerationResponse>;

    } catch (error) {
      console.error('Safety generation through backend failed:', error);
      throw error;
    }
  }

  // Health check for backend service
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      console.log('Checking backend service health');

      const response = await fetch(`${this.baseUrl}/api/pdf/health`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      console.log('Backend health check successful:', result);
      return result as HealthCheckResponse;
    } catch (error) {
      console.error('Backend health check failed:', error);
      throw error;
    }
  }

  // Delete PDF from backend processing service
  async deletePDF(pdfName: string): Promise<PDFDeleteResponse> {
    try {
      console.log(`🗑️ [PDF Processing] Starting deletion of PDF: "${pdfName}"`);
      console.log(`🌐 [PDF Processing] DELETE request to: ${this.baseUrl}/api/pdf/${pdfName}`);

      const startTime = Date.now();
      const response = await fetch(`${this.baseUrl}/api/pdf/${pdfName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [PDF Processing] Delete failed for "${pdfName}":`, {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          duration: `${duration}ms`,
          url: `${this.baseUrl}/api/pdf/${pdfName}`
        });
        throw new Error(`PDF deletion failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ [PDF Processing] Successfully deleted "${pdfName}":`, {
        result,
        duration: `${duration}ms`,
        status: response.status
      });
      return result as PDFDeleteResponse;

    } catch (error) {
      console.error(`💥 [PDF Processing] PDF deletion failed for "${pdfName}":`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        url: `${this.baseUrl}/api/pdf/${pdfName}`
      });
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('Network Error')) {
          console.error(`🌐 [PDF Processing] Network error detected for "${pdfName}" - service may be unavailable`);
          throw new Error('Backend service is unavailable. Please check your internet connection and try again.');
        }
      }
      throw error;
    }
  }

  // Process maintenance tasks and calculate next maintenance dates
  processMaintenanceTasks(tasks: MaintenanceTask[]): MaintenanceTask[] {
    return tasks.map(task => {
      const nextMaintenanceDate = calculateNextMaintenanceDate(task.frequency);
      return {
        ...task,
        next_maintenance_date: nextMaintenanceDate.toISOString().split('T')[0], // YYYY-MM-DD format
        next_maintenance_timestamp: nextMaintenanceDate.toISOString(),
      };
    });
  }
}

// Export a default instance
export const pdfProcessingService = new PDFProcessingService();
