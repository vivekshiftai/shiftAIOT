import { getApiConfig } from '../config/api';
import { logInfo, logError, logWarn } from '../utils/logger';
import { deviceAPI } from './api';
import { tokenService } from '../services/tokenService';

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
      logInfo('UnifiedOnboarding', 'Starting unified onboarding process', {
        deviceName: formData.deviceName,
        fileSize: uploadedFile?.size,
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

             // Step 1: Prepare device data with proper validation (only required fields)
       const deviceData = {
         name: formData.deviceName || 'Unnamed Device',
         type: formData.deviceType || 'SENSOR',
         location: formData.location || 'Unknown Location',
         protocol: formData.protocol || 'HTTP', // Backend expects: MQTT, HTTP, COAP
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
         tags: formData.tags || []
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
      
             // No need to send aiRules parameter - backend will handle AI processing internally

      // Log FormData contents for debugging
      logInfo('UnifiedOnboarding', 'FormData prepared for sending', {
        deviceDataLength: JSON.stringify(deviceData).length,
        deviceDataKeys: Object.keys(deviceData),
        hasManualFile: !!uploadedFile,
        manualFileName: uploadedFile?.name,
        manualFileSize: uploadedFile?.size,
        formDataEntries: Array.from(formDataToSend.entries()).map(([key, value]) => ({
          key,
          type: typeof value,
          isFile: value instanceof File,
          size: value instanceof File ? value.size : null,
          name: value instanceof File ? value.name : null
        }))
      });

      // Additional debugging: Log the actual FormData content
      console.log('🔍 FormData Debug - All entries:');
      for (const [key, value] of formDataToSend.entries()) {
        console.log(`🔍 Key: ${key}, Type: ${typeof value}, IsFile: ${value instanceof File}`);
        if (value instanceof File) {
          console.log(`🔍 File: ${value.name}, Size: ${value.size}, Type: ${value.type}`);
        } else {
          console.log(`🔍 Value: ${value}`);
        }
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

      logInfo('UnifiedOnboarding', 'Calling unified backend service', { endpoint: '/api/devices/device-onboard' });
      
      // Simulate progress updates during the backend call since it's synchronous
      const progressInterval = setInterval(() => {
        onProgress?.({
          stage: 'device',
          progress: Math.min(progress + 5, 25),
          message: 'Processing device creation...',
          stepDetails: {
            currentStep: 3,
            totalSteps: 8,
            stepName: 'Device Creation'
          }
        });
      }, 1000);
      
      let progress = 15;

      // Step 1: Validate authentication with detailed logging
      logInfo('UnifiedOnboarding', 'Step 1: Validating authentication');
      let token = tokenService.getToken();
      
      if (!token) {
        logWarn('UnifiedOnboarding', 'No token found in token service, attempting to refresh');
        try {
          token = await tokenService.refreshToken();
          if (!token) {
            logError('UnifiedOnboarding', 'Token refresh failed');
            throw new Error('Authentication token not available. Please log in again.');
          }
          logInfo('UnifiedOnboarding', 'Token refreshed successfully');
        } catch (refreshError) {
          logError('UnifiedOnboarding', 'Token refresh failed', refreshError instanceof Error ? refreshError : new Error('Unknown refresh error'));
          throw new Error('Authentication failed. Please log in again.');
        }
      }

      logInfo('UnifiedOnboarding', 'Token found', { 
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 20) + '...',
        hasToken: !!token 
      });

      // Step 2: Test backend connectivity first
      logInfo('UnifiedOnboarding', 'Testing backend connectivity');
      
      try {
        // Use the authenticated API service instead of fetch
        const healthResponse = await deviceAPI.testHealth();

        logInfo('UnifiedOnboarding', 'Health check response', {
          status: healthResponse.status,
          statusText: healthResponse.statusText,
          ok: healthResponse.status === 200,
          url: `${this.baseUrl}/api/devices/health`
        });

        logInfo('UnifiedOnboarding', 'Backend connectivity test successful');
      } catch (healthError) {
        logError('UnifiedOnboarding', 'Backend connectivity test failed', healthError instanceof Error ? healthError : new Error('Unknown health error'));
        
        if (healthError instanceof TypeError && healthError.message.includes('fetch')) {
          throw new Error(`Cannot connect to backend server at ${this.baseUrl}. Please check if the server is running.`);
        }
        
        throw new Error('Backend server is not accessible. Please check if the server is running.');
      }

      // Step 3: Test authentication with debug endpoint only (more reliable)
      try {
        logInfo('UnifiedOnboarding', 'Testing authentication with debug endpoint');
        
        const debugResponse = await fetch(`${this.baseUrl}/api/devices/debug-auth`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        logInfo('UnifiedOnboarding', 'Debug endpoint response', {
          status: debugResponse.status,
          statusText: debugResponse.statusText,
          ok: debugResponse.ok,
          url: debugResponse.url
        });

        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          logInfo('UnifiedOnboarding', 'Debug authentication successful', debugData);
        } else {
          logWarn('UnifiedOnboarding', `Debug authentication failed: ${debugResponse.status} ${debugResponse.statusText}`);
          
          // Try to get response text for more details
          try {
            const errorText = await debugResponse.text();
            logWarn('UnifiedOnboarding', `Debug endpoint error response: ${errorText}`);
          } catch (textError) {
            logWarn('UnifiedOnboarding', 'Could not read debug endpoint error response', textError instanceof Error ? textError : new Error('Unknown text error'));
          }
          
          // Don't throw error for authentication failure during onboarding
          // Just log a warning and continue
          logWarn('UnifiedOnboarding', 'Authentication test failed, but continuing with onboarding process');
        }

        logInfo('UnifiedOnboarding', 'Authentication test completed');
              } catch (authError) {
          const error = authError instanceof Error ? authError : new Error(String(authError));
          logWarn('UnifiedOnboarding', 'Authentication validation failed, but continuing', undefined, error);
        
        // Check if it's a network error
        if (authError instanceof TypeError && authError.message.includes('fetch')) {
          logError('UnifiedOnboarding', `Network error - backend might not be accessible. Base URL: ${this.baseUrl}, Error: ${authError.message}`);
          throw new Error('Cannot connect to backend server. Please check if the server is running.');
        }
        
        // Don't throw error for authentication issues during onboarding
        logWarn('UnifiedOnboarding', 'Authentication issues detected, but continuing with onboarding process');
      }

      // Use the proper API instance with authentication handling
             logInfo('UnifiedOnboarding', 'Calling device-onboard endpoint with authentication');
      
      let response;
             try {
         response = await deviceAPI.deviceOnboard(formDataToSend);
        
        // Validate response
        if (!response || !response.data) {
          throw new Error('Invalid response from backend service');
        }
        
                 logInfo('UnifiedOnboarding', 'Device-onboard endpoint call successful');
      } catch (apiError: any) {
                 logError('UnifiedOnboarding', 'API call to device-onboard failed', apiError instanceof Error ? apiError : new Error('Unknown API error'));
        
        // Check if it's an authentication error
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          throw new Error('Authentication failed. Please log in again and try the onboarding process.');
        }
        
        // Check if it's a network error
        if (apiError.code === 'ERR_NETWORK' || apiError.message?.includes('Network Error')) {
          throw new Error('Cannot connect to backend server. Please check if the server is running.');
        }
        
        // Re-throw other errors
        throw apiError;
      }

      const result = response.data;
      
      // Clear the progress interval
      clearInterval(progressInterval);
      
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
      
      // Simulate rules processing progress
      setTimeout(() => {
        onProgress?.({
          stage: 'rules',
          progress: 45,
          message: 'Generating monitoring rules...',
          stepDetails: {
            currentStep: 5,
            totalSteps: 8,
            stepName: 'Rules Processing'
          }
        });
      }, 2000);

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
      
      // Simulate maintenance processing progress
      setTimeout(() => {
        onProgress?.({
          stage: 'maintenance',
          progress: 60,
          message: 'Creating maintenance schedules...',
          stepDetails: {
            currentStep: 6,
            totalSteps: 8,
            stepName: 'Maintenance Processing'
          }
        });
      }, 3000);

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
      
      // Simulate safety processing progress
      setTimeout(() => {
        onProgress?.({
          stage: 'safety',
          progress: 75,
          message: 'Generating safety guidelines...',
          stepDetails: {
            currentStep: 7,
            totalSteps: 8,
            stepName: 'Safety Processing'
          }
        });
      }, 4000);

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
      
      // Simulate finalization progress
      setTimeout(() => {
        onProgress?.({
          stage: 'complete',
          progress: 95,
          message: 'Completing setup...',
          stepDetails: {
            currentStep: 8,
            totalSteps: 8,
            stepName: 'Finalization'
          }
        });
      }, 5000);

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
         const errorObj = pdfResultsError instanceof Error ? pdfResultsError : new Error(String(pdfResultsError));
         logWarn('UnifiedOnboarding', 'Failed to fetch PDF results, using default counts', undefined, errorObj);
        
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
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logError('UnifiedOnboarding', 'Unified onboarding failed', errorObj);
      
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
       const errorObj = error instanceof Error ? error : new Error(String(error));
       logError('UnifiedOnboarding', 'Failed to get onboarding status', errorObj);
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
       const errorObj = error instanceof Error ? error : new Error(String(error));
       logError('UnifiedOnboarding', 'Failed to retry onboarding step', errorObj);
      throw error;
    }
  }
}

// Export singleton instance
export const unifiedOnboardingService = new UnifiedOnboardingService();
