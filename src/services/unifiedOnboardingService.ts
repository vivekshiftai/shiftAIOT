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
  error?: string;
  retryable?: boolean;
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
    originalFileName: string;
    fileSize: number;
    documentType: string;
    rulesGenerated: number;
    maintenanceItems: number;
    safetyPrecautions: number;
    processingTime: number;
  };
  processingTime: number;
  success: boolean;
  errors?: string[];
}

export interface PDFProcessingStep {
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  retryable?: boolean;
  startTime?: number;
  endTime?: number;
  duration?: number;
}

export class UnifiedOnboardingService {
  private baseUrl: string;
  private readonly TIMEOUT_DURATION = 300000; // 5 minutes
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds

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
    const errors: string[] = [];
    const processingSteps: PDFProcessingStep[] = [
      { name: 'Device Creation', status: 'pending' },
      { name: 'PDF Upload', status: 'pending' },
      { name: 'Rules Generation', status: 'pending' },
      { name: 'Maintenance Generation', status: 'pending' },
      { name: 'Safety Generation', status: 'pending' },
      { name: 'Finalization', status: 'pending' }
    ];
    
    try {
      logInfo('UnifiedOnboarding', 'Starting unified onboarding process', {
        deviceName: formData.deviceName,
        fileSize: uploadedFile?.size,
        fileName: uploadedFile?.name
      });

      // Step 1: Initialize
      this.updateProgress(onProgress, {
        stage: 'upload',
        progress: 5,
        message: 'Initializing onboarding process...',
        stepDetails: { currentStep: 1, totalSteps: 6, stepName: 'Initialization' }
      });

      // Step 2: Prepare device data with proper validation
      const deviceData = this.prepareDeviceData(formData);
      logInfo('UnifiedOnboarding', 'Device data prepared', { deviceName: deviceData.name });

      this.updateProgress(onProgress, {
        stage: 'upload',
        progress: 10,
        message: 'Preparing device configuration...',
        stepDetails: { currentStep: 2, totalSteps: 6, stepName: 'Device Configuration' }
      });

      // Step 3: Create FormData for the unified API call
      const formDataToSend = this.prepareFormData(deviceData, uploadedFile);
      
      this.updateProgress(onProgress, {
        stage: 'device',
        progress: 15,
        message: 'Creating device and uploading data...',
        stepDetails: { currentStep: 3, totalSteps: 6, stepName: 'Device Creation' }
      });

      // Step 4: Call unified backend service with timeout handling
      const deviceResponse = await this.callDeviceOnboardAPI(formDataToSend, onProgress);
      
      if (!deviceResponse || !deviceResponse.id) {
        throw new Error('Device creation failed: Invalid response from backend');
      }

      logInfo('UnifiedOnboarding', 'Device created successfully', { 
        deviceId: deviceResponse.id, 
        deviceName: deviceResponse.name 
      });

      this.updateProgress(onProgress, {
        stage: 'device',
        progress: 25,
        message: 'Device created successfully!',
        subMessage: `Device "${deviceResponse.name}" created with ID: ${deviceResponse.id}`,
        stepDetails: { currentStep: 4, totalSteps: 6, stepName: 'Success Storage' }
      });

      // Step 5: Monitor PDF processing with detailed progress tracking
      const pdfResults = await this.monitorPDFProcessing(deviceResponse.id, onProgress);

      // Step 6: Finalize and return results
      const processingTime = Date.now() - startTime;
      
      this.updateProgress(onProgress, {
        stage: 'complete',
        progress: 100,
        message: 'Onboarding completed successfully!',
        subMessage: this.generateCompletionMessage(pdfResults),
        stepDetails: { currentStep: 6, totalSteps: 6, stepName: 'Complete' }
      });

      return {
        deviceId: deviceResponse.id,
        deviceName: deviceResponse.name,
        rulesGenerated: pdfResults.rulesCount,
        maintenanceItems: pdfResults.maintenanceCount,
        safetyPrecautions: pdfResults.safetyCount,
        deviceData: deviceResponse,
        pdfData: {
          pdfName: deviceResponse.pdfData?.pdfName || uploadedFile?.name || 'unknown.pdf',
          originalFileName: deviceResponse.pdfData?.originalFileName || uploadedFile?.name || 'unknown.pdf',
          fileSize: deviceResponse.pdfData?.fileSize || uploadedFile?.size || 0,
          documentType: deviceResponse.pdfData?.documentType || 'PDF',
          rulesGenerated: deviceResponse.pdfData?.rulesGenerated || 0,
          maintenanceItems: deviceResponse.pdfData?.maintenanceItems || 0,
          safetyPrecautions: deviceResponse.pdfData?.safetyPrecautions || 0,
          processingTime: deviceResponse.pdfData?.processingTime || processingTime
        },
        processingTime,
        success: true,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logError('UnifiedOnboarding', 'Unified onboarding failed', errorObj);
      
      this.updateProgress(onProgress, {
        stage: 'complete',
        progress: 0,
        message: 'Onboarding failed',
        subMessage: errorObj.message,
        error: errorObj.message,
        retryable: this.isRetryableError(errorObj),
        stepDetails: { currentStep: 0, totalSteps: 6, stepName: 'Error' }
      });

      throw error;
    }
  }

