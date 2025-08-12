// PDF Processing API Configuration
const API_BASE_URL = 'http://20.75.50.202:8000';

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
  total_pages: number;
  processed_chunks: number;
  iot_rules: IoTRule[];
  maintenance_data: MaintenanceData[];
  safety_precautions: SafetyPrecaution[];
  processing_time: number;
  summary: string;
}

export interface QueryRequest {
  pdf_filename: string;
  query: string;
  max_results?: number;
}

export interface RulesGenerationRequest {
  pdf_filename?: string;
  file?: File;
  chunk_size?: number;
  rule_types?: string[];
}

class PDFProcessingService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Upload PDF for processing
  async uploadPDF(file: File): Promise<PDFUploadResponse> {
    console.log('PDFProcessingService - Uploading PDF:', file.name, file.size);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseURL}/upload-pdf/`, {
        method: 'POST',
        body: formData,
      });

      console.log('PDFProcessingService - Upload response status:', response.status);
      console.log('PDFProcessingService - Upload response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDFProcessingService - Upload failed:', response.status, errorText);
        throw new Error(`Failed to upload PDF: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDFProcessingService - Upload result:', result);
      return result;
    } catch (error) {
      console.error('PDFProcessingService - Upload error:', error);
      throw error;
    }
  }

  // List all processed PDFs
  async listPDFs(): Promise<PDFListResponse> {
    const response = await fetch(`${this.baseURL}/pdfs/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to list PDFs: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete a PDF
  async deletePDF(filename: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/pdfs/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete PDF: ${response.statusText}`);
    }
  }

  // Query a specific PDF
  async queryPDF(request: QueryRequest): Promise<QueryResponse> {
    const response = await fetch(`${this.baseURL}/query/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to query PDF: ${response.statusText}`);
    }

    return response.json();
  }

  // Generate IoT rules and maintenance data
  async generateRules(request: RulesGenerationRequest): Promise<RulesGenerationResponse> {
    console.log('PDFProcessingService - Generating rules with request:', request);
    
    const formData = new FormData();
    
    if (request.pdf_filename) {
      formData.append('pdf_filename', request.pdf_filename);
    }
    
    if (request.file) {
      formData.append('file', request.file);
    }
    
    if (request.chunk_size) {
      formData.append('chunk_size', request.chunk_size.toString());
    }
    
    if (request.rule_types) {
      request.rule_types.forEach(type => {
        formData.append('rule_types', type);
      });
    }

    try {
      const response = await fetch(`${this.baseURL}/rules/`, {
        method: 'POST',
        body: formData,
      });

      console.log('PDFProcessingService - Rules generation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDFProcessingService - Rules generation failed:', response.status, errorText);
        throw new Error(`Failed to generate rules: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PDFProcessingService - Rules generation result:', result);
      return result;
    } catch (error) {
      console.error('PDFProcessingService - Rules generation error:', error);
      throw error;
    }
  }

  // Check PDF processing status
  async checkPDFStatus(filename: string): Promise<{ status: string; progress?: number }> {
    try {
      const pdfs = await this.listPDFs();
      const pdf = pdfs.pdfs.find(p => p.filename === filename);
      
      if (!pdf) {
        return { status: 'not_found' };
      }
      
      return { status: 'completed', progress: 100 };
    } catch (error) {
      return { status: 'error' };
    }
  }

  // Get image URL for PDF images
  getImageURL(pdfFilename: string, imagePath: string): string {
    return `${this.baseURL}/images/${encodeURIComponent(pdfFilename)}/${encodeURIComponent(imagePath)}`;
  }
}

// Export singleton instance
export const pdfProcessingService = new PDFProcessingService();
