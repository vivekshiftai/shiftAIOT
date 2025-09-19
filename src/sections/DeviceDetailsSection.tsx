import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Settings,
  Trash2,
  Edit,
  Download,
  Upload,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send,
  User,
  Bot,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  ArrowLeft,
  Wrench,
  Brain
} from 'lucide-react';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { DeviceCard } from '../components/Devices/DeviceCard';
import { DeviceDetails } from '../components/Devices/DeviceDetails';
import { useUserDisplayName } from '../hooks/useUserDisplayName';
import DeviceAnalyticsDisplay from '../components/Devices/DeviceAnalyticsDisplay';
import DeviceLogsDisplay from '../components/Devices/DeviceLogsDisplay';
import DeviceMaintenanceDisplay from '../components/Devices/DeviceMaintenanceDisplay';
import DeviceRulesDisplay from '../components/Devices/DeviceRulesDisplay';
import { DevicePDFResults } from '../components/Devices/DevicePDFResults';
import { DeviceChatInterface } from '../components/Devices/DeviceChatInterface';
import DeviceSafetyInfo from '../components/Devices/DeviceSafetyInfo';
import { DeviceRules } from '../components/Devices/DeviceRules';
import { DeviceConnectionManager } from '../components/Devices/DeviceConnectionManager';
// ChatImageDisplay and ChatTableDisplay imports removed - using inline implementation like Knowledge Section
import { deviceAPI, knowledgeAPI } from '../services/api';
import { pdfAPI } from '../services/api';
import { pdfProcessingService, PDFListResponse } from '../services/pdfprocess';
import { DeviceStatsService, DeviceStats } from '../services/deviceStatsService';
import { logInfo, logError, logWarn } from '../utils/logger';
import { formatKnowledgeBaseResponse, getUserDisplayName } from '../utils/responseTemplates';
import { validateDeviceUpdate, sanitizeDeviceData, getChangedFields } from '../utils/deviceValidation';
import { TabLoadingScreen, DataLoadingState, LoadingSpinner } from '../components/Loading/LoadingComponents';
import { tokenService } from '../services/tokenService';
import { PDFImage } from '../services/chatService';
import { ImageViewer } from '../components/UI/ImageViewer';
import { processImagePlaceholders } from '../utils/imageResponseProcessor';

interface DocumentationInfo {
  deviceId: string;
  deviceName: string;
  files: {
    manual: { available: boolean; url?: string; size?: number };
    datasheet: { available: boolean; url?: string; size?: number };
    certificate: { available: boolean; url?: string; size?: number };
  };
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
  deviceId?: string;
  deviceName?: string;
  organizationId: string;
  collectionName?: string;
  totalPages?: number;
  processedChunks?: number;
  processingTime?: string;
}