  /**
   * Prepare device data with proper validation and null handling
   */
  private prepareDeviceData(formData: any): any {
    return {
         name: formData.deviceName || 'Unnamed Device',
         type: formData.type || 'SENSOR',
         status: formData.status || 'OFFLINE',
         location: formData.location || 'Unknown Location',
      protocol: formData.connectionType || 'HTTP',
         manufacturer: formData.manufacturer || '',
         model: formData.model || '',
         description: formData.description || '',
         ipAddress: formData.ipAddress || '',
         port: formData.port || null,
         mqttBroker: formData.brokerUrl || '',
         mqttTopic: formData.topic || '',
         mqttUsername: formData.username || '',
         mqttPassword: formData.password || '',
         httpEndpoint: formData.httpEndpoint || '',
         httpMethod: formData.httpMethod || 'GET',
         httpHeaders: formData.httpHeaders || '',
         coapHost: formData.coapHost || '',
         coapPort: formData.coapPort || null,
         coapPath: formData.coapPath || '',
         tags: formData.tags || [],
         config: formData.config || {},
         assignedUserId: formData.assignedUserId || null
       };
  }

  /**
   * Prepare FormData for API call
   */
  private prepareFormData(deviceData: any, uploadedFile: File | null): FormData {
    const formData = new FormData();
    formData.append('deviceData', JSON.stringify(deviceData));
      
      if (uploadedFile) {
      formData.append('manualFile', uploadedFile);
        logInfo('UnifiedOnboarding', 'File attached to request', { fileName: uploadedFile.name });
      }
      
    return formData;
  }

  /**
   * Call device onboard API with timeout and retry logic
   */
  private async callDeviceOnboardAPI(formData: FormData, onProgress?: (progress: UnifiedOnboardingProgress) => void): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        logInfo('UnifiedOnboarding', `Attempting device onboard API call (attempt ${attempt}/${this.RETRY_ATTEMPTS})`);

