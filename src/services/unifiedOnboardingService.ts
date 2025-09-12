import { getApiConfig } from '../config/api';
import { logInfo, logError } from '../utils/logger';
import { deviceAPI } from './api';
import { SSEParser } from './sseParser';

export interface UnifiedOnboardingProgress {
  deviceId?: string;
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
        pdfDataKeys: deviceResponse.pdfData ? Object.keys(deviceResponse.pdfData) : 'no pdfData',
        fullDeviceResponse: deviceResponse
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
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minute timeout for SSE

      try {
        console.log('🌐 SSE: Making request to:', `${this.baseUrl}/api/devices/unified-onboarding-stream`);
        console.log('🌐 SSE: Request headers:', headers);
        console.log('🌐 SSE: FormData keys:', Array.from(formData.keys()));
        
        const response = await fetch(`${this.baseUrl}/api/devices/unified-onboarding-stream`, {
          method: 'POST',
          headers,
          body: formData,
          signal: controller.signal
        });
        
        console.log('🌐 SSE: Response received:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: response.body ? 'present' : 'missing'
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check if response is streaming (text/event-stream)
        const contentType = response.headers.get('content-type');
        console.log('🌐 SSE: Response received', {
          status: response.status,
          contentType: contentType,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        // Debug: Check if content-type contains event-stream
        console.log('🌐 SSE: Content-Type check', {
          contentType,
          includesEventStream: contentType && contentType.includes('text/event-stream'),
          contentTypeLower: contentType?.toLowerCase()
        });
        logInfo('UnifiedOnboarding', 'Response content type', contentType);
        logInfo('UnifiedOnboarding', 'Response status', response.status);
        logInfo('UnifiedOnboarding', 'Response headers', Object.fromEntries(response.headers.entries()));
        
        if (contentType && contentType.includes('text/event-stream')) {
          console.log('🌐 SSE: Using streaming response');
          logInfo('UnifiedOnboarding', 'Using SSE streaming response');
          return this.handleStreamingResponse(response, onProgress);
        } else if (onProgress) {
          // If we have a progress callback, try to use streaming even if content-type is not perfect
          console.log('🌐 SSE: Content-type not perfect but trying streaming anyway (has progress callback)');
          logInfo('UnifiedOnboarding', 'Attempting SSE streaming despite content-type');
          return this.handleStreamingResponse(response, onProgress);
        } else {
          console.log('🌐 SSE: Using regular JSON response (fallback)');
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
      
      // Check if it's a network error, timeout, or streaming error that requires fallback
      if (errorMessage.includes('network error') || 
          errorMessage.includes('ERR_INCOMPLETE_CHUNKED_ENCODING') ||
          errorMessage.includes('aborted') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('stream') ||
          errorMessage.includes('STREAMING_ERROR_FALLBACK_REQUIRED')) {
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
    console.log('🌐 SSE: Starting stream processing');
    return new Promise((resolve, reject) => {
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('🌐 SSE: No response body reader available');
        logError('UnifiedOnboarding', 'No response body reader available');
        reject(new Error('No response body reader available'));
        return;
      }

      console.log('🌐 SSE: Stream reader created, starting to read chunks');
      const decoder = new TextDecoder();
      let buffer = '';
      let isCompleted = false;
      let hasReceivedData = false;
      let currentEvent = '';
      let currentData = '';

      console.log('🌐 SSE: Initialized variables', { currentEvent, currentData, buffer: buffer.length });
      
      // Add a test to verify SSE connection
      console.log('🌐 SSE: Testing SSE connection - if you see this, the connection is established');
      console.log('🌐 SSE: Response status:', response.status);
      console.log('🌐 SSE: Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🌐 SSE: Response body type:', response.body?.constructor.name);

      // Set up a timeout to handle incomplete streams
      const timeoutId = setTimeout(() => {
        if (!isCompleted && !hasReceivedData) {
          console.error('🌐 SSE: Stream timeout - no data received');
          logError('UnifiedOnboarding', 'SSE stream timeout - no data received');
          reader.cancel();
          reject(new Error('Stream timeout - no data received'));
        }
      }, 30000); // 30 second timeout

      const processChunk = async () => {
        try {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('🌐 SSE: Stream completed');
            clearTimeout(timeoutId);
            isCompleted = true;
            
            if (!hasReceivedData) {
              console.error('🌐 SSE: Stream completed without data');
              logError('UnifiedOnboarding', 'SSE stream completed without data');
              reject(new Error('Stream completed without data'));
              return;
            }
            
            console.log('🌐 SSE: Stream completed successfully');
            logInfo('UnifiedOnboarding', 'SSE stream completed successfully');
            resolve({ success: true, message: 'Streaming completed' });
            return;
          }

          hasReceivedData = true;
          const chunk = decoder.decode(value, { stream: true });
          console.log('🌐 SSE: Received chunk', { size: chunk.length, preview: chunk.substring(0, 100) });
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line in buffer

          console.log('🌐 SSE: Processing lines', { linesCount: lines.length, lines: lines.slice(0, 5) });

          for (const line of lines) {
            const trimmedLine = line.trim();
            console.log('🌐 SSE: Processing line', { 
              line: trimmedLine, 
              lineLength: trimmedLine.length,
              startsWithEvent: trimmedLine.startsWith('event:'),
              startsWithData: trimmedLine.startsWith('data:'),
              currentEventBefore: currentEvent,
              currentDataBefore: currentData,
              firstChar: trimmedLine.charAt(0),
              first6Chars: trimmedLine.substring(0, 6),
              first7Chars: trimmedLine.substring(0, 7),
              charCodes: trimmedLine.substring(0, 10).split('').map(c => c.charCodeAt(0))
            });
            logInfo('UnifiedOnboarding', 'Processing SSE line', { line: trimmedLine });
            
            if (trimmedLine.startsWith('event:')) {
              const previousEvent = currentEvent;
              const previousData = currentData;
              currentEvent = trimmedLine.substring(6).trim();
              console.log('🌐 SSE: Event type received', { 
                event: currentEvent,
                previousEvent,
                previousData: previousData ? 'present' : 'missing',
                currentEventLength: currentEvent.length,
                currentDataLength: currentData.length
              });
              console.log('🌐 SSE: Event variable updated', { currentEvent, currentData });
              console.log('🌐 SSE: Variables after event update', { currentEvent, currentData });
            } else if (trimmedLine.startsWith('data:')) {
              const previousData = currentData;
              currentData = trimmedLine.substring(5);
              console.log('🌐 SSE: Data received', { 
                dataLength: currentData.length, 
                dataPreview: currentData.substring(0, Math.min(100, currentData.length)) + '...',
                currentEvent,
                previousData: previousData ? 'present' : 'missing',
                hasEvent: !!currentEvent,
                hasData: !!currentData,
                currentEventLength: currentEvent.length,
                currentDataLength: currentData.length
              });
              console.log('🌐 SSE: Data variable updated', { currentEvent, currentData });
              console.log('🌐 SSE: Variables after data update', { currentEvent, currentData });
            } else if (trimmedLine === '') {
              // Empty line indicates end of event, process the accumulated data
              console.log('🌐 SSE: Empty line detected - processing event', { 
                currentEvent, 
                currentData: currentData ? 'present' : 'missing', 
                hasEvent: !!currentEvent, 
                hasData: !!currentData,
                eventLength: currentEvent?.length || 0,
                dataLength: currentData?.length || 0,
                rawLine: `"${line}"`,
                trimmedLine: `"${trimmedLine}"`
              });
              
              if (currentEvent && currentData) {
                console.log('🌐 SSE: Processing event', { 
                  event: currentEvent, 
                  dataLength: currentData.length,
                  dataPreview: currentData.substring(0, Math.min(100, currentData.length)) + '...',
                  fullData: currentData
                });
                logInfo('UnifiedOnboarding', 'Processing SSE event data', { 
                  event: currentEvent, 
                  data: currentData.substring(0, Math.min(100, currentData.length)) + '...' 
                });
                
                try {
                  const eventData = JSON.parse(currentData);
                  console.log('🔍 SSE: Parsed event data', { 
                    currentEvent, 
                    eventData,
                    eventDataKeys: Object.keys(eventData),
                    eventDataStringified: JSON.stringify(eventData, null, 2),
                    timestamp: eventData.timestamp,
                    timestampType: typeof eventData.timestamp
                  });
                  
                  if (currentEvent === 'progress' && eventData.stage && eventData.progress !== undefined) {
                    // This is a progress update
                    console.log('🔥 SSE: Creating progress object from eventData', {
                      eventData,
                      stage: eventData.stage,
                      progress: eventData.progress,
                      message: eventData.message,
                      subMessage: eventData.subMessage,
                      stepDetails: eventData.stepDetails,
                      deviceId: eventData.deviceId,
                      error: eventData.error,
                      retryable: eventData.retryable,
                      timestamp: eventData.timestamp
                    });
                    
                    const progress: UnifiedOnboardingProgress = {
                      deviceId: eventData.deviceId,
                      stage: eventData.stage,
                      progress: eventData.progress,
                      message: eventData.message,
                      subMessage: eventData.subMessage,
                      stepDetails: eventData.stepDetails,
                      error: eventData.error,
                      retryable: eventData.retryable,
                      timestamp: eventData.timestamp
                    };
                    
                    console.log('🔥 SSE: Created progress object', {
                      progress,
                      progressKeys: Object.keys(progress),
                      stage: progress.stage,
                      progressValue: progress.progress,
                      message: progress.message,
                      deviceId: progress.deviceId,
                      stepDetails: progress.stepDetails,
                      timestamp: progress.timestamp
                    });
                    
                    console.log('🔥 SSE: Processing progress update', {
                      event: currentEvent,
                      stage: progress.stage,
                      progress: progress.progress,
                      message: progress.message,
                      subMessage: progress.subMessage,
                      stepDetails: progress.stepDetails,
                      deviceId: progress.deviceId,
                      error: progress.error,
                      retryable: progress.retryable,
                      timestamp: progress.timestamp,
                      fullProgress: progress
                    });
                    
                    logInfo('UnifiedOnboarding', 'Processing progress update', {
                      event: currentEvent,
                      stage: progress.stage,
                      progress: progress.progress,
                      message: progress.message
                    });
                    
                    if (onProgress) {
                      console.log('🔥 SSE: Calling onProgress callback with:', {
                        progress,
                        progressStringified: JSON.stringify(progress, null, 2),
                        callbackType: typeof onProgress,
                        callbackName: onProgress.name || 'anonymous'
                      });
                      onProgress(progress);
                      console.log('🔥 SSE: onProgress callback completed successfully');
                    } else {
                      console.log('🔥 SSE: onProgress callback is null!', {
                        onProgress,
                        onProgressType: typeof onProgress
                      });
                    }
                  } else if (currentEvent === 'complete') {
                    // This is the final result
                    console.log('🎉 SSE: Processing complete event', { eventData });
                    clearTimeout(timeoutId);
                    isCompleted = true;
                    logInfo('UnifiedOnboarding', 'Received final result from SSE stream', eventData);
                    
                    // Ensure the response has the expected structure
                    const formattedResponse = {
                      id: eventData.deviceId || eventData.id,
                      name: eventData.deviceName || eventData.name,
                      pdfData: eventData.pdfData || {
                        rulesGenerated: eventData.rulesGenerated || 0,
                        maintenanceItems: eventData.maintenanceItems || 0,
                        safetyPrecautions: eventData.safetyPrecautions || 0,
                        pdfName: eventData.pdfData?.pdfName || 'unknown.pdf',
                        originalFileName: eventData.pdfData?.originalFileName || 'unknown.pdf',
                        fileSize: eventData.pdfData?.fileSize || 0,
                        documentType: eventData.pdfData?.documentType || 'PDF',
                        processingTime: eventData.pdfData?.processingTime || Date.now()
                      }
                    };
                    
                    logInfo('UnifiedOnboarding', 'Formatted final result for frontend', formattedResponse);
                    resolve(formattedResponse);
                    return;
                  } else if (currentEvent === 'error' && eventData.error) {
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
              // Reset for next event
              console.log('🌐 SSE: Event processing completed, resetting variables', {
                processedEvent: currentEvent,
                processedDataLength: currentData?.length || 0,
                resettingTo: { currentEvent: '', currentData: '' }
              });
              currentEvent = '';
              currentData = '';
              continue;
            }
          }

          // Continue reading
          processChunk();
        } catch (error) {
          console.error('🌐 SSE: Error processing chunk', error);
          clearTimeout(timeoutId);
          isCompleted = true;
          const errorObj = error instanceof Error ? error : new Error('Unknown error');
          logError('UnifiedOnboarding', 'Error processing SSE chunk', errorObj);
          
          // Check if this is a network/streaming error that should trigger fallback
          const errorMessage = errorObj.message.toLowerCase();
          if (errorMessage.includes('network error') || 
              errorMessage.includes('err_incomplete_chunked_encoding') ||
              errorMessage.includes('aborted') ||
              errorMessage.includes('timeout') ||
              errorMessage.includes('stream')) {
            // Reject with a specific error that will trigger fallback
            reject(new Error('STREAMING_ERROR_FALLBACK_REQUIRED'));
          } else {
            reject(errorObj);
          }
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

        logInfo('UnifiedOnboarding', 'Fallback result formatted with actual data', {
          deviceId: result.deviceId,
          deviceName: result.deviceName,
          rulesGenerated: result.rulesGenerated,
          maintenanceItems: result.maintenanceItems,
          safetyPrecautions: result.safetyPrecautions,
          pdfDataExists: !!response.data.pdfData,
          rawPdfData: response.data.pdfData
        });
        return result;

      } catch (error: any) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        logError('UnifiedOnboarding', `Fallback device onboard API call failed (attempt ${attempt}/${this.RETRY_ATTEMPTS})`, lastError);
        logInfo('UnifiedOnboarding', 'Fallback error details', {
          errorMessage: lastError.message,
          stack: lastError.stack,
          errorType: error.constructor.name,
          response: error.response ? {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          } : 'No response data'
        });

        // Check if it's a retryable error
        if (!this.isRetryableError(lastError) || attempt === this.RETRY_ATTEMPTS) {
          logError('UnifiedOnboarding', 'Fallback device onboard API call failed after all retries', lastError);
          logInfo('UnifiedOnboarding', 'Fallback retry details', {
            finalErrorMessage: lastError.message,
            attempts: attempt,
            isRetryable: this.isRetryableError(lastError)
          });
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

