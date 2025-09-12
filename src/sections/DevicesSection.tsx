import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Filter, Search, CheckCircle } from 'lucide-react';
import { DeviceCard } from '../components/Devices/DeviceCard';
// import { DeviceOnboardingForm } from '../components/Devices/DeviceOnboardingForm';
import { EnhancedDeviceOnboardingForm } from '../components/Devices/EnhancedDeviceOnboardingForm';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { Device } from '../types';
import { DevicesLoading } from '../components/Loading/LoadingComponents';
import { logInfo, logError } from '../utils/logger';

export const DevicesSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { devices, updateDeviceStatus, loading, deleteDevice } = useIoT();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'updatedAt'>('name');
  const [showAddForm, setShowAddForm] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Debug logging
  logInfo('DevicesSection', 'Devices data', { devices: devices, loading, count: devices?.length || 0 });
  
  // Additional loading state debugging
  useEffect(() => {
    logInfo('DevicesSection', 'Loading state changed', { loading, devicesCount: devices?.length || 0 });
  }, [loading, devices]);

  // Load data only when component mounts
  useEffect(() => {
    logInfo('DevicesSection', 'Component mounted - data loaded from IoT context');
  }, []);

  // Note: Removed handleSectionClick to prevent unnecessary device refreshing
  // Devices are now loaded once from IoT context and don't need manual refreshing

  // Initialize filters from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const status = params.get('status');
    const search = params.get('search');
    if (status) setStatusFilter(status);
    if (search) setSearchTerm(search);
  }, [location.search]);

  const filteredDevices = useMemo(() => {
    const base = devices.filter(device => {
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           device.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
      const matchesType = typeFilter === 'all' || device.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
    const sorted = [...base].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'status') return a.status.localeCompare(b.status);
      if (sortBy === 'updatedAt') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      return 0;
    });
    return sorted;
  }, [devices, searchTerm, statusFilter, typeFilter, sortBy]);

  logInfo('DevicesSection', 'Filtered devices', { filteredDevices, count: filteredDevices.length });

  const handleAddDeviceClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering section click
    logInfo('DevicesSection', 'Add Device button clicked, setting showAddForm to true');
    setShowAddForm(true);
  };

  const handleCancelAddDevice = useCallback(() => {
    logInfo('DevicesSection', 'Cancel button clicked, setting showAddForm to false');
    setShowAddForm(false);
  }, []);

  const handleDeviceSubmit = useCallback(async (deviceData: any, _file: any) => {
    setSuccessMessage(`Device "${deviceData.deviceName}" has been successfully added to the platform!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    setShowAddForm(false);
  }, []);

  const handleDeviceClick = (device: Device, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering section click
    navigate(`/devices/${device.id}`);
  };

  const handleDeleteDevice = useCallback(async (deviceId: string, deviceName: string) => {
    if (window.confirm(`Are you sure you want to delete the device "${deviceName}"? This will permanently remove the device and all its associated data including rules, maintenance schedules, safety precautions, and PDF documents.`)) {
      try {
        logInfo('DevicesSection', 'Deleting device', { deviceId, deviceName });
        
        await deleteDevice(deviceId);
        logInfo('DevicesSection', 'Device deleted successfully', { deviceId, deviceName });
        setSuccessMessage(`Device "${deviceName}" has been successfully deleted!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (error) {
        logError('DevicesSection', 'Failed to delete device', error instanceof Error ? error : new Error('Unknown error'), {
          deviceId,
          deviceName,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          response: error instanceof Error && 'response' in error ? (error as any).response : undefined
        });
        
        // Enhanced error message parsing
        let errorMessage = 'Unknown error occurred';
        let errorType = 'Error';
        
        if (error instanceof Error) {
          const errorText = error.message.toLowerCase();
          
          // Check for specific error types from backend
          if (errorText.includes('authentication failed') || errorText.includes('401')) {
            errorType = 'Authentication Error';
            errorMessage = 'Your session has expired. Please log in again.';
          } else if (errorText.includes('device not found') || errorText.includes('404')) {
            errorType = 'Device Not Found';
            errorMessage = 'Device not found. It may have already been deleted.';
          } else if (errorText.includes('permission denied') || errorText.includes('403')) {
            errorType = 'Permission Denied';
            errorMessage = 'You do not have the required permissions to delete devices.';
          } else if (errorText.includes('connection deletion failed')) {
            errorType = 'Connection Error';
            errorMessage = 'Failed to delete device connections. The device may be currently in use.';
          } else if (errorText.includes('rules deletion failed')) {
            errorType = 'Rules Error';
            errorMessage = 'Failed to delete device rules and configurations.';
          } else if (errorText.includes('maintenance deletion failed')) {
            errorType = 'Maintenance Error';
            errorMessage = 'Failed to delete maintenance schedules and tasks.';
          } else if (errorText.includes('500') || errorText.includes('server error')) {
            errorType = 'Server Error';
            errorMessage = 'Server error occurred. Please try again later.';
          } else if (errorText.includes('network error') || errorText.includes('fetch')) {
            errorType = 'Network Error';
            errorMessage = 'Network connection error. Please check your internet connection.';
          } else {
            // Use the actual error message if it's meaningful
            errorMessage = error.message;
          }
        }
        
        // Show error with better formatting
        const fullErrorMessage = `${errorType}: ${errorMessage}`;
        setErrorMessage(fullErrorMessage);
        
        // Auto-clear error message after 10 seconds
        setTimeout(() => setErrorMessage(''), 10000);
        
        // Log the categorized error
        logError('DevicesSection', 'Categorized error', error instanceof Error ? error : new Error('Unknown error'), {
          errorType,
          errorMessage,
          originalError: error
        });
      }
    }
  }, [deleteDevice]);

  // Show loading screen while data is being fetched
  if (loading) {
    logInfo('DevicesSection', 'Showing loading screen for Assets section');
    return <DevicesLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-success-500/20 border border-success-500/30 rounded-lg glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-success-500 mr-3" />
              <span className="text-success-300">{successMessage}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSuccessMessage('');
              }}
              className="text-success-400 hover:text-success-300"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}

      {errorMessage && (
        <div className="mb-4 p-4 bg-danger-500/20 border border-danger-500/30 rounded-lg glass">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-danger-500 mr-3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <span className="text-danger-300">{errorMessage}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setErrorMessage('');
              }}
              className="text-danger-400 hover:text-danger-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Smart Assets</h1>
          <p className="text-secondary mt-2">
            {isAdmin() ? 'Monitor and control your smart assets' : 'View your smart assets'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleAddDeviceClick}
            className="flex items-center gap-2 px-4 py-2 btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Add Asset
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 placeholder-neutral-500 transition-all"
              />
            </div>
          </div>
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 transition-all min-w-[120px]"
              >
                <option value="all">All Status</option>
                <option value="ONLINE">Online</option>
                <option value="OFFLINE">Offline</option>
                <option value="WARNING">Warning</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 transition-all min-w-[120px]"
            >
              <option value="all">All Types</option>
              <option value="SENSOR">Sensors</option>
              <option value="ACTUATOR">Actuators</option>
              <option value="GATEWAY">Gateways</option>
              <option value="CONTROLLER">Controllers</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              onClick={(e) => e.stopPropagation()}
              className="px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white text-neutral-900 transition-all min-w-[140px]"
              aria-label="Sort assets"
              title="Sort by"
            >
              <option value="name">Sort: Name</option>
              <option value="status">Sort: Status</option>
              <option value="lastSeen">Sort: Last Seen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredDevices.map((device) => (
          <div key={device.id} onClick={(e) => handleDeviceClick(device, e)} className="cursor-pointer">
            <DeviceCard
              device={device}
              onStatusChange={updateDeviceStatus}
              onDelete={handleDeleteDevice}
            />
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="w-20 h-20 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Plus className="w-10 h-10 text-neutral-400" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-700 mb-3">No assets found</h3>
          <p className="text-neutral-500 mb-8 max-w-md mx-auto">
            No assets match your current search criteria. Try adjusting your filters or add your first asset.
          </p>
          <button 
            onClick={handleAddDeviceClick}
            className="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
          >
            Add First Device
          </button>
        </div>
      )}


      {/* Device Onboarding Form Modal */}
      {showAddForm && (
        <EnhancedDeviceOnboardingForm
          onSubmit={handleDeviceSubmit}
          onCancel={handleCancelAddDevice}
        />
      )}
    </div>
  );
};