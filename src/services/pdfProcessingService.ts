// PDF Processing API Configuration
const PDF_API_BASE = (import.meta as any).env?.VITE_PDF_API_URL || '/pdf-api';

export interface PDFUploadResponse {
  success: boolean;
  message: string;
  pdf_name: string;
  chunks_processed: number;
  processing_time: string;
  collection_name: string;
}

export interface PDFDocument {
  collection_name: string;
  pdf_name: string;
  created_at: string;
  chunk_count: number;
}

export interface PDFListResponse {
  success: boolean;
  pdfs: PDFDocument[];
  total_count: number;
}

export interface QueryRequest {
  pdf_name: string;
  query: string;
  top_k?: number;
}

export interface QueryResponse {
  success: boolean;
  message: string;
  response: string;
  chunks_used: string[];
  images: string[];
  tables: string[];
  processing_time: string;
}

export interface IoTRule {
  condition: string;
  action: string;
  category: string;
  priority: string;
}

export interface MaintenanceData {
  task: string;
  frequency: string;
  category: string;
  description: string;
}

export interface SafetyPrecaution {
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
  maintenance_tasks: MaintenanceData[];
  processing_time: string;
}

export interface SafetyGenerationResponse {
  success: boolean;
  pdf_name: string;
  safety_information: SafetyPrecaution[];
  processing_time: string;
}

// Simplified PDF Processing Service - API Calls Only
class PDFProcessingService {
  private base = PDF_API_BASE;

  // Upload PDF to external API
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.base}/upload/pdf`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Failed to upload PDF: ${res.status} ${res.statusText} - ${await res.text()}`);
    return res.json();
  }

  // List PDFs from external API
  async listPDFs(page: number = 1, limit: number = 10): Promise<PDFListResponse> {
    const res = await fetch(`${this.base}/pdfs?page=${page}&limit=${limit}`, { method: 'GET' });
    if (!res.ok) throw new Error(`Failed to list PDFs: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Query PDF via external API
  async queryPDF(request: QueryRequest): Promise<QueryResponse> {
    const res = await fetch(`${this.base}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) throw new Error(`Failed to query PDF: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Generate IoT Rules from PDF
  async generateRules(pdfName: string): Promise<RulesGenerationResponse> {
    const res = await fetch(`${this.base}/generate-rules/${encodeURIComponent(pdfName)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate rules: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Generate Maintenance Schedule from PDF
  async generateMaintenance(pdfName: string): Promise<MaintenanceGenerationResponse> {
    const res = await fetch(`${this.base}/generate-maintenance/${encodeURIComponent(pdfName)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate maintenance: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Generate Safety Information from PDF
  async generateSafety(pdfName: string): Promise<SafetyGenerationResponse> {
    const res = await fetch(`${this.base}/generate-safety/${encodeURIComponent(pdfName)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate safety: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${this.base}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const pdfProcessingService = new PDFProcessingService();
