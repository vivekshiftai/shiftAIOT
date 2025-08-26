package com.iotplatform.service;

import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.MaintenanceGenerationResponse;
import com.iotplatform.dto.RulesGenerationResponse;
import com.iotplatform.dto.SafetyGenerationResponse;
import com.iotplatform.dto.PDFUploadResponse;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.model.*;
import com.iotplatform.repository.*;
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
    private final ObjectMapper objectMapper;

    /**
     * Complete unified onboarding workflow
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
            String currentUserId
    ) throws IOException, PDFProcessingException {
        
        log.info("Starting unified onboarding workflow for device: {}", deviceRequest.getName());
        
        // Step 1: Create device (without storing PDF files in our DB) - This is transactional
        log.info("Step 1: Creating device without storing PDF files...");
        DeviceCreateResponse deviceResponse = createDeviceTransactional(deviceRequest, organizationId, currentUserId);
        
        log.info("Device created successfully with ID: {}", deviceResponse.getId());
        
        // Step 2: Upload PDF to PDF Processing Service and process - This is non-transactional
        log.info("Step 2: Uploading PDF to processing service and generating content...");
        try {
            processPDFAndGenerateContent(deviceResponse.getId(), manualFile, datasheetFile, certificateFile, organizationId);
        } catch (Exception e) {
            log.error("PDF processing failed for device: {}, but device creation succeeded", deviceResponse.getId(), e);
            // Don't fail the entire onboarding if PDF processing fails
        }
        
        log.info("Unified onboarding workflow completed successfully for device: {}", deviceResponse.getId());
        
        return deviceResponse;
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
     * Process PDF and generate all content (rules, maintenance, safety)
     * 
     * Flow:
     * 1. Upload PDF to PDF Processing Service
     * 2. Generate rules from processed PDF
     * 3. Generate maintenance from processed PDF  
     * 4. Generate safety precautions from processed PDF
     * 5. Store all results in our database
     */
    private void processPDFAndGenerateContent(
            String deviceId, 
            MultipartFile manualFile,
            MultipartFile datasheetFile, 
            MultipartFile certificateFile,
            String organizationId) throws PDFProcessingException {
        
        log.info("Processing PDF and generating content for device: {}", deviceId);
        
        try {
            // Use the first available PDF file (manual, datasheet, or certificate)
            MultipartFile pdfFile = manualFile != null ? manualFile : 
                                   datasheetFile != null ? datasheetFile : 
                                   certificateFile;
            
            if (pdfFile == null) {
                log.warn("No PDF file provided for device: {}, skipping content generation", deviceId);
                return;
            }
            
            log.info("Uploading PDF to processing service: {}", pdfFile.getOriginalFilename());
            
            // Step 1: Upload PDF to PDF Processing Service
            PDFUploadResponse uploadResponse = pdfProcessingService.uploadPDF(pdfFile, organizationId);
            
            if (!uploadResponse.isSuccess()) {
                log.error("PDF upload failed for device: {} - {}", deviceId, uploadResponse.getMessage());
                return;
            }
            
            String pdfName = uploadResponse.getPdfName();
            log.info("PDF uploaded successfully: {}", pdfName);
            
            // Step 2: Generate rules from processed PDF
            log.info("Generating rules from PDF: {}", pdfName);
            RulesGenerationResponse rulesResponse = pdfProcessingService.generateRules(pdfName, deviceId, organizationId);
            
            if (rulesResponse.isSuccess() && rulesResponse.getRules() != null && !rulesResponse.getRules().isEmpty()) {
                log.info("Successfully generated and stored {} rules for device: {}", rulesResponse.getRules().size(), deviceId);
            } else {
                log.warn("No rules generated for device: {}", deviceId);
            }
            
            // Step 3: Generate maintenance from processed PDF
            log.info("Generating maintenance from PDF: {}", pdfName);
            MaintenanceGenerationResponse maintenanceResponse = pdfProcessingService.generateMaintenance(pdfName, deviceId, organizationId);
            
            if (maintenanceResponse.isSuccess() && maintenanceResponse.getMaintenanceTasks() != null && !maintenanceResponse.getMaintenanceTasks().isEmpty()) {
                log.info("Successfully generated and stored {} maintenance items for device: {}", maintenanceResponse.getMaintenanceTasks().size(), deviceId);
            } else {
                log.warn("No maintenance items generated for device: {}", deviceId);
            }
            
            // Step 4: Generate safety precautions from processed PDF
            log.info("Generating safety precautions from PDF: {}", pdfName);
            SafetyGenerationResponse safetyResponse = pdfProcessingService.generateSafety(pdfName, deviceId, organizationId);
            
            if (safetyResponse.isSuccess() && safetyResponse.getSafetyPrecautions() != null && !safetyResponse.getSafetyPrecautions().isEmpty()) {
                log.info("Successfully generated and stored {} safety precautions for device: {}", safetyResponse.getSafetyPrecautions().size(), deviceId);
            } else {
                log.warn("No safety precautions generated for device: {}", deviceId);
            }
            
            log.info("PDF processing and content generation completed for device: {}", deviceId);
            
        } catch (Exception e) {
            log.error("Error processing PDF and generating content for device: {}", deviceId, e);
            // Don't throw exception to allow device creation to succeed
            log.warn("PDF processing failed, but device creation succeeded");
        }
    }

    /**
     * Store rules in database
     */
    private void storeRules(List<RulesGenerationResponse.Rule> rules, String deviceId, String organizationId) {
        try {
            List<Rule> rulesToSave = new ArrayList<>();
            
            for (var ruleData : rules) {
                Rule rule = new Rule();
                rule.setId(UUID.randomUUID().toString());
                rule.setName(ruleData.getName());
                rule.setDescription(ruleData.getDescription());
                rule.setMetric(ruleData.getMetric());
                rule.setMetricValue(ruleData.getMetricValue());
                rule.setThreshold(ruleData.getThreshold());
                rule.setConsequence(ruleData.getConsequence());
                rule.setActive(true);
                rule.setDeviceId(deviceId);
                rule.setOrganizationId(organizationId);
                rule.setCreatedAt(LocalDateTime.now());
                rule.setUpdatedAt(LocalDateTime.now());
                
                rulesToSave.add(rule);
            }
            
            ruleRepository.saveAll(rulesToSave);
            log.info("Successfully stored {} rules for device: {}", rulesToSave.size(), deviceId);
            
        } catch (Exception e) {
            log.error("Error storing rules for device: {}", deviceId, e);
        }
    }

    /**
     * Store maintenance items in database with validation and default values.
     * Skips tasks without task_name and uses default values for missing fields.
     */
    private void storeMaintenance(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceItems, String deviceId, String organizationId) {
        try {
            List<DeviceMaintenance> maintenanceToSave = new ArrayList<>();
            int processedCount = 0;
            int skippedCount = 0;
            
            for (var maintenanceData : maintenanceItems) {
                try {
                    // Validate required fields - skip if task_name is missing
                    if (maintenanceData.getTaskName() == null || maintenanceData.getTaskName().trim().isEmpty()) {
                        log.warn("Skipping maintenance task - task_name is missing or empty");
                        skippedCount++;
                        continue;
                    }
                    
                    DeviceMaintenance maintenance = new DeviceMaintenance();
                    maintenance.setId(UUID.randomUUID().toString());
                    maintenance.setOrganizationId(organizationId);
                    
                    // Set required fields with validation
                    maintenance.setTaskName(maintenanceData.getTaskName().trim());
                    maintenance.setComponentName(maintenanceData.getTaskName().trim());
                    maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                    
                    // Process optional fields with default values
                    maintenance.setFrequency(processFrequencyWithDefault(maintenanceData.getFrequency()));
                    maintenance.setDescription(processDescriptionWithDefault(maintenanceData.getDescription()));
                    maintenance.setPriority(processPriorityWithDefault(maintenanceData.getPriority()));
                    maintenance.setEstimatedDuration(processDurationWithDefault(maintenanceData.getEstimatedDuration()));
                    maintenance.setRequiredTools(processToolsWithDefault(maintenanceData.getRequiredTools()));
                    maintenance.setSafetyNotes(processSafetyNotesWithDefault(maintenanceData.getSafetyNotes()));
                    maintenance.setComponentName(processCategoryWithDefault(maintenanceData.getCategory()));
                    
                    // Set dates
                    maintenance.setLastMaintenance(LocalDate.now());
                    maintenance.setNextMaintenance(calculateNextMaintenanceDate(LocalDate.now(), maintenance.getFrequency()));
                    maintenance.setStatus(DeviceMaintenance.Status.PENDING);
                    maintenance.setCreatedAt(LocalDateTime.now());
                    maintenance.setUpdatedAt(LocalDateTime.now());
                    
                    maintenanceToSave.add(maintenance);
                    processedCount++;
                    
                    log.debug("Processed maintenance task: {} with frequency: {}", 
                        maintenance.getTaskName(), maintenance.getFrequency());
                        
                } catch (Exception e) {
                    log.error("Failed to process maintenance task: {}", 
                        maintenanceData.getTaskName() != null ? maintenanceData.getTaskName() : "Unknown", e);
                    skippedCount++;
                    // Continue with next task instead of failing completely
                }
            }
            
            if (!maintenanceToSave.isEmpty()) {
                maintenanceRepository.saveAll(maintenanceToSave);
                log.info("Successfully stored {} maintenance items for device: {} (skipped: {})", 
                    processedCount, deviceId, skippedCount);
            } else {
                log.warn("No valid maintenance items to store for device: {} (all {} items were skipped)", 
                    deviceId, maintenanceItems.size());
            }
            
        } catch (Exception e) {
            log.error("Error storing maintenance for device: {}", deviceId, e);
        }
    }

    /**
     * Store safety precautions in database
     */
    private void storeSafetyPrecautions(List<SafetyGenerationResponse.SafetyPrecaution> safetyPrecautions, String deviceId, String organizationId) {
        try {
            log.info("Starting to store {} safety precautions for device: {} in organization: {}", safetyPrecautions.size(), deviceId, organizationId);
            List<DeviceSafetyPrecaution> safetyToSave = new ArrayList<>();
            
            for (var safetyData : safetyPrecautions) {
                DeviceSafetyPrecaution safety = new DeviceSafetyPrecaution();
                safety.setId(UUID.randomUUID().toString());
                safety.setDeviceId(deviceId);
                safety.setOrganizationId(organizationId);
                safety.setTitle(safetyData.getTitle());
                safety.setDescription(safetyData.getDescription());
                safety.setSeverity(safetyData.getSeverity());
                safety.setCategory(safetyData.getCategory());
                safety.setType("PDF_GENERATED"); // Set required type field
                safety.setRecommendedAction(safetyData.getMitigation());
                safety.setIsActive(true);
                safety.setCreatedAt(LocalDateTime.now());
                safety.setUpdatedAt(LocalDateTime.now());
                
                log.debug("Created safety precaution: ID={}, Title={}, Type={}, Category={}", 
                    safety.getId(), safety.getTitle(), safety.getType(), safety.getCategory());
                
                // Verify all required fields are set
                if (safety.getId() == null || safety.getId().trim().isEmpty()) {
                    log.error("Safety precaution ID is null or empty");
                    throw new IllegalStateException("Safety precaution ID is required");
                }
                if (safety.getType() == null || safety.getType().trim().isEmpty()) {
                    log.error("Safety precaution Type is null or empty");
                    throw new IllegalStateException("Safety precaution Type is required");
                }
                if (safety.getCategory() == null || safety.getCategory().trim().isEmpty()) {
                    log.error("Safety precaution Category is null or empty");
                    throw new IllegalStateException("Safety precaution Category is required");
                }
                
                safetyToSave.add(safety);
            }
            
            // Save safety precautions one by one to avoid batch operation issues
            for (DeviceSafetyPrecaution safety : safetyToSave) {
                try {
                    safetyRepository.save(safety);
                    log.debug("Successfully saved safety precaution: {}", safety.getId());
                } catch (Exception e) {
                    log.error("Failed to save safety precaution {}: {}", safety.getId(), e.getMessage());
                    throw e; // Re-throw to stop the process
                }
            }
            log.info("Successfully stored {} safety precautions for device: {}", safetyToSave.size(), deviceId);
            
        } catch (Exception e) {
            log.error("Error storing safety precautions for device: {} - Error: {}", deviceId, e.getMessage(), e);
            // Don't re-throw to avoid transaction rollback issues
            log.warn("Safety precautions storage failed, but continuing with device creation");
        }
    }

    /**
     * Process and store rules for the device (DEPRECATED - use processPDFAndGenerateContent instead)
     */
    private void processAndStoreRules(String deviceId, String organizationId) throws PDFProcessingException {
        try {
            // Get device to find associated PDF
            Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
            if (deviceOpt.isEmpty()) {
                log.warn("Device not found for rule processing: {}", deviceId);
                return;
            }
            
            Device device = deviceOpt.get();
            
            // Note: Manual URL field removed from simplified schema
            // PDF processing is now handled through the device documentation system
            log.info("PDF processing for device {} is now handled through the device documentation system", deviceId);
            return;
            
        } catch (Exception e) {
            log.error("Error processing rules for device: {}", deviceId, e);
            // Don't throw exception to allow other steps to continue
            log.warn("Rule processing failed, continuing with other steps");
        }
    }

    /**
     * Process and store maintenance schedule with proper date formatting and frequency calculation
     */
    private void processAndStoreMaintenance(String deviceId, String organizationId) throws PDFProcessingException {
        try {
            // Get device to find associated PDF
            Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
            if (deviceOpt.isEmpty()) {
                log.warn("Device not found for maintenance processing: {}", deviceId);
                return;
            }
            
            Device device = deviceOpt.get();
            
            // Note: Manual URL field removed from simplified schema
            // PDF processing is now handled through the device documentation system
            log.info("Maintenance generation for device {} is now handled through the device documentation system", deviceId);
            return;
            
        } catch (Exception e) {
            log.error("Error processing maintenance for device: {}", deviceId, e);
            // Don't throw exception to allow other steps to continue
            log.warn("Maintenance processing failed, continuing with other steps");
        }
    }

    /**
     * Process and store safety precautions
     */
    private void processAndStoreSafety(String deviceId, String organizationId) throws PDFProcessingException {
        try {
            // Get device to find associated PDF
            Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
            if (deviceOpt.isEmpty()) {
                log.warn("Device not found for safety processing: {}", deviceId);
                return;
            }
            
            Device device = deviceOpt.get();
            
            // Note: Manual URL field removed from simplified schema
            // PDF processing is now handled through the device documentation system
            log.info("Safety generation for device {} is now handled through the device documentation system", deviceId);
            return;
            
        } catch (Exception e) {
            log.error("Error processing safety precautions for device: {}", deviceId, e);
            // Don't throw exception to allow other steps to continue
            log.warn("Safety processing failed, continuing with other steps");
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
}
