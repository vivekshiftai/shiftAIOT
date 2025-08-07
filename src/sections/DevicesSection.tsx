import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search, Cpu } from 'lucide-react';
import { DeviceCard } from '../components/Devices/DeviceCard';
import { AddDeviceForm } from '../components/Devices/AddDeviceForm';
import { TestModal } from '../components/Devices/TestModal';
import { useIoT } from '../contexts/IoTContext';
import { useAuth } from '../contexts/AuthContext';
import { deviceAPI } from '../services/api';
import { Device } from '../types';
import { DevicesLoading, LoadingButton } from '../components/Loading/LoadingComponents';

export const DevicesSection: React.FC = () => {
  const navigate = useNavigate();
  const { devices, updateDeviceStatus, refreshDevices, addDevice, loading } = useIoT();
  const { isAdmin, hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesType = typeFilter === 'all' || device.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleAddDeviceClick = () => {
    if (!hasPermission('DEVICE_WRITE')) {
      alert('You do not have permission to add devices. Please contact an administrator.');
      return;
    }
    console.log('Add Device button clicked, setting showAddForm to true');
    setShowAddForm(true);
  };

  const handleCancelAddDevice = () => {
    console.log('Cancel button clicked, setting showAddForm to false');
    setShowAddForm(false);
  };

  const handleTestModalClick = () => {
    if (!isAdmin()) {
      alert('This feature is only available to administrators.');
      return;
    }
    console.log('Test modal button clicked');
    setShowTestModal(true);
  };

  const handleRefreshDevices = async () => {
    setIsRefreshing(true);
    try {
      await refreshDevices();
    } catch (error) {
      console.error('Failed to refresh devices:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeviceClick = (device: Device) => {
    navigate(`/devices/${device.id}`);
  };

  // Show loading screen while data is being fetched
  if (loading) {
    return <DevicesLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Device Management</h1>
          <p className="text-slate-600 mt-2">
            {isAdmin() ? 'Monitor and control your IoT devices' : 'View your IoT devices'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <LoadingButton
            loading={isRefreshing}
            onClick={handleRefreshDevices}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
          >
            Refresh
          </LoadingButton>
          
          {isAdmin() && (
            <button 
              onClick={handleTestModalClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg"
            >
              Test Modal
            </button>
          )}
          
          {hasPermission('DEVICE_WRITE') && (
            <button 
              onClick={handleAddDeviceClick}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Device
            </button>
          )}
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
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
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
          </div>
        </div>
      </div>

      {/* Device List - Vertical Layout */}
      <div className="space-y-4">
        {filteredDevices.map((device) => (
          <div key={device.id} onClick={() => handleDeviceClick(device)}>
            <DeviceCard
              device={device}
              onStatusChange={hasPermission('DEVICE_WRITE') ? updateDeviceStatus : (() => {})}
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
            {hasPermission('DEVICE_WRITE') 
              ? 'No devices match your current search criteria. Try adjusting your filters or add your first device.'
              : 'No devices match your current search criteria. Try adjusting your filters.'
            }
          </p>
          {hasPermission('DEVICE_WRITE') && (
            <button 
              onClick={handleAddDeviceClick}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              Add First Device
            </button>
          )}
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

             {/* Add Device Form Modal - Admin Only */}
       {showAddForm && hasPermission('DEVICE_WRITE') && (
        <AddDeviceForm
          onSubmit={async (deviceData, files) => {
            try {
              console.log('DevicesSection - Submitting device data:', deviceData);
              console.log('DevicesSection - Files to upload:', files);
              
              // Convert files array to object format expected by API
              const fileObject: { manual?: File; datasheet?: File; certificate?: File } = {};
              files.forEach(file => {
                if (file.type === 'manual') fileObject.manual = file.file;
                if (file.type === 'datasheet') fileObject.datasheet = file.file;
                if (file.type === 'certificate') fileObject.certificate = file.file;
              });
              
              // Create device object for backend
              const newDevice: Omit<Device, 'id'> = {
                name: deviceData.name,
                type: deviceData.type,
                status: 'online',
                location: deviceData.location,
                lastSeen: new Date().toISOString(),
                batteryLevel: 100,
                firmware: deviceData.firmware,
                protocol: deviceData.protocol,
                tags: deviceData.tags,
                manufacturer: deviceData.manufacturer,
                model: deviceData.model,
                serialNumber: deviceData.serialNumber,
                macAddress: deviceData.macAddress,
                ipAddress: deviceData.ipAddress,
                port: deviceData.port,
                powerSource: deviceData.powerSource,
                powerConsumption: deviceData.powerConsumption,
                operatingTemperatureMin: deviceData.operatingTemperatureMin,
                operatingTemperatureMax: deviceData.operatingTemperatureMax,
                operatingHumidityMin: deviceData.operatingHumidityMin,
                operatingHumidityMax: deviceData.operatingHumidityMax,
                wifiSsid: deviceData.wifiSsid,
                mqttBroker: deviceData.mqttBroker,
                mqttTopic: deviceData.mqttTopic,
                description: deviceData.description,
                installationNotes: deviceData.installationNotes,
                maintenanceSchedule: deviceData.maintenanceSchedule,
                warrantyInfo: deviceData.warrantyInfo,
                organizationId: '', // Will be set by backend
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              
              // Try to create device with files first
              let createdDevice;
              if (files.length > 0) {
                try {
                  console.log('DevicesSection - Creating device with files');
                  const response = await deviceAPI.createWithFiles(deviceData, fileObject);
                  createdDevice = response.data;
                  console.log('DevicesSection - Device created with files:', createdDevice.id);
                } catch (error) {
                  console.error('DevicesSection - Failed to create device with files:', error);
                  // Fall back to creating device without files
                  console.log('DevicesSection - Falling back to create device without files');
                  createdDevice = await addDevice(newDevice);
                }
              } else {
                // Create device without files
                console.log('DevicesSection - Creating device without files');
                createdDevice = await addDevice(newDevice);
              }
              
              console.log('DevicesSection - Device created successfully:', createdDevice.id);
              
              // Close the form
              setShowAddForm(false);
            } catch (error) {
              console.error('DevicesSection - Failed to create device:', error);
              // Show error to user (you can add a toast notification here)
              alert(`Failed to create device: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }}
          onCancel={handleCancelAddDevice}
        />
      )}
    </div>
  );
};