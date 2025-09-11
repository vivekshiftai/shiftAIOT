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
   * Get real-time statistics for a device with robust error handling
   */
  static async getDeviceStats(deviceId: string): Promise<DeviceStats> {
    // Initialize default response
    const defaultStats: DeviceStats = {
      deviceId,
      rulesCount: 0,
      maintenanceCount: 0,
      safetyCount: 0,
      totalItems: 0
    };

    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        this.fetchRulesCount(deviceId),
        this.fetchMaintenanceCount(deviceId),
        this.fetchSafetyCount(deviceId)
      ]);

      // Extract results, using 0 as fallback for failed requests
      const [rulesResult, maintenanceResult, safetyResult] = results;

      const rulesCount = rulesResult.status === 'fulfilled' ? rulesResult.value : 0;
      const maintenanceCount = maintenanceResult.status === 'fulfilled' ? maintenanceResult.value : 0;
      const safetyCount = safetyResult.status === 'fulfilled' ? safetyResult.value : 0;

      return {
        deviceId,
        rulesCount,
        maintenanceCount,
        safetyCount,
        totalItems: rulesCount + maintenanceCount + safetyCount
      };
    } catch (error) {
      console.warn(`Failed to fetch device stats for ${deviceId}:`, error);
      return defaultStats;
    }
  }

  /**
   * Fetch rules count with individual error handling
   */
  private static async fetchRulesCount(deviceId: string): Promise<number> {
    try {
      console.log(`🔧 DeviceStatsService: Fetching rules for device ${deviceId}`);
      const response = await ruleAPI.getByDevice(deviceId);
      console.log(`🔧 DeviceStatsService: Rules response for device ${deviceId}:`, response);
      return response.data?.length || 0;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        console.warn(`❌ Access denied for rules endpoint for device ${deviceId} - Status: ${status}`);
        console.warn(`❌ This might be the source of the AccessDeniedException in the logs`);
      } else if (status === 404) {
        console.warn(`Rules endpoint not found for device ${deviceId}`);
      } else {
        console.warn(`Failed to fetch rules for device ${deviceId}:`, status || error.message);
      }
      return 0;
    }
  }

  /**
   * Fetch maintenance count with individual error handling
   */
  private static async fetchMaintenanceCount(deviceId: string): Promise<number> {
    try {
      console.log(`🔧 DeviceStatsService: Fetching maintenance for device ${deviceId}`);
      const response = await maintenanceAPI.getByDevice(deviceId);
      console.log(`🔧 DeviceStatsService: Maintenance response for device ${deviceId}:`, response);
      // The backend returns a complex object with maintenanceTasks field
      const maintenanceData = response.data?.maintenanceTasks || response.data || [];
      return maintenanceData.length || 0;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        console.warn(`❌ Access denied for maintenance endpoint for device ${deviceId} - Status: ${status}`);
        console.warn(`❌ This might be the source of the AccessDeniedException in the logs`);
      } else if (status === 404) {
        console.warn(`Maintenance endpoint not found for device ${deviceId}`);
      } else {
        console.warn(`Failed to fetch maintenance for device ${deviceId}:`, status || error.message);
      }
      return 0;
    }
  }

  /**
   * Fetch safety count with individual error handling
   */
  private static async fetchSafetyCount(deviceId: string): Promise<number> {
    try {
      console.log(`🔧 DeviceStatsService: Fetching safety for device ${deviceId}`);
      const response = await deviceSafetyPrecautionsAPI.getByDevice(deviceId);
      console.log(`🔧 DeviceStatsService: Safety response for device ${deviceId}:`, response);
      const safetyData = response.data || [];
      console.log(`🔧 DeviceStatsService: Safety data length for device ${deviceId}:`, safetyData.length);
      return safetyData.length || 0;
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        console.warn(`❌ Access denied for safety precautions endpoint for device ${deviceId} - Status: ${status}`);
        console.warn(`❌ This might be the source of the AccessDeniedException in the logs`);
      } else if (status === 404) {
        console.warn(`Safety precautions endpoint not found for device ${deviceId}`);
      } else if (status === 500) {
        console.warn(`Server error fetching safety precautions for device ${deviceId}`);
      } else {
        console.warn(`Failed to fetch safety precautions for device ${deviceId}:`, status || error.message);
      }
      return 0;
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
    } catch (error: any) {
      console.warn(`Failed to fetch device rules for ${deviceId}:`, error.response?.status || error.message);
      return [];
    }
  }

  /**
   * Get detailed maintenance for a device
   */
  static async getDeviceMaintenance(deviceId: string) {
    try {
      const response = await maintenanceAPI.getByDevice(deviceId);
      // The backend returns a complex object with maintenanceTasks field
      const maintenanceData = response.data?.maintenanceTasks || response.data || [];
      return maintenanceData;
    } catch (error: any) {
      console.warn(`Failed to fetch device maintenance for ${deviceId}:`, error.response?.status || error.message);
      return [];
    }
  }

  /**
   * Get detailed safety precautions for a device
   */
  static async getDeviceSafety(deviceId: string) {
    try {
      const response = await deviceSafetyPrecautionsAPI.getByDevice(deviceId);
      console.log(`🔧 DeviceStatsService: getDeviceSafety response for device ${deviceId}:`, response);
      const safetyData = response.data || [];
      console.log(`🔧 DeviceStatsService: getDeviceSafety data for device ${deviceId}:`, safetyData);
      return safetyData;
    } catch (error: any) {
      console.warn(`Failed to fetch device safety for ${deviceId}:`, error.response?.status || error.message);
      return [];
    }
  }
}
