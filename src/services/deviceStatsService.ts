import { deviceAPI, ruleAPI, maintenanceAPI, deviceSafetyPrecautionsAPI } from './api';

export interface DeviceStats {
  deviceId: string;
  rulesCount: number;
  maintenanceCount: number;
  safetyCount: number;
  totalItems: number;
}

export class DeviceStatsService {
  /**
   * Get real-time statistics for a device
   */
  static async getDeviceStats(deviceId: string): Promise<DeviceStats> {
    try {
      // Fetch all data in parallel for better performance
      const [rulesResponse, maintenanceResponse, safetyResponse] = await Promise.all([
        ruleAPI.getByDevice(deviceId),
        maintenanceAPI.getByDevice(deviceId),
        deviceSafetyPrecautionsAPI.getByDevice(deviceId)
      ]);

      const rulesCount = rulesResponse.data?.length || 0;
      const maintenanceCount = maintenanceResponse.data?.length || 0;
      const safetyCount = safetyResponse.data?.length || 0;

      return {
        deviceId,
        rulesCount,
        maintenanceCount,
        safetyCount,
        totalItems: rulesCount + maintenanceCount + safetyCount
      };
    } catch (error) {
      console.error('Failed to fetch device stats:', error);
      // Return default values if API calls fail
      return {
        deviceId,
        rulesCount: 0,
        maintenanceCount: 0,
        safetyCount: 0,
        totalItems: 0
      };
    }
  }

  /**
   * Get device information
   */
  static async getDeviceInfo(deviceId: string) {
    try {
      const response = await deviceAPI.getById(deviceId);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch device info:', error);
      return null;
    }
  }

  /**
   * Get detailed rules for a device
   */
  static async getDeviceRules(deviceId: string) {
    try {
      const response = await ruleAPI.getByDevice(deviceId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch device rules:', error);
      return [];
    }
  }

  /**
   * Get detailed maintenance for a device
   */
  static async getDeviceMaintenance(deviceId: string) {
    try {
      const response = await maintenanceAPI.getByDevice(deviceId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch device maintenance:', error);
      return [];
    }
  }

  /**
   * Get detailed safety precautions for a device
   */
  static async getDeviceSafety(deviceId: string) {
    try {
      const response = await deviceSafetyPrecautionsAPI.getByDevice(deviceId);
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch device safety:', error);
      return [];
    }
  }
}
