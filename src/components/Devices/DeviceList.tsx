import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye,
  Trash2,
  RotateCcw,
  Grid3x3,
  List
} from 'lucide-react';
import { Device } from '../../types';
import { DeviceCard } from './DeviceCard';
import { EnhancedDeviceOnboardingForm } from './EnhancedDeviceOnboardingForm';
import { DeviceDetails } from './DeviceDetails';
// import { pdfProcessingService } from '../../services/pdfprocess';
import { stompWebSocketService } from '../../services/stompWebSocketService';

interface DeviceListProps {
  devices: Device[];
  onStatusChange: (deviceId: string, status: Device['status']) => void;
  onAddDevice: (deviceData: any, files: any, aiRules?: any[]) => Promise<void>;
  onDeleteDevice: (deviceId: string) => Promise<void>;
  onRefresh: () => void;
  loading?: boolean;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'ONLINE' | 'OFFLINE' | 'WARNING' | 'ERROR';
// type DeviceType = 'all' | 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';

interface OnboardingDevice {
  device: Device;
  pdfProcessingStatus: 'pending' | 'processing' | 'completed' | 'error';
  pdfFileName?: string;
  startTime: number;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onStatusChange,
  onAddDevice,
  onDeleteDevice,
  onRefresh,
  loading = false
}) => {
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Onboarding state management
  const [onboardingDevices, setOnboardingDevices] = useState<Map<string, OnboardingDevice>>(new Map());
  
  // WebSocket connection status
  const [wsConnected, setWsConnected] = useState(false);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) || false;
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOnboardingDevice = async (deviceData: any, file: any) => {
    try {
      const fileMap: { manual?: File } = {};
      if (file && file.file) fileMap.manual = file.file;
      
      // Create a temporary device for onboarding display
      const tempDevice: Device = {
        id: `temp-${Date.now()}`,
        name: deviceData.deviceName || 'New Device',
        type: 'SENSOR',
        status: 'OFFLINE',
        location: deviceData.location || 'Unknown',
        lastSeen: new Date().toISOString(),
        protocol: deviceData.connectionProtocol || 'MQTT',
        organizationId: 'temp',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...deviceData
      };

      // Add to onboarding devices with processing status
      setOnboardingDevices(prev => new Map(prev).set(tempDevice.id, {
        device: tempDevice,
        pdfProcessingStatus: 'processing',
        pdfFileName: file?.file?.name || 'unknown.pdf',
        startTime: Date.now()
      }));

      // Don't close the form immediately - let the form handle the loading screen
      // The form will close itself when the process is complete

      // Try to add device to backend
      try {
        await onAddDevice(deviceData, fileMap, []);
        
        // Update the onboarding device to completed status
        setOnboardingDevices(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(tempDevice.id);
          if (existing) {
            newMap.set(tempDevice.id, {
              ...existing,
              pdfProcessingStatus: 'completed'
            });
          }
          return newMap;
        });
        
        // Remove from onboarding devices after a delay to show completion
        setTimeout(() => {
          setOnboardingDevices(prev => {
            const newMap = new Map(prev);
            newMap.delete(tempDevice.id);
            return newMap;
          });
        }, 5000); // Show completion for 5 seconds
        
      } catch (error: any) {
        console.error('Failed to add device to backend:', error);
        
        // Check if it's a network/connection error
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Connection')) {
          console.error('Backend server not available');
          throw new Error('Backend server is not available. Please ensure the backend server is running and try again.');
        } else {
          // Update the onboarding device to error status
          setOnboardingDevices(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(tempDevice.id);
            if (existing) {
              newMap.set(tempDevice.id, {
                ...existing,
                pdfProcessingStatus: 'error'
              });
            }
            return newMap;
          });
          
          // Re-throw other errors
          throw error;
        }
      }
      
    } catch (error) {
      console.error('Error during device onboarding:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to complete onboarding: ${errorMessage}`);
    }
  };

  const getStatusCount = (status: FilterType) => {
    return devices.filter(device => status === 'all' || device.status === status).length;
  };


  // Monitor WebSocket connection status
  useEffect(() => {
    const checkConnection = () => {
      setWsConnected(stompWebSocketService.isWebSocketConnected());
    };

    // Check initial connection status
    checkConnection();

    // Set up interval to check connection status
    const interval = setInterval(checkConnection, 5000);

    return () => clearInterval(interval);
  }, []);

  // Combine regular devices with onboarding devices
  const allDevices = [
    ...filteredDevices,
    ...Array.from(onboardingDevices.values()).map(onboarding => onboarding.device)
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Smart Assets</h1>
            {/* WebSocket connection indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              wsConnected 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {wsConnected ? 'Live' : 'Offline'}
            </div>
          </div>
          <p className="text-slate-600">
            {allDevices.length} of {devices.length} assets
            {onboardingDevices.size > 0 && (
              <span className="text-blue-600 ml-2">
                ({onboardingDevices.size} onboarding)
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Toggle Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowOnboardingForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search assets by name, location, manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All ({getStatusCount('all')})</option>
                <option value="ONLINE">Online ({getStatusCount('ONLINE')})</option>
                <option value="OFFLINE">Offline ({getStatusCount('OFFLINE')})</option>
                <option value="WARNING">Warning ({getStatusCount('WARNING')})</option>
                <option value="ERROR">Error ({getStatusCount('ERROR')})</option>
              </select>
            </div>
            
          </div>
        )}
      </div>

      {/* Device Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading assets...</p>
        </div>
      ) : allDevices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No assets found</h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first smart asset'
            }
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowOnboardingForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Smart Onboarding
            </button>
          </div>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {allDevices.map((device) => {
            const onboardingDevice = onboardingDevices.get(device.id);
            const isOnboarding = !!onboardingDevice;
            
            return (
              <div key={device.id} className="relative group">
                <DeviceCard
                  device={device}
                  onStatusChange={onStatusChange}
                  isOnboarding={isOnboarding}
                  pdfProcessingStatus={onboardingDevice?.pdfProcessingStatus}
                  pdfFileName={onboardingDevice?.pdfFileName}
                  startTime={onboardingDevice?.startTime}
                />
                
                {/* Action Overlay - Only show for non-onboarding devices */}
                {!isOnboarding && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setSelectedDevice(device)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                      </button>
                      
                      <button
                        onClick={() => onDeleteDevice(device.id)}
                        className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                        title="Delete Device"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Enhanced Onboarding Form */}
      {showOnboardingForm && (
        <EnhancedDeviceOnboardingForm
          onSubmit={handleOnboardingDevice}
          onCancel={() => setShowOnboardingForm(false)}
        />
      )}

      {/* Device Details Modal */}
      {selectedDevice && (
        <DeviceDetails
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
        />
      )}
    </div>
  );
};
