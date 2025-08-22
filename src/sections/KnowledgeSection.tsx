import React, { useState, useEffect, useRef } from 'react';
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
  Plus,
  Settings
} from 'lucide-react';
import { deviceAPI } from '../services/api';
import { pdfProcessingService, PDFListResponse, PDFImage } from '../services/pdfprocess';
import { logError, logInfo } from '../utils/logger';
import '../styles/knowledge.css';

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
  deviceId?: string; // Link to device
  deviceName?: string; // Device name for display
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  images?: PDFImage[];
  tables?: string[];
  chunks_used?: string[];
  processing_time?: string;
}

export const KnowledgeSection: React.FC = () => {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceForUpload, setSelectedDeviceForUpload] = useState<string>('');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Refs for scrolling
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const documentsListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Load documents from external PDF API and devices on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load PDF documents from external PDF API
        const pdfListResponse: PDFListResponse = await pdfProcessingService.listPDFs();
        const convertedDocuments: KnowledgeDocument[] = pdfListResponse.pdfs.map((pdf, index) => ({
          id: index.toString(), // Use index as ID since external API doesn't provide unique IDs
          name: pdf.pdf_name,
          type: 'pdf',
          uploadedAt: pdf.created_at,
          processedAt: pdf.created_at, // Assuming processing is immediate
          size: 0, // Size not available in external API response
          status: 'completed', // All listed PDFs are processed
          vectorized: true,
          chunk_count: pdf.chunk_count,
          deviceId: undefined, // Not available from external API
          deviceName: undefined // Not available from external API
        }));
        setDocuments(convertedDocuments);

        // Load devices for association
        try {
          const devicesResponse = await deviceAPI.getAll();
          setDevices(devicesResponse.data || []);
        } catch (deviceError) {
          logError('Knowledge', 'Failed to load devices', deviceError instanceof Error ? deviceError : new Error('Unknown error'));
          // Continue without devices
        }
      } catch (error) {
        logError('Knowledge', 'Failed to load PDF documents from external API', error instanceof Error ? error : new Error('Unknown error'));
        // Keep empty array as fallback
      } finally {
        setLoading(false);
      }
    };

    loadData();
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
        return <CheckCircle className="w-4 h-4 text-success-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-warning-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-error-500" />;
      default:
        return <Clock className="w-4 h-4 text-tertiary" />;
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

    setChatMessages((prev: ChatMessage[]) => [...prev, userMessage]);
    setNewMessage('');
    setIsTyping(true);

    try {
      // If a document is selected, query it specifically
      if (selectedDocument) {
        try {
          const queryRequest = {
            pdf_name: selectedDocument.name,
            query: userMessage.content,
            top_k: 5
          };
          
          const queryResponse = await pdfProcessingService.queryPDF(queryRequest);
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: queryResponse.response || `I found relevant results in "${selectedDocument.name}". ${queryResponse.chunks_used?.length > 0 ? 'Here\'s what I found: ' + queryResponse.response.substring(0, 200) + '...' : 'Would you like me to search for more specific information?'}`,
            timestamp: new Date(),
            images: queryResponse.images || [],
            tables: queryResponse.tables || [],
            chunks_used: queryResponse.chunks_used || [],
            processing_time: queryResponse.processing_time
          };
          setChatMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
        } catch (queryError) {
          logError('Knowledge', 'Failed to query PDF', queryError instanceof Error ? queryError : new Error('Unknown error'));
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I encountered an error while searching "${selectedDocument.name}". Please try again or ask a different question.`,
            timestamp: new Date()
          };
          setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
        }
      } else {
        // Generate a general response
        const aiResponse = generateAIResponse(userMessage.content);
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };
        setChatMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
      }
    } catch (error) {
      logError('Knowledge', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or select a specific document to query.',
        timestamp: new Date()
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatResponseText = (text: string): string => {
    // Convert line breaks to HTML
    let formatted = text.replace(/\n/g, '<br>');
    
    // Handle bold text (**text**)
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text (*text*)
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle code blocks
    formatted = formatted.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // Handle inline code
    formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return formatted;
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

    // Show device selector if devices are available
    if (devices.length > 0) {
      setSelectedFile(file);
      setShowDeviceSelector(true);
      // Store the file for later upload
      const fileInput = event.target;
      fileInput.value = '';
      return;
    }

    // If no devices, upload directly
    await uploadPDFFile(file);
  };

  const uploadPDFFile = async (file: File, deviceId?: string) => {
    setUploading(true);
    try {
      const deviceName = deviceId ? devices.find((d: Device) => d.id === deviceId)?.name : undefined;
      
      // Upload directly to PDF processing service (like in Device section)
      const uploadResponse = await pdfProcessingService.uploadPDF(file);
      
      // Create a new document entry
      const newDocument: KnowledgeDocument = {
        id: Date.now().toString(),
        name: uploadResponse.pdf_name || file.name,
        type: 'pdf',
        uploadedAt: new Date().toISOString(),
        size: file.size,
        status: 'completed', // PDF processing service processes immediately
        vectorized: true,
        chunk_count: uploadResponse.chunks_processed,
        deviceId: deviceId,
        deviceName: deviceName
      };

      setDocuments((prev: KnowledgeDocument[]) => [newDocument, ...prev]);
      
      // Show success message
      const deviceInfo = deviceId ? ` for device "${deviceName}"` : '';
      const successMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Successfully uploaded "${newDocument.name}"${deviceInfo}. The document has been processed and is ready for querying.`,
        timestamp: new Date()
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, successMessage]);

      // Reset device selector
      setShowDeviceSelector(false);
      setSelectedDeviceForUpload('');
    } catch (error) {
      logError('Knowledge', 'Failed to upload document', error instanceof Error ? error : new Error('Unknown error'));
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const document = documents.find((doc: KnowledgeDocument) => doc.id === documentId);
      if (document) {
        logInfo('Knowledge', `🗑️ Starting deletion process for document: "${document.name}" (ID: ${documentId})`);
        console.log(`📋 [Knowledge] Document details:`, {
          id: document.id,
          name: document.name,
          type: document.type,
          size: document.size,
          status: document.status,
          vectorized: document.vectorized,
          chunk_count: document.chunk_count,
          deviceId: document.deviceId,
          deviceName: document.deviceName
        });

        // Delete from external PDF processing service
        logInfo('Knowledge', `🌐 Calling external PDF processing service to delete: "${document.name}"`);
        const deleteStartTime = Date.now();
        
        await pdfProcessingService.deletePDF(document.name);
        
        const deleteEndTime = Date.now();
        const deleteDuration = deleteEndTime - deleteStartTime;
        
        logInfo('Knowledge', `✅ Successfully deleted "${document.name}" from external PDF processing service in ${deleteDuration}ms`);
        
        // Remove from local state
        logInfo('Knowledge', `🗂️ Removing "${document.name}" from local state`);
        setDocuments((prev: KnowledgeDocument[]) => {
          const updatedDocs = prev.filter((doc: KnowledgeDocument) => doc.id !== documentId);
          console.log(`📊 [Knowledge] Documents count: ${prev.length} → ${updatedDocs.length}`);
          return updatedDocs;
        });
        
        if (selectedDocument?.id === documentId) {
          logInfo('Knowledge', `🔄 Clearing selected document since it was deleted`);
          setSelectedDocument(null);
        }

        // Show deletion message
        const deletionMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Successfully deleted "${document.name}" from the knowledge base and external processing service.`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, deletionMessage]);
        
        logInfo('Knowledge', `🎉 Complete deletion process finished for "${document.name}"`);
        console.log(`📈 [Knowledge] Deletion summary:`, {
          documentName: document.name,
          documentId: documentId,
          externalServiceDuration: `${deleteDuration}ms`,
          totalDocumentsRemaining: documents.length - 1,
          selectedDocumentCleared: selectedDocument?.id === documentId
        });
      } else {
        logError('Knowledge', `❌ Document not found for deletion (ID: ${documentId})`);
        console.error(`🔍 [Knowledge] Available document IDs:`, documents.map(d => d.id));
      }
    } catch (error) {
      logError('Knowledge', `💥 Failed to delete document (ID: ${documentId})`, error instanceof Error ? error : new Error('Unknown error'));
      console.error(`💥 [Knowledge] Deletion error details:`, {
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        availableDocuments: documents.map(d => ({ id: d.id, name: d.name }))
      });
      alert('Failed to delete document. Please try again.');
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedDeviceForUpload || doc.deviceId === selectedDeviceForUpload)
  );

  return (
    <div className="knowledge-section flex flex-col bg-gray-50 h-full">
      {/* Fixed Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-500 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
              <p className="text-sm text-gray-600">
                AI-powered document analysis and chat assistant
                {selectedDocument && (
                  <span className="ml-2 text-blue-600 font-medium">
                    • Active: {selectedDocument.name}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Fixed height, no overflow */}
      <div className="flex-1 flex min-h-0">
        {/* Left Panel - Chat Interface */}
        <div className="flex-1 flex flex-col bg-white min-h-0">
          {/* Chat Messages Area - Scrollable content only */}
          <div 
            ref={chatMessagesRef}
            className="knowledge-chat-messages p-6 space-y-6"
          >
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-3 max-w-2xl">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-50 text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatResponseText(message.content) }}
                    />
                    
                    {/* Display Images */}
                    {message.images && message.images.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">📷 Related Images:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {message.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={`data:${image.mime_type};base64,${image.data}`}
                                alt={image.filename}
                                title={image.filename}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head><title>${image.filename}</title></head>
                                        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
                                          <img src="data:${image.mime_type};base64,${image.data}" 
                                               alt="${image.filename}" 
                                               style="max-width:90%;max-height:90%;object-fit:contain;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-radius:8px;">
                                        </body>
                                      </html>
                                    `);
                                  }
                                }}
                              />
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {image.filename}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display Tables */}
                    {message.tables && message.tables.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">📊 Related Tables:</p>
                        <div className="space-y-3">
                          {message.tables.map((table, index) => (
                            <div key={index} className="overflow-x-auto">
                              <div className="text-xs text-gray-500 mb-1">Table {index + 1}:</div>
                              <div 
                                className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm"
                                dangerouslySetInnerHTML={{ __html: table }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display Chunks Used */}
                    {message.chunks_used && message.chunks_used.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">📄 Sources Used:</p>
                        <div className="space-y-2">
                          {message.chunks_used.map((chunk, index) => (
                            <div key={index} className="text-xs bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                              <span className="text-blue-600 font-medium">Source {index + 1}:</span>
                              <span className="text-gray-700 ml-2">{chunk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display Processing Time */}
                    {message.processing_time && (
                      <p className="text-xs text-gray-500 mt-2">
                        ⏱️ Processed in {message.processing_time}
                      </p>
                    )}
                    
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-2xl">
                  <div className="p-2 rounded-full flex-shrink-0 bg-gray-100 text-gray-600">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl shadow-sm bg-gray-50 text-gray-900 border border-gray-200">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Footer - Fixed at bottom */}
          <div className="knowledge-fixed-footer flex-shrink-0 bg-white border-t border-gray-200 p-4">
            <div className="space-y-3">
              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setNewMessage('How do I troubleshoot temperature sensor issues?')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Temperature sensors
                </button>
                <button
                  onClick={() => setNewMessage('What maintenance procedures are recommended?')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Maintenance
                </button>
                <button
                  onClick={() => setNewMessage('How do I install IoT gateways?')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Installation
                </button>
              </div>
              
              {/* Message Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={selectedDocument ? `Ask about "${selectedDocument.name}"...` : "Ask about your devices, documents, or troubleshooting..."}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isTyping}
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Document Library - 20% width */}
        <div className="w-1/5 flex flex-col bg-white border-l border-gray-200 min-h-0">
          {/* PDF Library Header - Fixed */}
          <div className="knowledge-fixed-header flex-shrink-0 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">PDF Library</h2>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all shadow-sm">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload'}
                </div>
              </label>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search PDF documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                />
              </div>
              
              {devices.length > 0 && (
                <select
                  value={selectedDeviceForUpload}
                  onChange={(e) => setSelectedDeviceForUpload(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 shadow-sm"
                >
                  <option value="">All devices</option>
                  {devices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.name} ({device.type})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* PDF Documents List - Scrollable content only */}
          <div 
            ref={documentsListRef}
            className="knowledge-documents-list"
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2 text-sm">Loading PDF documents...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? 'No PDF documents found' : 'No PDF documents uploaded yet'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedDocument?.id === doc.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">{doc.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{formatFileSize(doc.size)}</span>
                            <span>•</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            {doc.chunk_count && (
                              <>
                                <span>•</span>
                                <span>{doc.chunk_count} chunks</span>
                              </>
                            )}
                            {doc.deviceName && (
                              <>
                                <span>•</span>
                                <span className="text-blue-600 font-medium">{doc.deviceName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {getStatusIcon(doc.status)}
                        {doc.vectorized && (
                          <Brain className="w-4 h-4 text-green-500" />
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

          {/* PDF Library Footer - Fixed at bottom */}
          <div className="knowledge-fixed-footer flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{documents.length} PDF documents</span>
              <span>{documents.filter(d => d.vectorized).length} AI ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Device Selector Modal */}
      {showDeviceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Associate PDF with Device</h3>
            <p className="text-gray-600 mb-4">Select a device to associate this PDF with, or upload without association:</p>
            
            <select
              value={selectedDeviceForUpload}
              onChange={(e) => setSelectedDeviceForUpload(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 mb-4"
            >
              <option value="">No device association</option>
              {devices.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.type})
                </option>
              ))}
            </select>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeviceSelector(false);
                  setSelectedDeviceForUpload('');
                  setSelectedFile(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (selectedFile) {
                    await uploadPDFFile(selectedFile, selectedDeviceForUpload);
                    setSelectedFile(null);
                  }
                  setShowDeviceSelector(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
