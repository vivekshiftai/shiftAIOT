// PDF Processing API Configuration
const PDF_API_BASE = (import.meta as any).env?.VITE_PDF_API_URL || '/pdf-api';

export interface PDFUploadResponse {
  success: boolean;
  message: string;
  pdf_filename: string;
  processing_status: string;
}

export interface PDFDocument {
  filename: string;
  chunk_count: number;
  file_size: number;
  upload_date: string;
}

export interface PDFListResponse {
  pdfs: PDFDocument[];
  total_count: number;
}

export interface QueryResult {
  heading: string;
  text: string;
  score: number;
  page_number: number;
  images: {
    filename: string;
    url: string;
    page_number: number;
  }[];
}

export interface QueryResponse {
  pdf_filename: string;
  query: string;
  answer: string;
  results: QueryResult[];
  total_matches: number;
  processing_time: number;
}

export interface IoTRule {
  device_name: string;
  rule_type: 'monitoring' | 'maintenance' | 'alert';
  condition: string;
  action: string;
  priority: 'low' | 'medium' | 'high';
  frequency: string;
  description: string;
}

export interface MaintenanceData {
  component_name: string;
  maintenance_type: string;
  frequency: string;
  last_maintenance: string;
  next_maintenance: string;
  description: string;
}

export interface SafetyPrecaution {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  recommended_action: string;
}

export interface RulesGenerationResponse {
  pdf_filename: string;
  total_pages?: number;
  processed_chunks?: number;
  iot_rules: IoTRule[];
  maintenance_data?: MaintenanceData[];
  safety_precautions?: SafetyPrecaution[];
  processing_time?: number;
  summary?: string;
}

export interface QueryRequest {
  pdf_filename: string;
  query: string;
  max_results?: number;
}

class PDFProcessingService {
  private base = PDF_API_BASE;

  // Upload PDF
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${this.base}/upload-pdf`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Failed to upload PDF: ${res.status} ${res.statusText} - ${await res.text()}`);
    return res.json();
  }

  // List PDFs
  async listPDFs(): Promise<PDFListResponse> {
    const res = await fetch(`${this.base}/pdfs`, { method: 'GET' });
    if (!res.ok) throw new Error(`Failed to list PDFs: ${res.status} ${res.statusText}`);
    return res.json();
  }

  // Query
  async queryPDF(request: QueryRequest): Promise<QueryResponse> {
    const res = await fetch(`${this.base}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`Failed to query PDF: ${res.status} ${res.statusText} - ${await res.text()}`);
    return res.json();
  }

  // Generate rules
  async generateRules(pdfName: string): Promise<RulesGenerationResponse> {
    const res = await fetch(`${this.base}/generate-rules/${encodeURIComponent(pdfName)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate rules: ${res.status} ${res.statusText} - ${await res.text()}`);
    return res.json();
  }

  // Generate maintenance
  async generateMaintenance(pdfName: string): Promise<{ maintenance_data: MaintenanceData[] }> {
    const res = await fetch(`${this.base}/generate-maintenance/${encodeURIComponent(pdfName)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate maintenance: ${res.status} ${res.statusText} - ${await res.text()}`);
    return res.json();
  }

  // Generate safety
  async generateSafety(pdfName: string): Promise<{ safety_precautions: SafetyPrecaution[] }> {
    const res = await fetch(`${this.base}/generate-safety/${encodeURIComponent(pdfName)}`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to generate safety: ${res.status} ${res.statusText} - ${await res.text()}`);
    return res.json();
  }
}

export const pdfProcessingService = new PDFProcessingService();
