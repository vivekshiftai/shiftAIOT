import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Clock,
  Settings,
  BarChart3,
  Shield,
  Wrench,
  Eye,
  ArrowDown,
  ArrowUp
} from 'lucide-react';
import { unifiedDeviceService, DeviceRules, DeviceMaintenance, DeviceSafetyPrecaution } from '../../services/unifiedDeviceService';
import { logError, logInfo } from '../../utils/logger';
import { DeviceStatusTest } from './DeviceStatusTest';

interface Device {
  id: string;
  name: string;
  type: string;
  location: string;
  status: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  description?: string;
  tags?: string[];
  config?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface DeviceDetailsProps {
  device: Device;
  onClose: () => void;
}

export const DeviceDetails: React.FC<DeviceDetailsProps> = ({ device, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documentation' | 'rules' | 'maintenance' | 'safety' | 'debug'>('overview');
  const [documentation, setDocumentation] = useState<DeviceDocumentation[]>([]);
  const [rules, setRules] = useState<DeviceRules[]>([]);
  const [maintenance, setMaintenance] = useState<DeviceMaintenance[]>([]);
  const [safetyPrecautions, setSafetyPrecautions] = useState<DeviceSafetyPrecaution[]>([]);
  const [debugData, setDebugData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'success' | 'failed'>('checking');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTabData(activeTab);
  }, [activeTab, device.id]);

  const toggleRowExpansion = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const truncateText = (text: string, limit: number = 40) => {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
  };

  const loadTabData = async (tab: string) => {
    setIsLoading(true);
    try {
      switch (tab) {
        case 'documentation':
          const docs = await unifiedDeviceService.getDeviceDocumentation(device.id);
          setDocumentation(docs);
          break;
        case 'rules':
          const deviceRules = await unifiedDeviceService.getDeviceRules(device.id);
          setRules(deviceRules);
          break;
        case 'maintenance':
          const deviceMaintenance = await unifiedDeviceService.getDeviceMaintenance(device.id);
          setMaintenance(deviceMaintenance);
          break;
        case 'safety':
          const deviceSafety = await unifiedDeviceService.getDeviceSafetyPrecautions(device.id);
          setSafetyPrecautions(deviceSafety);
          break;
        case 'debug':
          const debug = await unifiedDeviceService.getDeviceDebugData(device.id);
          setDebugData(debug);
          break;
      }
    } catch (error) {
      logError('DeviceDetails', `Error loading ${tab} data`, error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const testAuthentication = async () => {
    setAuthStatus('checking');
    try {
      const isAuthenticated = await unifiedDeviceService.testDeviceAuth();
      setAuthStatus(isAuthenticated ? 'success' : 'failed');
      logInfo('DeviceDetails', `Authentication test result: ${isAuthenticated ? 'success' : 'failed'}`);
    } catch (error) {
      setAuthStatus('failed');
      logError('DeviceDetails', 'Authentication test failed', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const downloadDocumentation = async (doc: DeviceDocumentation) => {
    try {
      const response = await fetch(doc.fileUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        logInfo('DeviceDetails', `Downloaded documentation: ${doc.fileName}`);
      }
    } catch (error) {
      logError('DeviceDetails', 'Error downloading documentation', error instanceof Error ? error : new Error('Unknown error'));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ONLINE':
        return 'text-green-600 bg-green-100';
      case 'OFFLINE':
        return 'text-red-600 bg-red-100';
      case 'WARNING':
        return 'text-yellow-600 bg-yellow-100';
      case 'ERROR':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ONLINE':
        return <CheckCircle className="w-4 h-4" />;
      case 'OFFLINE':
        return <X className="w-4 h-4" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4" />;
      case 'ERROR':
        return <X className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'documentation', label: 'Documentation', icon: <FileText className="w-4 h-4" /> },
    { id: 'rules', label: 'Rules', icon: <Shield className="w-4 h-4" /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Settings className="w-4 h-4" /> },
    { id: 'safety', label: 'Safety', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'debug', label: 'Debug', icon: <HardDrive className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{device.name}</h2>
            <p className="text-gray-600">{device.location}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Device Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${getStatusColor(device.status)}`}>
                          {getStatusIcon(device.status)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Status</h3>
                          <p className="text-sm text-gray-600">Device connection</p>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{device.status}</div>
                    </div>


                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600">
                          <Eye className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">Location</h3>
                          <p className="text-sm text-gray-600">Physical location</p>
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-gray-800">{device.location}</div>
                    </div>
                  </div>

                  {/* Device Information */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Manufacturer</label>
                        <p className="text-gray-800">{device.manufacturer || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Model</label>
                        <p className="text-gray-800">{device.model || 'Not specified'}</p>
                      </div>
                                              <div>
                          <label className="text-sm font-medium text-gray-600">IP Address</label>
                          <p className="text-gray-800">{device.ipAddress || 'Not specified'}</p>
                        </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-gray-800">{device.description || 'No description available'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Authentication Test */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Authentication Test</h3>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={testAuthentication}
                        disabled={authStatus === 'checking'}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {authStatus === 'checking' ? 'Testing...' : 'Test Authentication'}
                      </button>
                      <div className="flex items-center gap-2">
                        {authStatus === 'checking' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>}
                        {authStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                 {authStatus === 'failed' && <X className="w-4 h-4 text-red-600" />}
                        <span className="text-sm text-gray-600">
                          {authStatus === 'checking' && 'Testing connection...'}
                          {authStatus === 'success' && 'Authentication successful'}
                          {authStatus === 'failed' && 'Authentication failed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device Status Test */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Device Status Test</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Test the real-time device status update functionality. This will update the device status in the database and broadcast the change to all connected clients.
                    </p>
                    <DeviceStatusTest device={device} />
                  </div>
                </div>
              )}

              {activeTab === 'documentation' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Device Documentation</h3>
                  {documentation.length === 0 ? (
                    <p className="text-gray-600">No documentation available for this device.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documentation.map((doc) => (
                        <div key={doc.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 mb-3">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{doc.fileName}</h4>
                              <p className="text-sm text-gray-600">{doc.type}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => downloadDocumentation(doc)}
                            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Download className="w-4 h-4 inline mr-2" />
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Device Rules</h3>
                  {rules.length === 0 ? (
                    <p className="text-gray-600">No rules configured for this device.</p>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {rules.map((rule) => (
                            <React.Fragment key={rule.id}>
                              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(rule.id)}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {truncateText(rule.name || 'Unnamed Rule')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    rule.priority === 'HIGH'
                                      ? 'bg-red-100 text-red-800'
                                      : rule.priority === 'MEDIUM'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {rule.priority || 'MEDIUM'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    rule.status === 'ACTIVE' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {rule.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                  {expandedRows.has(rule.id) ? '↑' : '↓'}
                                </td>
                              </tr>
                              {expandedRows.has(rule.id) && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="font-medium text-gray-800 mb-1">Description:</h5>
                                        <p className="text-gray-600 text-sm">{rule.description || 'No description available'}</p>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-600">Metric:</span>
                                          <p className="text-gray-800">{rule.metric || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Threshold:</span>
                                          <p className="text-gray-800">{rule.threshold || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Category:</span>
                                          <p className="text-gray-800">{rule.category || 'General'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Action:</span>
                                          <p className="text-gray-800">{rule.action || rule.consequence || 'Not specified'}</p>
                                        </div>
                                      </div>
                                      {rule.condition && (
                                        <div>
                                          <span className="font-medium text-gray-600">Condition:</span>
                                          <p className="text-gray-800">{rule.condition}</p>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'maintenance' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Maintenance Schedule</h3>
                  {maintenance.length === 0 ? (
                    <p className="text-gray-600">No maintenance schedule available for this device.</p>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {maintenance.map((item) => (
                            <React.Fragment key={item.id}>
                              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(item.id)}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {truncateText(item.taskName || item.title || 'Unnamed Task')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {item.frequency || 'Not specified'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    item.status === 'ACTIVE' || item.status === 'scheduled'
                                      ? 'bg-green-100 text-green-800' 
                                      : item.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.status === 'completed'
                                      ? 'bg-gray-100 text-gray-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                  {expandedRows.has(item.id) ? '↑' : '↓'}
                                </td>
                              </tr>
                              {expandedRows.has(item.id) && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="font-medium text-gray-800 mb-1">Description:</h5>
                                        <p className="text-gray-600 text-sm">{item.description || 'No description available'}</p>
                                      </div>
                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <span className="font-medium text-gray-600">Component:</span>
                                          <p className="text-gray-800">{item.componentName || 'Not specified'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Priority:</span>
                                          <p className="text-gray-800">{item.priority || 'Medium'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Next Due:</span>
                                          <p className="text-gray-800">{item.nextMaintenance || item.scheduledDate || 'Not scheduled'}</p>
                                        </div>
                                        <div>
                                          <span className="font-medium text-gray-600">Duration:</span>
                                          <p className="text-gray-800">{item.estimatedDuration || 'Not specified'}</p>
                                        </div>
                                      </div>
                                      {(item.notes || item.requiredTools || item.safetyNotes) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                          {item.notes && (
                                            <div>
                                              <span className="font-medium text-gray-600">Notes:</span>
                                              <p className="text-gray-800">{item.notes}</p>
                                            </div>
                                          )}
                                          {item.requiredTools && (
                                            <div>
                                              <span className="font-medium text-gray-600">Required Tools:</span>
                                              <p className="text-gray-800">{item.requiredTools}</p>
                                            </div>
                                          )}
                                          {item.safetyNotes && (
                                            <div>
                                              <span className="font-medium text-gray-600">Safety Notes:</span>
                                              <p className="text-gray-800">{item.safetyNotes}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'safety' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Safety Precautions</h3>
                  {safetyPrecautions.length === 0 ? (
                    <p className="text-gray-600">No safety precautions available for this device.</p>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safety Item</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {safetyPrecautions.map((precaution) => (
                            <React.Fragment key={precaution.id}>
                              <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleRowExpansion(precaution.id)}>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {truncateText(precaution.title || 'Safety Precaution')}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {precaution.category || 'General'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    precaution.severity === 'HIGH' 
                                      ? 'bg-red-100 text-red-800'
                                      : precaution.severity === 'MEDIUM'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {precaution.severity || 'LOW'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-400">
                                  {expandedRows.has(precaution.id) ? '↑' : '↓'}
                                </td>
                              </tr>
                              {expandedRows.has(precaution.id) && (
                                <tr>
                                  <td colSpan={4} className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                                    <div className="space-y-3">
                                      <div>
                                        <h5 className="font-medium text-gray-800 mb-1">Description:</h5>
                                        <p className="text-gray-600 text-sm">{precaution.description || 'No description available'}</p>
                                      </div>
                                      {(precaution.procedure || precaution.emergencyContact || precaution.requirements) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                          {precaution.procedure && (
                                            <div>
                                              <span className="font-medium text-gray-600">Procedure:</span>
                                              <p className="text-gray-800">{precaution.procedure}</p>
                                            </div>
                                          )}
                                          {precaution.emergencyContact && (
                                            <div>
                                              <span className="font-medium text-gray-600">Emergency Contact:</span>
                                              <p className="text-gray-800">{precaution.emergencyContact}</p>
                                            </div>
                                          )}
                                          {precaution.requirements && (
                                            <div>
                                              <span className="font-medium text-gray-600">Requirements:</span>
                                              <p className="text-gray-800">{precaution.requirements}</p>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'debug' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Debug Information</h3>
                  {debugData ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <pre className="text-sm text-gray-800 overflow-x-auto">
                        {JSON.stringify(debugData, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-gray-600">No debug information available for this device.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
