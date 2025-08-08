import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw
} from 'lucide-react';
import { Device } from '../../types';
import { DeviceCard } from './DeviceCard';
import { AddDeviceForm } from './AddDeviceForm';
import { DeviceOnboardingForm } from './DeviceOnboardingForm';
import { DeviceDetails } from './DeviceDetails';

interface DeviceListProps {
  devices: Device[];
  onStatusChange: (deviceId: string, status: Device['status']) => void;
  onAddDevice: (deviceData: any, files: any, aiRules?: any[]) => Promise<void>;
  onDeleteDevice: (deviceId: string) => Promise<void>;
  onRefresh: () => void;
  loading?: boolean;
}

type ViewMode = 'grid' | 'list';
type FilterType = 'all' | 'online' | 'offline' | 'warning' | 'error';
type DeviceType = 'all' | 'SENSOR' | 'ACTUATOR' | 'GATEWAY' | 'CONTROLLER';

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onStatusChange,
  onAddDevice,
  onDeleteDevice,
  onRefresh,
  loading = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<DeviceType>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) || false;
    
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesType = typeFilter === 'all' || device.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddDevice = async (deviceData: any, files: any) => {
    try {
      await onAddDevice(deviceData, files);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to add device:', error);
    }
  };

  const handleOnboardingDevice = async (deviceData: any, files: any[], aiRules: any[]) => {
    try {
      // Convert files array to the expected format
      const fileMap: { manual?: File; datasheet?: File; certificate?: File } = {};
      files.forEach((fileUpload: any) => {
        if (fileUpload.type === 'manual') fileMap.manual = fileUpload.file;
        else if (fileUpload.type === 'datasheet') fileMap.datasheet = fileUpload.file;
        else if (fileUpload.type === 'certificate') fileMap.certificate = fileUpload.file;
      });
      
      // Use the new AI onboarding API
      await onAddDevice(deviceData, fileMap, aiRules);
      setShowOnboardingForm(false);
    } catch (error) {
      console.error('Failed to onboard device with AI:', error);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      try {
        await onDeleteDevice(deviceId);
      } catch (error) {
        console.error('Failed to delete device:', error);
      }
    }
  };

  const getStatusCount = (status: FilterType) => {
    return devices.filter(device => status === 'all' || device.status === status).length;
  };

  const getTypeCount = (type: DeviceType) => {
    return devices.filter(device => type === 'all' || device.type === type).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">IoT Devices</h1>
          <p className="text-slate-600">
            {filteredDevices.length} of {devices.length} devices
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Filter className="w-5 h-5" />
          </button>
          
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowOnboardingForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Smart Onboarding
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Quick Add
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search devices by name, location, manufacturer, model, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All ({getStatusCount('all')})</option>
                <option value="online">Online ({getStatusCount('online')})</option>
                <option value="offline">Offline ({getStatusCount('offline')})</option>
                <option value="warning">Warning ({getStatusCount('warning')})</option>
                <option value="error">Error ({getStatusCount('error')})</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as DeviceType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All ({getTypeCount('all')})</option>
                <option value="SENSOR">Sensors ({getTypeCount('SENSOR')})</option>
                <option value="ACTUATOR">Actuators ({getTypeCount('ACTUATOR')})</option>
                <option value="GATEWAY">Gateways ({getTypeCount('GATEWAY')})</option>
                <option value="CONTROLLER">Controllers ({getTypeCount('CONTROLLER')})</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Device Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-600 mt-4">Loading devices...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No devices found</h3>
          <p className="text-slate-600 mb-6">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by adding your first IoT device'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowOnboardingForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Smart Onboarding
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Quick Add
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }>
          {filteredDevices.map((device) => (
            <div key={device.id} className="relative group">
              <DeviceCard
                device={device}
                onStatusChange={onStatusChange}
              />
              
              {/* Action Overlay */}
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
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-red-50 transition-colors"
                    title="Delete Device"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Device Form Modal */}
      {showAddForm && (
        <AddDeviceForm
          onSubmit={handleAddDevice}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Device Onboarding Form Modal */}
      {showOnboardingForm && (
        <DeviceOnboardingForm
          onSubmit={handleOnboardingDevice}
          onCancel={() => setShowOnboardingForm(false)}
        />
      )}

      {/* Device Details Modal */}
      {selectedDevice && (
        <DeviceDetails
          device={selectedDevice}
          onClose={() => setSelectedDevice(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
};
