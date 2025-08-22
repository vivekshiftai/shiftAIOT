import { getApiConfig } from '../config/api';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface DeviceData {
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

export interface DeviceRules {
  id: string;
  name: string;
  description: string;
  metric: string;
  metricValue: string;
  threshold: string;
  consequence: string;
  status: string;
  deviceId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceMaintenance {
  id: string;
  taskName: string;
  deviceId: string;
  deviceName: string;
  componentName: string;
  maintenanceType: string;
  frequency: string;
  description: string;
  priority: string;
  estimatedCost?: number;
  estimatedDuration?: string;
  requiredTools?: string[];
  safetyNotes?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceSafetyPrecaution {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  deviceId: string;
  deviceName: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceDocumentation {
  id: string;
  deviceId: string;
  type: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt?: string;
}

export class UnifiedDeviceService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiConfig().BACKEND_BASE_URL;
  }

  /**
   * Get all devices for the current user's organization
   */
  async getAllDevices(): Promise<DeviceData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch devices: ${response.status}`);
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching devices', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get device by ID
   */
  async getDeviceById(deviceId: string): Promise<DeviceData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch device: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get device rules
   */
  async getDeviceRules(deviceId: string): Promise<DeviceRules[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/pdf-results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logWarn('UnifiedDeviceService', `Failed to fetch device rules: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.rules || [];
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device rules', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }

  /**
   * Get device maintenance schedule
   */
  async getDeviceMaintenance(deviceId: string): Promise<DeviceMaintenance[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/pdf-results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logWarn('UnifiedDeviceService', `Failed to fetch device maintenance: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.maintenance || [];
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device maintenance', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }

  /**
   * Get device safety precautions
   */
  async getDeviceSafetyPrecautions(deviceId: string): Promise<DeviceSafetyPrecaution[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/pdf-results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logWarn('UnifiedDeviceService', `Failed to fetch device safety precautions: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data.safetyPrecautions || [];
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device safety precautions', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }

  /**
   * Get device documentation
   */
  async getDeviceDocumentation(deviceId: string): Promise<DeviceDocumentation[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/documentation`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logWarn('UnifiedDeviceService', `Failed to fetch device documentation: ${response.status}`);
        return [];
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device documentation', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string, status: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        throw new Error(`Failed to update device status: ${response.status}`);
      }

      return true;
    } catch (error) {
      logError('UnifiedDeviceService', 'Error updating device status', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to delete device: ${response.status}`);
      }

      return true;
    } catch (error) {
      logError('UnifiedDeviceService', 'Error deleting device', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get device telemetry data
   */
  async getDeviceTelemetry(deviceId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/telemetry`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logWarn('UnifiedDeviceService', `Failed to fetch device telemetry: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device telemetry', error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  }

  /**
   * Get device debug data
   */
  async getDeviceDebugData(deviceId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/debug-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        logWarn('UnifiedDeviceService', `Failed to fetch device debug data: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      logError('UnifiedDeviceService', 'Error fetching device debug data', error instanceof Error ? error : new Error('Unknown error'));
      return null;
    }
  }

  /**
   * Test device authentication
   */
  async testDeviceAuth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/auth-test`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      logError('UnifiedDeviceService', 'Error testing device auth', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }
}

// Export singleton instance
export const unifiedDeviceService = new UnifiedDeviceService();