interface MaintenanceTask {
  id: string;
  taskName: string;
  description?: string;
  status: string;
  priority: string;
  frequency: string;
  nextMaintenance: string;
  deviceName?: string;
  assignedTo?: string;
  estimatedDuration?: string;
  notes?: string;
  requiredTools?: string;
  safetyNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// Maintenance Card Component
const MaintenanceCard: React.FC<{ task: MaintenanceTask }> = ({ task }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-primary-100 text-primary-800';
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-slate-800 mb-1">{task.taskName}</h4>
          <p className="text-sm text-slate-600 mb-2">{task.frequency}</p>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <EyeOff className="w-4 h-4 text-slate-500" />
          ) : (
            <Eye className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      <div className="text-sm text-slate-600 mb-3">
        <p><strong>Next:</strong> {formatDate(task.nextMaintenance)}</p>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200 pt-3 space-y-2">
          {task.description && (
            <div>
              <p className="text-sm text-slate-700"><strong>Description:</strong></p>
              <p className="text-sm text-slate-600">{task.description}</p>
            </div>
          )}
          
          {task.assignedTo && (
            <div>
              <p className="text-sm text-slate-700"><strong>Assigned to:</strong></p>
              <p className="text-sm text-slate-600">{task.assignedTo}</p>
            </div>
          )}
          
          {task.estimatedDuration && (
            <div>
              <p className="text-sm text-slate-700"><strong>Estimated Duration:</strong></p>
              <p className="text-sm text-slate-600">{task.estimatedDuration}</p>
            </div>
          )}
          
          {task.requiredTools && (
            <div>
              <p className="text-sm text-slate-700"><strong>Required Tools:</strong></p>
              <p className="text-sm text-slate-600">{task.requiredTools}</p>
            </div>
          )}
          
          {task.notes && (
            <div>
              <p className="text-sm text-slate-700"><strong>Notes:</strong></p>
              <p className="text-sm text-slate-600">{task.notes}</p>
            </div>
          )}
          
          {task.safetyNotes && (
            <div>
              <p className="text-sm text-slate-700"><strong>Safety Notes:</strong></p>
              <p className="text-sm text-slate-600">{task.safetyNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const tabs = [
  { id: 'device-info', label: 'Device Information', icon: Settings },
  { id: 'maintenance', label: 'Maintenance', icon: Settings },
  { id: 'rules', label: 'Rules', icon: FileText },
  { id: 'safety', label: 'Safety Info', icon: AlertTriangle },
  { id: 'chat', label: 'Chat', icon: MessageSquare }
];

export const DeviceDetailsSection: React.FC = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const navigate = useNavigate();
  const { devices, updateDeviceStatus } = useIoT();
  const { hasPermission, user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('device-info');
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [documentationInfo, setDocumentationInfo] = useState<DocumentationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [devicePDFs, setDevicePDFs] = useState<UnifiedPDF[]>([]);
  // selectedPDF state removed - we automatically use the first available PDF
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m here to help you with information about this device. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);
  
  // Real-time data states
  const [deviceStats, setDeviceStats] = useState<DeviceStats | null>(null);
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceTask[]>([]);
  const [deviceRules, setDeviceRules] = useState<any[]>([]);
  const [safetyPrecautions, setSafetyPrecautions] = useState<any[]>([]);
  const [lastSeen, setLastSeen] = useState<string>('');
  const [isRealTimeLoading, setIsRealTimeLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Edit state for device profile
  const [isEditing, setIsEditing] = useState(false);
  const [editedDevice, setEditedDevice] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  // Image viewer state
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [imageViewerImages, setImageViewerImages] = useState<PDFImage[]>([]);
  const [imageViewerInitialIndex, setImageViewerInitialIndex] = useState(0);

  const device = devices.find(d => d.id === deviceId);
  
  // Get user display name for assigned user
  const { displayName: assignedUserName, loading: userNameLoading } = useUserDisplayName(device?.assignedUserId);
  
  // Device state monitoring
  useEffect(() => {
    // Clear any previous errors when device changes
    setError(null);
  }, [deviceId, devices, device, isEditing, editedDevice, isSaving]);

// Test function removed - no longer needed for production

  // Function definitions - must be before useEffect that calls them
  const fetchRealTimeData = async () => {
    if (!device) return;
    
    setIsRealTimeLoading(true);
    try {
      logInfo('DeviceDetails', `🔄 Fetching real-time data for device: ${device.name} (${device.id})`);
      
      // Fetch device statistics with timeout
      try {
        const statsPromise = DeviceStatsService.getDeviceStats(device.id);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Device stats timeout')), 5000)
        );
        const stats = await Promise.race([statsPromise, timeoutPromise]) as any;
        // Device stats loaded successfully
        setDeviceStats(stats);
      } catch (error) {
        logWarn('DeviceDetails', 'Failed to fetch device stats', { error: error instanceof Error ? error.message : 'Unknown error' });
        setDeviceStats(null);
      }
      
      // Fetch detailed data with better error handling and timeouts
      logInfo('DeviceDetails', 'Fetching rules, maintenance, and safety data...');
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 5000)
      );
      
      const [rules, maintenance, safety] = await Promise.allSettled([
        Promise.race([DeviceStatsService.getDeviceRules(device.id), timeoutPromise]),
        Promise.race([DeviceStatsService.getDeviceMaintenance(device.id), timeoutPromise]),
        Promise.race([DeviceStatsService.getDeviceSafety(device.id), timeoutPromise])
      ]);
      
      const rulesData = rules.status === 'fulfilled' ? rules.value : [];
      const maintenanceData = maintenance.status === 'fulfilled' ? maintenance.value : [];
      const safetyData = safety.status === 'fulfilled' ? safety.value : [];
      
      // Transform maintenance data to match MaintenanceTask interface
      const transformedMaintenanceData: MaintenanceTask[] = maintenanceData.map((task: any) => ({
        id: task.id || task.taskId || '',
        taskName: task.taskName || task.title || task.name || 'Unnamed Task',
        description: task.description || task.details || '',
        status: task.status || 'scheduled',
        priority: task.priority || 'medium',
        frequency: task.frequency || task.schedule || 'unknown',
        nextMaintenance: task.nextMaintenance || task.scheduledDate || task.dueDate || new Date().toISOString(),
        deviceName: task.deviceName || device.name,
        assignedTo: task.assignedTo || task.assignedUserId || '',
        estimatedDuration: task.estimatedDuration || task.duration || '',
        notes: task.notes || task.comments || '',
        requiredTools: task.requiredTools || task.tools || '',
        safetyNotes: task.safetyNotes || task.safetyInfo || '',
        createdAt: task.createdAt || task.created_at || new Date().toISOString(),
        updatedAt: task.updatedAt || task.updated_at || new Date().toISOString()
      }));
      
      setDeviceRules(rulesData);
      setMaintenanceHistory(transformedMaintenanceData);
      setSafetyPrecautions(safetyData);
      
      // Update last seen timestamp
      setLastSeen(new Date().toISOString());
      
      logInfo('DeviceDetails', `✅ Real-time data fetched successfully for ${device.name}`, {
        rulesCount: rulesData.length,
        maintenanceCount: maintenanceData.length,
        safetyCount: safetyData.length
      });
    } catch (error) {
      logError('DeviceDetails', 'Failed to fetch real-time data', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsRealTimeLoading(false);
    }
  };

  const loadDevicePDFs = async () => {
    if (!device) {
      return;
    }
    
    // Check authentication before making the request
    const token = tokenService.getToken();
    if (!token) {
      logError('DeviceDetails', 'No authentication token found for PDF loading');
      setError('Authentication required. Please log in again.');
      return;
    }
    
    try {
      logInfo('DeviceDetails', 'Loading PDFs for device from local database', { deviceId: device.id, deviceName: device.name });
      
      // First try to get PDFs from local database using device-specific endpoints
      try {
        // Try the device PDF results endpoint first
        const devicePDFResponse = await deviceAPI.getDevicePDFResults(device.id);
        
        if (devicePDFResponse.data && devicePDFResponse.data.pdfReferences && devicePDFResponse.data.pdfReferences.length > 0) {
          const pdfReferences = devicePDFResponse.data.pdfReferences;
          
          logInfo('DeviceDetails', 'Retrieved PDFs from device PDF results', { 
            deviceId: device.id, 
            totalPDFs: pdfReferences.length 
          });
          
          const filteredPDFs: UnifiedPDF[] = pdfReferences.map((pdfRef: any) => ({
            id: pdfRef.id || pdfRef.pdfName,
            name: pdfRef.pdfName || pdfRef.name,
            originalFilename: pdfRef.originalFilename || pdfRef.pdfName || pdfRef.name,
            documentType: 'pdf',
            fileSize: pdfRef.fileSize || 0,
            processingStatus: pdfRef.status || 'completed',
            vectorized: pdfRef.vectorized !== false,
            uploadedAt: pdfRef.uploadedAt || pdfRef.createdAt || new Date().toISOString(),
            processedAt: pdfRef.processedAt || pdfRef.updatedAt || new Date().toISOString(),
            deviceId: device.id,
            deviceName: device.name,
            organizationId: device.organizationId || 'public',
            collectionName: pdfRef.collectionName,
            totalPages: pdfRef.totalPages || 0,
            processedChunks: pdfRef.processedChunks || 0,
            processingTime: pdfRef.processingTime
          }));
          
          setDevicePDFs(filteredPDFs);
          setInitialChatMessage(`I have access to ${filteredPDFs.length} PDF document(s) related to ${device.name}. Ask me anything about setup, maintenance, troubleshooting, specifications, or any other device-related questions!`);
          
          logInfo('DeviceDetails', 'Device PDFs loaded successfully from device PDF results', { 
            deviceId: device.id, 
            totalPDFs: pdfReferences.length,
            pdfNames: filteredPDFs.map(pdf => pdf.name)
          });
          return;
        }
      } catch (devicePDFError) {
        logError('DeviceDetails', 'Device PDF results failed, trying knowledge documents', devicePDFError instanceof Error ? devicePDFError : new Error('Unknown error'));
      }
      
      // Try knowledge documents by device
      try {
        const knowledgeResponse = await knowledgeAPI.getDocumentsByDevice(device.id);
        
        if (knowledgeResponse.data && knowledgeResponse.data.length > 0) {
          const documents = knowledgeResponse.data;
          
          logInfo('DeviceDetails', 'Retrieved documents from knowledge API', { 
            deviceId: device.id, 
            totalDocuments: documents.length 
          });
          
          // Filter only PDF documents
          const pdfDocuments = documents.filter((doc: any) => 
            doc.documentType === 'pdf' || 
            doc.type === 'pdf' || 
            (doc.filename && doc.filename.toLowerCase().endsWith('.pdf'))
          );
          
          if (pdfDocuments.length > 0) {
            const filteredPDFs: UnifiedPDF[] = pdfDocuments.map((doc: any) => ({
              id: doc.id,
              name: doc.filename || doc.name,
              originalFilename: doc.filename || doc.name,
              documentType: 'pdf',
              fileSize: doc.fileSize || 0,
              processingStatus: doc.status || 'completed',
              vectorized: doc.vectorized !== false,
              uploadedAt: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
              processedAt: doc.processedAt || doc.updatedAt || new Date().toISOString(),
              deviceId: device.id,
              deviceName: device.name,
              organizationId: device.organizationId || 'public',
              collectionName: doc.collectionName,
              totalPages: doc.totalPages || 0,
              processedChunks: doc.processedChunks || 0,
              processingTime: doc.processingTime
            }));
            
            setDevicePDFs(filteredPDFs);
            setInitialChatMessage(`I have access to ${filteredPDFs.length} PDF document(s) related to ${device.name}. Ask me anything about setup, maintenance, troubleshooting, specifications, or any other device-related questions!`);
            
            logInfo('DeviceDetails', 'Device PDFs loaded successfully from knowledge documents', { 
              deviceId: device.id, 
              totalDocuments: documents.length,
              pdfDocuments: pdfDocuments.length,
              pdfNames: filteredPDFs.map(pdf => pdf.name)
            });
            return;
          }
        }
      } catch (knowledgeError) {
        logError('DeviceDetails', 'Knowledge documents failed, trying general documents', knowledgeError instanceof Error ? knowledgeError : new Error('Unknown error'));
      }
      
      // Try general documents with device filtering
      try {
        const generalResponse = await knowledgeAPI.getDocuments();
        
        if (generalResponse.data && generalResponse.data.length > 0) {
          const allDocuments = generalResponse.data;
          
          // Filter documents that might be related to this device
          const deviceDocuments = allDocuments.filter((doc: any) => {
            const docName = (doc.filename || doc.name || '').toLowerCase();
            const deviceName = device.name.toLowerCase();
            
            // Check for device association or name matching
            const isMatch = (doc.deviceId && doc.deviceId === device.id) ||
                           (doc.device_id && doc.device_id === device.id) ||
                           (doc.deviceName && doc.deviceName.toLowerCase() === deviceName) ||
                           (doc.device_name && doc.device_name.toLowerCase() === deviceName) ||
                           docName.includes(deviceName) ||
                           deviceName.includes(docName);
            
            return isMatch && (doc.documentType === 'pdf' || doc.type === 'pdf' || docName.endsWith('.pdf'));
          });
          
          if (deviceDocuments.length > 0) {
            const filteredPDFs: UnifiedPDF[] = deviceDocuments.map((doc: any) => ({
              id: doc.id,
              name: doc.filename || doc.name,
              originalFilename: doc.filename || doc.name,
              documentType: 'pdf',
              fileSize: doc.fileSize || 0,
              processingStatus: doc.status || 'completed',
              vectorized: doc.vectorized !== false,
              uploadedAt: doc.uploadedAt || doc.createdAt || new Date().toISOString(),
              processedAt: doc.processedAt || doc.updatedAt || new Date().toISOString(),
              deviceId: device.id,
              deviceName: device.name,
              organizationId: device.organizationId || 'public',
              collectionName: doc.collectionName,
              totalPages: doc.totalPages || 0,
              processedChunks: doc.processedChunks || 0,
              processingTime: doc.processingTime
            }));
            
            setDevicePDFs(filteredPDFs);
            setInitialChatMessage(`I found ${filteredPDFs.length} PDF document(s) that might be related to ${device.name}. Ask me anything about setup, maintenance, troubleshooting, specifications, or any other device-related questions!`);
            
            logInfo('DeviceDetails', 'Device PDFs loaded from general documents with filtering', { 
              deviceId: device.id, 
              totalDocuments: allDocuments.length,
              deviceDocuments: deviceDocuments.length,
              pdfNames: filteredPDFs.map(pdf => pdf.name)
            });
            return;
          }
        }
      } catch (generalError) {
        logError('DeviceDetails', 'General documents failed', generalError instanceof Error ? generalError : new Error('Unknown error'));
      }
      
      // No PDFs found in local database
      setDevicePDFs([]);
      setInitialChatMessage(`I don't have any PDF documents specifically associated with ${device.name} in the local database. To enable AI-powered assistance, upload device manuals, datasheets, or other documentation in the Knowledge Base section.`);
      
      logInfo('DeviceDetails', 'No PDFs found for device in local database', { deviceId: device.id });
      
    } catch (error) {
      logError('DeviceDetails', 'Failed to load PDFs from local database', error instanceof Error ? error : new Error('Unknown error'));
      setDevicePDFs([]);
      setInitialChatMessage(`I don't have access to PDF documents for ${device.name} at the moment. Please try again later.`);
    }
  };

  const fetchDocumentationInfo = async () => {
    if (!device) return;
    try {
      // Fetching documentation info for device
      const docPromise = deviceAPI.getDocumentation(device.id);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Documentation timeout')), 5000)
      );
      const response = await Promise.race([docPromise, timeoutPromise]) as any;
      setDocumentationInfo(response.data);
              // Documentation info loaded successfully
    } catch (error) {
      logError('DeviceDetails', 'Failed to fetch documentation info', error instanceof Error ? error : new Error('Unknown error'));
      // Set empty documentation info on error
      setDocumentationInfo(null);
    }
  };

  // Clear loading state if device is found and we're still loading
  useEffect(() => {
    if (device && deviceId && isInitialLoading) {
              // Device found, clearing initial loading state
      setIsInitialLoading(false);
    }
  }, [device, deviceId, isInitialLoading]);

  // Main data loading effect
  useEffect(() => {
          // useEffect triggered with device data
    
    if (device && deviceId) {
              // Starting data loading for device
      setIsInitialLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        logWarn('DeviceDetails', 'Data loading timeout, forcing completion');
        setIsInitialLoading(false);
      }, 15000); // 15 second timeout
      
      Promise.allSettled([
        fetchDocumentationInfo(),
        loadDevicePDFs(),
        fetchRealTimeData()
      ]).then((results) => {
        // Data loading results processed
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            logError('DeviceDetails', `Data loading failed for index ${index}`, result.reason instanceof Error ? result.reason : new Error('Unknown error'));
          }
        });
      }).finally(() => {
        // Data loading completed
        clearTimeout(timeoutId);
        setIsInitialLoading(false);
      });
    } else if (deviceId && devices.length > 0) {
      // Device not found but devices are loaded, stop loading
      setIsInitialLoading(false);
    }
  }, [deviceId, devices.length, device]);

  // Show loading if devices are still being loaded
  if (devices.length === 0) {
    return <TabLoadingScreen />;
  }

  // Redirect if device not found
  if (!device) {
    navigate('/devices');
    return null;
  }

  // Show loading screen while initial data is being fetched
  if (isInitialLoading) {
    return <TabLoadingScreen />;
  }

  const handleTabChange = (tabId: string) => {
    setIsTabLoading(true);
    setActiveTab(tabId);
    // Simulate loading for better UX
    setTimeout(() => setIsTabLoading(false), 100);
  };

  const downloadDocumentation = async (type: 'manual' | 'datasheet' | 'certificate') => {
    if (!device || !documentationInfo?.files[type].available) return;

    try {
      setDownloading(type);
      // Note: downloadDocumentation method is not implemented in the API
      // This is a placeholder for future implementation
      logInfo('DeviceDetails', `Download ${type} requested for device: ${device.name}`);
      alert(`Download functionality for ${type} is not yet implemented.`);
    } catch (error) {
      logError('DeviceDetails', `Failed to download ${type}`, error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setDownloading(null);
    }
  };

  // Image viewer functions
  const openImageViewer = (images: PDFImage[], initialIndex: number = 0) => {
    logInfo('DeviceDetails', 'Opening image viewer', { 
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

  if (!device) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Settings className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="subsection-header">Device not found</h3>
          <p className="text-slate-600 mb-6">
            The device you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/devices')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all"
          >
            Back to Devices
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    ONLINE: { 
      color: 'text-success-600', 
      bg: 'bg-success-50',
      label: 'Online'
    },
    OFFLINE: { 
      color: 'text-slate-600', 
      bg: 'bg-slate-50',
      label: 'Offline'
    },
    WARNING: { 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-50',
      label: 'Warning'
    },
    ERROR: { 
      color: 'text-red-600', 
      bg: 'bg-red-50',
      label: 'Error'
    }
  };

  const deviceTypeConfig = {
    SENSOR: { icon: Settings, label: 'Machine' },
    ACTUATOR: { icon: Settings, label: 'Actuator' },
    GATEWAY: { icon: Settings, label: 'Gateway' },
    CONTROLLER: { icon: Settings, label: 'Controller' },
    MACHINE: { icon: Settings, label: 'Machine' }
  };

  const statusInfo = statusConfig[device.status as keyof typeof statusConfig] || { color: 'text-gray-500', bg: 'bg-gray-50', label: 'Unknown' };
  const deviceTypeInfo = deviceTypeConfig[device.type as keyof typeof deviceTypeConfig] || { icon: Settings, label: 'Device' };

  const formatLastSeen = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Edit functions
  const handleEditClick = () => {
    // handleEditClick called
    
    const editData = {
      name: device.name,
      location: device.location,
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      description: device.description || '',
      ipAddress: device.ipAddress || '',
      port: device.port || '',
      mqttBroker: device.mqttBroker || '',
      mqttTopic: device.mqttTopic || '',
      mqttUsername: device.mqttUsername || '',
      mqttPassword: device.mqttPassword || '',
      httpEndpoint: device.httpEndpoint || '',
      httpMethod: device.httpMethod || 'GET',
      httpHeaders: device.httpHeaders || '',
      coapHost: device.coapHost || '',
      coapPort: device.coapPort || '',
      coapPath: device.coapPath || ''
    };
    
          // Setting editedDevice
    setEditedDevice(editData);
    setIsEditing(true);
    setValidationErrors({}); // Clear any previous validation errors
    setError(null); // Clear any previous errors
    
          // Edit mode activated
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedDevice(null);
    setValidationErrors({}); // Clear validation errors when canceling
    setError(null); // Clear any errors when canceling
  };

  const handleSaveEdit = async () => {
    // handleSaveEdit called
    
    if (!device || !editedDevice) {
              // Missing device or editedDevice
      return;
    }

          // Starting save process
    setIsSaving(true);
    
    try {
      // Get only the changed fields to minimize payload
      const changedFields = getChangedFields(device, editedDevice);
              // Changed fields identified
      
      // Sanitize the data to ensure proper null handling
      const sanitizedData = sanitizeDeviceData(changedFields);
              // Data sanitized
      
      // Validate the update data
      const validation = validateDeviceUpdate(sanitizedData);
              // Validation completed
      
      if (!validation.isValid) {
                  // Validation failed
        logError('DeviceDetails', 'Device validation failed', new Error('Validation errors: ' + JSON.stringify(validation.errors)));
        setValidationErrors(validation.errors);
        setIsSaving(false);
        return;
      }
      
      // Clear any previous validation errors
      setValidationErrors({});

      // Add device ID
      sanitizedData.id = device.id;

              // Sending update to API
      logInfo('DeviceDetails', 'Sending device update payload', { 
        deviceId: device.id, 
        payload: sanitizedData,
        validationWarnings: validation.warnings
      });

      await deviceAPI.update(device.id, sanitizedData);
              // API update successful
      
      // Update the device in the IoT context
      updateDeviceStatus(device.id, { ...device, ...editedDevice });
      
      setIsEditing(false);
      setEditedDevice(null);
      
              // Save completed successfully
      logInfo('DeviceDetails', 'Device updated successfully', { deviceId: device.id });
    } catch (error) {
              // Save failed
      logError('DeviceDetails', 'Failed to update device', error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    // handleInputChange called
    
    if (!editedDevice) {
              // No editedDevice found
      return;
    }
    
    // Define required fields that should preserve empty strings for validation
    const requiredFields = ['name', 'location'];
    
    let processedValue;
    if (requiredFields.includes(field)) {
      // For required fields, preserve empty strings for validation
      processedValue = value;
              // Required field - preserving value as-is
    } else {
      // For optional fields, convert empty strings to null for better backend handling
      processedValue = value === '' ? null : value;
              // Optional field - processing value
    }
    
    setEditedDevice((prev: any) => {
      const updated = {
        ...prev,
        [field]: processedValue
      };
      // Updated editedDevice
      return updated;
    });
    
    logInfo('DeviceDetails', 'Field value changed', { 
      field, 
      originalValue: value, 
      processedValue: processedValue,
      isRequired: requiredFields.includes(field)
    });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isTyping) return;

    // Check authentication before sending message
    const token = tokenService.getToken();
    if (!token) {
      setError('Authentication required. Please log in again.');
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'I apologize, but I need you to log in again to continue our conversation. Please refresh the page and log in.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      return;
    }

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
      // Automatically use the first available PDF if we have any
      const pdfToUse = devicePDFs.length > 0 ? devicePDFs[0] : null;
      
      if (pdfToUse) {
        try {
          logInfo('DeviceDetails', 'Querying PDF for device', { 
            deviceId: device.id, 
            pdfName: pdfToUse.name, 
            query: userMessage.content 
          });
          
          const queryRequest = {
            pdf_name: pdfToUse.name, // Use PDF name behind the scenes
            query: userMessage.content,
            top_k: 5
          };
          
          // Use the chat service with device context for better results
          const queryResponse = await pdfProcessingService.queryPDF(queryRequest);
          
          logInfo('DeviceDetails', 'PDF query successful', { 
            deviceId: device.id, 
            pdfName: pdfToUse.name,
            responseLength: queryResponse.response?.length || 0,
            chunksUsed: queryResponse.chunks_used?.length || 0,
            imagesFound: queryResponse.images?.length || 0,
            tablesFound: queryResponse.tables?.length || 0
          });
          
          // Format response with personalized template
          const username = getUserDisplayName(user);
          let enhancedContent = formatKnowledgeBaseResponse(queryResponse, username);
          
          // Safety check: Ensure we don't display raw JSON
          if (enhancedContent.includes('"response":') || enhancedContent.includes('"chunks_used":')) {
            logError('DeviceDetails', 'Raw JSON response detected, cleaning up', new Error('JSON response not properly formatted'));
            // Try to extract just the response content
            try {
              const jsonMatch = enhancedContent.match(/"response":\s*"([^"]*(?:\\.[^"]*)*)"/);
              if (jsonMatch && jsonMatch[1]) {
                enhancedContent = jsonMatch[1]
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"')
                  .replace(/\\t/g, '\t');
              } else {
                enhancedContent = "I found information about your query, but there was an issue formatting the response. Please try asking your question in a different way.";
              }
            } catch (error) {
              enhancedContent = "I found information about your query, but there was an issue formatting the response. Please try asking your question in a different way.";
            }
          }
          
          // Add information about found images and tables
          if (queryResponse.images && queryResponse.images.length > 0) {
            // Validate image data before including
            const validImages = queryResponse.images.filter(img => 
              img.data && 
              img.data.trim() !== '' && 
              img.mime_type && 
              img.size > 0
            );
            
            if (validImages.length > 0) {
              enhancedContent += `\n\n📸 I found ${validImages.length} image(s) related to your query. You can view them below.`;
              // Use only valid images
              queryResponse.images = validImages;
            } else {
              enhancedContent += `\n\n⚠️ I found ${queryResponse.images.length} image(s) but they appear to be corrupted or incomplete.`;
            }
          }
          
          if (queryResponse.tables && queryResponse.tables.length > 0) {
            // Validate table data before including
            const validTables = queryResponse.tables.filter(table => 
              table && 
              table.trim() !== '' && 
              table.length > 10
            );
            
            if (validTables.length > 0) {
              enhancedContent += `\n\n📊 I found ${validTables.length} table(s) with relevant data. You can view them below.`;
              // Use only valid tables
              queryResponse.tables = validTables;
            } else {
              enhancedContent += `\n\n⚠️ I found ${queryResponse.tables.length} table(s) but they appear to be corrupted or incomplete.`;
            }
          }
          
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: enhancedContent,
            timestamp: new Date(),
            images: queryResponse.images || [],
            tables: queryResponse.tables || [],
            chunks_used: queryResponse.chunks_used || [],
            processing_time: queryResponse.processing_time
          };
          setChatMessages(prev => [...prev, assistantMessage]);
        } catch (queryError) {
          logError('DeviceDetails', 'Failed to query PDF', queryError instanceof Error ? queryError : new Error('Unknown error'));
          
          // Enhanced error message with debugging info (NO PDF name shown to user)
          let errorContent = `I encountered an error while searching the device documentation. `;
          
          if (queryError instanceof Error) {
            if (queryError.message.includes('401') || queryError.message.includes('Unauthorized')) {
              errorContent += 'This appears to be an authentication issue. Please refresh the page and log in again.';
            } else if (queryError.message.includes('500') || queryError.message.includes('Internal Server Error')) {
              errorContent += 'The server encountered an error. Please try again in a few moments.';
            } else if (queryError.message.includes('timeout') || queryError.message.includes('Timeout')) {
              errorContent += 'The request timed out. Please try a simpler question or try again later.';
            } else if (queryError.message.includes('404') || queryError.message.includes('Not Found')) {
              errorContent += 'The PDF document was not found. It may have been moved or deleted.';
            } else if (queryError.message.includes('PDF') && queryError.message.includes('not found')) {
              errorContent += 'The PDF document is not available for querying. Please check if it was processed correctly.';
            } else {
              errorContent += `Error: ${queryError.message}. Please try again or ask a different question.`;
            }
          } else {
            errorContent += 'Please try again or ask a different question.';
          }
          
          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: 'assistant',
            content: errorContent,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, errorMessage]);
        }
      } else {
        // Generate a general response about the device
        const aiResponse: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: `I understand you're asking about "${userMessage.content}" for the ${device?.name} device. ${devicePDFs.length > 0 ? `I found ${devicePDFs.length} PDF document(s) related to this device. Would you like me to search through them for specific information?` : 'I don\'t have any PDF documents specifically associated with this device, but I can help you with general device information.'}`,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, aiResponse]);
      }
    } catch (error) {
      logError('DeviceDetails', 'Failed to send message', error instanceof Error ? error : new Error('Unknown error'));
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'device-info':
        return (
          <div className="space-y-8">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between">
              <h2 className="section-header">Device Profile</h2>
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Device
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Device Information */}
            <div className="space-y-4">
              <h3 className="subsection-header">
                Device Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-slate-600">Device Name</label>
                  {isEditing ? (
                    <div>
                      <input
                        type="text"
                        value={editedDevice?.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 ${
                          validationErrors.name ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-800">{device.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Location</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedDevice?.location || ''}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  ) : (
                    <p className="text-slate-800">{device.location}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Manufacturer</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedDevice?.manufacturer || ''}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter manufacturer"
                    />
                  ) : (
                    <p className="text-slate-800">{device.manufacturer || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Model</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedDevice?.model || ''}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter model"
                    />
                  ) : (
                    <p className="text-slate-800">{device.model || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editedDevice?.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      placeholder="Enter device description"
                    />
                  ) : (
                    <p className="text-slate-800">{device.description || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Assigned User</label>
                  <p className="text-slate-800">
                    {device.assignedUserId ? (
                      userNameLoading ? (
                        <span className="text-slate-500">Loading user...</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          {assignedUserName}
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500">Not assigned</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {device.tags && device.tags.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h3 className="subsection-header">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {device.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-50 text-primary-600 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'maintenance':
        return (
          <div className="space-y-6">
            {/* Real-time Status */}
            {isRealTimeLoading && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-primary-800 font-medium">Updating maintenance data...</span>
                </div>
              </div>
            )}

            {/* Tab Loading State */}
            {isTabLoading && activeTab === 'maintenance' && (
              <DataLoadingState message="Loading maintenance information..." />
            )}

            {/* Use the dedicated DeviceMaintenanceDisplay component */}
            <DeviceMaintenanceDisplay deviceId={deviceId!} />
          </div>
        );

      case 'rules':
        return (
          <div className="space-y-6">
            {/* Real-time Status */}
            {isRealTimeLoading && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-primary-800 font-medium">Updating rules data...</span>
                </div>
              </div>
            )}

            {/* Use the dedicated DeviceRulesDisplay component */}
            <DeviceRulesDisplay deviceId={deviceId!} />
          </div>
        );



      case 'safety':
        return (
          <div className="space-y-6">
            {/* Real-time Status */}
            {isRealTimeLoading && (
              <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  <span className="text-primary-800 font-medium">Updating real-time safety data...</span>
                </div>
              </div>
            )}

            {/* Tab Loading State */}
            {isTabLoading && activeTab === 'safety' && (
              <DataLoadingState message="Loading safety information..." />
            )}

            {/* Use the dedicated DeviceSafetyInfo component */}
            <DeviceSafetyInfo deviceId={deviceId!} />
          </div>
        );

      case 'chat':
        return (
          <div className="flex flex-col h-[calc(100vh-200px)] min-h-[400px] max-h-[800px] sm:h-[calc(100vh-180px)] sm:min-h-[500px] lg:h-[calc(100vh-160px)] lg:min-h-[600px]">
            {/* Error Display */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Authentication Error</span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-sm text-red-700 mt-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  🔄 Refresh Page
                </button>
              </div>
            )}
            
            {/* AI Chat Ready Banner - Simple and Clean */}
            {devicePDFs.length > 0 && (
              <div className="mb-4 p-3 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-success-600" />
                  <span className="text-sm font-medium text-success-800">AI Chat Ready</span>
                </div>
              </div>
            )}
            
            {devicePDFs.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">No PDF Documents Found</h4>
                      <p className="text-xs text-yellow-600">This device doesn't have any associated PDF documents yet.</p>
                    </div>
                  </div>

                </div>
                <div className="bg-white p-3 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-700 mb-2">
                    To enable AI-powered chat assistance for this device:
                  </p>
                  <ol className="text-xs text-yellow-600 space-y-1 ml-4">
                    <li>1. Go to the <strong>Knowledge Base</strong> section</li>
                    <li>2. Upload PDF documents (manuals, datasheets, etc.)</li>
                    <li>3. Associate them with this device during upload</li>
                    <li>4. Return here to start chatting with AI about your device</li>
                  </ol>
                </div>
              </div>
            )}



            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-lg min-h-0 max-h-[calc(100vh-350px)] sm:max-h-[calc(100vh-330px)] lg:max-h-[calc(100vh-310px)]">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex items-start gap-2 sm:gap-3 max-w-[60%] sm:max-w-[65%] lg:max-w-[60%]">
                    <div className={`p-2 rounded-full flex-shrink-0 shadow-sm ${
                      message.type === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}>
                      {message.type === 'user' ? (<User className="w-4 h-4" />) : (<Bot className="w-4 h-4" />)}
                    </div>
                    <div
                      className={`px-3 sm:px-4 py-2 rounded-lg flex-1 min-w-0 ${
                        message.type === 'user'
                          ? 'bg-primary-500 text-white'
                          : 'bg-white text-slate-800 border border-slate-200'
                      }`}
                    >
                      <div 
                        className="text-sm leading-relaxed break-words"
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
                      
                      {/* Images are now displayed inline in the text above - no separate gallery needed */}
                      
                      {/* Display Tables - Using same implementation as Knowledge Section */}
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
                      
                      {/* Display Chunks Used - Using same implementation as Knowledge Section */}
                      {message.chunks_used && message.chunks_used.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-2">📄 Sources Used:</p>
                          <div className="space-y-2">
                            {message.chunks_used.map((chunk, index) => (
                              <div key={index} className="text-xs bg-primary-50 border border-primary-200 px-3 py-2 rounded-lg">
                                <span className="text-primary-600 font-medium">Source {index + 1}:</span>
                                <span className="text-gray-700 ml-2">{chunk}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Display Processing Time - Using same implementation as Knowledge Section */}
                      {message.processing_time && (
                        <p className="text-xs text-gray-500 mt-2">
                          ⏱️ Processed in {message.processing_time}
                        </p>
                      )}
                      
                      <p className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-primary-100' : 'text-slate-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 sm:gap-3 max-w-[60%] sm:max-w-[65%] lg:max-w-[60%]">
                    <div className="p-2 rounded-full flex-shrink-0 shadow-sm bg-white text-slate-600 border border-slate-200">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-3 sm:px-4 py-2 rounded-lg bg-white text-slate-800 border border-slate-200 flex-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Chat Input - Fixed at bottom */}
            <div className="flex-shrink-0 bg-white border-t border-slate-200 p-3 sm:p-4">
              {/* Quick Actions - Above search bar */}
              {devicePDFs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => setNewMessage('How do I install this machine and how to start it and stop it? Explain me the complete setup process.')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Setup Guide
                  </button>
                  <button
                    onClick={() => setNewMessage('What maintenance procedures are required for this machine? How often should I perform maintenance and what are the steps?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Maintenance
                  </button>
                  <button
                    onClick={() => setNewMessage('Help me troubleshoot common issues with this machine. What are the most frequent problems and how to fix them?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Troubleshooting
                  </button>
                  <button
                    onClick={() => setNewMessage('Show me the technical specifications, operating parameters, and performance characteristics of this machine.')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Specifications
                  </button>
                {device?.type === 'SENSOR' && (
                  <button
                    onClick={() => setNewMessage('What are the machine calibration procedures?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Calibration
                  </button>
                )}
                {device?.type === 'GATEWAY' && (
                  <button
                    onClick={() => setNewMessage('How do I configure network settings?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Network Config
                  </button>
                )}
                {device?.type === 'ACTUATOR' && (
                  <button
                    onClick={() => setNewMessage('What are the safety procedures for this actuator?')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                  >
                    Safety Procedures
                  </button>
                )}
              </div>
              )}

              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about this device..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || isTyping}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
          </div>
        );



      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/devices')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className={`${statusInfo.bg} p-3 rounded-xl shadow-sm`}>
              {React.createElement(deviceTypeInfo.icon, { 
                className: `w-6 h-6 ${statusInfo.color}` 
              })}
            </div>
            <div>
              <h1 className="page-header">{device.name}</h1>
              <p className="page-subtitle">{deviceTypeInfo.label} • {device.location}</p>
            </div>
          </div>
        </div>


      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl">
        <div className="flex overflow-x-auto scrollbar-hide relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTabChange(tab.id);
                }
              }}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              className={`flex items-center gap-3 px-6 py-4 border-b-2 font-medium whitespace-nowrap transition-all duration-300 hover:bg-slate-50 relative focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 bg-primary-50 shadow-sm'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <tab.icon className={`w-5 h-5 transition-colors duration-200 ${activeTab === tab.id ? 'text-primary-600' : 'text-slate-500'}`} />
              <span className="font-semibold">{tab.label}</span>
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-500 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-lg border border-slate-200">
        <div 
          className="p-6"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {isTabLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-600 font-medium">Loading...</span>
              </div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>

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
