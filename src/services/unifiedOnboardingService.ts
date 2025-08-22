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
   * Complete unified onboarding workflow with enhanced error handling and progress tracking
   */
  async completeUnifiedOnboarding(
    formData: any,
    uploadedFile: File | null,
    onProgress?: (progress: UnifiedOnboardingProgress) => void
  ): Promise<UnifiedOnboardingResult> {
    const startTime = Date.now();
    
    try {
      logInfo('UnifiedOnboarding', 'Starting unified onboarding workflow', {
        deviceName: formData.deviceName,
        hasFile: !!uploadedFile,
        fileName: uploadedFile?.name
      });

      onProgress?.({
        stage: 'upload',
        progress: 5,
        message: 'Initializing onboarding process...',
        stepDetails: {
          currentStep: 1,
          totalSteps: 8,
          stepName: 'Initialization'
        }
      });

      // Step 1: Prepare device data with proper validation
      const deviceData = {
        name: formData.deviceName || 'Unnamed Device',
        type: formData.deviceType || 'SENSOR',
        location: formData.location || 'Unknown Location',
        manufacturer: formData.manufacturer || 'Unknown Manufacturer',
        model: formData.model || 'Unknown Model',
        serialNumber: formData.serialNumber || '',
        firmware: formData.firmware || '',
        powerSource: formData.powerSource || 'Unknown',
        powerConsumption: formData.powerConsumption || null,
        operatingTemperatureMin: formData.operatingTemperatureMin || null,
        operatingTemperatureMax: formData.operatingTemperatureMax || null,
        operatingHumidityMin: formData.operatingHumidityMin || null,
        operatingHumidityMax: formData.operatingHumidityMax || null,
        wifiSsid: formData.wifiSsid || '',
        ipAddress: formData.ipAddress || '',
        macAddress: formData.macAddress || '',
        port: formData.port || null,
        mqttBroker: formData.mqttBroker || '',
        mqttTopic: formData.mqttTopic || '',
        protocol: formData.protocol || 'HTTP',
        assignedUserId: formData.assignedUserId || null,
        tags: formData.tags || [],
        connectionSettings: {
          mqttBroker: formData.mqttBroker || '',
          mqttTopic: formData.mqttTopic || '',
          httpEndpoint: formData.httpEndpoint || '',
          httpMethod: formData.httpMethod || 'GET',
          httpHeaders: formData.httpHeaders || {},
          coapHost: formData.coapHost || '',
          coapPort: formData.coapPort || 5683,
          coapPath: formData.coapPath || ''
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

      // Validate authentication before proceeding
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      // Test authentication with a simple API call
      try {
        logInfo('UnifiedOnboarding', 'Testing authentication before onboarding...');
        
        // Get user email from localStorage
        const userData = user ? JSON.parse(user) : null;
        const userEmail = userData?.email;
        
        if (userEmail) {
          // Check if user exists in database
          const dbCheckResponse = await fetch(`${this.baseUrl}/api/devices/debug-db?email=${encodeURIComponent(userEmail)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (dbCheckResponse.ok) {
            const dbData = await dbCheckResponse.json();
            logInfo('UnifiedOnboarding', 'Database check successful', dbData);
          } else {
            logWarn('UnifiedOnboarding', `Database check failed: ${dbCheckResponse.status} ${dbCheckResponse.statusText}`);
          }
        }
        
        // First, test the debug endpoint
        const debugResponse = await fetch(`${this.baseUrl}/api/devices/debug-auth`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          logInfo('UnifiedOnboarding', 'Debug authentication successful', debugData);
        } else {
          logError('UnifiedOnboarding', `Debug authentication failed: ${debugResponse.status} ${debugResponse.statusText}`);
        }

        // Then test the profile endpoint
        const authTestResponse = await fetch(`${this.baseUrl}/api/users/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!authTestResponse.ok) {
          logError('UnifiedOnboarding', `Authentication test failed: ${authTestResponse.status} ${authTestResponse.statusText}`);
          throw new Error(`Authentication failed: ${authTestResponse.status} ${authTestResponse.statusText}`);
        }

        logInfo('UnifiedOnboarding', 'Authentication test successful');
      } catch (authError) {
        logError('UnifiedOnboarding', 'Authentication validation failed', authError instanceof Error ? authError : new Error('Unknown error'));
        throw new Error('Authentication validation failed. Please log in again.');
      }

      // Use the proper API instance with authentication handling
      const response = await deviceAPI.onboardWithAI(formDataToSend);

      // Validate response
      if (!response || !response.data) {
        throw new Error('Invalid response from backend service');
      }

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

      // Step 7: Completion
      onProgress?.({
        stage: 'complete',
        progress: 90,
        message: 'Finalizing onboarding process...',
        stepDetails: {
          currentStep: 8,
          totalSteps: 8,
          stepName: 'Finalization'
        }
      });

      // Step 8: Fetch results to get actual counts
      try {
        const pdfResultsResponse = await deviceAPI.getDevicePDFResults(result.id);
        const pdfResults = pdfResultsResponse.data;
        
        const rulesCount = pdfResults.rules?.length || 0;
        const maintenanceCount = pdfResults.maintenance?.length || 0;
        const safetyCount = pdfResults.safetyPrecautions?.length || 0;
        
        logInfo('UnifiedOnboarding', 'PDF processing results retrieved', {
          deviceId: result.id,
          rulesCount,
          maintenanceCount,
          safetyCount
        });

        onProgress?.({
          stage: 'complete',
          progress: 100,
          message: 'Onboarding completed successfully!',
          subMessage: `Generated ${rulesCount} rules, ${maintenanceCount} maintenance tasks, and ${safetyCount} safety precautions`,
          stepDetails: {
            currentStep: 8,
            totalSteps: 8,
            stepName: 'Complete'
          }
        });

        const processingTime = Date.now() - startTime;
        
        return {
          deviceId: result.id,
          deviceName: result.name,
          rulesGenerated: rulesCount,
          maintenanceItems: maintenanceCount,
          safetyPrecautions: safetyCount,
          deviceData: result,
          pdfData: {
            pdfName: uploadedFile?.name || 'No file uploaded',
            rulesData: pdfResults.rules,
            maintenanceData: pdfResults.maintenance,
            safetyData: pdfResults.safetyPrecautions
          },
          processingTime
        };

             } catch (pdfResultsError) {
         logWarn('UnifiedOnboarding', 'Failed to fetch PDF results, using default counts', pdfResultsError instanceof Error ? pdfResultsError : new Error('Unknown error'));
        
        // Return with default counts if PDF results fetch fails
        onProgress?.({
          stage: 'complete',
          progress: 100,
          message: 'Onboarding completed successfully!',
          subMessage: 'Device created and processing initiated',
          stepDetails: {
            currentStep: 8,
            totalSteps: 8,
            stepName: 'Complete'
          }
        });

        const processingTime = Date.now() - startTime;
        
        return {
          deviceId: result.id,
          deviceName: result.name,
          rulesGenerated: 0,
          maintenanceItems: 0,
          safetyPrecautions: 0,
          deviceData: result,
          pdfData: {
            pdfName: uploadedFile?.name || 'No file uploaded'
          },
          processingTime
        };
      }

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logError('UnifiedOnboarding', 'Unified onboarding failed', error);
      
      onProgress?.({
        stage: 'complete',
        progress: 0,
        message: 'Onboarding failed',
        subMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        stepDetails: {
          currentStep: 0,
          totalSteps: 8,
          stepName: 'Error'
        }
      });

      throw error;
    }
  }

  /**
   * Get onboarding status for a device
   */
  async getOnboardingStatus(deviceId: string): Promise<any> {
    try {
      logInfo('UnifiedOnboarding', 'Getting onboarding status for device', { deviceId });
      
      const response = await deviceAPI.getDevicePDFResults(deviceId);
      return response.data;
      
         } catch (error) {
       logError('UnifiedOnboarding', 'Failed to get onboarding status', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Retry failed onboarding steps
   */
  async retryOnboardingStep(deviceId: string, step: 'rules' | 'maintenance' | 'safety'): Promise<any> {
    try {
      logInfo('UnifiedOnboarding', 'Retrying onboarding step', { deviceId, step });
      
      const response = await fetch(`${this.baseUrl}/api/devices/${deviceId}/retry-${step}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to retry ${step}: ${response.statusText}`);
      }

      return await response.json();
      
         } catch (error) {
       logError('UnifiedOnboarding', 'Failed to retry onboarding step', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}

// Export singleton instance
export const unifiedOnboardingService = new UnifiedOnboardingService();
