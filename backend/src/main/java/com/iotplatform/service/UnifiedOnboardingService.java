package com.iotplatform.service;

import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.MaintenanceGenerationResponse;
import com.iotplatform.dto.RulesGenerationResponse;
import com.iotplatform.dto.SafetyGenerationResponse;
import com.iotplatform.dto.PDFUploadResponse;
import com.iotplatform.dto.UnifiedOnboardingProgress;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.model.*;
import com.iotplatform.model.Device;
import com.iotplatform.model.Notification;
import com.iotplatform.model.UnifiedPDF;
import com.iotplatform.repository.*;
import java.util.Optional;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.function.Consumer;
import org.springframework.beans.factory.annotation.Autowired;
import com.iotplatform.service.DeviceNotificationEnhancerService;
import com.iotplatform.service.JiraTaskAssignmentService;

/**
 * Unified service for handling sequential device onboarding workflow.
 * 
 * Workflow:
 * 1. Upload data and store success message
 * 2. Process rules and store
 * 3. Process maintenance and store (with proper date formatting and frequency calculation)
 * 4. Process safety and store
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class UnifiedOnboardingService {

    private static final Logger log = LoggerFactory.getLogger(UnifiedOnboardingService.class);

    private final DeviceService deviceService;
    private final PDFProcessingService pdfProcessingService;
    private final RuleService ruleService;
    private final MaintenanceScheduleService maintenanceService;
    private final DeviceSafetyPrecautionService safetyService;
    private final FileStorageService fileStorageService;
    private final DeviceRepository deviceRepository;
    private final RuleRepository ruleRepository;
    private final DeviceMaintenanceRepository maintenanceRepository;
    private final DeviceSafetyPrecautionRepository safetyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ConsolidatedNotificationService consolidatedNotificationService;
    private final UnifiedPDFService unifiedPDFService;
    private final ObjectMapper objectMapper;

    @Autowired
    private DeviceNotificationEnhancerService deviceNotificationEnhancerService;

    @Autowired
    private JiraTaskAssignmentService jiraTaskAssignmentService;

    @Autowired
    private OrganizationService organizationService;

    /**
     * Complete unified onboarding workflow with real-time progress tracking
     * 
     * Correct Flow:
     * 1. Create device (without storing PDF files)
     * 2. Upload PDF to PDF Processing Service
     * 3. Generate rules, maintenance, safety from processed PDF
     * 4. Store only the results in our database
     */
    public DeviceCreateResponse completeUnifiedOnboarding(
            DeviceCreateWithFileRequest deviceRequest,
            MultipartFile manualFile,
            MultipartFile datasheetFile,
            MultipartFile certificateFile,
            String organizationId,
            String currentUserId,
            Consumer<UnifiedOnboardingProgress> progressCallback
    ) throws IOException, PDFProcessingException {
        
        log.info("Starting unified onboarding workflow for device: {}", deviceRequest.getName());
        
        // Ensure the organization exists before starting the onboarding process
        try {
            organizationService.ensureOrganizationExists(organizationId);
            log.info("✅ Organization ensured to exist: {}", organizationId);
        } catch (Exception e) {
            log.error("❌ Failed to ensure organization exists: {}", organizationId, e);
            throw new RuntimeException("Failed to ensure organization exists: " + e.getMessage(), e);
        }
        
        // Step 1: Create device (without storing PDF files in our DB) - This is transactional
        log.info("Step 1: Creating device without storing PDF files...");
        
        // Send progress update for device creation
        sendProgressUpdate(progressCallback, "device", 10, "Creating device configuration...", 
                          "Setting up device in the system", null, 1, 5, "Device Creation");
        
        DeviceCreateResponse deviceResponse = createDeviceTransactional(deviceRequest, organizationId, currentUserId);
        
        log.info("Device created successfully with ID: {}", deviceResponse.getId());
        
        // Send progress update for device creation completion
        sendProgressUpdate(progressCallback, "device", 20, "Device created successfully", 
                          "Device configuration saved to database", null, 1, 6, "Device Creation");
        
        // Step 2: Assign device to user
        log.info("Step 2: Assigning device to user...");
        sendProgressUpdate(progressCallback, "assignment", 30, "Assigning device to user", 
                          "Setting up user responsibility and notifications", null, 2, 6, "User Assignment");
        
        // Get device assignee information
        Optional<Device> device = deviceRepository.findById(deviceResponse.getId());
        String deviceAssignee = device.map(Device::getAssignedUserId).orElse(null);
        
        if (deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
            log.info("✅ Device assigned to user: {}", deviceAssignee);
            sendProgressUpdate(progressCallback, "assignment", 40, "Device assigned successfully", 
                              "User will receive notifications and be responsible for maintenance", null, 2, 6, "User Assignment");
        } else {
            log.warn("⚠️ No user assigned to device");
            sendProgressUpdate(progressCallback, "assignment", 40, "Device created without assignment", 
                              "Device can be assigned later from the device management page", null, 2, 6, "User Assignment");
        }
        
        // Step 3: Upload PDF to PDF Processing Service and process - This is non-transactional
        log.info("Step 3: Uploading PDF to processing service and generating content...");
        try {
            PDFProcessingResult pdfResult = processPDFAndGenerateContent(deviceResponse.getId(), manualFile, datasheetFile, certificateFile, 
                                       organizationId, deviceRequest, currentUserId, progressCallback);
            
            // Populate PDF data in the response
            if (pdfResult != null) {
                DeviceCreateResponse.PDFData pdfData = new DeviceCreateResponse.PDFData();
                pdfData.setPdfName(pdfResult.pdfName);
                pdfData.setOriginalFileName(pdfResult.originalFileName);
                pdfData.setFileSize(pdfResult.fileSize);
                pdfData.setDocumentType(pdfResult.documentType);
                pdfData.setRulesGenerated(pdfResult.rulesGenerated);
                pdfData.setMaintenanceItems(pdfResult.maintenanceItems);
                pdfData.setSafetyPrecautions(pdfResult.safetyPrecautions);
                pdfResult.processingTime = pdfResult.processingTime;
                
                deviceResponse.setPdfData(pdfData);
                
                log.info("✅ PDF data populated in device response: {}", pdfResult.pdfName);
            }
            
        } catch (Exception e) {
            log.error("PDF processing failed for device: {}, but device creation succeeded", deviceResponse.getId(), e);
            
            // Send error progress update
            sendProgressUpdate(progressCallback, "error", 0, "PDF processing failed", 
                              "Device created but PDF processing encountered an error", e.getMessage(), 0, 5, "Error");
            
            // Don't fail the entire onboarding if PDF processing fails
        }
        
        // Step 3: Create notification for device assignment (regardless of PDF processing success)
        log.info("Step 3: Creating notification for device assignment...");
        try {
            if (deviceRequest.getAssignedUserId() != null && !deviceRequest.getAssignedUserId().trim().isEmpty()) {
                
                log.info("📝 Creating device assignment notification for user: {} for device: {}", 
                       deviceRequest.getAssignedUserId().trim(), deviceRequest.getName());
                
                // Create consolidated notification if PDF processing succeeded, otherwise create basic notification
                try {
                    consolidatedNotificationService.createConsolidatedDeviceNotification(
                        deviceResponse.getId(),
                        deviceRequest.getAssignedUserId().trim(),
                        organizationId,
                        currentUserId
                    );
                    
                    log.info("✅ Consolidated notification sent to user: {} for device: {}", 
                           deviceRequest.getAssignedUserId().trim(), deviceRequest.getName());
                } catch (Exception consolidatedError) {
                    log.warn("⚠️ Consolidated notification failed, creating basic notification instead: {}", consolidatedError.getMessage());
                    
                    // Fallback to enhanced device assignment notification
                    Notification enhancedNotification = new Notification();
                    enhancedNotification.setTitle("New Device Assignment");
                    enhancedNotification.setMessage("Device has been successfully onboarded and assigned to you. The device is now ready for monitoring and management.");
                    enhancedNotification.setCategory(Notification.NotificationCategory.DEVICE_ASSIGNMENT);
                    enhancedNotification.setUserId(deviceRequest.getAssignedUserId().trim());
                    enhancedNotification.setDeviceId(deviceResponse.getId());
                    enhancedNotification.setOrganizationId(organizationId);
                    enhancedNotification.setRead(false);
                    
                    // Enhance notification with comprehensive device information
                    deviceNotificationEnhancerService.enhanceNotificationWithDeviceInfo(
                        enhancedNotification, deviceResponse.getId(), organizationId);
                    
                    // Build enhanced message
                    String enhancedMessage = deviceNotificationEnhancerService.buildEnhancedNotificationMessage(enhancedNotification);
                    enhancedNotification.setMessage(enhancedMessage);
                    
                    notificationService.createNotificationWithPreferenceCheck(
                        deviceRequest.getAssignedUserId().trim(), enhancedNotification);
                    
                    log.info("✅ Enhanced notification sent to user: {} for device: {}", 
                           deviceRequest.getAssignedUserId().trim(), deviceRequest.getName());
                }
            } else {
                log.info("📝 No notification needed - no assignment specified");
            }
        } catch (Exception e) {
            log.error("❌ Failed to create notification for device: {}", deviceResponse.getId(), e);
            // Don't fail the onboarding if notification fails
        }
        
        // Send final completion progress
        sendProgressUpdate(progressCallback, "complete", 100, "Onboarding completed", 
                          "Device successfully onboarded with all configurations", null, 6, 6, "Completion");
        
        log.info("Unified onboarding workflow completed successfully for device: {}", deviceResponse.getId());
        
        return deviceResponse;
    }
    
    /**
     * PDF Processing Result class to hold processing data
     */
    private static class PDFProcessingResult {
        String pdfName;
        String originalFileName;
        Long fileSize;
        String documentType;
        Integer rulesGenerated;
        Integer maintenanceItems;
        Integer safetyPrecautions;
        Long processingTime;
    }
    
    /**
     * Send progress update to the callback
     */
    private void sendProgressUpdate(Consumer<UnifiedOnboardingProgress> progressCallback, 
                                  String stage, int progress, String message, String subMessage, 
                                  String error, int currentStep, int totalSteps, String stepName) {
        if (progressCallback != null) {
            try {
                UnifiedOnboardingProgress progressUpdate = UnifiedOnboardingProgress.builder()
                    .stage(stage)
                    .progress(progress)
                    .message(message)
                    .subMessage(subMessage)
                    .error(error)
                    .retryable(error != null && !error.contains("fatal"))
                    .timestamp(LocalDateTime.now())
                    .stepDetails(UnifiedOnboardingProgress.StepDetails.builder()
                        .currentStep(currentStep)
                        .totalSteps(totalSteps)
                        .stepName(stepName)
                        .status(error != null ? "failed" : progress == 100 ? "completed" : "processing")
                        .startTime(System.currentTimeMillis())
                        .build())
                    .build();
                
                progressCallback.accept(progressUpdate);
                log.info("Progress update sent: {} - {}% - {}", stage, progress, message);
            } catch (Exception e) {
                log.error("Failed to send progress update", e);
            }
        }
    }
    
    /**
     * Create device in a separate transactional method
     */
    @Transactional
    private DeviceCreateResponse createDeviceTransactional(
            DeviceCreateWithFileRequest deviceRequest,
            String organizationId,
            String currentUserId
    ) throws IOException {
        return deviceService.createDeviceWithoutFiles(deviceRequest, organizationId, currentUserId);
    }

    /**
     * Process PDF and generate all content (rules, maintenance, safety) with progress tracking
     * 
     * Flow:
     * 1. Upload PDF to PDF Processing Service
     * 2. Generate rules from processed PDF
     * 3. Generate maintenance from processed PDF  
     * 4. Generate safety precautions from processed PDF
     * 5. Store all results in our database
     */
    private PDFProcessingResult processPDFAndGenerateContent(
            String deviceId, 
            MultipartFile manualFile,
            MultipartFile datasheetFile, 
            MultipartFile certificateFile,
            String organizationId,
            DeviceCreateWithFileRequest deviceRequest,
            String currentUserId,
            Consumer<UnifiedOnboardingProgress> progressCallback) throws PDFProcessingException {
        
        log.info("Processing PDF and generating content for device: {}", deviceId);
        
        PDFProcessingResult pdfResult = new PDFProcessingResult();

        try {
            // Use the first available PDF file (manual, datasheet, or certificate)
            MultipartFile pdfFile = manualFile != null ? manualFile : 
                                   datasheetFile != null ? datasheetFile : 
                                   certificateFile;
            
            if (pdfFile == null) {
                String errorMsg = "No PDF file provided for processing";
                log.error(errorMsg);
                sendProgressUpdate(progressCallback, "error", 0, "No PDF file found", 
                                  "Please provide a PDF file for processing", errorMsg, 0, 5, "PDF Upload");
                throw new PDFProcessingException(errorMsg);
            }

            // Step 2.1: Upload PDF to processing service
            log.info("Step 2.1: Uploading PDF to processing service...");
            sendProgressUpdate(progressCallback, "upload", 50, "Uploading PDF to AI processing service", 
                              "Sending document for intelligent analysis", null, 3, 6, "PDF Upload");
            
            PDFUploadResponse uploadResponse = pdfProcessingService.uploadPDF(pdfFile, organizationId);
            pdfResult.pdfName = uploadResponse.getPdfName();
            pdfResult.originalFileName = pdfFile.getOriginalFilename();
            pdfResult.fileSize = pdfFile.getSize();
            pdfResult.documentType = "manual"; // Default, will be updated if other files are provided
            
            log.info("PDF uploaded successfully: {}", pdfResult.pdfName);
            
            // Send progress update for PDF upload completion
            sendProgressUpdate(progressCallback, "upload", 60, "PDF uploaded successfully", 
                              "Document received and queued for processing", null, 3, 6, "PDF Upload");
            
            // Step 1.5: Store PDF metadata in unified PDF system
            try {
                String documentType = manualFile != null ? "manual" : 
                                    datasheetFile != null ? "datasheet" : 
                                    "certificate";
                
                // Create unified PDF entry for device
                UnifiedPDF unifiedPDF = unifiedPDFService.createDevicePDF(
                    deviceId,
                    deviceRequest.getName(),
                    pdfResult.originalFileName,
                    "Device " + documentType, // Title
                    UnifiedPDF.DocumentType.valueOf(documentType.toUpperCase()),
                    pdfResult.fileSize,
                    organizationId,
                    currentUserId
                );
                
                // Update with processing response details
                unifiedPDFService.updateProcessingResponse(
                    unifiedPDF.getId(),
                    pdfResult.pdfName,
                    uploadResponse.getChunksProcessed(),
                    uploadResponse.getProcessingTime(),
                    uploadResponse.getCollectionName()
                );
                
                log.info("✅ Stored PDF metadata in unified system: {} for device: {}", 
                       unifiedPDF.getId(), deviceId);
                
            } catch (Exception e) {
                log.error("❌ Failed to store PDF metadata for device: {} - {}", deviceId, e.getMessage(), e);
                // Continue with processing even if metadata storage fails
            }

            // Step 2.2: Generate rules from processed PDF
            log.info("Step 2.2: Generating rules from processed PDF...");
            sendProgressUpdate(progressCallback, "rules", 70, "Generating intelligent monitoring rules", 
                              "Analyzing device specifications and creating automation rules", null, 4, 6, "Rules Generation");
            
            RulesGenerationResponse rulesResponse = pdfProcessingService.generateRules(pdfResult.pdfName, deviceId, organizationId);
            pdfResult.rulesGenerated = rulesResponse.getRules().size();
            log.info("Rules generated successfully: {} rules created", pdfResult.rulesGenerated);
            
            // Store rules in database
            ruleService.createRulesFromPDF(rulesResponse.getRules(), deviceId, organizationId);
            log.info("✅ Stored {} rules in database for device: {}", pdfResult.rulesGenerated, deviceId);
            
            // Send progress update for rules completion
            sendProgressUpdate(progressCallback, "rules", 80, "Rules generated successfully", 
                              pdfResult.rulesGenerated + " monitoring rules created and configured", null, 4, 6, "Rules Generation");

            // Step 2.3: Generate maintenance schedule from processed PDF
            log.info("Step 2.3: Generating maintenance schedule from processed PDF...");
            sendProgressUpdate(progressCallback, "maintenance", 85, "Creating maintenance schedule", 
                              "Extracting maintenance requirements and creating service plans", null, 5, 6, "Maintenance Schedule");
            
            MaintenanceGenerationResponse maintenanceResponse = pdfProcessingService.generateMaintenance(pdfResult.pdfName, deviceId, organizationId);
            pdfResult.maintenanceItems = maintenanceResponse.getMaintenanceTasks().size();
            log.info("Maintenance schedule generated successfully: {} maintenance items created", 
                    pdfResult.maintenanceItems);
            
            // Store maintenance schedule in database with auto-assignment to device assignee
            // Get device to find the assigned user
            Optional<Device> device = deviceRepository.findById(deviceId);
            String deviceAssignee = device.map(Device::getAssignedUserId).orElse(null);
            
            log.info("🔍 Device lookup for maintenance assignment - Device ID: {}, Assigned User: '{}'", deviceId, deviceAssignee);
            log.info("🔍 Device details from DB - Device exists: {}, Device name: '{}', Device assignedUserId: '{}'", 
                    device.isPresent(), 
                    device.map(Device::getName).orElse("N/A"), 
                    device.map(Device::getAssignedUserId).orElse("N/A"));
            
            // Additional validation - ensure device exists and has assigned user
            if (!device.isPresent()) {
                log.error("❌ CRITICAL: Device not found in database during maintenance assignment! Device ID: {}", deviceId);
                throw new RuntimeException("Device not found during maintenance assignment: " + deviceId);
            }
            
            if (deviceAssignee == null || deviceAssignee.trim().isEmpty()) {
                log.error("❌ CRITICAL: Device has no assigned user! Device ID: {}, Device Name: '{}'", 
                         deviceId, device.get().getName());
                log.error("❌ This means the device was created without proper user assignment!");
            }
            
            if (deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
                log.info("🔧 Auto-assigning {} maintenance tasks to device assignee: {}", maintenanceResponse.getMaintenanceTasks().size(), deviceAssignee);
                storeMaintenanceWithAutoAssignment(maintenanceResponse.getMaintenanceTasks(), deviceId, organizationId, deviceAssignee);
            } else {
                log.warn("⚠️ No device assignee found for device: {}, storing {} maintenance tasks without assignment", deviceId, maintenanceResponse.getMaintenanceTasks().size());
                maintenanceService.createMaintenanceFromPDF(maintenanceResponse.getMaintenanceTasks(), deviceId, organizationId);
            }
            log.info("✅ Stored {} maintenance items in database for device: {}", pdfResult.maintenanceItems, deviceId);
            
            // Send progress update for maintenance completion
            sendProgressUpdate(progressCallback, "maintenance", 90, "Maintenance schedule created", 
                              pdfResult.maintenanceItems + " maintenance tasks scheduled", null, 5, 6, "Maintenance Schedule");

            // Step 2.4: Generate safety precautions from processed PDF
            log.info("Step 2.4: Generating safety precautions from processed PDF...");
            sendProgressUpdate(progressCallback, "safety", 95, "Extracting safety procedures", 
                              "Identifying safety requirements and creating protocols", null, 6, 6, "Safety Procedures");
            
            SafetyGenerationResponse safetyResponse = pdfProcessingService.generateSafety(pdfResult.pdfName, deviceId, organizationId);
            pdfResult.safetyPrecautions = safetyResponse.getSafetyPrecautions().size();
            log.info("Safety precautions generated successfully: {} safety items created", 
                    pdfResult.safetyPrecautions);
            
            // Store safety precautions in database
            safetyService.createSafetyFromPDF(safetyResponse.getSafetyPrecautions(), deviceId, organizationId);
            log.info("✅ Stored {} safety precautions in database for device: {}", pdfResult.safetyPrecautions, deviceId);
            
            // Send progress update for safety completion
            sendProgressUpdate(progressCallback, "safety", 98, "Safety procedures configured", 
                              pdfResult.safetyPrecautions + " safety protocols established", null, 6, 6, "Safety Procedures");

            // Convert processing time string to long if possible, otherwise use current time
            try {
                pdfResult.processingTime = Long.parseLong(uploadResponse.getProcessingTime());
            } catch (NumberFormatException e) {
                pdfResult.processingTime = System.currentTimeMillis();
                log.warn("Could not parse processing time from response, using current time: {}", uploadResponse.getProcessingTime());
            }
            log.info("✅ PDF processing and content generation completed successfully for device: {}", deviceId);
            
        } catch (Exception e) {
            log.error("❌ Error during PDF processing and content generation for device: {}", deviceId, e);
            throw new PDFProcessingException("Failed to process PDF and generate content: " + e.getMessage(), e);
        }
        
        return pdfResult;
    }





    /**
     * Store maintenance items in database with auto-assignment to device assignee.
     * Skips tasks with empty required fields (task, frequency, description, priority, estimated_duration, required_tools, safety_notes).
     * Safety notes are part of maintenance tasks and are stored with them.
     */
    private void storeMaintenanceWithAutoAssignment(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceItems, 
                                                   String deviceId, String organizationId, String deviceAssignee) {
        try {
            List<DeviceMaintenance> maintenanceToSave = new ArrayList<>();
            int processedCount = 0;
            int skippedCount = 0;
            int assignedCount = 0;
            
            for (var maintenanceData : maintenanceItems) {
                String taskTitle = null;
                try {
                    // Get task title - prefer 'task' field over 'task_name' field
                    taskTitle = maintenanceData.getTask() != null && !maintenanceData.getTask().trim().isEmpty() 
                        ? maintenanceData.getTask().trim() 
                        : maintenanceData.getTaskName() != null ? maintenanceData.getTaskName().trim() : null;
                    
                    // STRICT VALIDATION: Check all required fields - skip if any are missing or empty
                    if (taskTitle == null || taskTitle.isEmpty()) {
                        log.warn("Skipping maintenance task - task title is missing or empty");
                        skippedCount++;
                        continue;
                    }
                    
                    if (maintenanceData.getFrequency() == null || maintenanceData.getFrequency().trim().isEmpty()) {
                        log.warn("Skipping maintenance task '{}' - frequency is missing or empty", taskTitle);
                        skippedCount++;
                        continue;
                    }
                    
                    if (maintenanceData.getDescription() == null || maintenanceData.getDescription().trim().isEmpty()) {
                        log.warn("Skipping maintenance task '{}' - description is missing or empty", taskTitle);
                        skippedCount++;
                        continue;
                    }
                    
                    if (maintenanceData.getPriority() == null || maintenanceData.getPriority().trim().isEmpty()) {
                        log.warn("Skipping maintenance task '{}' - priority is missing or empty", taskTitle);
                        skippedCount++;
                        continue;
                    }
                    
                    if (maintenanceData.getEstimatedDuration() == null || maintenanceData.getEstimatedDuration().trim().isEmpty()) {
                        log.warn("Skipping maintenance task '{}' - estimated_duration is missing or empty", taskTitle);
                        skippedCount++;
                        continue;
                    }
                    
                    if (maintenanceData.getRequiredTools() == null || maintenanceData.getRequiredTools().trim().isEmpty()) {
                        log.warn("Skipping maintenance task '{}' - required_tools is missing or empty", taskTitle);
                        skippedCount++;
                        continue;
                    }
                    
                    if (maintenanceData.getSafetyNotes() == null || maintenanceData.getSafetyNotes().trim().isEmpty()) {
                        log.warn("Skipping maintenance task '{}' - safety_notes is missing or empty", taskTitle);
                        skippedCount++;
                        continue;
                    }
                    
                    // Check if maintenance task already exists for this device (deviceId + taskName)
                    Optional<DeviceMaintenance> existingMaintenance = maintenanceRepository
                        .findByDeviceIdAndTaskNameAndOrganizationId(deviceId, taskTitle, organizationId);
                    if (existingMaintenance.isPresent()) {
                        log.info("⚠️ Maintenance task '{}' already exists for device: {}, skipping", taskTitle, deviceId);
                        skippedCount++;
                        continue;
                    }
                    
                    // All required fields are present, create maintenance task
                    DeviceMaintenance maintenance = new DeviceMaintenance();
                    maintenance.setId(UUID.randomUUID().toString());
                    maintenance.setOrganizationId(organizationId);
                    
                    // Set required fields with actual values (no defaults)
                    maintenance.setTaskName(taskTitle);
                    maintenance.setComponentName(taskTitle != null && !taskTitle.trim().isEmpty() ? taskTitle.trim() : "General");
                    maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                    
                    log.debug("Set componentName to: '{}' for task: '{}'", maintenance.getComponentName(), taskTitle);
                    log.debug("Set maintenanceType to: '{}' for task: '{}'", maintenance.getMaintenanceType(), taskTitle);
                    
                    // Set device information (required for foreign key constraint)
                    setDeviceInformation(maintenance, deviceId);
                    
                    // Set validated fields with actual values
                    maintenance.setFrequency(maintenanceData.getFrequency().trim());
                    maintenance.setDescription(maintenanceData.getDescription().trim());
                    maintenance.setPriority(processPriorityStrict(maintenanceData.getPriority().trim()));
                    maintenance.setEstimatedDuration(maintenanceData.getEstimatedDuration().trim());
                    maintenance.setRequiredTools(maintenanceData.getRequiredTools().trim());
                    
                    // Store safety notes as part of maintenance task
                    maintenance.setSafetyNotes(maintenanceData.getSafetyNotes().trim());
                    
                    // Set category if available
                    if (maintenanceData.getCategory() != null && !maintenanceData.getCategory().trim().isEmpty()) {
                        maintenance.setCategory(maintenanceData.getCategory().trim());
                    }
                    
                    // Auto-assign to device assignee
                    if (deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
                        maintenance.setAssignedTo(deviceAssignee);
                        assignedCount++;
                        log.info("✅ Maintenance task '{}' assigned to user: {}", taskTitle, deviceAssignee);
                    } else {
                        log.warn("⚠️ Maintenance task '{}' not assigned - no device assignee found", taskTitle);
                    }
                    
                    // Set dates
                    formatAndCalculateMaintenanceDates(maintenance, maintenanceData);
                    
                    // Final validation - ensure maintenance type is set
                    if (maintenance.getMaintenanceType() == null) {
                        log.warn("Maintenance type is null for task: {}, setting to GENERAL", taskTitle);
                        maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                    }
                    
                    // Double-check maintenance type before saving
                    if (maintenance.getMaintenanceType() == null) {
                        log.error("CRITICAL: Maintenance type is still null for task: {} after setting to GENERAL", taskTitle);
                        maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                    }
                    
                    log.info("Final maintenance type before save: {} for task: {}", maintenance.getMaintenanceType(), taskTitle);
                    
                    // Save to database
                    maintenanceRepository.save(maintenance);
                    maintenanceToSave.add(maintenance);
                    processedCount++;
                    
                    // Assign task to Jira if user is assigned
                    if (deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
                        try {
                            // Get user email for Jira assignment
                            Optional<User> user = userRepository.findById(deviceAssignee);
                            if (user.isPresent() && user.get().getEmail() != null) {
                                // Get device name for context
                                Optional<Device> device = deviceRepository.findById(deviceId);
                                String deviceName = device.isPresent() ? device.get().getName() : "Unknown Device";
                                
                                // Assign task to Jira
                                jiraTaskAssignmentService.assignMaintenanceTask(
                                    taskTitle,
                                    maintenance.getDescription(),
                                    user.get().getEmail(),
                                    deviceName
                                );
                                
                                log.info("🎯 Jira task assigned for maintenance: {} to user: {}", taskTitle, user.get().getEmail());
                            } else {
                                log.warn("⚠️ Cannot assign Jira task - user not found or email missing for user ID: {}", deviceAssignee);
                            }
                        } catch (Exception e) {
                            log.error("❌ Failed to assign Jira task for maintenance: {} - {}", taskTitle, e.getMessage());
                            // Don't fail the entire process if Jira assignment fails
                        }
                    }
                    
                    log.debug("✅ Created maintenance task: {} for device: {}", taskTitle, deviceId);
                    
                } catch (Exception e) {
                    log.error("❌ Failed to create maintenance task: {} for device: {} - {}", 
                             taskTitle, deviceId, e.getMessage(), e);
                    skippedCount++;
                }
            }
            
            log.info("✅ Maintenance tasks processing completed for device: {} - Processed: {}, Skipped: {}, Assigned: {}", 
                     deviceId, processedCount, skippedCount, assignedCount);
            
            // Send notification to assigned user about new maintenance tasks
            if (assignedCount > 0 && deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
                try {
                    Optional<Device> device = deviceRepository.findById(deviceId);
                    String deviceName = device.map(Device::getName).orElse("Unknown Device");
                    
                    Notification notification = new Notification();
                    notification.setUserId(deviceAssignee);
                    notification.setTitle("New Maintenance Tasks Assigned");
                    notification.setMessage(String.format(
                        "You have been assigned %d new maintenance task%s for device '%s' during onboarding. " +
                        "Please review and schedule these tasks accordingly.",
                        assignedCount, assignedCount > 1 ? "s" : "", deviceName
                    ));
                    notification.setCategory(Notification.NotificationCategory.MAINTENANCE_ASSIGNMENT);
                    notification.setOrganizationId(organizationId);
                    notification.setDeviceId(deviceId);
                    notification.setRead(false);
                    
                    Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(deviceAssignee, notification);
                    if (createdNotification.isPresent()) {
                        log.info("✅ Created maintenance assignment notification for user: {} for {} tasks on device: {}", 
                               deviceAssignee, assignedCount, deviceName);
                    } else {
                        log.info("⚠️ Maintenance assignment notification blocked by user preferences for user: {}", deviceAssignee);
                    }
                } catch (Exception e) {
                    log.error("❌ Failed to create maintenance assignment notification for user: {} device: {}", 
                             deviceAssignee, deviceId, e);
                    // Don't fail the entire process if notification fails
                }
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to store maintenance tasks for device: {} - {}", deviceId, e.getMessage(), e);
            throw new RuntimeException("Failed to store maintenance tasks: " + e.getMessage(), e);
        }
    }





    /**
     * Extract PDF filename from file path with improved handling
     */
    private String extractPdfFilename(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        
        try {
            // Handle different path separators
            String normalizedPath = filePath.replace('\\', '/');
            
            // Extract filename from path
            String filename = normalizedPath.substring(normalizedPath.lastIndexOf('/') + 1);
            
            // Remove file extension if present
            if (filename.contains(".")) {
                filename = filename.substring(0, filename.lastIndexOf('.'));
            }
            
            // Validate filename
            if (filename.trim().isEmpty()) {
                log.warn("Extracted filename is empty from path: {}", filePath);
                return null;
            }
            
            log.debug("Extracted PDF filename: {} from path: {}", filename, filePath);
            return filename;
            
        } catch (Exception e) {
            log.error("Error extracting PDF filename from path: {}", filePath, e);
            return null;
        }
    }

    /**
     * Format dates properly and calculate next maintenance date based on frequency
     */
    private void formatAndCalculateMaintenanceDates(DeviceMaintenance maintenance, MaintenanceGenerationResponse.MaintenanceTask maintenanceData) {
        try {
            // Since MaintenanceTask doesn't have last_maintenance field, we'll use today as the last maintenance date
            LocalDate lastMaintenance = LocalDate.now();
            maintenance.setLastMaintenance(lastMaintenance);
            
            // Calculate next maintenance date based on frequency
            LocalDate nextMaintenance = calculateNextMaintenanceDate(lastMaintenance, maintenance.getFrequency());
            maintenance.setNextMaintenance(nextMaintenance);
            
            log.debug("Calculated maintenance dates for task '{}': last={}, next={}, frequency={}", 
                maintenance.getTaskName(), lastMaintenance, nextMaintenance, maintenance.getFrequency());
            
        } catch (Exception e) {
            log.error("Error formatting maintenance dates for task: {}", maintenance.getTaskName(), e);
            // Set default dates if parsing fails
            LocalDate today = LocalDate.now();
            maintenance.setLastMaintenance(today);
            maintenance.setNextMaintenance(today.plusDays(1)); // Default to daily
        }
    }

    /**
     * Calculate next maintenance date based on frequency
     */
    private LocalDate calculateNextMaintenanceDate(LocalDate lastMaintenance, String frequency) {
        if (frequency == null || frequency.isEmpty()) {
            return lastMaintenance.plusDays(1); // Default to daily
        }
        
        String lowerFrequency = frequency.toLowerCase();
        
        // Parse frequency patterns
        if (lowerFrequency.contains("daily") || lowerFrequency.contains("every day")) {
            return lastMaintenance.plusDays(1);
        } else if (lowerFrequency.contains("weekly") || lowerFrequency.contains("every week")) {
            return lastMaintenance.plusWeeks(1);
        } else if (lowerFrequency.contains("monthly") || lowerFrequency.contains("every month")) {
            return lastMaintenance.plusMonths(1);
        } else if (lowerFrequency.contains("quarterly") || lowerFrequency.contains("every 3 months")) {
            return lastMaintenance.plusMonths(3);
        } else if (lowerFrequency.contains("semi-annual") || lowerFrequency.contains("every 6 months")) {
            return lastMaintenance.plusMonths(6);
        } else if (lowerFrequency.contains("annual") || lowerFrequency.contains("yearly") || lowerFrequency.contains("every year")) {
            return lastMaintenance.plusYears(1);
        } else if (lowerFrequency.contains("bi-annual") || lowerFrequency.contains("every 2 years")) {
            return lastMaintenance.plusYears(2);
        }
        
        // Try to extract numeric values from frequency string
        Pattern pattern = Pattern.compile("(\\d+)\\s*(day|week|month|year)s?", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(lowerFrequency);
        
        if (matcher.find()) {
            int number = Integer.parseInt(matcher.group(1));
            String unit = matcher.group(2).toLowerCase();
            
            switch (unit) {
                case "day":
                    return lastMaintenance.plusDays(number);
                case "week":
                    return lastMaintenance.plusWeeks(number);
                case "month":
                    return lastMaintenance.plusMonths(number);
                case "year":
                    return lastMaintenance.plusYears(number);
            }
        }
        
        // Default fallback
        return lastMaintenance.plusDays(1);
    }

    /**
     * Process frequency with default value "daily".
     * Handles numeric string values and converts them to descriptive frequency strings.
     */
    private String processFrequencyWithDefault(String frequency) {
        if (frequency == null || frequency.trim().isEmpty()) {
            log.debug("Frequency not provided, defaulting to 'daily'");
            return "daily";
        }
        String freq = frequency.trim();
        if (freq.isEmpty()) {
            log.debug("Frequency is empty, defaulting to 'daily'");
            return "daily";
        }
        
        // First, try to parse as numeric string (new format)
        try {
            int numericFreq = Integer.parseInt(freq);
            String descriptiveFreq = convertNumericFrequencyToDescriptive(numericFreq);
            log.debug("Converted numeric frequency {} to descriptive: {}", numericFreq, descriptiveFreq);
            return descriptiveFreq;
        } catch (NumberFormatException e) {
            // If not numeric, process as text (legacy format)
            log.debug("Frequency is not numeric, processing as text: {}", freq);
        }
        
        // Normalize common frequency values (legacy text format)
        String normalizedFreq = freq.toLowerCase();
        if (normalizedFreq.contains("daily") || normalizedFreq.contains("every day")) {
            return "daily";
        } else if (normalizedFreq.contains("weekly") || normalizedFreq.contains("every week")) {
            return "weekly";
        } else if (normalizedFreq.contains("monthly") || normalizedFreq.contains("every month")) {
            return "monthly";
        } else if (normalizedFreq.contains("quarterly") || normalizedFreq.contains("every 3 months")) {
            return "quarterly";
        } else if (normalizedFreq.contains("semi-annual") || normalizedFreq.contains("every 6 months")) {
            return "semi-annual";
        } else if (normalizedFreq.contains("annual") || normalizedFreq.contains("yearly") || normalizedFreq.contains("every year")) {
            return "annual";
        } else if (normalizedFreq.contains("bi-annual") || normalizedFreq.contains("every 2 years")) {
            return "bi-annual";
        }
        
        // Return original value if not recognized
        log.debug("Using original frequency value: {}", freq);
        return freq;
    }

    /**
     * Convert numeric frequency values to descriptive frequency strings.
     */
    private String convertNumericFrequencyToDescriptive(int numericFreq) {
        switch (numericFreq) {
            case 1:
                return "daily";
            case 7:
                return "weekly";
            case 30:
                return "monthly";
            case 90:
                return "quarterly";
            case 180:
                return "semi-annual";
            case 365:
                return "annual";
            default:
                log.warn("Unknown numeric frequency: {}, defaulting to daily", numericFreq);
                return "daily";
        }
    }

    /**
     * Process description with default value.
     */
    private String processDescriptionWithDefault(String description) {
        if (description == null || description.trim().isEmpty()) {
            return "Maintenance task for device component";
        }
        String desc = description.trim();
        return desc.isEmpty() ? "Maintenance task for device component" : desc;
    }

    /**
     * Process priority with default value MEDIUM.
     */
    private DeviceMaintenance.Priority processPriorityWithDefault(String priority) {
        if (priority == null || priority.trim().isEmpty()) {
            return DeviceMaintenance.Priority.MEDIUM;
        }
        String prio = priority.trim().toUpperCase();
        
        try {
            return DeviceMaintenance.Priority.valueOf(prio);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid priority value: {}, defaulting to MEDIUM", prio);
            return DeviceMaintenance.Priority.MEDIUM;
        }
    }

    /**
     * Process priority with strict validation.
     */
    private DeviceMaintenance.Priority processPriorityStrict(String priority) {
        if (priority == null || priority.trim().isEmpty()) {
            log.warn("Priority is missing or empty, defaulting to MEDIUM");
            return DeviceMaintenance.Priority.MEDIUM;
        }
        String prio = priority.trim().toUpperCase();
        
        try {
            return DeviceMaintenance.Priority.valueOf(prio);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid priority value: {}, defaulting to MEDIUM", prio);
            return DeviceMaintenance.Priority.MEDIUM;
        }
    }

    /**
     * Process estimated duration with default value.
     */
    private String processDurationWithDefault(String duration) {
        if (duration == null || duration.trim().isEmpty()) {
            return "1 hour";
        }
        String dur = duration.trim();
        return dur.isEmpty() ? "1 hour" : dur;
    }

    /**
     * Process required tools with default value.
     */
    private String processToolsWithDefault(String tools) {
        if (tools == null || tools.trim().isEmpty()) {
            return "Standard maintenance tools";
        }
        String toolsStr = tools.trim();
        return toolsStr.isEmpty() ? "Standard maintenance tools" : toolsStr;
    }

    /**
     * Process safety notes with default value.
     */
    private String processSafetyNotesWithDefault(String safetyNotes) {
        if (safetyNotes == null || safetyNotes.trim().isEmpty()) {
            return "Follow standard safety procedures";
        }
        String notes = safetyNotes.trim();
        return notes.isEmpty() ? "Follow standard safety procedures" : notes;
    }

    /**
     * Process category with default value.
     */
    private String processCategoryWithDefault(String category) {
        if (category == null || category.trim().isEmpty()) {
            return "General";
        }
        String cat = category.trim();
        return cat.isEmpty() ? "General" : cat;
    }



    /**
     * Process safety type with default value.
     */
    private String processSafetyTypeWithDefault(String type) {
        if (type == null || type.trim().isEmpty()) {
            return "warning";
        }
        String typeStr = type.trim().toLowerCase();
        
        switch (typeStr) {
            case "warning":
            case "procedure":
            case "caution":
            case "note":
                return typeStr;
            default:
                log.warn("Unknown safety type: {}, defaulting to warning", typeStr);
                return "warning";
        }
    }

    /**
     * Process safety category with default value.
     */
    private String processSafetyCategoryWithDefault(String category) {
        if (category == null || category.trim().isEmpty()) {
            return "general";
        }
        String cat = category.trim().toLowerCase();
        return cat.isEmpty() ? "general" : cat;
    }

    /**
     * Process safety severity with default value.
     */
    private String processSafetySeverityWithDefault(String severity) {
        if (severity == null || severity.trim().isEmpty()) {
            return "MEDIUM";
        }
        String sev = severity.trim().toUpperCase();
        
        // Validate severity values
        switch (sev) {
            case "LOW":
            case "MEDIUM":
            case "HIGH":
            case "CRITICAL":
                return sev;
            default:
                log.warn("Invalid severity value: {}, defaulting to MEDIUM", sev);
                return "MEDIUM";
        }
    }

    /**
     * Process string with default value.
     */
    private String processStringWithDefault(String value, String defaultValue) {
        if (value == null || value.trim().isEmpty()) {
            return defaultValue;
        }
        String str = value.trim();
        return str.isEmpty() ? defaultValue : str;
    }

    /**
     * Sets the device ID and name for a maintenance item.
     */
    private void setDeviceInformation(DeviceMaintenance maintenance, String deviceId) {
        // Set device information (required for foreign key constraint)
        maintenance.setDeviceId(deviceId);
        
        // Get device name for reference
        try {
            Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
            if (deviceOpt.isPresent()) {
                maintenance.setDeviceName(deviceOpt.get().getName());
            } else {
                log.warn("Device not found for ID: {}, using device ID as name", deviceId);
                maintenance.setDeviceName("Device-" + deviceId);
            }
        } catch (Exception e) {
            log.warn("Failed to get device name for ID: {}, using device ID as name", deviceId, e);
            maintenance.setDeviceName("Device-" + deviceId);
        }
    }
}