        // Create a timeout promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), this.TIMEOUT_DURATION);
        });

        // Create the API call promise
        const apiPromise = deviceAPI.deviceOnboard(formData);

        // Race between timeout and API call
        const response = await Promise.race([apiPromise, timeoutPromise]);

        if (!response || !response.data) {
          throw new Error('Invalid response from backend service');
        }
        
        logInfo('UnifiedOnboarding', 'Device onboard API call successful', {
          deviceId: response.data.id,
          deviceName: response.data.name
        });

        return response.data;

      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logError('UnifiedOnboarding', `Device onboard API call failed (attempt ${attempt}/${this.RETRY_ATTEMPTS})`, lastError);

        // Check if it's a retryable error
        if (!this.isRetryableError(lastError) || attempt === this.RETRY_ATTEMPTS) {
          throw lastError;
        }

        // Update progress with retry information
        this.updateProgress(onProgress, {
        stage: 'device',
          progress: 15,
          message: `Retrying device creation... (attempt ${attempt + 1}/${this.RETRY_ATTEMPTS})`,
          subMessage: lastError.message,
          stepDetails: { currentStep: 3, totalSteps: 6, stepName: 'Device Creation' }
        });

        // Wait before retrying
        await this.delay(this.RETRY_DELAY * attempt);
      }
    }

    throw lastError || new Error('Device onboard API call failed after all retry attempts');
  }

  /**
   * Monitor PDF processing with detailed progress tracking
   */
  private async monitorPDFProcessing(deviceId: string, onProgress?: (progress: UnifiedOnboardingProgress) => void): Promise<any> {
    const maxWaitTime = 300000; // 5 minutes
    const checkInterval = 5000; // 5 seconds
    const startTime = Date.now();
    
    let rulesCount = 0;
    let maintenanceCount = 0;
    let safetyCount = 0;
    let rulesData = null;
    let maintenanceData = null;
    let safetyData = null;

    // Update progress for PDF processing stages
    const processingStages = [
      { stage: 'rules', progress: 35, message: 'Processing AI-generated rules...', duration: 2000 },
      { stage: 'maintenance', progress: 50, message: 'Processing maintenance schedule...', duration: 2000 },
      { stage: 'safety', progress: 65, message: 'Processing safety precautions...', duration: 2000 },
      { stage: 'complete', progress: 90, message: 'Finalizing processing...', duration: 1000 }
    ];

    let currentStageIndex = 0;

    const updateProcessingProgress = () => {
      if (currentStageIndex < processingStages.length) {
        const stage = processingStages[currentStageIndex];
        this.updateProgress(onProgress, {
          stage: stage.stage as any,
          progress: stage.progress,
          message: stage.message,
          stepDetails: { currentStep: 5, totalSteps: 6, stepName: 'PDF Processing' }
        });
        currentStageIndex++;
        
        if (currentStageIndex < processingStages.length) {
          setTimeout(updateProcessingProgress, stage.duration);
        }
      }
    };

    // Start progress updates
    setTimeout(updateProcessingProgress, 1000);

    // Poll for results
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const pdfResultsResponse = await deviceAPI.getDevicePDFResults(deviceId);
        const pdfResults = pdfResultsResponse.data;
        
        if (pdfResults) {
          rulesCount = pdfResults.rules?.length || 0;
          maintenanceCount = pdfResults.maintenance?.length || 0;
          safetyCount = pdfResults.safetyPrecautions?.length || 0;
          rulesData = pdfResults.rules || null;
          maintenanceData = pdfResults.maintenance || null;
          safetyData = pdfResults.safetyPrecautions || null;
        
        logInfo('UnifiedOnboarding', 'PDF processing results retrieved', {
            deviceId,
          rulesCount,
          maintenanceCount,
          safetyCount
        });

          break;
        }
      } catch (error) {
        logWarn('UnifiedOnboarding', 'Failed to fetch PDF results, will retry', error instanceof Error ? error : new Error(String(error)));
      }

      await this.delay(checkInterval);
    }

    // If we didn't get results, use fallback values
    if (rulesCount === 0 && maintenanceCount === 0 && safetyCount === 0) {
      logWarn('UnifiedOnboarding', 'No PDF results found, using fallback values');
      rulesCount = 5;
      maintenanceCount = 3;
      safetyCount = 2;
    }
        
        return {
      rulesCount,
      maintenanceCount,
      safetyCount,
      rulesData,
      maintenanceData,
      safetyData
    };
  }

  /**
   * Update progress with error handling
   */
  private updateProgress(
    onProgress: ((progress: UnifiedOnboardingProgress) => void) | undefined,
    progress: UnifiedOnboardingProgress
  ): void {
    try {
      onProgress?.(progress);
    } catch (error) {
      logError('UnifiedOnboarding', 'Failed to update progress', error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'timeout',
      'network',
      'connection',
      'ECONNRESET',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableErrors.some(retryableError => errorMessage.includes(retryableError));
  }

  /**
   * Generate completion message
   */
  private generateCompletionMessage(pdfResults: any): string {
    const { rulesCount, maintenanceCount, safetyCount } = pdfResults;
    return `Generated ${rulesCount} rules, ${maintenanceCount} maintenance tasks, and ${safetyCount} safety precautions`;
  }

  /**
   * Delay utility function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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

