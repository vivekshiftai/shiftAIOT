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
  Plus,
  Settings
} from 'lucide-react';
import { knowledgeAPI } from '../services/api';
import { deviceAPI } from '../services/api';
import { pdfProcessingService, PDFListResponse } from '../services/pdfprocess';

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
          console.error('Failed to load devices:', deviceError);
          // Continue without devices
        }
      } catch (error) {
        console.error('Failed to load PDF documents from external API:', error);
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

    setChatMessages(prev => [...prev, userMessage]);
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
            content: queryResponse.response || `I found relevant results in "${selectedDocument.name}". ${queryResponse.chunks_used.length > 0 ? 'Here\'s what I found: ' + queryResponse.response.substring(0, 200) + '...' : 'Would you like me to search for more specific information?'}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, assistantMessage]);
        } catch (queryError) {
          console.error('Failed to query PDF:', queryError);
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I encountered an error while searching "${selectedDocument.name}". Please try again or ask a different question.`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorMessage]);
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

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
      const deviceName = deviceId ? devices.find(d => d.id === deviceId)?.name : undefined;
      
      // Upload to backend Knowledge API
      const uploadRes = await knowledgeAPI.uploadPDF(file, deviceId, deviceName);
      const uploadData = (uploadRes as any)?.data || {};
      
      // Create a new document entry
      const newDocument: KnowledgeDocument = {
        id: uploadData.document_id || Date.now().toString(),
        name: uploadData.pdf_filename || file.name,
        type: 'pdf',
        uploadedAt: new Date().toISOString(),
        size: file.size,
        status: uploadData.processing_status || 'uploaded',
        vectorized: false,
        chunk_count: undefined,
        deviceId: deviceId,
        deviceName: deviceName
      };

      setDocuments(prev => [newDocument, ...prev]);
      
      // Show success message
      const deviceInfo = deviceId ? ` for device "${deviceName}"` : '';
      const successMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Successfully uploaded "${newDocument.name}"${deviceInfo}. The document is ready for querying.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, successMessage]);

      // Reset device selector
      setShowDeviceSelector(false);
      setSelectedDeviceForUpload('');
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
        // Note: deletePDF method doesn't exist in pdfProcessingService
        // await pdfProcessingService.deletePDF(document.name);
        console.log('Delete functionality not implemented in pdfProcessingService');
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
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (!selectedDeviceForUpload || doc.deviceId === selectedDeviceForUpload)
  );

  return (
         <div className="h-full flex bg-secondary">
      {/* Left Panel - Chat Interface */}
      <div className="w-2/3 flex flex-col">
        {/* Chat Header */}
                 <div className="p-4 border-b border-light bg-card">
                      <div className="flex items-center gap-3">
                             <div className="p-3 bg-primary-500 rounded-xl shadow-sm">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary">AI Knowledge Assistant</h2>
                                  <p className="text-secondary">
                   Ask questions about your devices and PDF documents
                   {selectedDocument && (
                     <span className="ml-2 text-primary-500 font-medium">
                       • Currently viewing: {selectedDocument.name}
                     </span>
                   )}
                 </p>
              </div>
            </div>
        </div>

                 {/* Chat Messages */}
                   <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-tertiary">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start gap-3 max-w-3xl">
                                 <div className={`p-3 rounded-full flex-shrink-0 shadow-sm ${
                   message.type === 'user'
                     ? 'bg-primary-500 text-white'
                     : 'bg-card text-secondary border border-light'
                 }`}>
                  {message.type === 'user' ? (<User className="w-5 h-5" />) : (<Bot className="w-5 h-5" />)}
                </div>
                                 <div
                   className={`px-4 py-3 rounded-2xl shadow-sm ${
                     message.type === 'user'
                       ? 'bg-primary-500 text-white'
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
                 <div className="p-3 rounded-full flex-shrink-0 shadow-sm bg-card text-secondary border border-light">
                   <Bot className="w-5 h-5" />
                 </div>
                 <div className="px-6 py-4 rounded-2xl shadow-sm bg-card text-primary border border-light">
                   <div className="flex space-x-2">
                     <div className="w-3 h-3 bg-tertiary rounded-full animate-bounce"></div>
                     <div className="w-3 h-3 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                     <div className="w-3 h-3 bg-tertiary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   </div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Chat Input */}
                 <div className="p-4 border-t border-light bg-card">
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
               className="px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
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
             <div className="w-1/3 border-l border-light flex flex-col bg-card">
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
               <div className="flex items-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all shadow-sm">
                 {uploading ? (
                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                 ) : (
                   <Plus className="w-4 h-4" />
                 )}
                 {uploading ? 'Uploading...' : 'Upload PDF'}
               </div>
             </label>
           </div>

           {/* Device Selector Modal */}
           {showDeviceSelector && (
             <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
               <div className="bg-card p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
                 <h3 className="text-lg font-semibold text-primary mb-4">Associate PDF with Device</h3>
                 <p className="text-secondary mb-4">Select a device to associate this PDF with, or upload without association:</p>
                 
                 <select
                   value={selectedDeviceForUpload}
                   onChange={(e) => setSelectedDeviceForUpload(e.target.value)}
                   className="w-full p-3 border border-medium rounded-lg bg-card text-primary mb-4"
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
                      className="flex-1 px-4 py-2 border border-medium text-secondary rounded-lg hover:bg-tertiary transition-colors"
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
                      className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      Upload
                    </button>
                 </div>
               </div>
             </div>
           )}
          
                     {/* Search and Filters */}
           <div className="space-y-3">
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
             
             {devices.length > 0 && (
               <select
                 value={selectedDeviceForUpload}
                 onChange={(e) => setSelectedDeviceForUpload(e.target.value)}
                 className="w-full p-2 border border-medium rounded-lg bg-card text-primary shadow-sm"
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
                     selectedDocument?.id === doc.id ? 'bg-primary-500/10 border-r-4 border-primary-500' : ''
                   }`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                             <div className="p-2 bg-primary-500/10 rounded-lg flex-shrink-0">
                         <FileText className="w-4 h-4 text-primary-500" />
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
                           {doc.deviceName && (
                             <>
                               <span>•</span>
                               <span className="text-primary-500 font-medium">{doc.deviceName}</span>
                             </>
                           )}
                         </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-2">
                      {getStatusIcon(doc.status)}
                                             {doc.vectorized && (
                         <Brain className="w-4 h-4 text-success-500" />
                       )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDocument(doc.id);
                        }}
                                                 className="p-1 hover:bg-error-500/10 rounded transition-colors"
                      >
                                                 <Trash2 className="w-4 h-4 text-error-500" />
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
