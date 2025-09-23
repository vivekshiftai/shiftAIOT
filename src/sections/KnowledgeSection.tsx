import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Search, 
  FileText, 
  Brain, 
  Send,
  Bot,
  User,
  Plus
} from 'lucide-react';
import { pdfProcessingService, PDFImage } from '../services/pdfprocess';
import { logError, logInfo } from '../utils/logger';
import { formatKnowledgeBaseResponse, getUserDisplayName } from '../utils/responseTemplates';
import { useAuth } from '../contexts/AuthContext';
import '../styles/knowledge.css';
import { knowledgeAPI } from '../services/api';
import { ImageViewer } from '../components/UI/ImageViewer';
import { processImagePlaceholders } from '../utils/imageResponseProcessor';
import { useSectionState } from '../hooks/useSectionState';
import { ChatFeedbackButtons } from '../components/Chat/ChatFeedbackButtons';
import { chatFeedbackService } from '../services/chatFeedbackService';
import { chatService } from '../services/chatService';

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
  pdfs?: UnifiedPDF[];
  pdfCount?: number;
  hasPDFs?: boolean;
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
  const { user } = useAuth();
  const [documents, setDocuments] = useState<UnifiedPDF[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [devices] = useState<Device[]>([]);
  const [selectedDeviceForUpload, setSelectedDeviceForUpload] = useState<string>('');
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  // Persistent chat messages that survive navigation
  const [sectionState, setSectionState] = useSectionState('knowledge_base', {
    chatMessages: [
      {
        id: '1',
        type: 'assistant',
        content: 'Hello! I\'m your AI assistant for machines.\n\n**How to use:**\n1. Select a machine from the "AI Ready Machines" panel on the right\n2. Ask questions about that machine\n\n\n**Available machines with Device Guides will appear on the right. Select one to get started!**',
        timestamp: new Date()
      }
    ] as ChatMessage[]
  });
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [querySuggestions, setQuerySuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<PDFImage[]>([]);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  // Refs for scrolling
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const documentsListRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [sectionState.chatMessages]);

  // Simple function to load query suggestions (optional)
  const loadQuerySuggestions = async () => {
    try {
      // Set some default suggestions instead of calling API
      const defaultSuggestions = [
        "How do I troubleshoot this machine?",
        "What maintenance procedures are needed?",
        "How do I install this device?",
        "What are the safety precautions?",
        "How do I operate this machine?"
      ];
      setQuerySuggestions(defaultSuggestions);
      logInfo('Knowledge', 'Default query suggestions loaded', { count: defaultSuggestions.length });
    } catch (error) {
      logError('Knowledge', 'Failed to load query suggestions', error instanceof Error ? error : new Error('Unknown error'));
    }
  };


  // Data loading function - can be called multiple times
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      logInfo('Knowledge', 'Loading devices from unified PDFs table...');
      
      // Load documents from unified PDFs table via knowledge API
      const knowledgeResponse = await knowledgeAPI.getDocuments();
      
      // Debug: Log the actual response
      logInfo('Knowledge', 'Knowledge API Response', {
        status: knowledgeResponse.status,
        headers: knowledgeResponse.headers,
        documentsCount: knowledgeResponse.data?.documents?.length || 0
      });
      
      if (knowledgeResponse.data.documents) {
        const knowledgeDocuments: UnifiedPDF[] = knowledgeResponse.data.documents.map((doc: any) => ({
          id: doc.id.toString(),
          name: doc.name,
          originalFilename: doc.originalFilename || doc.name,
          documentType: doc.documentType || 'pdf',
          fileSize: doc.fileSize || 0,
          processingStatus: doc.processingStatus || 'completed',
          vectorized: doc.vectorized === true || doc.vectorized === 'true', // Handle both boolean and string
          uploadedAt: doc.uploadedAt,
          processedAt: doc.processedAt || doc.uploadedAt,
          deviceId: doc.deviceId,
          deviceName: doc.deviceName,
          organizationId: doc.organizationId || 'activeops-hub-org-2024',
          collectionName: doc.collectionName,
          totalPages: doc.totalPages,
          processedChunks: doc.processedChunks || 0,
          processingTime: doc.processingTime
        }));
        
        setDocuments(knowledgeDocuments);
        
        // Debug: Log document details
        logInfo('Knowledge', 'Processed documents', {
          totalDocuments: knowledgeDocuments.length,
          documentsWithDeviceInfo: knowledgeDocuments.filter(doc => doc.deviceId && doc.deviceName).length
        });
        
        logInfo('Knowledge', 'Devices loaded successfully', { 
          totalDocuments: knowledgeDocuments.length,
          devicesWithPDFs: knowledgeDocuments.filter(doc => doc.deviceId && doc.deviceName).length
        });
      } else {
        logInfo('Knowledge', 'No documents found', {
          responseData: knowledgeResponse.data,
          responseStructure: Object.keys(knowledgeResponse.data || {})
        });
        logInfo('Knowledge', 'No documents found in unified PDFs table');
        setDocuments([]);
      }
    } catch (error) {
      logError('Knowledge', 'Failed to load devices from unified PDFs table', error instanceof Error ? error : new Error('Unknown error'));
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    // Load data immediately when component mounts
    loadData();
    loadQuerySuggestions();
  }, [loadData]); // Include loadData in dependencies


  // Add a ref to detect when the component is visible
  const knowledgeSectionRef = useRef<HTMLDivElement>(null);

  // Use intersection observer to detect when Knowledge section becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            logInfo('Knowledge', 'Knowledge section is now visible, checking if data needs refresh');
            // Only refresh if we don't have any documents loaded
            if (documents.length === 0) {
              logInfo('Knowledge', 'No documents loaded, refreshing data');
              loadData();
            }
          }
        });
      },
      { threshold: 0.1 } // Trigger when 10% of the component is visible
    );

    if (knowledgeSectionRef.current) {
      observer.observe(knowledgeSectionRef.current);
    }

    return () => {
      if (knowledgeSectionRef.current) {
        observer.unobserve(knowledgeSectionRef.current);
      }
    };
  }, [documents.length, loadData]);



  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    // Generate session ID for this conversation
    const sessionId = `knowledge_${Date.now()}`;

    setSectionState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMessage]
    }));
    setNewMessage('');
    setIsTyping(true);

    // Save user message to database and get the real database ID
    let userMessageId: string | undefined;
    if (user?.id && user?.organizationId) {
      const savedUserMessage = await chatService.saveUserMessage(
        user.id,
        selectedDevice?.id,
        user.organizationId,
        newMessage,
        sessionId
      );
      userMessageId = savedUserMessage.id;
    }

    try {
      // If a device is selected, query its PDFs
      if (selectedDevice) {
        // Get device PDFs from the selected device - use any PDF regardless of processing status
        const devicePDFs = selectedDevice.pdfs || documents.filter(doc => doc.deviceName === selectedDevice.name);
        
        if (devicePDFs.length > 0) {
          // Try to query the first available PDF for the device
          const primaryPDF = devicePDFs[0];
          
          try {
            // Use the PDF name stored in the unified PDFs table
            const queryRequest = {
              pdf_name: primaryPDF.name,
              query: userMessage.content,
              top_k: 5
            };
            
            logInfo('Knowledge', `Querying PDF "${primaryPDF.name}" for device "${selectedDevice.name}"`);
            
            const queryResponse = await pdfProcessingService.queryPDF(queryRequest);
            
            // Format response with personalized template
            const username = getUserDisplayName(user);
            let formattedContent = formatKnowledgeBaseResponse(queryResponse, username);
            
            // Safety check: Ensure we don't display raw JSON
            if (formattedContent.includes('"response":') || formattedContent.includes('"chunks_used":')) {
              logError('KnowledgeSection', 'Raw JSON response detected, cleaning up', new Error('JSON response not properly formatted'));
              // Try to extract just the response content
              try {
                const jsonMatch = formattedContent.match(/"response":\s*"([^"]*(?:\\.[^"]*)*)"/);
                if (jsonMatch && jsonMatch[1]) {
                  formattedContent = jsonMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\"/g, '"')
                    .replace(/\\t/g, '\t');
                } else {
                  formattedContent = "I found information about your query, but there was an issue formatting the response. Please try asking your question in a different way.";
                }
              } catch (error) {
                formattedContent = "I found information about your query, but there was an issue formatting the response. Please try asking your question in a different way.";
              }
            }
            
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: formattedContent,
              timestamp: new Date(),
              images: queryResponse.images || [],
              tables: queryResponse.tables || [],
              chunks_used: queryResponse.chunks_used || [],
              processing_time: queryResponse.processing_time,
              queryType: 'PDF'
            };

            // Save assistant message to database and get the real database ID
            let assistantMessageId: string | undefined;
            if (user?.id && user?.organizationId) {
              const savedAssistantMessage = await chatService.saveAssistantMessage(
                user.id,
                selectedDevice?.id,
                user.organizationId,
                formattedContent,
                sessionId,
                'PDF',
                primaryPDF.name,
                queryResponse.chunks_used ? JSON.stringify(queryResponse.chunks_used) : undefined,
                queryResponse.processing_time,
                undefined, // sqlQuery
                undefined, // databaseResults
                undefined  // rowCount
              );
              assistantMessageId = savedAssistantMessage.id;
            }

            setSectionState(prev => ({
              ...prev,
              chatMessages: [...prev.chatMessages, assistantMessage]
            }));
          } catch (queryError) {
            logError('Knowledge', `Failed to query documentation for device "${selectedDevice.name}"`, queryError instanceof Error ? queryError : new Error('Unknown error'));
            
            // Simple fallback message
            const fallbackMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'assistant',
              content: `I'm having trouble accessing the documentation for "${selectedDevice.name}" right now. Please try again later or contact support if the issue persists.`,
              timestamp: new Date(),
              queryType: 'UNKNOWN'
            };
            setSectionState(prev => ({
              ...prev,
              chatMessages: [...prev.chatMessages, fallbackMessage]
            }));
          }
        } else {
          // No Device Guides available for this device
          const noPDFMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: `No Device Guide is available for device "${selectedDevice.name}". Please upload a Device Guide for this device to enable AI-powered queries.`,
            timestamp: new Date(),
            queryType: 'UNKNOWN'
          };
          setSectionState(prev => ({
            ...prev,
            chatMessages: [...prev.chatMessages, noPDFMessage]
          }));
        }
      } else {
        // No device selected - show helpful message
        const noDeviceMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `Please select a device from the "AI Ready Machines" panel on the right to ask questions about its documentation. I can help you with troubleshooting, maintenance, installation, and other device-related questions once you select a machine.`,
          timestamp: new Date(),
          queryType: 'UNKNOWN'
        };
        setSectionState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, noDeviceMessage]
        }));
      }
    } catch (error) {
      logError('Knowledge', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again or select a device to query its documentation.',
        timestamp: new Date(),
        queryType: 'UNKNOWN'
      };
      setSectionState(prev => ({
        ...prev,
        chatMessages: [...prev.chatMessages, errorMessage]
      }));
    } finally {
      setIsTyping(false);
    }
  };

  const formatResponseText = (text: string, images: any[] = []): string => {
    // First, process image placeholders
    const imageProcessed = processImagePlaceholders(text, images);
    let formatted = imageProcessed.processedText;
    
    // Convert line breaks to HTML
    formatted = formatted.replace(/\n/g, '<br>');
    
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

  // Function to open image viewer
  const openImageViewer = (images: PDFImage[], initialIndex: number = 0) => {
    logInfo('Knowledge', 'Opening image viewer', { 
      imageCount: images.length, 
      initialIndex 
    });
    setImageViewerImages(images);
    setImageViewerInitialIndex(initialIndex);
    setImageViewerOpen(true);
  };

  const closeImageViewer = () => {
    setImageViewerOpen(false);
    setImageViewerImages([]);
    setImageViewerInitialIndex(0);
  };

  // Feedback handling functions
  const handleFeedback = async (messageId: string, feedback: 'like' | 'dislike' | 'regenerate') => {
    try {
      logInfo('KnowledgeSection', 'Handling user feedback', { 
        messageId, 
        feedback 
      });

      // Send feedback to backend
      await chatFeedbackService.addFeedback({
        messageId,
        feedback
      });

      logInfo('KnowledgeSection', 'Feedback submitted successfully', { 
        messageId, 
        feedback 
      });

    } catch (error) {
      logError('KnowledgeSection', 'Failed to submit feedback', error instanceof Error ? error : new Error('Unknown error'));
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
            content: uploadResponse.data.message || `✅ Device Guide "${newDocument.name}" uploaded successfully. We're processing your document in the background. You'll receive a notification when it's ready for AI chat queries.`,
          timestamp: new Date()
        };
        setSectionState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, successMessage]
        }));

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


  // Get devices from unified PDFs table (devices that have PDFs) - memoized to prevent unnecessary recalculations
  const devicesWithPDFs = useMemo(() => {
    logInfo('Knowledge', 'Calculating devicesWithPDFs from documents', { documentsCount: documents.length });
    
    // Remove all filters - show ALL devices with PDFs regardless of processing status
    const filteredDocs = documents.filter(doc => doc.deviceName); // Only filter by deviceName
    logInfo('Knowledge', 'Filtered documents (with deviceName only)', { filteredDocsCount: filteredDocs.length });
    
    const devices = filteredDocs.reduce((acc, doc) => {
      // Group by device name instead of device ID
      const existingDevice = acc.find(d => d.name === doc.deviceName);
      if (existingDevice) {
        existingDevice.pdfs!.push(doc);
        existingDevice.pdfCount!++;
      } else {
        acc.push({
          id: doc.deviceId || `device-${doc.deviceName}`, // Use deviceId if available, otherwise generate one
          name: doc.deviceName!,
          type: 'Machine', // Default type for devices from PDFs
          status: 'online', // Default status
          pdfs: [doc],
          pdfCount: 1,
          hasPDFs: true
        });
      }
      return acc;
    }, [] as Array<Device & { pdfs: UnifiedPDF[]; pdfCount: number; hasPDFs: boolean }>);
    
    logInfo('Knowledge', 'Final devices array', { devicesCount: devices.length });
    return devices;
  }, [documents]); // Only recalculate when documents change

  // Filter devices based on search query - memoized to prevent unnecessary recalculations
  const filteredDevices = useMemo(() => {
    return devicesWithPDFs.filter(device =>
      device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [devicesWithPDFs, searchQuery]); // Only recalculate when devices or search query change


  return (
    <div ref={knowledgeSectionRef} className="knowledge-section flex flex-col bg-gray-50 h-full">
      {/* Fixed Header */}
      <div className="knowledge-fixed-header flex-shrink-0 bg-white border-b border-gray-200 px-3 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-header">Knowledge Base</h1>
            <p className="page-subtitle">
              AI-powered machine documentation and chat assistant
              {selectedDevice && (
                <span className="ml-2 text-primary-600 font-medium">
                  • Active: {selectedDevice.name}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Fixed height, no overflow */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Panel - Chat Interface */}
        <div className="flex-1 flex flex-col bg-white min-h-0">
          {/* Chat Messages Area - Scrollable content only */}
          <div 
            ref={chatMessagesRef}
            className="knowledge-chat-messages p-6 space-y-6"
          >
            {sectionState.chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="flex items-start gap-3 max-w-2xl">
                  <div className={`p-2 rounded-full flex-shrink-0 ${
                    message.type === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-neutral-100 text-neutral-600'
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
                        ? 'bg-primary-500 text-white'
                        : 'bg-neutral-50 text-neutral-900 border border-neutral-200'
                    }`}
                  >
                    {/* Query Type Indicator */}
                    {message.type === 'assistant' && message.queryType && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          message.queryType === 'DATABASE' ? 'bg-primary-100 text-primary-700' :
                          message.queryType === 'PDF' ? 'bg-success-100 text-success-700' :
                          message.queryType === 'MIXED' ? 'bg-secondary-100 text-secondary-700' :
                          message.queryType === 'LLM_ANSWER' ? 'bg-warning-100 text-warning-700' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {message.queryType === 'PDF' ? '📄' : message.queryType === 'DATABASE' ? '📊' : '🤖'} {message.queryType === 'PDF' ? 'Knowledge Base' : message.queryType}
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
                      dangerouslySetInnerHTML={{ __html: formatResponseText(message.content, message.images) }}
                      onClick={(e) => {
                        // Handle inline image clicks to open in ImageViewer
                        const target = e.target as HTMLElement;
                        if (target.tagName === 'IMG' && target.classList.contains('inline-response-image')) {
                          const filename = target.getAttribute('data-filename');
                          if (filename && message.images) {
                            const imageIndex = message.images.findIndex(img => img.filename === filename);
                            if (imageIndex !== -1) {
                              openImageViewer(message.images, imageIndex);
                            }
                          }
                        }
                      }}
                    />
                    
                    {/* Database Results Table */}
                    {message.type === 'assistant' && message.databaseResults && message.databaseResults.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-500 mb-2">📊 Database Results:</div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs border-collapse border border-gray-300 rounded-lg overflow-hidden">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(message.databaseResults[0]).slice(0, 5).map((key, index) => (
                                  <th key={index} className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300 border-r border-gray-200 last:border-r-0">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {message.databaseResults.slice(0, 5).map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-gray-200 hover:bg-gray-50">
                                  {Object.values(row).slice(0, 5).map((value, colIndex) => (
                                    <td key={colIndex} className="px-3 py-2 text-gray-600 border-r border-gray-200 last:border-r-0">
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
                    
                    {/* Images are now displayed inline in the text above - no separate gallery needed */}
                    
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
                                style={{
                                  '--table-border': '#d1d5db',
                                  '--table-border-thick': '#9ca3af'
                                } as React.CSSProperties}
                                dangerouslySetInnerHTML={{ 
                                  __html: table.replace(
                                    /<table/g, 
                                    '<table style="border-collapse: collapse; width: 100%; border: 1px solid var(--table-border-thick);"'
                                  ).replace(
                                    /<th/g, 
                                    '<th style="border: 1px solid var(--table-border); padding: 8px; background-color: #f9fafb; font-weight: 600;"'
                                  ).replace(
                                    /<td/g, 
                                    '<td style="border: 1px solid var(--table-border); padding: 8px;"'
                                  )
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Display Chunks Used */}
                    {/* Sources Used section commented out as requested */}
                    {/* {message.chunks_used && message.chunks_used.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">📄 Sources Used:</p>
                        <div className="space-y-2">
                          {message.chunks_used.map((chunk, index) => (
                            <div key={index} className="text-xs bg-primary-50 border border-primary-200 px-3 py-2 rounded-lg">
                              <span className="text-primary-600 font-medium">Source {index + 1}:</span>
                              <span className="text-neutral-700 ml-2">{chunk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )} */}
                    
                    {/* Display Processing Time */}
                    {message.processing_time && (
                      <p className="text-xs text-gray-500 mt-2">
                        ⏱️ Processed in {message.processing_time}
                      </p>
                    )}
                    
                    {/* Feedback Buttons for Assistant Messages */}
                    {message.type === 'assistant' && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <ChatFeedbackButtons
                          messageId={message.id}
                          onFeedback={handleFeedback}
                          disabled={isTyping}
                        />
                      </div>
                    )}
                    
                    <p className={`text-xs mt-2 ${
                      message.type === 'user' ? 'text-primary-100' : 'text-neutral-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
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
          <div className="knowledge-fixed-footer flex-shrink-0 bg-white border-t border-gray-200 p-3 sm:p-4">
            <div className="space-y-3">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setNewMessage('How do I install this machine and how to start it and stop it?')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Setup Guide
                </button>
                <button
                  onClick={() => setNewMessage('What maintenance procedures are required for this machine? How often should I perform maintenance and what are the steps?')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Maintenance
                </button>
                <button
                  onClick={() => setNewMessage('Help me troubleshoot common issues with this machine. What are the most frequent problems and how to fix them?')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Troubleshooting
                </button>
                <button
                  onClick={() => setNewMessage('Show me the technical specifications, operating parameters, and performance characteristics of this machine.')}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  Specifications
                </button>
              </div>
              
              {/* Message Input */}
              <div className="relative flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    placeholder={selectedDevice ? `Ask about "${selectedDevice.name}"...` : "Ask about your machines, documents, or troubleshooting..."}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 shadow-sm"
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
                          className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isTyping}
                  className="px-4 sm:px-6 py-3 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - AI Ready Devices - 25% width */}
        <div className="w-full lg:w-1/4 flex flex-col bg-white border-l border-gray-200 min-h-0">
          {/* AI Ready Devices Header - Fixed */}
          <div className="knowledge-fixed-header flex-shrink-0 p-3 sm:p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
              <h2 className="section-header">AI Ready Machines</h2>
              {/* Upload Guide Button - Commented out for now */}
              {/* <div className="flex items-center gap-2">
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
                    {uploading ? 'Uploading...' : 'Upload Guide'}
                  </div>
                </label>
              </div> */}
            </div>

            {/* Search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search machines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Devices List - Scrollable content only */}
          <div 
            ref={documentsListRef}
            className="knowledge-documents-list"
          >
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                <p className="text-neutral-500 mt-2 text-sm">Loading machines...</p>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? 'No machines found' : 'No machines with Device Guides available'}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`p-4 hover:bg-neutral-50 cursor-pointer transition-colors ${
                      selectedDevice?.id === device.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
                    }`}
                    onClick={() => {
                      setSelectedDevice(device);
                      // Add a message to the chat when a device is selected
                      const deviceSelectionMessage: ChatMessage = {
                        id: (Date.now() + 1).toString(),
                        type: 'assistant',
                        content: `✅ **${device.name}** selected! I now have access to this machine's documentation.\n\nAsk me anything about this machine - I'll search through its documentation to provide accurate answers!`,
                        timestamp: new Date(),
                        queryType: 'PDF'
                      };
                      setSectionState(prev => ({
                        ...prev,
                        chatMessages: [...prev.chatMessages, deviceSelectionMessage]
                      }));
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg flex-shrink-0">
                          <FileText className="w-4 h-4 text-primary-600" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate text-sm">
                            {device.name}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span>{device.type}</span>
                            <span>•</span>
                            <span className="text-success-600 font-medium">AI Ready</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-2">
                        {device.hasPDFs && (
                          <Brain className="w-4 h-4 text-success-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Ready Devices Footer - Fixed at bottom */}
          <div className="knowledge-fixed-footer flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="text-success-500 font-medium">
                  {devicesWithPDFs.filter(d => d.hasPDFs).length} AI ready machines
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
              <div className="p-2 rounded-lg">
                <FileText className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="subsection-header">Upload Device Guide</h3>
                <p className="subsection-subtitle">Associate with a machine for better organization</p>
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
                Machine Association (Optional)
              </label>
              <select
                value={selectedDeviceForUpload}
                onChange={(e) => setSelectedDeviceForUpload(e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg bg-white text-neutral-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">📄 No machine association (General document)</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    📱 {device.name} ({device.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {selectedDeviceForUpload 
                  ? 'This Device Guide will be available for chat queries in the machine details section.'
                  : 'This Device Guide will be available in the general knowledge base.'
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
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Uploading...
                  </div>
                ) : (
                    'Upload Device Guide'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      <ImageViewer
        images={imageViewerImages}
        isOpen={imageViewerOpen}
        onClose={closeImageViewer}
        initialIndex={imageViewerInitialIndex}
      />
    </div>
  );
};
