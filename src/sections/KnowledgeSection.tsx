import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  FileText, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Send,
  Trash2,
  Bot,
  User,
  Plus,
  Settings
} from 'lucide-react';
import { deviceAPI } from '../services/api';
import { pdfProcessingService, PDFImage } from '../services/pdfprocess';
import { logError, logInfo } from '../utils/logger';
import { getDisplayImageName } from '../utils/imageUtils';
import '../styles/knowledge.css';
import { pdfAPI } from '../services/api'; // Added pdfAPI import
import { knowledgeAPI } from '../services/api'; // Added knowledgeAPI import
import { UnifiedQueryService, UnifiedQueryRequest } from '../services/unifiedQueryService';

// Updated interface to match UnifiedPDF API response
interface UnifiedPDF {
  id: string;
  name: string;
  originalFilename: string;
  documentType: string;
  fileSize: number;
  processingStatus: string;
  vectorized: boolean;
  uploadedAt: string;
  processedAt?: string;
  deviceId?: string; // Link to device
  deviceName?: string; // Device name for display
  organizationId: string;
  collectionName?: string;
  totalPages?: number;
  processedChunks?: number;
  processingTime?: string;
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
  // New fields for unified queries
  queryType?: 'DATABASE' | 'PDF' | 'MIXED' | 'LLM_ANSWER' | 'UNKNOWN';
  databaseResults?: Array<Record<string, any>>;
  rowCount?: number;
  sqlQuery?: string;
}

