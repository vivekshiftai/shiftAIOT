package com.iotplatform.service;

import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceCreateResponse;
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
        
        // Step 1: Upload data and create device
        log.info("Step 1: Uploading data and creating device...");
        DeviceCreateResponse deviceResponse = deviceService.createDeviceWithFiles(
            deviceRequest, manualFile, datasheetFile, certificateFile, organizationId
        );
        
        log.info("Device created successfully with ID: {}", deviceResponse.getId());
        
        // Step 2: Process rules and store
        log.info("Step 2: Processing rules...");
        processAndStoreRules(deviceResponse.getId(), organizationId);
        
        // Step 3: Process maintenance and store (with proper date formatting)
        log.info("Step 3: Processing maintenance schedule...");
        processAndStoreMaintenance(deviceResponse.getId(), organizationId);
        
        // Step 4: Process safety and store
        log.info("Step 4: Processing safety precautions...");
        processAndStoreSafety(deviceResponse.getId(), organizationId);
        
        log.info("Unified onboarding workflow completed successfully for device: {}", deviceResponse.getId());
        
        return deviceResponse;
    }

    /**
     * Process and store rules for the device
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
            
            // Generate rules using PDF processing service
            var rulesResponse = pdfProcessingService.generateRules(pdfFilename, deviceId, organizationId);
            
            if (rulesResponse.getStatus() != "PENDING") {
                log.error("Rule generation failed for device: {}", deviceId);
                return;
            }
            
            // Store rules in database
            if (rulesResponse.getResult() != null && rulesResponse.getResult().getRules() != null) {
                List<Rule> rulesToSave = new ArrayList<>();
                
                for (var ruleData : rulesResponse.getResult().getRules()) {
                    Rule rule = new Rule();
                    rule.setId(UUID.randomUUID().toString());
                    rule.setName(ruleData.getRule_name());
                    rule.setDescription(ruleData.getDescription());
                    rule.setMetric(ruleData.getMetric());
                    rule.setMetricValue(ruleData.getMetric_value());
                    rule.setThreshold(ruleData.getThreshold());
                    rule.setConsequence(ruleData.getConsequence());
                    rule.setStatus(Rule.RuleStatus.ACTIVE);
                    rule.setDeviceId(deviceId);
                    rule.setOrganizationId(organizationId);
                    rule.setCreatedAt(new Date());
                    rule.setUpdatedAt(new Date());
                    
                    rulesToSave.add(rule);
                }
                
                ruleRepository.saveAll(rulesToSave);
                log.info("Successfully stored {} rules for device: {}", rulesToSave.size(), deviceId);
            }
            
        } catch (Exception e) {
            log.error("Error processing rules for device: {}", deviceId, e);
            throw new PDFProcessingException("Failed to process rules: " + e.getMessage());
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
            
            // Generate maintenance using PDF processing service
            var maintenanceResponse = pdfProcessingService.generateMaintenance(pdfFilename, deviceId, organizationId);
            
            if (maintenanceResponse.getStatus() != "PENDING") {
                log.error("Maintenance generation failed for device: {}", deviceId);
                return;
            }
            
            // Store maintenance tasks in database with proper date formatting
            if (maintenanceResponse.getResult() != null && maintenanceResponse.getResult().getMaintenance() != null) {
                List<DeviceMaintenance> maintenanceToSave = new ArrayList<>();
                
                for (var maintenanceData : maintenanceResponse.getResult().getMaintenance()) {
                    DeviceMaintenance maintenance = new DeviceMaintenance();
                    maintenance.setId(UUID.randomUUID().toString());
                    maintenance.setTaskName(maintenanceData.getTask_name());
                    maintenance.setDeviceId(deviceId);
                    maintenance.setDeviceName(device.getName());
                    maintenance.setComponentName(maintenanceData.getComponent_name());
                    maintenance.setMaintenanceType(maintenanceData.getMaintenance_type());
                    maintenance.setFrequency(maintenanceData.getFrequency());
                    maintenance.setDescription(maintenanceData.getDescription());
                    maintenance.setPriority(maintenanceData.getPriority());
                    maintenance.setEstimatedCost(maintenanceData.getEstimated_cost());
                    maintenance.setEstimatedDuration(maintenanceData.getEstimated_duration());
                    maintenance.setRequiredTools(maintenanceData.getRequired_tools());
                    maintenance.setSafetyNotes(maintenanceData.getSafety_notes());
                    maintenance.setStatus(DeviceMaintenance.MaintenanceStatus.ACTIVE);
                    maintenance.setOrganizationId(organizationId);
                    maintenance.setCreatedAt(new Date());
                    maintenance.setUpdatedAt(new Date());
                    
                    // Format dates properly and calculate next maintenance date
                    formatAndCalculateMaintenanceDates(maintenance, maintenanceData);
                    
                    maintenanceToSave.add(maintenance);
                }
                
                maintenanceRepository.saveAll(maintenanceToSave);
                log.info("Successfully stored {} maintenance tasks for device: {}", maintenanceToSave.size(), deviceId);
            }
            
        } catch (Exception e) {
            log.error("Error processing maintenance for device: {}", deviceId, e);
            throw new PDFProcessingException("Failed to process maintenance: " + e.getMessage());
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
            
            // Generate safety precautions using PDF processing service
            var safetyResponse = pdfProcessingService.generateSafety(pdfFilename, deviceId, organizationId);
            
            if (safetyResponse.getStatus() != "PENDING") {
                log.error("Safety generation failed for device: {}", deviceId);
                return;
            }
            
            // Store safety precautions in database
            if (safetyResponse.getResult() != null && safetyResponse.getResult().getSafety_precautions() != null) {
                List<DeviceSafetyPrecaution> safetyToSave = new ArrayList<>();
                
                for (var safetyData : safetyResponse.getResult().getSafety_precautions()) {
                    DeviceSafetyPrecaution safety = new DeviceSafetyPrecaution();
                    safety.setId(UUID.randomUUID().toString());
                    safety.setTitle(safetyData.getTitle());
                    safety.setDescription(safetyData.getDescription());
                    safety.setCategory(safetyData.getCategory());
                    safety.setSeverity(safetyData.getSeverity());
                    safety.setDeviceId(deviceId);
                    safety.setDeviceName(device.getName());
                    safety.setOrganizationId(organizationId);
                    safety.setCreatedAt(new Date());
                    safety.setUpdatedAt(new Date());
                    
                    safetyToSave.add(safety);
                }
                
                safetyRepository.saveAll(safetyToSave);
                log.info("Successfully stored {} safety precautions for device: {}", safetyToSave.size(), deviceId);
            }
            
        } catch (Exception e) {
            log.error("Error processing safety precautions for device: {}", deviceId, e);
            throw new PDFProcessingException("Failed to process safety precautions: " + e.getMessage());
        }
    }

    /**
     * Extract PDF filename from file path
     */
    private String extractPdfFilename(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        
        // Extract filename from path
        String filename = filePath.substring(filePath.lastIndexOf('/') + 1);
        if (filename.contains("\\")) {
            filename = filename.substring(filename.lastIndexOf('\\') + 1);
        }
        
        // Remove file extension if present
        if (filename.contains(".")) {
            filename = filename.substring(0, filename.lastIndexOf('.'));
        }
        
        return filename;
    }

    /**
     * Format dates properly and calculate next maintenance date based on frequency
     */
    private void formatAndCalculateMaintenanceDates(DeviceMaintenance maintenance, Object maintenanceData) {
        try {
            // Parse last maintenance date if provided
            LocalDate lastMaintenance = null;
            if (maintenanceData.getLast_maintenance() != null && !maintenanceData.getLast_maintenance().isEmpty()) {
                // Try different date formats
                String[] dateFormats = {
                    "yyyy-MM-dd",
                    "dd/MM/yyyy",
                    "MM/dd/yyyy",
                    "dd-MM-yyyy",
                    "MM-dd-yyyy"
                };
                
                for (String format : dateFormats) {
                    try {
                        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(format);
                        lastMaintenance = LocalDate.parse(maintenanceData.getLast_maintenance(), formatter);
                        break;
                    } catch (Exception e) {
                        // Continue to next format
                    }
                }
            }
            
            // If no last maintenance date, use today
            if (lastMaintenance == null) {
                lastMaintenance = LocalDate.now();
            }
            
            maintenance.setLastMaintenance(java.sql.Date.valueOf(lastMaintenance));
            
            // Calculate next maintenance date based on frequency
            LocalDate nextMaintenance = calculateNextMaintenanceDate(lastMaintenance, maintenance.getFrequency());
            maintenance.setNextMaintenance(java.sql.Date.valueOf(nextMaintenance));
            
            log.debug("Calculated maintenance dates for task '{}': last={}, next={}, frequency={}", 
                maintenance.getTaskName(), lastMaintenance, nextMaintenance, maintenance.getFrequency());
            
        } catch (Exception e) {
            log.error("Error formatting maintenance dates for task: {}", maintenance.getTaskName(), e);
            // Set default dates if parsing fails
            LocalDate today = LocalDate.now();
            maintenance.setLastMaintenance(java.sql.Date.valueOf(today));
            maintenance.setNextMaintenance(java.sql.Date.valueOf(today.plusMonths(6))); // Default to 6 months
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
