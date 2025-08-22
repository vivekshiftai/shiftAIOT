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

export interface ProcessingStatusResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  message: string;
  pdf_name: string;
  chunks_processed: number;
  processing_time: string;
  collection_name: string;
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
  private baseUrl: string

  constructor() {
    this.baseUrl = getApiConfig().BACKEND_BASE_URL;
  }

  // Upload and process PDF files through backend
  async uploadPDF(file: File, deviceId?: string, deviceName?: string): Promise<PDFUploadResponse> {
    try {
      console.log('Uploading PDF to backend service:', file.name);

      const formData = new FormData();
      formData.append('file', file);
      if (deviceId) formData.append('deviceId', deviceId);
      if (deviceName) formData.append('deviceName', deviceName);

      const response = await fetch(`${this.baseUrl}/api/pdf/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF upload to backend successful:', result);
      return result as PDFUploadResponse;

    } catch (error) {
      console.error('PDF upload to backend failed:', error);
      throw error;
    }
  }

  // Query PDF content through backend
  async queryPDF(request: PDFQueryRequest): Promise<PDFQueryResponse> {
    try {
      console.log('Querying PDF through backend service:', request);

      const response = await fetch(`${this.baseUrl}/api/pdf/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend query failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF query from backend successful:', result);
      return result as PDFQueryResponse;

    } catch (error) {
      console.error('PDF query from backend failed:', error);
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
      console.log('Generating rules from PDF through backend service:', { pdfName, deviceId });

      const response = await fetch(`${this.baseUrl}/api/pdf/generate-rules`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_name: pdfName,
          deviceId: deviceId,
          organizationId: organizationId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend rules generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Rules generation from backend successful:', result);
      return result as AsyncResponse<RulesGenerationResponse>;

    } catch (error) {
      console.error('Rules generation from backend failed:', error);
      throw error;
    }
  }

  // Generate maintenance schedule from PDF through backend
  async generateMaintenance(pdfName: string, deviceId: string, organizationId: string): Promise<AsyncResponse<MaintenanceGenerationResponse>> {
    try {
      console.log('Generating maintenance from PDF through backend service:', { pdfName, deviceId });

      const response = await fetch(`${this.baseUrl}/api/pdf/generate-maintenance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_name: pdfName,
          deviceId: deviceId,
          organizationId: organizationId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend maintenance generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Maintenance generation from backend successful:', result);
      return result as AsyncResponse<MaintenanceGenerationResponse>;

    } catch (error) {
      console.error('Maintenance generation from backend failed:', error);
      throw error;
    }
  }

  // Generate safety precautions from PDF through backend
  async generateSafety(pdfName: string, deviceId: string, organizationId: string): Promise<AsyncResponse<SafetyGenerationResponse>> {
    try {
      console.log('Generating safety precautions from PDF through backend service:', { pdfName, deviceId });

      const response = await fetch(`${this.baseUrl}/api/pdf/generate-safety`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdf_name: pdfName,
          deviceId: deviceId,
          organizationId: organizationId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend safety generation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Safety generation from backend successful:', result);
      return result as AsyncResponse<SafetyGenerationResponse>;

    } catch (error) {
      console.error('Safety generation from backend failed:', error);
      throw error;
    }
  }

  // Download processed PDF through backend
  async downloadPDF(pdfName: string): Promise<Blob> {
    try {
      console.log('Downloading PDF from backend service:', pdfName);

      const response = await fetch(`${this.baseUrl}/api/pdf/download/${pdfName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend download failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const blob = await response.blob();
      console.log('PDF download from backend successful:', blob.size, 'bytes');
      return blob;

    } catch (error) {
      console.error('PDF download from backend failed:', error);
      throw error;
    }
  }

  // Get PDF processing status through backend
  async getPDFStatus(pdfName: string): Promise<ProcessingStatusResponse> {
    try {
      console.log('Getting PDF status from backend service:', pdfName);

      const response = await fetch(`${this.baseUrl}/api/pdf/status/${pdfName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend status check failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF status from backend successful:', result);
      return result as ProcessingStatusResponse;

    } catch (error) {
      console.error('PDF status from backend failed:', error);
      throw error;
    }
  }

  // Delete PDF through backend
  async deletePDF(pdfName: string): Promise<PDFDeleteResponse> {
    try {
      console.log('Deleting PDF from backend service:', pdfName);

      const response = await fetch(`${this.baseUrl}/api/pdf/delete/${pdfName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend deletion failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDF deletion from backend successful:', result);
      return result as PDFDeleteResponse;

    } catch (error) {
      console.error('PDF deletion from backend failed:', error);
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

// Export singleton instance
export const pdfProcessingService = new PDFProcessingService();
