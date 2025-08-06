import { supabase } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'docx';
  file_path: string;
  uploaded_at: string;
  processed_at?: string;
  size: number;
  status: 'processing' | 'completed' | 'error';
  extracted_text?: string;
  vectorized: boolean;
  organization_id: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  document_id: string;
  document_name: string;
  excerpt: string;
  relevance_score: number;
  metadata?: Record<string, any>;
}

export class KnowledgeService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async uploadDocument(file: Express.Multer.File, organizationId: string): Promise<KnowledgeDocument> {
    const document: KnowledgeDocument = {
      id: uuidv4(),
      name: file.originalname,
      type: this.getFileType(file.originalname),
      file_path: file.path,
      uploaded_at: new Date().toISOString(),
      size: file.size,
      status: 'processing',
      vectorized: false,
      organization_id: organizationId
    };

    const { data, error } = await supabase
      .from('knowledge_documents')
      .insert([document])
      .select()
      .single();

    if (error) throw error;

    // Process document asynchronously
    this.processDocument(data.id).catch(error => {
      console.error(`Failed to process document ${data.id}:`, error);
    });

    return data;
  }

  async getDocuments(organizationId: string): Promise<KnowledgeDocument[]> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('organization_id', organizationId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getDocument(documentId: string, organizationId: string): Promise<KnowledgeDocument | null> {
    const { data, error } = await supabase
      .from('knowledge_documents')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  }

  async deleteDocument(documentId: string, organizationId: string): Promise<void> {
    const document = await this.getDocument(documentId, organizationId);
    if (!document) throw new Error('Document not found');

    // Delete file from filesystem
    if (fs.existsSync(document.file_path)) {
      fs.unlinkSync(document.file_path);
    }

    // Delete from database
    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', documentId)
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Delete vectors from vector database
    await this.deleteVectors(documentId);
  }

  async searchDocuments(query: string, organizationId: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      // Generate embedding for the query
      const embedding = await this.generateEmbedding(query);

      // Search in vector database (simplified - in production use Pinecone/Weaviate)
      const { data: documents, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('vectorized', true);

      if (error) throw error;

      // Simulate semantic search results
      const results: SearchResult[] = documents
        .filter(doc => doc.extracted_text?.toLowerCase().includes(query.toLowerCase()))
        .map(doc => ({
          document_id: doc.id,
          document_name: doc.name,
          excerpt: this.extractRelevantExcerpt(doc.extracted_text || '', query),
          relevance_score: Math.random() * 0.3 + 0.7, // Simulate relevance score
          metadata: doc.metadata
        }))
        .sort((a, b) => b.relevance_score - a.relevance_score)
        .slice(0, limit);

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  async generateInsights(telemetryData: any, organizationId: string): Promise<string[]> {
    try {
      // Get relevant documents
      const searchQuery = `temperature ${telemetryData.temperature} humidity ${telemetryData.humidity} troubleshooting`;
      const searchResults = await this.searchDocuments(searchQuery, organizationId, 3);

      if (searchResults.length === 0) {
        return ['No relevant documentation found for current conditions.'];
      }

      // Generate insights using OpenAI
      const context = searchResults.map(result => result.excerpt).join('\n\n');
      
      const prompt = `
        Based on the following telemetry data and documentation excerpts, provide actionable insights:
        
        Telemetry Data:
        - Temperature: ${telemetryData.temperature}°C
        - Humidity: ${telemetryData.humidity}%
        - Device Status: ${telemetryData.status}
        
        Documentation Context:
        ${context}
        
        Please provide 2-3 specific, actionable insights or recommendations:
      `;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      });

      const insights = response.choices[0]?.message?.content
        ?.split('\n')
        .filter(line => line.trim().length > 0)
        .slice(0, 3) || [];

      return insights.length > 0 ? insights : ['Unable to generate insights at this time.'];
    } catch (error) {
      console.error('Failed to generate insights:', error);
      return ['Insight generation temporarily unavailable.'];
    }
  }

  private async processDocument(documentId: string): Promise<void> {
    try {
      const { data: document, error } = await supabase
        .from('knowledge_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !document) throw new Error('Document not found');

      // Extract text from document
      const extractedText = await this.extractText(document.file_path, document.type);

      // Generate embeddings
      const embedding = await this.generateEmbedding(extractedText);

      // Store vectors (simplified - in production use proper vector DB)
      await this.storeVectors(documentId, embedding, extractedText);

      // Update document status
      await supabase
        .from('knowledge_documents')
        .update({
          status: 'completed',
          processed_at: new Date().toISOString(),
          extracted_text: extractedText.substring(0, 10000), // Store first 10k chars
          vectorized: true
        })
        .eq('id', documentId);

    } catch (error) {
      console.error(`Document processing failed for ${documentId}:`, error);
      
      // Update status to error
      await supabase
        .from('knowledge_documents')
        .update({ status: 'error' })
        .eq('id', documentId);
    }
  }

  private async extractText(filePath: string, fileType: string): Promise<string> {
    // Simplified text extraction - in production use proper libraries
    // like pdf-parse, mammoth, etc.
    
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // For demo purposes, return sample text
    return `
      This is extracted text from a ${fileType} document.
      
      Device Troubleshooting Guide:
      
      When temperature readings exceed 35°C, check the sensor calibration and ensure proper ventilation around the device.
      
      High humidity levels above 80% may indicate poor ventilation or water ingress. Check seals and drainage systems.
      
      If device status shows offline, verify network connectivity and power supply. Check MQTT broker connection.
      
      For battery-powered devices, replace batteries when level drops below 20% to ensure reliable operation.
      
      Regular maintenance should be performed every 3 months including sensor cleaning and firmware updates.
    `;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!process.env.OPENAI_API_KEY) {
      // Return dummy embedding for demo
      return Array.from({ length: 1536 }, () => Math.random());
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000) // Limit input size
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Return dummy embedding as fallback
      return Array.from({ length: 1536 }, () => Math.random());
    }
  }

  private async storeVectors(documentId: string, embedding: number[], text: string): Promise<void> {
    // In production, store in proper vector database like Pinecone
    // For demo, we'll store in a simple table
    
    const chunks = this.chunkText(text, 500);
    
    for (let i = 0; i < chunks.length; i++) {
      await supabase
        .from('document_vectors')
        .insert([{
          id: uuidv4(),
          document_id: documentId,
          chunk_index: i,
          text_chunk: chunks[i],
          embedding: embedding, // In production, generate embedding per chunk
          created_at: new Date().toISOString()
        }]);
    }
  }

  private async deleteVectors(documentId: string): Promise<void> {
    await supabase
      .from('document_vectors')
      .delete()
      .eq('document_id', documentId);
  }

  private chunkText(text: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  private extractRelevantExcerpt(text: string, query: string): string {
    const queryWords = query.toLowerCase().split(' ');
    const sentences = text.split('.');
    
    // Find sentence with most query words
    let bestSentence = sentences[0] || '';
    let maxMatches = 0;
    
    for (const sentence of sentences) {
      const matches = queryWords.filter(word => 
        sentence.toLowerCase().includes(word)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }
    
    return bestSentence.trim().substring(0, 200) + '...';
  }

  private getFileType(filename: string): 'pdf' | 'doc' | 'docx' {
    const extension = path.extname(filename).toLowerCase();
    switch (extension) {
      case '.pdf':
        return 'pdf';
      case '.doc':
        return 'doc';
      case '.docx':
        return 'docx';
      default:
        return 'pdf';
    }
  }
}

export const knowledgeService = new KnowledgeService();