export const KnowledgeSection: React.FC = () => {
  const [documents, setDocuments] = useState<UnifiedPDF[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<UnifiedPDF | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceForUpload, setSelectedDeviceForUpload] = useState<string>('');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI assistant for the IoT knowledge base. I can help you with:\n\n📊 **Database Queries**: Ask about devices, users, maintenance tasks, notifications, and more\n📄 **Document Queries**: Search through PDF documents, manuals, and guides\n🤖 **General Questions**: Ask about IoT concepts, device management, and platform usage\n🔄 **Mixed Queries**: Get both database information and document references\n\nTry asking: "Show me all offline devices", "How to setup this device?", or "What is IoT device management?"',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showDeviceSummary, setShowDeviceSummary] = useState(false);
  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Refs for scrolling
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const documentsListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Function to load query suggestions
  const loadQuerySuggestions = async () => {
    try {
      const suggestions = await UnifiedQueryService.getQuerySuggestions();
      if (suggestions.success) {
        setQuerySuggestions(suggestions.suggestions);
      }
    } catch (error) {
      console.error('Failed to load query suggestions:', error);
    }
  };

  // Function to refresh collections data
  const refreshCollections = async () => {
    try {
      setLoading(true);
      const collectionsResponse = await pdfAPI.listAllCollections();
      console.log('Collections refresh response:', collectionsResponse);
      
      // Handle both response formats from external service
      let collections = [];
      if (collectionsResponse.data.success && collectionsResponse.data.data && collectionsResponse.data.data.collections) {
        // New format: { success: true, data: { collections: [...] } }
        collections = collectionsResponse.data.data.collections;
      } else if (collectionsResponse.data.success && collectionsResponse.data.collections) {
        // Alternative format: { success: true, collections: [...] }
        collections = collectionsResponse.data.collections;
      } else if (Array.isArray(collectionsResponse.data)) {
        // Direct array format: [...]
        collections = collectionsResponse.data;
      } else {
        console.error('Unexpected collections response format:', collectionsResponse.data);
        throw new Error('Invalid collections response format');
      }

      const convertedDocuments: UnifiedPDF[] = collections.map((collection: any, index: number) => ({
        id: collection.collection_name || collection.id || index.toString(),
        name: collection.pdf_name || collection.name || collection.collection_name || `PDF_${index}`,
        originalFilename: collection.pdf_name || collection.name || collection.collection_name || `PDF_${index}`,
        documentType: 'pdf',
        fileSize: collection.size || 0,
        processingStatus: collection.status || 'completed',
        vectorized: collection.vectorized !== false, // Default to true unless explicitly false
        uploadedAt: collection.created_at || collection.uploadedAt || new Date().toISOString(),
        processedAt: collection.created_at || collection.processedAt || new Date().toISOString(),
        deviceId: collection.deviceId || undefined,
        deviceName: collection.deviceName || undefined,
        organizationId: 'public',
        collectionName: collection.collection_name,
        totalPages: collection.total_pages || collection.totalPages,
        processedChunks: collection.chunk_count || collection.chunkCount || 0,
        processingTime: collection.processing_time || collection.processingTime
      }));
      setDocuments(convertedDocuments);
      logInfo('Knowledge', 'Collections refreshed successfully', { count: convertedDocuments.length });
    } catch (error) {
      logError('Knowledge', 'Failed to refresh collections', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Load documents from external PDF API and devices on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load PDF documents from external collections API
        try {
          const collectionsResponse = await pdfAPI.listAllCollections();
          console.log('Collections response:', collectionsResponse);
          
          // Handle both response formats from external service
          let collections = [];
          if (collectionsResponse.data.success && collectionsResponse.data.data && collectionsResponse.data.data.collections) {
            // New format: { success: true, data: { collections: [...] } }
            collections = collectionsResponse.data.data.collections;
          } else if (collectionsResponse.data.success && collectionsResponse.data.collections) {
            // Alternative format: { success: true, collections: [...] }
            collections = collectionsResponse.data.collections;
          } else if (Array.isArray(collectionsResponse.data)) {
            // Direct array format: [...]
            collections = collectionsResponse.data;
          } else {
            console.error('Unexpected collections response format:', collectionsResponse.data);
            throw new Error('Invalid collections response format');
          }

          const convertedDocuments: UnifiedPDF[] = collections.map((collection: any, index: number) => ({
            id: collection.collection_name || collection.id || index.toString(),
            name: collection.pdf_name || collection.name || collection.collection_name || `PDF_${index}`,
            originalFilename: collection.pdf_name || collection.name || collection.collection_name || `PDF_${index}`,
            documentType: 'pdf',
            fileSize: collection.size || 0,
            processingStatus: collection.status || 'completed',
            vectorized: collection.vectorized !== false, // Default to true unless explicitly false
            uploadedAt: collection.created_at || collection.uploadedAt || new Date().toISOString(),
            processedAt: collection.created_at || collection.processedAt || new Date().toISOString(),
            deviceId: collection.deviceId || undefined,
            deviceName: collection.deviceName || undefined,
            organizationId: 'public',
            collectionName: collection.collection_name,
            totalPages: collection.total_pages || collection.totalPages,
            processedChunks: collection.chunk_count || collection.chunkCount || 0,
            processingTime: collection.processing_time || collection.processingTime
          }));
          setDocuments(convertedDocuments);
          logInfo('Knowledge', 'PDF documents loaded from external collections', { count: convertedDocuments.length });
        } catch (collectionsError) {
          logError('Knowledge', 'Failed to load PDF documents from external collections', collectionsError instanceof Error ? collectionsError : new Error('Unknown error'));
          
          // Try knowledge API first (better device association support)
          try {
            const knowledgeResponse = await knowledgeAPI.getDocuments();
            if (knowledgeResponse.data.documents) {
              const knowledgeDocuments: UnifiedPDF[] = knowledgeResponse.data.documents.map((doc: any) => ({
                id: doc.id.toString(),
                name: doc.name,
                originalFilename: doc.name,
                documentType: doc.type || 'pdf',
                fileSize: doc.size || 0,
                processingStatus: doc.status || 'completed',
                vectorized: doc.vectorized || true,
                uploadedAt: doc.uploadedAt,
                processedAt: doc.processedAt || doc.uploadedAt,
                deviceId: doc.deviceId,
                deviceName: doc.deviceName,
                organizationId: doc.organizationId || 'public',
                collectionName: doc.collectionName,
                totalPages: doc.totalPages,
                processedChunks: doc.chunkCount || 0,
                processingTime: doc.processingTime
              }));
              setDocuments(knowledgeDocuments);
              logInfo('Knowledge', 'PDF documents loaded from knowledge API', { count: knowledgeDocuments.length });
            } else {
              throw new Error('Invalid response format from knowledge API');
            }
          } catch (knowledgeError) {
            logError('Knowledge', 'Failed to load documents from knowledge API', knowledgeError instanceof Error ? knowledgeError : new Error('Unknown error'));
            // Fallback to backend PDF API
            try {
              const pdfListResponse = await pdfAPI.listPDFs(0, 50);
              const convertedDocuments: UnifiedPDF[] = pdfListResponse.data.pdfs.map((pdf: any, index: number) => ({
                id: pdf.id || index.toString(),
                name: pdf.name || pdf.filename || `PDF_${index}`,
                originalFilename: pdf.name || pdf.filename || `PDF_${index}`,
                documentType: 'pdf',
                fileSize: pdf.file_size || pdf.size_bytes || 0,
                processingStatus: pdf.status || 'completed',
                vectorized: pdf.vectorized || true,
                uploadedAt: pdf.uploaded_at || pdf.created_at || new Date().toISOString(),
                processedAt: pdf.processed_at || pdf.created_at || new Date().toISOString(),
                deviceId: pdf.device_id || undefined,
                deviceName: pdf.device_name || undefined,
                organizationId: pdf.organization_id || pdf.organizationId || 'public',
                collectionName: pdf.collection_name || pdf.collectionName,
                totalPages: pdf.total_pages || pdf.totalPages,
                processedChunks: pdf.chunk_count || 0,
                processingTime: pdf.processing_time || pdf.processingTime
              }));
              setDocuments(convertedDocuments);
              logInfo('Knowledge', 'PDF documents loaded from backend fallback', { count: convertedDocuments.length });
            } catch (pdfError) {
              logError('Knowledge', 'Failed to load PDF documents from backend fallback', pdfError instanceof Error ? pdfError : new Error('Unknown error'));
              // Keep empty array as final fallback
              setDocuments([]);
            }
          }
        }

        // Load devices for association
        try {
          const devicesResponse = await deviceAPI.getAll();
          setDevices(devicesResponse.data || []);
          logInfo('Knowledge', 'Devices loaded successfully', { count: devicesResponse.data?.length || 0 });
        } catch (deviceError) {
          logError('Knowledge', 'Failed to load devices', deviceError instanceof Error ? deviceError : new Error('Unknown error'));
          // Continue without devices
          setDevices([]);
        }
      } catch (error) {
        logError('Knowledge', 'Failed to load data', error instanceof Error ? error : new Error('Unknown error'));
        // Keep empty arrays as fallback
        setDocuments([]);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    loadQuerySuggestions();
  }, []);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
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
      // If a document is selected, query it specifically (PDF mode)
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
            processing_time: queryResponse.processing_time,
            queryType: 'PDF'
          };
          setChatMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
        } catch (queryError) {
          logError('Knowledge', 'Failed to query PDF', queryError instanceof Error ? queryError : new Error('Unknown error'));
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I encountered an error while searching "${selectedDocument.name}". Please try again or ask a different question.`,
            timestamp: new Date(),
            queryType: 'PDF'
          };
          setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
        }
      } else {
        // Use unified query service for general queries
        try {
          console.log('🔍 Sending unified query to backend:', userMessage.content);
          
          const unifiedRequest: UnifiedQueryRequest = {
            query: userMessage.content
          };
          
          const unifiedResponse = await UnifiedQueryService.sendUnifiedQuery(unifiedRequest);
          
          console.log('✅ Received unified response:', unifiedResponse);
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: unifiedResponse.response || 'I processed your query but didn\'t find specific results. Please try rephrasing your question.',
            timestamp: new Date(),
            queryType: unifiedResponse.queryType,
            databaseResults: unifiedResponse.databaseResults,
            rowCount: unifiedResponse.rowCount,
            sqlQuery: unifiedResponse.sqlQuery
          };
          setChatMessages((prev: ChatMessage[]) => [...prev, assistantMessage]);
        } catch (unifiedError) {
          logError('Knowledge', 'Failed to process unified query', unifiedError instanceof Error ? unifiedError : new Error('Unknown error'));
          
          // Show proper error message instead of fallback
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `I encountered an error while processing your query: "${userMessage.content}". Please check the backend connection and try again.`,
            timestamp: new Date(),
            queryType: 'UNKNOWN'
          };
          setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      logError('Knowledge', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or select a specific document to query.',
        timestamp: new Date(),
        queryType: 'UNKNOWN'
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

  const handleSuggestionClick = (suggestion: string) => {
    setNewMessage(suggestion);
    setShowSuggestions(false);
  };

  const handleInputFocus = () => {
    if (querySuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const testBackendConnection = async () => {
    try {
      console.log('🔍 Testing backend connection...');
      const result = await UnifiedQueryService.testBackend();
      console.log('✅ Backend test successful:', result);
      
      const testMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `✅ Backend connection test successful! Message: ${result.message}`,
        timestamp: new Date(),
        queryType: 'UNKNOWN'
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, testMessage]);
    } catch (error) {
      console.error('❌ Backend test failed:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: `❌ Backend connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        queryType: 'UNKNOWN'
      };
      setChatMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
    }
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
      
      // Upload to knowledge API which supports device association
      const uploadResponse = await knowledgeAPI.uploadPDF(file, deviceId, deviceName);
      
      if (uploadResponse.data.success) {
        // Create a new document entry from the response
        const newDocument: UnifiedPDF = {
          id: uploadResponse.data.pdfId || Date.now().toString(),
          name: uploadResponse.data.pdf_filename || file.name,
          originalFilename: uploadResponse.data.pdf_filename || file.name,
          documentType: 'pdf',
          fileSize: file.size,
          processingStatus: uploadResponse.data.processing_status || 'processing',
          vectorized: false, // Will be updated when processing completes
          uploadedAt: new Date().toISOString(),
          processedAt: uploadResponse.data.processed_at || new Date().toISOString(),
          deviceId: uploadResponse.data.device_id || deviceId,
          deviceName: uploadResponse.data.device_name || deviceName,
          organizationId: 'public',
          collectionName: uploadResponse.data.collection_name || undefined,
          totalPages: uploadResponse.data.total_pages || undefined,
          processedChunks: uploadResponse.data.chunk_count || undefined,
          processingTime: uploadResponse.data.processing_time || undefined
        };

        setDocuments((prev: UnifiedPDF[]) => [newDocument, ...prev]);
        
        // Show immediate success message (no loading screen)
        const successMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: uploadResponse.data.message || `✅ PDF "${newDocument.name}" uploaded successfully. We're processing your document in the background. You'll receive a notification when it's ready for AI chat queries.`,
          timestamp: new Date()
        };
        setChatMessages((prev: ChatMessage[]) => [...prev, successMessage]);

        // Reset device selector
        setShowDeviceSelector(false);
        setSelectedDeviceForUpload('');
      } else {
        throw new Error(uploadResponse.data.error || 'Upload failed');
      }
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
      const document = documents.find((doc: UnifiedPDF) => doc.id === documentId);
      if (document) {
        logInfo('Knowledge', `🗑️ Starting deletion process for document: "${document.name}" (ID: ${documentId})`);
        console.log(`📋 [Knowledge] Document details:`, {
          id: document.id,
          name: document.name,
          type: document.documentType,
          size: document.fileSize,
          status: document.processingStatus,
          vectorized: document.vectorized,
          chunk_count: document.processedChunks,
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
        setDocuments((prev: UnifiedPDF[]) => {
          const updatedDocs = prev.filter((doc: UnifiedPDF) => doc.id !== documentId);
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

  // Get device summary statistics
  const deviceSummary = devices.map(device => {
    const devicePDFs = documents.filter(doc => doc.deviceId === device.id);
    return {
      ...device,
      pdfCount: devicePDFs.length,
      hasPDFs: devicePDFs.length > 0
    };
  }).filter(device => device.hasPDFs);

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
                    {/* Query Type Indicator */}
                    {message.type === 'assistant' && message.queryType && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          message.queryType === 'DATABASE' ? 'bg-blue-100 text-blue-700' :
                          message.queryType === 'PDF' ? 'bg-green-100 text-green-700' :
                          message.queryType === 'MIXED' ? 'bg-purple-100 text-purple-700' :
                          message.queryType === 'LLM_ANSWER' ? 'bg-orange-100 text-orange-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {UnifiedQueryService.getQueryTypeIcon(message.queryType)} {message.queryType}
                        </span>
                        {message.rowCount && (
                          <span className="text-xs text-gray-500">
                            {message.rowCount} result{message.rowCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div 
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatResponseText(message.content) }}
                    />
                    
                    {/* Database Results Table */}
                    {message.type === 'assistant' && message.databaseResults && message.databaseResults.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">📊 Database Results:</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(message.databaseResults[0]).slice(0, 5).map((key, index) => (
                                  <th key={index} className="px-2 py-1 text-left font-medium text-gray-700 border-b border-gray-200">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.databaseResults.slice(0, 5).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-100">
                                  {Object.values(row).slice(0, 5).map((value, colIndex) => (
                                    <td key={colIndex} className="px-2 py-1 text-gray-600">
                                      {value ? String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '') : '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {message.databaseResults.length > 5 && (
                            <div className="text-xs text-gray-500 mt-1">
                              ... and {message.databaseResults.length - 5} more results
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* SQL Query Display */}
                    {message.type === 'assistant' && message.sqlQuery && (
                      <div className="mt-3">
                        <details className="text-xs">
                          <summary className="font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                            🔍 View SQL Query
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            <code>{message.sqlQuery}</code>
                          </pre>
                        </details>
                      </div>
                    )}
                    
                    {/* Display Images */}
                    {message.images && message.images.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">📷 Related Images:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {message.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={`data:${image.mime_type};base64,${image.data}`}
                                alt={getDisplayImageName(image.filename, index)}
                                title={getDisplayImageName(image.filename, index)}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head><title>${getDisplayImageName(image.filename, index)}</title></head>
                                        <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f0f0f0;">
                                          <img src="data:${image.mime_type};base64,${image.data}" 
                                               alt="${getDisplayImageName(image.filename, index)}" 
                                               style="max-width:90%;max-height:90%;object-fit:contain;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-radius:8px;">
                                        </body>
                                      </html>
                                    `);
                                  }
                                }}
                              />
                              <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                {getDisplayImageName(image.filename, index)}
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
              <div className="relative flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={selectedDocument ? `Ask about "${selectedDocument.name}"...` : "Ask about your devices, documents, or troubleshooting..."}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 shadow-sm"
                  />
                  
                  {/* Query Suggestions */}
                  {showSuggestions && querySuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="p-2 text-xs text-gray-500 border-b border-gray-100">
                        💡 Try these queries:
                      </div>
                      {querySuggestions.slice(0, 8).map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={testBackendConnection}
                  className="px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all flex items-center gap-2 shadow-sm"
                  title="Test Backend Connection"
                >
                  <span className="text-sm">🔍</span>
                  Test
                </button>
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

        {/* Right Panel - PDF Document Library - 33% width */}
        <div className="w-1/3 flex flex-col bg-white border-l border-gray-200 min-h-0">
          {/* PDF Library Header - Fixed */}
          <div className="knowledge-fixed-header flex-shrink-0 p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">PDF Library</h2>
              <div className="flex items-center gap-2">
                {deviceSummary.length > 0 && (
                  <button
                    onClick={() => setShowDeviceSummary(!showDeviceSummary)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                      showDeviceSummary 
                        ? 'bg-green-100 text-green-700 border border-green-300' 
                        : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}
                  >
                    📊 {showDeviceSummary ? 'Hide Summary' : 'Device Summary'}
                  </button>
                )}

                <button
                  onClick={refreshCollections}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all shadow-sm disabled:opacity-50"
                  title="Refresh collections from external service"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <Settings className="w-4 h-4" />
                  )}
                  Refresh
                </button>
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
            </div>

            {/* Device Summary */}
            {showDeviceSummary && deviceSummary.length > 0 && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 bg-green-100 rounded">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <h4 className="text-sm font-medium text-green-800">Device PDF Summary</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {deviceSummary.map((device) => (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-blue-100 rounded">
                          <FileText className="w-3 h-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{device.name}</p>
                          <p className="text-xs text-gray-500">{device.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-600">{device.pdfCount}</span>
                        <p className="text-xs text-gray-500">PDF{device.pdfCount !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-2">
                  💡 These PDFs are available for chat queries in their respective device detail pages.
                </p>
              </div>
            )}

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
                          <h4 className="font-medium text-gray-900 truncate text-sm">
                            {doc.deviceName ? `${doc.deviceName} - ${doc.name}` : doc.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            {/* <span>{formatFileSize(doc.size)}</span> */}
                            <span>•</span>
                            <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                            {doc.processedChunks && (
                              <>
                                <span>•</span>
                                <span>{doc.processedChunks} chunks</span>
                              </>
                            )}
                          </div>
                          {doc.deviceName && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                📱 {doc.deviceName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {getStatusIcon(doc.processingStatus)}
                        {doc.processingStatus === 'processing' && (
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            Processing...
                          </span>
                        )}
                        {doc.processingStatus === 'completed' && doc.vectorized && (
                          <Brain className="w-4 h-4 text-green-500" />
                        )}
                        {doc.processingStatus === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDocument(doc.id);
                            }}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
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
              <div className="flex items-center gap-4">
                <span>{documents.length} PDF documents</span>
                <span>{documents.filter(d => d.vectorized).length} AI ready</span>
                <span className="text-blue-600 font-medium">
                  📱 {documents.filter(d => d.deviceName).length} device-associated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Selector Modal */}
      {showDeviceSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Upload PDF Document</h3>
                <p className="text-sm text-gray-600">Associate with a device for better organization</p>
              </div>
            </div>
            
            {/* File Info */}
            {selectedFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            
            {/* Device Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Device Association (Optional)
              </label>
              <select
                value={selectedDeviceForUpload}
                onChange={(e) => setSelectedDeviceForUpload(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">📄 No device association (General document)</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    📱 {device.name} ({device.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedDeviceForUpload 
                  ? 'This PDF will be available for chat queries in the device details section.'
                  : 'This PDF will be available in the general knowledge base.'
                }
              </p>
            </div>
            
            {/* Action Buttons */}
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
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                  'Upload PDF'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
