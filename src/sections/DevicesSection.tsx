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
import { logInfo } from '../utils/logger';

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

  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Debug logging
  logInfo('DevicesSection', 'Devices data', { devices: devices, loading, count: devices?.length || 0 });

  // Load data only when component mounts
  useEffect(() => {
    logInfo('DevicesSection', 'Component mounted - data loaded from IoT context');
  }, []);

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

  const handleAddDeviceClick = () => {
    logInfo('DevicesSection', 'Add Device button clicked, setting showAddForm to true');
    setShowAddForm(true);
  };

  const handleCancelAddDevice = useCallback(() => {
    logInfo('DevicesSection', 'Cancel button clicked, setting showAddForm to false');
    setShowAddForm(false);
  }, []);

  const handleDeviceSubmit = useCallback(async (deviceData: any, file: any) => {
    setSuccessMessage(`Device "${deviceData.deviceName}" has been successfully added to the platform!`);
    setTimeout(() => setSuccessMessage(''), 5000);
    setShowAddForm(false);
  }, []);

  const handleDeviceClick = (device: Device) => {
    navigate(`/devices/${device.id}`);
  };

  const handleDeleteDevice = useCallback(async (deviceId: string, deviceName: string) => {
    if (window.confirm(`Are you sure you want to delete the device "${deviceName}"? This will permanently remove the device and all its associated data including rules, maintenance schedules, safety precautions, and PDF documents.`)) {
      try {
        console.log('DevicesSection: Deleting device:', { deviceId, deviceName });
        
        await deleteDevice(deviceId);
        console.log('DevicesSection: Device deleted successfully:', { deviceId, deviceName });
        setSuccessMessage(`Device "${deviceName}" has been successfully deleted!`);
        setTimeout(() => setSuccessMessage(''), 5000);
      } catch (error) {
        console.error('DevicesSection: Failed to delete device:', error);
        console.error('DevicesSection: Error details:', {
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
        console.error('DevicesSection: Categorized error:', {
          errorType,
          errorMessage,
          originalError: error
        });
      }
    }
  }, [deleteDevice]);

  // Show loading screen while data is being fetched
  if (loading) {
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
              onClick={() => setSuccessMessage('')}
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
              onClick={() => setErrorMessage('')}
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
          <h1 className="text-3xl font-bold text-primary">Device Management</h1>
          <p className="text-secondary mt-2">
            {isAdmin() ? 'Monitor and control your IoT devices' : 'View your IoT devices'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleAddDeviceClick}
            className="flex items-center gap-2 px-4 py-2 btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 minimal-input"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-secondary-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 minimal-input"
            >
              <option value="all">All Status</option>
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Offline</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 minimal-input"
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
              className="px-3 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 minimal-input"
              aria-label="Sort devices"
              title="Sort by"
            >
              <option value="name">Sort: Name</option>
              <option value="status">Sort: Status</option>
              <option value="lastSeen">Sort: Last Seen</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device List - Vertical Layout */}
      <div className="space-y-4">
        {filteredDevices.map((device) => (
          <div key={device.id} onClick={() => handleDeviceClick(device)}>
            <DeviceCard
              device={device}
              onStatusChange={updateDeviceStatus}
              onDelete={handleDeleteDevice}
            />
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12 card">
          <div className="w-16 h-16 bg-secondary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-secondary-400" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">No devices found</h3>
          <p className="text-secondary mb-6">
            No devices match your current search criteria. Try adjusting your filters or add your first device.
          </p>
          <button 
            onClick={handleAddDeviceClick}
            className="px-4 py-2 btn-secondary"
          >
            Add First Device
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-sm text-tertiary">
        Debug: showAddForm = {showAddForm.toString()}
      </div>

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