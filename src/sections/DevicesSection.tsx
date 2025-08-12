import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Filter, Search, Cpu, CheckCircle, X } from 'lucide-react';
import { DeviceCard } from '../components/Devices/DeviceCard';
import { DeviceOnboardingForm } from '../components/Devices/DeviceOnboardingForm';
import { TestModal } from '../components/Devices/TestModal';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { deviceAPI } from '../services/api';
import { Device } from '../types';
import { DevicesLoading } from '../components/Loading/LoadingComponents';

export const DevicesSection: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { devices, updateDeviceStatus, addDevice, loading } = useIoT();
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'lastSeen'>('name');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  // const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Debug logging
  console.log('DevicesSection - devices:', devices);
  console.log('DevicesSection - loading:', loading);
  console.log('DevicesSection - devices length:', devices?.length || 0);

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

  console.log('DevicesSection - filteredDevices:', filteredDevices);
  console.log('DevicesSection - filteredDevices length:', filteredDevices.length);

  const handleAddDeviceClick = () => {
    console.log('Add Device button clicked, setting showAddForm to true');
    setShowAddForm(true);
  };

  const handleCancelAddDevice = () => {
    console.log('Cancel button clicked, setting showAddForm to false');
    setShowAddForm(false);
  };

  // const handleTestModalClick = () => {
  //   if (!isAdmin()) {
  //     alert('This feature is only available to administrators.');
  //     return;
  //   }
  //   console.log('Test modal button clicked');
  //   setShowTestModal(true);
  // };

  // const handleRefreshDevices = async () => {
  //   setIsRefreshing(true);
  //   try {
  //     await refreshDevices();
  //   } catch (error) {
  //     console.error('Failed to refresh devices:', error);
  //   } finally {
  //     setIsRefreshing(false);
  //   }
  // };

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
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-green-800">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Device Management</h1>
          <p className="text-slate-600 mt-2">
            {isAdmin() ? 'Monitor and control your IoT devices' : 'View your IoT devices'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleAddDeviceClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Add Device
          </button>
          

        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
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
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
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
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all"
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
        <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Cpu className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">No devices found</h3>
          <p className="text-slate-600 mb-6">
            No devices match your current search criteria. Try adjusting your filters or add your first device.
          </p>
          <button 
            onClick={handleAddDeviceClick}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            Add First Device
          </button>
        </div>
      )}

      {/* Debug Info */}
      <div className="text-sm text-slate-500">
        Debug: showAddForm = {showAddForm.toString()}, showTestModal = {showTestModal.toString()}
      </div>

      {/* Test Modal - Admin Only */}
      {isAdmin() && (
        <TestModal 
          isOpen={showTestModal} 
          onClose={() => setShowTestModal(false)} 
        />
      )}

             {/* Device Onboarding Form Modal */}
       {showAddForm && (
        <DeviceOnboardingForm
          onSubmit={async (deviceData: any, file: any) => {
            try {
              console.log('DevicesSection - Submitting device data:', deviceData);
              console.log('DevicesSection - File data:', file);
              
              // Create a complete device object with all required fields
              const completeDeviceData: Omit<Device, 'id'> = {
                name: deviceData.deviceName,
                type: 'SENSOR', // Default type
                status: 'ONLINE',
                location: deviceData.location || '',
                protocol: deviceData.connectionProtocol || 'MQTT',
                lastSeen: new Date().toISOString(),
                batteryLevel: 100,
                organizationId: '1', // Will be set by backend
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                manufacturer: '',
                model: deviceData.productId || '',
                serialNumber: deviceData.serialNumber || '',
                macAddress: '',
                ipAddress: '',
                port: 8100,
                description: deviceData.metadata || '',
                installationNotes: '',
                maintenanceSchedule: '',
                warrantyInfo: '',
                wifiSsid: '',
                mqttBroker: '',
                mqttTopic: '',
                powerSource: '',
                powerConsumption: 0,
                operatingTemperatureMin: 0,
                operatingTemperatureMax: 50,
                operatingHumidityMin: 0,
                operatingHumidityMax: 100,
                tags: []
              };
              
              let createdDevice;
              
              // Create device using the appropriate method based on whether there's a file
              if (file && file.file && file.status === 'success') {
                console.log('DevicesSection - Creating device with file and PDF results');
                try {
                  // For files, we need to use the API directly
                  const fileObject = { manual: file.file };
                  
                  // Include PDF results if available
                  const deviceRequestData = {
                    ...completeDeviceData,
                    pdfResults: deviceData.pdfResults || null
                  };
                  
                  const response = await deviceAPI.createWithFiles(deviceRequestData, fileObject);
                  createdDevice = response.data;
                } catch (fileError) {
                  console.error('Failed to create device with file, trying without file:', fileError);
                  // Fallback: create device without file
                  createdDevice = await addDevice(completeDeviceData);
                }
              } else {
                console.log('DevicesSection - Creating device without file');
                // Use the addDevice function from IoTContext
                createdDevice = await addDevice(completeDeviceData);
              }
              
              console.log('DevicesSection - Device created successfully:', createdDevice);
              
              // Show success message
              setSuccessMessage(`Device "${deviceData.deviceName}" has been successfully added to the platform!`);
              
              // Clear success message after 5 seconds
              setTimeout(() => {
                setSuccessMessage('');
              }, 5000);
              
              // Close the form after a short delay to show success message
              setTimeout(() => {
                setShowAddForm(false);
              }, 1000);
              
            } catch (error) {
              console.error('DevicesSection - Failed to create device:', error);
              alert(`Failed to create device: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }}
          onCancel={handleCancelAddDevice}
        />
      )}
    </div>
  );
};