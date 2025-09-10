import { getApiConfig } from '../config/api';
import { logInfo, logError } from '../utils/logger';
import { deviceAPI } from './api';

export interface UnifiedOnboardingProgress {
  stage: 'device' | 'assignment' | 'upload' | 'rules' | 'maintenance' | 'safety' | 'complete';
  progress: number;
  message: string;
  subMessage?: string;
  stepDetails?: {
    currentStep: number;
    totalSteps: number;
    stepName: string;
    status?: string;
    startTime?: number;
    endTime?: number;
    duration?: number;
  };
  error?: string;
  retryable?: boolean;
  timestamp?: string;
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
    
    try {
      logInfo('UnifiedOnboarding', 'Starting unified onboarding process', {
        deviceName: formData.deviceName,
        fileSize: uploadedFile?.size,
        fileName: uploadedFile?.name
      });

      // Prepare device data with proper validation
      const deviceData = this.prepareDeviceData(formData);
      logInfo('UnifiedOnboarding', 'Device data prepared', { deviceName: deviceData.name });

      // Create FormData for the unified API call
      const formDataToSend = this.prepareFormData(deviceData, uploadedFile);

      // Call unified backend service with real-time progress streaming
      const deviceResponse = await this.callDeviceOnboardAPI(formDataToSend, onProgress);
      
      if (!deviceResponse || !deviceResponse.id) {
        throw new Error('Device creation failed: Invalid response from backend');
      }

      logInfo('UnifiedOnboarding', 'Device created successfully', { 
        deviceId: deviceResponse.id, 
        deviceName: deviceResponse.name 
      });

      // PDF processing and all subsequent steps are now handled by real-time SSE streaming
      // The backend sends all progress updates directly, no need for frontend progress management

      // Log the actual values being returned
      logInfo('UnifiedOnboardingService', 'Returning onboarding result with actual counts', {
        deviceId: deviceResponse.id,
        deviceName: deviceResponse.name,
        rulesGenerated: deviceResponse.pdfData?.rulesGenerated || 0,
        maintenanceItems: deviceResponse.pdfData?.maintenanceItems || 0,
        safetyPrecautions: deviceResponse.pdfData?.safetyPrecautions || 0,
        pdfDataExists: !!deviceResponse.pdfData,
        pdfDataKeys: deviceResponse.pdfData ? Object.keys(deviceResponse.pdfData) : 'no pdfData'
      });

      return {
        deviceId: deviceResponse.id,
        deviceName: deviceResponse.name,
        rulesGenerated: deviceResponse.pdfData?.rulesGenerated || 0,
        maintenanceItems: deviceResponse.pdfData?.maintenanceItems || 0,
        safetyPrecautions: deviceResponse.pdfData?.safetyPrecautions || 0,
        deviceData: deviceResponse,
        pdfData: {
          pdfName: deviceResponse.pdfData?.pdfName || uploadedFile?.name || 'unknown.pdf',
          originalFileName: deviceResponse.pdfData?.originalFileName || uploadedFile?.name || 'unknown.pdf',
          fileSize: deviceResponse.pdfData?.fileSize || uploadedFile?.size || 0,
          documentType: deviceResponse.pdfData?.documentType || 'PDF',
          rulesGenerated: deviceResponse.pdfData?.rulesGenerated || 0,
          maintenanceItems: deviceResponse.pdfData?.maintenanceItems || 0,
          safetyPrecautions: deviceResponse.pdfData?.safetyPrecautions || 0,
          processingTime: deviceResponse.pdfData?.processingTime || (Date.now() - startTime)
        },
        processingTime: Date.now() - startTime,
        success: true,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logError('UnifiedOnboarding', 'Unified onboarding failed', errorObj);
      
      // Error handling - let the backend handle progress updates for errors
      // Frontend will receive error progress updates via SSE streaming

      throw error;
    }
  }

