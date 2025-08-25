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
@Slf4j
@Service
@RequiredArgsConstructor
public class UnifiedOnboardingService {

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
    @Transactional
    public DeviceCreateResponse completeUnifiedOnboarding(
            DeviceCreateWithFileRequest deviceRequest,
            MultipartFile manualFile,
            MultipartFile datasheetFile,
            MultipartFile certificateFile,
            String organizationId
    ) throws IOException, PDFProcessingException {
        
        log.info("Starting unified onboarding workflow for device: {}", deviceRequest.getName());
        
        try {
            // Step 1: Create device (without storing PDF files in our DB)
            log.info("Step 1: Creating device without storing PDF files...");
            DeviceCreateResponse deviceResponse = deviceService.createDeviceWithoutFiles(
                deviceRequest, organizationId
            );
            
            log.info("Device created successfully with ID: {}", deviceResponse.getId());
            
            // Step 2: Upload PDF to PDF Processing Service and process
            log.info("Step 2: Uploading PDF to processing service and generating content...");
            processPDFAndGenerateContent(deviceResponse.getId(), manualFile, datasheetFile, certificateFile, organizationId);
            
            log.info("Unified onboarding workflow completed successfully for device: {}", deviceResponse.getId());
            
            return deviceResponse;
            
        } catch (Exception e) {
            log.error("Unified onboarding workflow failed for device: {}", deviceRequest.getName(), e);
            throw new PDFProcessingException("Unified onboarding failed: " + e.getMessage(), e);
        }
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
            
            String pdfName = uploadResponse.getFilename();
            log.info("PDF uploaded successfully: {}", pdfName);
            
            // Step 2: Generate rules from processed PDF
            log.info("Generating rules from PDF: {}", pdfName);
            RulesGenerationResponse rulesResponse = pdfProcessingService.generateRules(pdfName, deviceId, organizationId);
            
            if (rulesResponse.isSuccess() && rulesResponse.getRules() != null && !rulesResponse.getRules().isEmpty()) {
                storeRules(rulesResponse.getRules(), deviceId, organizationId);
                log.info("Successfully generated and stored {} rules for device: {}", rulesResponse.getRules().size(), deviceId);
            } else {
                log.warn("No rules generated for device: {}", deviceId);
            }
            
            // Step 3: Generate maintenance from processed PDF
            log.info("Generating maintenance from PDF: {}", pdfName);
            MaintenanceGenerationResponse maintenanceResponse = pdfProcessingService.generateMaintenance(pdfName, deviceId, organizationId);
            
            if (maintenanceResponse.isSuccess() && maintenanceResponse.getMaintenanceTasks() != null && !maintenanceResponse.getMaintenanceTasks().isEmpty()) {
                storeMaintenance(maintenanceResponse.getMaintenanceTasks(), deviceId, organizationId);
                log.info("Successfully generated and stored {} maintenance items for device: {}", maintenanceResponse.getMaintenanceTasks().size(), deviceId);
            } else {
                log.warn("No maintenance items generated for device: {}", deviceId);
            }
            
            // Step 4: Generate safety precautions from processed PDF
            log.info("Generating safety precautions from PDF: {}", pdfName);
            SafetyGenerationResponse safetyResponse = pdfProcessingService.generateSafety(pdfName, deviceId, organizationId);
            
            if (safetyResponse.isSuccess() && safetyResponse.getSafetyPrecautions() != null && !safetyResponse.getSafetyPrecautions().isEmpty()) {
                storeSafetyPrecautions(safetyResponse.getSafetyPrecautions(), deviceId, organizationId);
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
     * Store maintenance items in database
     */
    private void storeMaintenance(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceItems, String deviceId, String organizationId) {
        try {
            List<DeviceMaintenance> maintenanceToSave = new ArrayList<>();
            
            for (var maintenanceData : maintenanceItems) {
                DeviceMaintenance maintenance = new DeviceMaintenance();
                maintenance.setId(UUID.randomUUID().toString());
                maintenance.setDeviceId(deviceId);
                maintenance.setOrganizationId(organizationId);
                maintenance.setComponentName(maintenanceData.getTaskName());
                maintenance.setMaintenanceType("GENERAL");
                maintenance.setFrequency(maintenanceData.getFrequency());
                maintenance.setDescription(maintenanceData.getDescription());
                maintenance.setLastMaintenance(LocalDate.now());
                maintenance.setNextMaintenance(calculateNextMaintenanceDate(maintenanceData.getFrequency()));
                maintenance.setStatus("PENDING");
                maintenance.setCreatedAt(LocalDateTime.now());
                maintenance.setUpdatedAt(LocalDateTime.now());
                
                maintenanceToSave.add(maintenance);
            }
            
            maintenanceRepository.saveAll(maintenanceToSave);
            log.info("Successfully stored {} maintenance items for device: {}", maintenanceToSave.size(), deviceId);
            
        } catch (Exception e) {
            log.error("Error storing maintenance for device: {}", deviceId, e);
        }
    }

    /**
     * Store safety precautions in database
     */
    private void storeSafetyPrecautions(List<SafetyGenerationResponse.SafetyPrecaution> safetyPrecautions, String deviceId, String organizationId) {
        try {
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
                safety.setRecommendedAction(safetyData.getMitigation());
                safety.setActive(true);
                safety.setCreatedAt(LocalDateTime.now());
                safety.setUpdatedAt(LocalDateTime.now());
                
                safetyToSave.add(safety);
            }
            
            safetyRepository.saveAll(safetyToSave);
            log.info("Successfully stored {} safety precautions for device: {}", safetyToSave.size(), deviceId);
            
        } catch (Exception e) {
            log.error("Error storing safety precautions for device: {}", deviceId, e);
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
            
            // Check if device has manual URL (PDF file)
            if (device.getManualUrl() == null || device.getManualUrl().isEmpty()) {
                log.info("No PDF file found for device {}, skipping rule processing", deviceId);
                return;
            }
            
            // Extract PDF filename from manual URL
            String pdfFilename = extractPdfFilename(device.getManualUrl());
            if (pdfFilename == null) {
                log.warn("Could not extract PDF filename from manual URL: {}", device.getManualUrl());
                return;
            }
            
            log.info("Generating rules for device: {} using PDF: {}", deviceId, pdfFilename);
            
            // Generate rules using PDF processing service
            var rulesResponse = pdfProcessingService.generateRules(pdfFilename, deviceId, organizationId);
            
            if (!rulesResponse.isSuccess()) {
                log.error("Rule generation failed for device: {} - {}", deviceId, rulesResponse.getMessage());
                return;
            }
            
            // Store rules in database
            if (rulesResponse.getRules() != null && !rulesResponse.getRules().isEmpty()) {
                List<Rule> rulesToSave = new ArrayList<>();
                
                for (var ruleData : rulesResponse.getRules()) {
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
            } else {
                log.warn("No rules generated for device: {}", deviceId);
            }
            
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
            
            // Check if device has manual URL (PDF file)
            if (device.getManualUrl() == null || device.getManualUrl().isEmpty()) {
                log.info("No PDF file found for device {}, skipping maintenance processing", deviceId);
                return;
            }
            
            // Extract PDF filename from manual URL
            String pdfFilename = extractPdfFilename(device.getManualUrl());
            if (pdfFilename == null) {
                log.warn("Could not extract PDF filename from manual URL: {}", device.getManualUrl());
                return;
            }
            
            log.info("Generating maintenance schedule for device: {} using PDF: {}", deviceId, pdfFilename);
            
            // Generate maintenance using PDF processing service
            var maintenanceResponse = pdfProcessingService.generateMaintenance(pdfFilename, deviceId, organizationId);
            
            if (!maintenanceResponse.isSuccess()) {
                log.error("Maintenance generation failed for device: {} - {}", deviceId, maintenanceResponse.getMessage());
                return;
            }
            
            // Store maintenance tasks in database with proper date formatting
            if (maintenanceResponse.getMaintenanceTasks() != null && !maintenanceResponse.getMaintenanceTasks().isEmpty()) {
                List<DeviceMaintenance> maintenanceToSave = new ArrayList<>();
                
                for (var maintenanceData : maintenanceResponse.getMaintenanceTasks()) {
                    DeviceMaintenance maintenance = new DeviceMaintenance();
                    maintenance.setId(UUID.randomUUID().toString());
                    maintenance.setTaskName(maintenanceData.getTaskName());
                    maintenance.setDevice(device);
                    maintenance.setDeviceName(device.getName());
                    maintenance.setDescription(maintenanceData.getDescription());
                    maintenance.setFrequency(maintenanceData.getFrequency());
                    maintenance.setPriority(DeviceMaintenance.Priority.valueOf(maintenanceData.getPriority().toUpperCase()));
                    maintenance.setEstimatedDuration(maintenanceData.getEstimatedDuration());
                    maintenance.setRequiredTools(maintenanceData.getRequiredTools());
                    maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
                    maintenance.setOrganizationId(organizationId);
                    maintenance.setCreatedAt(LocalDateTime.now());
                    maintenance.setUpdatedAt(LocalDateTime.now());
                    
                    // Format dates properly and calculate next maintenance date
                    formatAndCalculateMaintenanceDates(maintenance, maintenanceData);
                    
                    maintenanceToSave.add(maintenance);
                }
                
                maintenanceRepository.saveAll(maintenanceToSave);
                log.info("Successfully stored {} maintenance tasks for device: {}", maintenanceToSave.size(), deviceId);
            } else {
                log.warn("No maintenance tasks generated for device: {}", deviceId);
            }
            
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
            
            // Check if device has manual URL (PDF file)
            if (device.getManualUrl() == null || device.getManualUrl().isEmpty()) {
                log.info("No PDF file found for device {}, skipping safety processing", deviceId);
                return;
            }
            
            // Extract PDF filename from manual URL
            String pdfFilename = extractPdfFilename(device.getManualUrl());
            if (pdfFilename == null) {
                log.warn("Could not extract PDF filename from manual URL: {}", device.getManualUrl());
                return;
            }
            
            log.info("Generating safety precautions for device: {} using PDF: {}", deviceId, pdfFilename);
            
            // Generate safety precautions using PDF processing service
            var safetyResponse = pdfProcessingService.generateSafety(pdfFilename, deviceId, organizationId);
            
            if (!safetyResponse.isSuccess()) {
                log.error("Safety generation failed for device: {} - {}", deviceId, safetyResponse.getMessage());
                return;
            }
            
            // Store safety precautions in database
            if (safetyResponse.getSafetyPrecautions() != null && !safetyResponse.getSafetyPrecautions().isEmpty()) {
                List<DeviceSafetyPrecaution> safetyToSave = new ArrayList<>();
                
                for (var safetyData : safetyResponse.getSafetyPrecautions()) {
                    DeviceSafetyPrecaution safety = new DeviceSafetyPrecaution();
                    safety.setId(UUID.randomUUID().toString());
                    safety.setTitle(safetyData.getTitle());
                    safety.setDescription(safetyData.getDescription());
                    safety.setCategory(safetyData.getCategory());
                    safety.setSeverity(safetyData.getSeverity());
                    safety.setDeviceId(deviceId);
                    safety.setOrganizationId(organizationId);
                    safety.setCreatedAt(LocalDateTime.now());
                    safety.setUpdatedAt(LocalDateTime.now());
                    
                    safetyToSave.add(safety);
                }
                
                safetyRepository.saveAll(safetyToSave);
                log.info("Successfully stored {} safety precautions for device: {}", safetyToSave.size(), deviceId);
            } else {
                log.warn("No safety precautions generated for device: {}", deviceId);
            }
            
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
            maintenance.setNextMaintenance(today.plusMonths(6)); // Default to 6 months
        }
    }

    /**
     * Calculate next maintenance date based on frequency
     */
    private LocalDate calculateNextMaintenanceDate(LocalDate lastMaintenance, String frequency) {
        if (frequency == null || frequency.isEmpty()) {
            return lastMaintenance.plusMonths(6); // Default to 6 months
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
        return lastMaintenance.plusMonths(6);
    }
}
