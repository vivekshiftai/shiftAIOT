import { getApiConfig } from '../config/api';
import { logInfo, logError, logWarn } from '../utils/logger';
import { deviceAPI } from './api';

export interface UnifiedOnboardingProgress {
  stage: 'upload' | 'device' | 'rules' | 'maintenance' | 'safety' | 'complete';
  progress: number;
  message: string;
  subMessage?: string;
  stepDetails?: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
  };
}

export interface UnifiedOnboardingResult {
  deviceId: string;
  deviceName: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  deviceData: any;
  pdfData: {
    pdfName: string;
    rulesData?: any;
    maintenanceData?: any;
    safetyData?: any;
  };
  processingTime: number;
}

export class UnifiedOnboardingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiConfig().BACKEND_BASE_URL;
  }

  /**
   * Complete unified onboarding process using the new backend service
   * Handles sequential workflow: upload → device creation → rules → maintenance → safety
   */
  async completeUnifiedOnboarding(
    formData: any,
    uploadedFile: File,
    onProgress?: (progress: UnifiedOnboardingProgress) => void
  ): Promise<UnifiedOnboardingResult> {
    const startTime = Date.now();
    
    try {
      logInfo('UnifiedOnboarding', 'Starting unified onboarding process', { deviceName: formData.deviceName });
      
      // Step 1: Prepare device data and upload files
      onProgress?.({
        stage: 'upload',
        progress: 5,
        message: 'Preparing device data and files...',
        stepDetails: {
          currentStep: 1,
          totalSteps: 8,
          stepName: 'Data Preparation'
        }
      });

      // Dummy data for skipped connection settings
      const dummyConnectionData = {
        brokerUrl: 'mqtt://localhost:1883',
        topic: 'device/default/data',
        username: 'default_user',
        password: 'default_password',
        httpEndpoint: 'https://api.example.com/device/data',
        httpMethod: 'POST',
        httpHeaders: '{"Content-Type": "application/json"}',
        coapHost: 'coap://localhost',
        coapPort: '5683',
        coapPath: '/device/data'
      };

      const deviceData = {
        name: formData.deviceName,
        type: formData.deviceType || 'SENSOR',
        location: formData.location,
        protocol: formData.connectionType || 'MQTT',
        status: formData.deviceStatus || 'OFFLINE',
        manufacturer: formData.manufacturer,
        model: formData.model || '',
        serialNumber: formData.serialNumber || '',
        description: formData.description || '',
        tags: formData.tags || [],
        config: {
          mqttBroker: formData.brokerUrl || dummyConnectionData.brokerUrl,
          mqttTopic: formData.topic || dummyConnectionData.topic,
          mqttUsername: formData.username || dummyConnectionData.username,
          mqttPassword: formData.password || dummyConnectionData.password,
          httpEndpoint: formData.httpEndpoint || dummyConnectionData.httpEndpoint,
          httpMethod: formData.httpMethod || dummyConnectionData.httpMethod,
          coapHost: formData.coapHost || dummyConnectionData.coapHost,
          coapPort: formData.coapPort || dummyConnectionData.coapPort,
          coapPath: formData.coapPath || dummyConnectionData.coapPath
        }
      };

      logInfo('UnifiedOnboarding', 'Device data prepared', { deviceName: deviceData.name });

      onProgress?.({
        stage: 'upload',
        progress: 10,
        message: 'Uploading files to server...',
        stepDetails: {
          currentStep: 2,
          totalSteps: 8,
          stepName: 'File Upload'
        }
      });

      // Step 2: Create FormData for the unified API call
      const formDataToSend = new FormData();
      formDataToSend.append('deviceData', JSON.stringify(deviceData));
      
      if (uploadedFile) {
        formDataToSend.append('manualFile', uploadedFile);
        logInfo('UnifiedOnboarding', 'File attached to request', { fileName: uploadedFile.name });
      }

      // Step 3: Call unified backend service for sequential processing
      onProgress?.({
        stage: 'device',
        progress: 15,
        message: 'Creating device and uploading data...',
        stepDetails: {
          currentStep: 3,
          totalSteps: 8,
          stepName: 'Device Creation'
        }
      });

      logInfo('UnifiedOnboarding', 'Calling unified backend service', { endpoint: '/api/devices/onboard-with-ai' });

      // Debug: Check token status before making the request
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      logInfo('UnifiedOnboarding', 'Token status before request', { 
        hasToken: !!token, 
        tokenLength: token?.length || 0,
        hasUser: !!user,
        userData: user ? JSON.parse(user) : null
      });

      // Use the proper API instance with authentication handling
      const response = await deviceAPI.onboardWithAI(formDataToSend);

      const result = response.data;
      
      logInfo('UnifiedOnboarding', 'Device created successfully', { deviceId: result.id, deviceName: result.name });
      
      onProgress?.({
        stage: 'device',
        progress: 25,
        message: 'Device created successfully!',
        subMessage: `Device "${result.name}" created with ID: ${result.id}`,
        stepDetails: {
          currentStep: 4,
          totalSteps: 8,
          stepName: 'Success Storage'
        }
      });

      // Step 4: Rules processing (handled by backend)
      onProgress?.({
        stage: 'rules',
        progress: 35,
        message: 'Processing AI-generated rules...',
        stepDetails: {
          currentStep: 5,
          totalSteps: 8,
          stepName: 'Rules Processing'
        }
      });

      logInfo('UnifiedOnboarding', 'Rules processing initiated by backend');

      // Step 5: Maintenance processing (handled by backend with proper date formatting)
      onProgress?.({
        stage: 'maintenance',
        progress: 50,
        message: 'Processing maintenance schedule with date formatting...',
        stepDetails: {
          currentStep: 6,
          totalSteps: 8,
          stepName: 'Maintenance Processing'
        }
      });

      logInfo('UnifiedOnboarding', 'Maintenance processing initiated by backend with date formatting');

      // Step 6: Safety processing (handled by backend)
      onProgress?.({
        stage: 'safety',
        progress: 65,
        message: 'Processing safety precautions...',
        stepDetails: {
          currentStep: 7,
          totalSteps: 8,
          stepName: 'Safety Processing'
        }
      });

      logInfo('UnifiedOnboarding', 'Safety processing initiated by backend');

      // Step 7: Fetch final results
      onProgress?.({
        stage: 'complete',
        progress: 80,
        message: 'Fetching processed data...',
        stepDetails: {
          currentStep: 8,
          totalSteps: 8,
          stepName: 'Data Retrieval'
        }
      });

      const deviceDetails = await this.fetchDeviceDetails(result.id);

      const processingTime = Date.now() - startTime;
      
      logInfo('UnifiedOnboarding', 'Device onboarding completed successfully', {
        deviceId: result.id,
        deviceName: result.name,
        processingTime,
        rulesGenerated: deviceDetails.rules?.length || 0,
        maintenanceItems: deviceDetails.maintenance?.length || 0,
        safetyPrecautions: deviceDetails.safetyPrecautions?.length || 0
      });

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Device onboarding completed successfully!',
        subMessage: `Generated ${deviceDetails.rules?.length || 0} rules, ${deviceDetails.maintenance?.length || 0} maintenance items, and ${deviceDetails.safetyPrecautions?.length || 0} safety precautions`,
        stepDetails: {
          currentStep: 8,
          totalSteps: 8,
          stepName: 'Complete'
        }
      });

      return {
        deviceId: result.id,
        deviceName: result.name,
        rulesGenerated: deviceDetails.rules?.length || 0,
        maintenanceItems: deviceDetails.maintenance?.length || 0,
        safetyPrecautions: deviceDetails.safetyPrecautions?.length || 0,
        deviceData: result,
        pdfData: {
          pdfName: uploadedFile?.name || '',
          rulesData: deviceDetails.rules,
          maintenanceData: deviceDetails.maintenance,
          safetyData: deviceDetails.safetyPrecautions
        },
        processingTime
      };

    } catch (error) {
      logError('UnifiedOnboarding', 'Unified onboarding process failed', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Fetch device details including rules, maintenance, and safety data
   */
  private async fetchDeviceDetails(deviceId: string) {
    try {
      logInfo('UnifiedOnboarding', 'Fetching device details', { deviceId });
      
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/pdf-results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        logInfo('UnifiedOnboarding', 'Device details fetched successfully', {
          deviceId,
          rulesCount: data.rules?.length || 0,
          maintenanceCount: data.maintenance?.length || 0,
          safetyCount: data.safetyPrecautions?.length || 0
        });
        return {
          rules: data.rules || [],
          maintenance: data.maintenance || [],
          safetyPrecautions: data.safetyPrecautions || []
        };
      } else {
        logWarn('UnifiedOnboarding', `Failed to fetch device details: ${response.status}`);
        return {
          rules: [],
          maintenance: [],
          safetyPrecautions: []
        };
      }
    } catch (error) {
      logError('UnifiedOnboarding', 'Error fetching device details', error instanceof Error ? error : new Error('Unknown error'));
      return {
        rules: [],
        maintenance: [],
        safetyPrecautions: []
      };
    }
  }

  /**
   * Get onboarding progress for a specific device
   */
  async getOnboardingProgress(deviceId: string): Promise<UnifiedOnboardingProgress> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/onboarding-progress`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      } else {
        return {
          stage: 'complete',
          progress: 100,
          message: 'Onboarding completed'
        };
      }
    } catch (error) {
      logError('UnifiedOnboarding', 'Error fetching onboarding progress', error instanceof Error ? error : new Error('Unknown error'));
      return {
        stage: 'complete',
        progress: 100,
        message: 'Onboarding completed'
      };
    }
  }

  /**
   * Check if device onboarding is complete
   */
  async isOnboardingComplete(deviceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/onboarding-status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.completed || false;
      }
      return false;
    } catch (error) {
      logError('UnifiedOnboarding', 'Error checking onboarding status', error instanceof Error ? error : new Error('Unknown error'));
      return false;
    }
  }

  /**
   * Get device rules through unified service
   */
  async getDeviceRules(deviceId: string): Promise<any[]> {
    try {
      const deviceDetails = await this.fetchDeviceDetails(deviceId);
      return deviceDetails.rules || [];
    } catch (error) {
      logError('UnifiedOnboarding', 'Error fetching device rules', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }

  /**
   * Get device maintenance through unified service
   */
  async getDeviceMaintenance(deviceId: string): Promise<any[]> {
    try {
      const deviceDetails = await this.fetchDeviceDetails(deviceId);
      return deviceDetails.maintenance || [];
    } catch (error) {
      logError('UnifiedOnboarding', 'Error fetching device maintenance', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }

  /**
   * Get device safety precautions through unified service
   */
  async getDeviceSafetyPrecautions(deviceId: string): Promise<any[]> {
    try {
      const deviceDetails = await this.fetchDeviceDetails(deviceId);
      return deviceDetails.safetyPrecautions || [];
    } catch (error) {
      logError('UnifiedOnboarding', 'Error fetching device safety precautions', error instanceof Error ? error : new Error('Unknown error'));
      return [];
    }
  }
}

// Export singleton instance
export const unifiedOnboardingService = new UnifiedOnboardingService();
