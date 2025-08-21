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
  const { devices, updateDeviceStatus, loading } = useIoT();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastSeen'>('name');
  const [showAddForm, setShowAddForm] = useState(false);

  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Debug logging
  logInfo('DevicesSection', 'Devices data', { devices: devices, loading, count: devices?.length || 0 });

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
      if (sortBy === 'lastSeen') return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
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