import { unifiedOnboardingService, UnifiedOnboardingProgress, UnifiedOnboardingResult } from './unifiedOnboardingService';
import { logInfo, logError, logWarn } from '../utils/logger';

export interface OnboardingResult {
  deviceId: string;
  rulesGenerated: number;
  maintenanceItems: number;
  safetyPrecautions: number;
  deviceData: any;
  pdfData: {
    pdfName: string;
    rulesData?: any;
    maintenanceData?: any;
    safetyData?: any;
    knowledgeUpload?: any;
  };
}

export interface OnboardingProgress {
  stage: 'upload' | 'device' | 'rules' | 'maintenance' | 'safety' | 'knowledge' | 'complete';
  progress: number;
  message: string;
  subMessage?: string;
}

/**
 * Legacy onboarding service that now delegates to the unified service
 * This maintains backward compatibility while using the new unified workflow
 */
export class OnboardingService {
  
  /**
   * Complete device onboarding process using the unified service
   */
  async completeOnboarding(
    formData: any,
    uploadedFile: File,
    onProgress?: (progress: OnboardingProgress) => void
  ): Promise<OnboardingResult> {
    
    logInfo('Onboarding', 'Starting legacy onboarding process, delegating to unified service');
    
    try {
      // Convert legacy progress to unified progress
      const unifiedProgressHandler = (progress: UnifiedOnboardingProgress) => {
        // Map unified stages to legacy stages
        let legacyStage: OnboardingProgress['stage'];
        switch (progress.stage) {
          case 'upload':
            legacyStage = 'upload';
            break;
          case 'device':
            legacyStage = 'device';
            break;
          case 'rules':
            legacyStage = 'rules';
            break;
          case 'maintenance':
            legacyStage = 'maintenance';
            break;
          case 'safety':
            legacyStage = 'safety';
            break;
          case 'complete':
            legacyStage = 'complete';
            break;
          default:
            legacyStage = 'complete';
        }
        
        onProgress?.({
          stage: legacyStage,
          progress: progress.progress,
          message: progress.message,
          subMessage: progress.subMessage
        });
      };
      
      // Call the unified service
      const unifiedResult = await unifiedOnboardingService.completeUnifiedOnboarding(
        formData,
        uploadedFile,
        unifiedProgressHandler
      );
      
      // Convert unified result to legacy format
      const legacyResult: OnboardingResult = {
        deviceId: unifiedResult.deviceId,
        rulesGenerated: unifiedResult.rulesGenerated,
        maintenanceItems: unifiedResult.maintenanceItems,
        safetyPrecautions: unifiedResult.safetyPrecautions,
        deviceData: unifiedResult.deviceData,
        pdfData: {
          pdfName: unifiedResult.pdfData.pdfName,
          rulesData: unifiedResult.pdfData.rulesData,
          maintenanceData: unifiedResult.pdfData.maintenanceData,
          safetyData: unifiedResult.pdfData.safetyData,
          knowledgeUpload: null // Not used in unified service
        }
      };
      
      logInfo('Onboarding', `Legacy onboarding completed successfully for device: ${legacyResult.deviceId}`);
      
      return legacyResult;
      
    } catch (error) {
      logError('Onboarding', 'Legacy onboarding process failed', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
}

// Export singleton instance for backward compatibility
export const onboardingService = new OnboardingService();