  /**
   * Prepare device data with proper validation and null handling
   */
  private prepareDeviceData(formData: any): any {
    const deviceData = {
         name: formData.deviceName || 'Unnamed Device',
         type: formData.deviceType || formData.type || 'SENSOR', // Default to SENSOR if not provided
         status: formData.status || 'ONLINE',
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
    
    return deviceData;
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
   * Call device onboard API with real-time progress streaming using fetch
   */
  private async callDeviceOnboardAPI(formData: FormData, onProgress?: (progress: UnifiedOnboardingProgress) => void): Promise<any> {
    try {
      logInfo('UnifiedOnboarding', 'Starting device onboard API with progress streaming');

      // Get auth token
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Use fetch with streaming and timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      try {
        const response = await fetch(`${this.baseUrl}/api/devices/unified-onboarding-stream`, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is streaming (text/event-stream)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/event-stream')) {
          logInfo('UnifiedOnboarding', 'Using SSE streaming response');
          return this.handleStreamingResponse(response, onProgress);
        } else {
          // Fallback to regular JSON response
          logInfo('UnifiedOnboarding', 'Using regular JSON response');
          const result = await response.json();
          return result;
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        throw fetchError;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logError('UnifiedOnboarding', 'Failed to start progress streaming', error instanceof Error ? error : new Error('Unknown error'));
      
      // Check if it's a network error or timeout
      if (errorMessage.includes('network error') || 
          errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('stream')) {
        logInfo('UnifiedOnboarding', 'Network/streaming error detected, falling back to regular API call');
        try {
          return await this.callDeviceOnboardAPIFallback(formData);
        } catch (fallbackError) {
          logError('UnifiedOnboarding', 'Fallback API call also failed', fallbackError instanceof Error ? fallbackError : new Error('Unknown error'));
          // Re-throw the original streaming error as it's more descriptive
          throw error;
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Handle streaming response from Server-Sent Events with improved error handling
   */
  private async handleStreamingResponse(response: Response, onProgress?: (progress: UnifiedOnboardingProgress) => void): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = response.body?.getReader();
      if (!reader) {
        logError('UnifiedOnboarding', 'No response body reader available');
        reject(new Error('No response body reader available'));
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let isCompleted = false;
      let hasReceivedData = false;

      // Set up a timeout to handle incomplete streams
      const timeoutId = setTimeout(() => {
        if (!isCompleted && !hasReceivedData) {
          logError('UnifiedOnboarding', 'SSE stream timeout - no data received');
          reader.cancel();
          reject(new Error('Stream timeout - no data received'));
        }
      }, 30000); // 30 second timeout

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            clearTimeout(timeoutId);
            isCompleted = true;
            
            if (!hasReceivedData) {
              logError('UnifiedOnboarding', 'SSE stream completed without data');
              reject(new Error('Stream completed without data'));
              return;
            }
            
            logInfo('UnifiedOnboarding', 'SSE stream completed successfully');
            resolve({ success: true, message: 'Streaming completed' });
            return;
          }

          hasReceivedData = true;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.substring(6); // Remove 'data: ' prefix
              
              try {
                const eventData = JSON.parse(data);
                
                if (eventData.stage && eventData.progress !== undefined) {
                  // This is a progress update
                  const progress: UnifiedOnboardingProgress = {
                    stage: eventData.stage,
                    progress: eventData.progress,
                    message: eventData.message,
                    subMessage: eventData.subMessage,
                    stepDetails: eventData.stepDetails,
                    error: eventData.error,
                    retryable: eventData.retryable
                  };
                  
                  if (onProgress) {
                    onProgress(progress);
                  }
                } else if (eventData.success !== undefined) {
                  // This is the final result
                  clearTimeout(timeoutId);
                  isCompleted = true;
                  logInfo('UnifiedOnboarding', 'Received final result from SSE stream', eventData);
                  resolve(eventData);
                  return;
                } else if (eventData.error) {
                  // This is an error
                  clearTimeout(timeoutId);
                  isCompleted = true;
                  logError('UnifiedOnboarding', 'Received error from SSE stream', eventData);
                  reject(new Error(eventData.error));
                  return;
                }
              } catch (parseError) {
                logError('UnifiedOnboarding', 'Failed to parse SSE data', parseError instanceof Error ? parseError : new Error('Unknown error'));
                // Continue processing other lines instead of failing completely
              }
            }
          }

          // Continue reading
          processChunk();
        } catch (error) {
          clearTimeout(timeoutId);
          isCompleted = true;
          logError('UnifiedOnboarding', 'Error processing SSE chunk', error instanceof Error ? error : new Error('Unknown error'));
          reject(error);
        }
      };

      processChunk();
    });
  }

  /**
   * Fallback method for device onboard API with timeout and retry logic
   */
  private async callDeviceOnboardAPIFallback(formData: FormData): Promise<any> {
    let lastError: Error | null = null;

    logInfo('UnifiedOnboarding', 'Using fallback API method (no streaming)');

    for (let attempt = 1; attempt <= this.RETRY_ATTEMPTS; attempt++) {
      try {
        logInfo('UnifiedOnboarding', `Attempting fallback device onboard API call (attempt ${attempt}/${this.RETRY_ATTEMPTS})`);

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
        
        logInfo('UnifiedOnboarding', 'Fallback device onboard API call successful', {
          deviceId: response.data.id,
          deviceName: response.data.name,
          hasPdfData: !!response.data.pdfData
        });

        // Ensure we return a properly formatted result
        const result = {
          deviceId: response.data.id,
          deviceName: response.data.name,
          rulesGenerated: response.data.pdfData?.rulesGenerated || 0,
          maintenanceItems: response.data.pdfData?.maintenanceItems || 0,
          safetyPrecautions: response.data.pdfData?.safetyPrecautions || 0,
          success: true
        };

        logInfo('UnifiedOnboarding', 'Fallback result formatted', result);
        return result;

      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logError('UnifiedOnboarding', `Fallback device onboard API call failed (attempt ${attempt}/${this.RETRY_ATTEMPTS})`, lastError);

        // Check if it's a retryable error
        if (!this.isRetryableError(lastError) || attempt === this.RETRY_ATTEMPTS) {
          throw lastError;
        }

        // Wait before retrying
        await this.delay(this.RETRY_DELAY * attempt);
      }
    }

    logError('UnifiedOnboarding', 'All fallback retry attempts failed', lastError || new Error('Unknown error'));
    throw lastError || new Error('Device onboard API call failed after all retry attempts');
  }

  /**
   * Monitor PDF processing - REMOVED: Now handled by real-time SSE streaming
   * The backend streams progress updates directly, no need for polling
   */

  /**
   * Update progress with error handling - REMOVED: Now handled by backend SSE streaming
   */

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
   * Generate completion message - REMOVED: Not used in current implementation
   */

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
   * Retry failed onboarding steps - REMOVED: Not used in current implementation
   * Retry logic is now handled by the backend streaming service
   */
}
// Export singleton instance
export const unifiedOnboardingService = new UnifiedOnboardingService();

