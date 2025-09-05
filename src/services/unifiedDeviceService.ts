import { getApiConfig } from '../config/api';
import { tokenService } from './tokenService';
import { logError, logWarn } from '../utils/logger';
import { deviceAPI } from './api';

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
  precautionType: 'electrical' | 'mechanical' | 'chemical' | 'environmental' | 'general';
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
      const response = await deviceAPI.getAll();
      return response.data || [];
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
      const response = await deviceAPI.getById(deviceId);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      logError('UnifiedDeviceService', 'Error fetching device', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Get device rules
   */
  async getDeviceRules(deviceId: string): Promise<DeviceRules[]> {
    try {
      const response = await deviceAPI.getById(deviceId);
      // Note: This would need a specific endpoint for device rules
      return [];
    } catch (error) {
      logWarn('UnifiedDeviceService', `Failed to fetch device rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get device maintenance schedule
   */
  async getDeviceMaintenance(deviceId: string): Promise<DeviceMaintenance[]> {
    try {
      // Note: This would need a specific endpoint for device maintenance
      return [];
    } catch (error) {
      logWarn('UnifiedDeviceService', `Failed to fetch device maintenance: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get device safety precautions
   */
  async getDeviceSafetyPrecautions(deviceId: string): Promise<DeviceSafetyPrecaution[]> {
    try {
      // Note: This would need a specific endpoint for device safety precautions
      return [];
    } catch (error) {
      logWarn('UnifiedDeviceService', `Failed to fetch device safety precautions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }

  /**
   * Get device documentation
   */
  async getDeviceDocumentation(deviceId: string): Promise<DeviceDocumentation | null> {
    try {
      const response = await deviceAPI.getDocumentation(deviceId);
      return response.data;
    } catch (error) {
      logWarn('UnifiedDeviceService', `Failed to fetch device documentation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Update device status
   */
  async updateDeviceStatus(deviceId: string, status: string): Promise<boolean> {
    try {
      await deviceAPI.updateStatus(deviceId, status);
      return true;
    } catch (error) {
      logError('UnifiedDeviceService', 'Error updating device status', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<boolean> {
    try {
      await deviceAPI.delete(deviceId);
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
      // Note: This would need a specific endpoint for device telemetry
      return null;
    } catch (error) {
      logWarn('UnifiedDeviceService', `Failed to fetch device telemetry: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Get device debug data
   */
  async getDeviceDebugData(deviceId: string): Promise<any> {
    try {
      // Note: This would need a specific endpoint for device debug data
      return null;
    } catch (error) {
      logWarn('UnifiedDeviceService', `Failed to fetch device debug data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Test device authentication
   */
  async testDeviceAuth(): Promise<boolean> {
    try {
      const response = await deviceAPI.healthCheck();
      return response.status === 200;
    } catch (error) {
      logError('UnifiedDeviceService', 'Error testing device auth', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }
}

// Export singleton instance
export const unifiedDeviceService = new UnifiedDeviceService();
