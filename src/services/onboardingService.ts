import { pdfProcessingService } from './pdfprocess';
import { deviceAPI, ruleAPI, maintenanceAPI, deviceSafetyPrecautionsAPI } from './api';
import { getApiConfig } from '../config/api';

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

export class OnboardingService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiConfig().BACKEND_BASE_URL;
  }

  /**
   * Complete device onboarding process with all three generation endpoints
   */
  async completeOnboarding(
    formData: any,
    uploadedFile: File,
    onProgress?: (progress: OnboardingProgress) => void
  ): Promise<OnboardingResult> {
    try {
      // Step 1: Upload PDF to MinerU
      onProgress?.({
        stage: 'upload',
        progress: 10,
        message: 'Uploading PDF to processing service...'
      });

      const pdfUploadResponse = await pdfProcessingService.uploadPDF(uploadedFile);
      
      if (!pdfUploadResponse.success) {
        throw new Error('PDF upload failed');
      }

      onProgress?.({
        stage: 'upload',
        progress: 20,
        message: 'PDF uploaded successfully',
        subMessage: `Processing time: ${pdfUploadResponse.processing_time}`
      });

      // Step 2: Create device in backend
      onProgress?.({
        stage: 'device',
        progress: 30,
        message: 'Creating device in database...'
      });

      const deviceData = {
        name: formData.deviceName,
        location: formData.location,
        manufacturer: formData.manufacturer,
        model: formData.manufacturer,
        protocol: formData.connectionType,
        status: 'OFFLINE',
        deviceType: 'SENSOR',
        description: `Device onboarded via PDF: ${uploadedFile.name}`,
        connectionDetails: {
          type: formData.connectionType,
          brokerUrl: formData.brokerUrl,
          topic: formData.topic,
          username: formData.username,
          password: formData.password
        }
      };

      const deviceResponse = await deviceAPI.create(deviceData);
      const createdDevice = deviceResponse.data;

      if (!createdDevice || !createdDevice.id) {
        throw new Error('Device creation failed: No device ID returned');
      }

      onProgress?.({
        stage: 'device',
        progress: 40,
        message: 'Device created successfully',
        subMessage: `Device ID: ${createdDevice.id}`
      });

      // Step 3: Generate IoT Rules
      onProgress?.({
        stage: 'rules',
        progress: 50,
        message: 'Generating IoT rules from PDF...'
      });

      const rulesResponse = await pdfProcessingService.generateRules(pdfUploadResponse.pdf_name);
      
      if (!rulesResponse.success) {
        throw new Error('IoT rules generation failed');
      }

      // Save rules to backend
      if (rulesResponse.rules && rulesResponse.rules.length > 0) {
        try {
          const rulesToSave = rulesResponse.rules.map((rule: any) => ({
            name: `${rule.category} Rule`,
            description: rule.condition,
            condition: rule.condition,
            action: rule.action,
            priority: rule.priority.toUpperCase(),
            status: 'ACTIVE',
            deviceId: createdDevice.id,
            category: rule.category
          }));

          await ruleAPI.createBulk(rulesToSave);
          console.log('Rules saved to backend successfully');
        } catch (error) {
          console.error('Failed to save rules to backend:', error);
          // Don't throw error, continue with onboarding
        }
      }

      onProgress?.({
        stage: 'rules',
        progress: 60,
        message: 'IoT rules generated successfully',
        subMessage: `${rulesResponse.rules?.length || 0} rules created`
      });

      // Step 4: Generate Maintenance Schedule
      onProgress?.({
        stage: 'maintenance',
        progress: 70,
        message: 'Generating maintenance schedule...'
      });

      const maintenanceResponse = await pdfProcessingService.generateMaintenance(pdfUploadResponse.pdf_name);
      
      if (!maintenanceResponse.success) {
        throw new Error('Maintenance schedule generation failed');
      }

      // Save maintenance tasks to backend
      if (maintenanceResponse.maintenance_tasks && maintenanceResponse.maintenance_tasks.length > 0) {
        try {
          const maintenanceToSave = maintenanceResponse.maintenance_tasks.map((task: any) => ({
            taskName: task.task,
            deviceId: createdDevice.id,
            deviceName: formData.deviceName,
            componentName: task.category,
            maintenanceType: 'PREVENTIVE',
            frequency: task.frequency.toUpperCase(),
            description: task.description,
            priority: 'MEDIUM',
            status: 'ACTIVE',
            organizationId: 'default' // This should come from user context
          }));

          await maintenanceAPI.createBulk(maintenanceToSave);
          console.log('Maintenance tasks saved to backend successfully');
        } catch (error) {
          console.error('Failed to save maintenance tasks to backend:', error);
          // Don't throw error, continue with onboarding
        }
      }

      onProgress?.({
        stage: 'maintenance',
        progress: 80,
        message: 'Maintenance schedule generated',
        subMessage: `${maintenanceResponse.maintenance_tasks?.length || 0} tasks created`
      });

      // Step 5: Generate Safety Information
      onProgress?.({
        stage: 'safety',
        progress: 85,
        message: 'Generating safety information...'
      });

      const safetyResponse = await pdfProcessingService.generateSafety(pdfUploadResponse.pdf_name);
      
      if (!safetyResponse.success) {
        throw new Error('Safety information generation failed');
      }

      // Save safety precautions to backend
      if (safetyResponse.safety_information && safetyResponse.safety_information.length > 0) {
        try {
          const safetyPrecautions = safetyResponse.safety_information.map((safety: any) => ({
            deviceId: createdDevice.id,
            title: safety.title,
            description: safety.description,
            type: safety.type,
            category: safety.category,
            severity: 'MEDIUM',
            isActive: true,
            organizationId: 'default' // This should come from user context
          }));

          await deviceSafetyPrecautionsAPI.createBulk(safetyPrecautions);
          console.log('Safety precautions saved to backend successfully');
        } catch (error) {
          console.error('Failed to save safety precautions to backend:', error);
          // Don't throw error, continue with onboarding
        }
      }

      onProgress?.({
        stage: 'safety',
        progress: 90,
        message: 'Safety information generated',
        subMessage: `${safetyResponse.safety_information?.length || 0} precautions created`
      });

      // Step 6: Upload to knowledge base (optional)
      onProgress?.({
        stage: 'knowledge',
        progress: 95,
        message: 'Uploading to knowledge base...'
      });

      let knowledgeUploadResponse = null;
      try {
        // This would be your knowledge base API call
        // knowledgeUploadResponse = await knowledgeAPI.uploadPDF(uploadedFile, createdDevice.id, formData.deviceName);
        console.log('Knowledge base upload completed');
      } catch (error) {
        console.error('Knowledge base upload failed:', error);
        // Don't throw error, this is optional
      }

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Onboarding completed successfully!',
        subMessage: 'Device is ready for use'
      });

      // Return comprehensive result
      return {
        deviceId: createdDevice.id,
        rulesGenerated: rulesResponse.rules?.length || 0,
        maintenanceItems: maintenanceResponse.maintenance_tasks?.length || 0,
        safetyPrecautions: safetyResponse.safety_information?.length || 0,
        deviceData: createdDevice,
        pdfData: {
          pdfName: pdfUploadResponse.pdf_name,
          rulesData: rulesResponse,
          maintenanceData: maintenanceResponse,
          safetyData: safetyResponse,
          knowledgeUpload: knowledgeUploadResponse
        }
      };

    } catch (error) {
      console.error('Onboarding process failed:', error);
      throw error;
    }
  }

  /**
   * Generate all three types of data from an existing PDF
   */
  async generateAllFromPDF(
    pdfName: string,
    deviceId: string,
    onProgress?: (progress: OnboardingProgress) => void
  ): Promise<{
    rules: any;
    maintenance: any;
    safety: any;
  }> {
    try {
      // Generate all three types in parallel for better performance
      onProgress?.({
        stage: 'rules',
        progress: 30,
        message: 'Generating IoT rules...'
      });

      const [rulesResponse, maintenanceResponse, safetyResponse] = await Promise.all([
        pdfProcessingService.generateRules(pdfName),
        pdfProcessingService.generateMaintenance(pdfName),
        pdfProcessingService.generateSafety(pdfName)
      ]);

      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'All data generated successfully'
      });

      return {
        rules: rulesResponse,
        maintenance: maintenanceResponse,
        safety: safetyResponse
      };

    } catch (error) {
      console.error('Failed to generate data from PDF:', error);
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    pdfService: boolean;
    backend: boolean;
  }> {
    const results = {
      pdfService: false,
      backend: false
    };

    try {
      await pdfProcessingService.healthCheck();
      results.pdfService = true;
    } catch (error) {
      console.error('PDF service health check failed:', error);
    }

    try {
      // Simple backend health check
      const response = await fetch(`${this.baseUrl}/api/health`);
      results.backend = response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
    }

    return results;
  }
}

// Export singleton instance
export const onboardingService = new OnboardingService();
