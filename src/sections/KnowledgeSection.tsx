import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Search, 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Send,
  Download,
  Trash2,
  MessageSquare,
  Bot,
  User,
  Plus
} from 'lucide-react';
import { pdfProcessingService, PDFDocument, PDFUploadResponse, QueryRequest, QueryResponse } from '../services/pdfProcessingService';

// Updated interface to match PDF API response
interface KnowledgeDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  processedAt?: string;
  size: number;
  status: string;
  vectorized: boolean;
  chunk_count?: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const KnowledgeSection: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant for the IoT knowledge base. I can help you find information from your uploaded PDF documents, answer questions about your devices, and assist with troubleshooting. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Load documents from PDF API on component mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const pdfListResponse = await pdfProcessingService.listPDFs();
        const convertedDocuments: KnowledgeDocument[] = pdfListResponse.pdfs.map((pdf: PDFDocument, index: number) => ({
          id: index.toString(),
          name: pdf.filename,
          type: 'pdf',
          uploadedAt: pdf.upload_date,
          processedAt: pdf.upload_date, // Assuming processing is immediate
          size: pdf.file_size,
          status: 'completed', // All listed PDFs are processed
          vectorized: true,
          chunk_count: pdf.chunk_count
        }));
        setDocuments(convertedDocuments);
      } catch (error) {
        console.error('Failed to load PDF documents:', error);
        // Keep empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // If a document is selected, query it specifically
      if (selectedDocument) {
        const queryRequest: QueryRequest = {
          pdf_filename: selectedDocument.name,
          query: userMessage.content,
          max_results: 5
        };

        const queryResponse = await pdfProcessingService.queryPDF(queryRequest);
        
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: queryResponse.answer || `I found ${queryResponse.total_matches} relevant results in "${selectedDocument.name}". ${queryResponse.results.length > 0 ? 'Here\'s what I found: ' + queryResponse.results[0].text.substring(0, 200) + '...' : 'Would you like me to search for more specific information?'}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      } else {
        // Generate a general response
        const aiResponse = generateAIResponse(userMessage.content);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or select a specific document to query.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userMessage: string): string => {
    const responses = [
      `Based on the available documentation, I can help you with "${userMessage}". Let me search through the knowledge base for relevant information.`,
      `I understand you're asking about "${userMessage}". This is a common question that I can address using the uploaded documents.`,
      `Regarding "${userMessage}", I found some relevant information in the knowledge base. Would you like me to elaborate on any specific aspect?`,
      `I can help you with "${userMessage}". The documentation contains several relevant sections that might be useful.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Only allow PDF files
    if (!file.type.includes('pdf')) {
      alert('Please upload only PDF files.');
      return;
    }

    setUploading(true);
    try {
      const uploadResponse: PDFUploadResponse = await pdfProcessingService.uploadPDF(file);
      
      // Create a new document entry
      const newDocument: KnowledgeDocument = {
        id: Date.now().toString(),
        name: uploadResponse.pdf_filename,
        type: 'pdf',
        uploadedAt: new Date().toISOString(),
        size: file.size,
        status: uploadResponse.processing_status === 'processing' ? 'processing' : 'completed',
        vectorized: uploadResponse.processing_status === 'completed',
        chunk_count: 0
      };

      setDocuments(prev => [newDocument, ...prev]);
      
      // Clear the input
      event.target.value = '';
      
      // Show success message
      const successMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Successfully uploaded "${uploadResponse.pdf_filename}". ${uploadResponse.processing_status === 'processing' ? 'The document is being processed and will be available for querying shortly.' : 'The document is ready for querying.'}`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const document = documents.find(doc => doc.id === documentId);
      if (document) {
        await pdfProcessingService.deletePDF(document.name);
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        
        if (selectedDocument?.id === documentId) {
          setSelectedDocument(null);
        }

        // Show deletion message
        const deletionMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Successfully deleted "${document.name}" from the knowledge base.`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, deletionMessage]);
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex bg-gradient-to-br from-neutral-950 via-primary-950 to-secondary-950">
      {/* Left Panel - Chat Interface */}
      <div className="w-2/3 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-light bg-card/80 backdrop-blur-sm">
                      <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-lg">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary">AI Knowledge Assistant</h2>
                <p className="text-secondary">
                  Ask questions about your devices and PDF documents
                  {selectedDocument && (
                    <span className="ml-2 text-primary-600 font-medium">
                      • Currently viewing: {selectedDocument.name}
                    </span>
                  )}
                </p>
              </div>
            </div>
        </div>

                 {/* Chat Messages */}
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-card/50 to-secondary-950/30">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start gap-3 max-w-3xl">
                <div className={`p-3 rounded-full flex-shrink-0 shadow-lg ${
                  message.type === 'user'
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                    : 'bg-card text-secondary border border-light'
                }`}>
                  {message.type === 'user' ? (<User className="w-5 h-5" />) : (<Bot className="w-5 h-5" />)}
                </div>
                <div
                  className={`px-4 py-3 rounded-2xl shadow-sm ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white'
                      : 'bg-card text-primary border border-light'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.type === 'user' ? 'text-primary-100' : 'text-tertiary'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-3xl">
                <div className="p-3 rounded-full flex-shrink-0 shadow-lg bg-white text-slate-600 border border-slate-200">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="px-6 py-4 rounded-2xl shadow-sm bg-white text-slate-800 border border-slate-200">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-light bg-card/80 backdrop-blur-sm">
          <div className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={selectedDocument ? `Ask about "${selectedDocument.name}"...` : "Ask about your devices, documents, or troubleshooting..."}
              className="flex-1 px-4 py-3 border border-medium rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-card text-primary shadow-sm"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || isTyping}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setNewMessage('How do I troubleshoot temperature sensor issues?')}
              className="px-3 py-2 text-sm bg-card border border-light text-secondary rounded-full hover:bg-tertiary transition-colors shadow-sm"
            >
              Temperature sensors
            </button>
            <button
              onClick={() => setNewMessage('What maintenance procedures are recommended?')}
              className="px-3 py-2 text-sm bg-card border border-light text-secondary rounded-full hover:bg-tertiary transition-colors shadow-sm"
            >
              Maintenance
            </button>
            <button
              onClick={() => setNewMessage('How do I install IoT gateways?')}
              className="px-3 py-2 text-sm bg-card border border-light text-secondary rounded-full hover:bg-tertiary transition-colors shadow-sm"
            >
              Installation
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - PDF Document Library */}
      <div className="w-1/3 border-l border-light flex flex-col bg-card/80 backdrop-blur-sm">
        {/* Header */}
        <div className="p-4 border-b border-light">
                      <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-primary">PDF Document Library</h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:from-primary-700 hover:to-secondary-700 transition-all shadow-lg">
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {uploading ? 'Uploading...' : 'Upload PDF'}
              </div>
            </label>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
            <input
              type="text"
              placeholder="Search PDF documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-medium rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-card text-primary shadow-sm"
            />
          </div>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-secondary mt-2">Loading PDF documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="p-4 text-center text-secondary">
              {searchQuery ? 'No PDF documents found' : 'No PDF documents uploaded yet'}
            </div>
          ) : (
            <div className="divide-y divide-light">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className={`p-4 hover:bg-tertiary cursor-pointer transition-colors ${
                    selectedDocument?.id === doc.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                  }`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-lg flex-shrink-0">
                        <FileText className="w-4 h-4 text-primary-600" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-primary truncate">{doc.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-secondary mt-1">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                          {doc.chunk_count && (
                            <>
                              <span>•</span>
                              <span>{doc.chunk_count} chunks</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-2">
                      {getStatusIcon(doc.status)}
                      {doc.vectorized && (
                        <Brain className="w-4 h-4 text-green-600" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-light bg-secondary">
          <div className="flex items-center justify-between text-sm text-secondary">
            <span>{documents.length} PDF documents</span>
            <span>{documents.filter(d => d.vectorized).length} AI ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};
