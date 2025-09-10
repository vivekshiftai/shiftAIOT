package com.iotplatform.service;

import com.iotplatform.dto.SafetyGenerationResponse;
import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.repository.DeviceSafetyPrecautionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class DeviceSafetyPrecautionService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeviceSafetyPrecautionService.class);
    
    private final DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository;
    
    @Autowired
    public DeviceSafetyPrecautionService(DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository) {
        this.deviceSafetyPrecautionRepository = deviceSafetyPrecautionRepository;
    }
    
    public List<DeviceSafetyPrecaution> getAllSafetyPrecautionsByDevice(String deviceId, String organizationId) {
        logger.info("Fetching all safety precautions for device: {} in organization: {}", deviceId, organizationId);
        return deviceSafetyPrecautionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
    }
    
    public List<DeviceSafetyPrecaution> getAllSafetyPrecautionsByOrganization(String organizationId) {
        logger.info("Fetching all safety precautions for organization: {}", organizationId);
        return deviceSafetyPrecautionRepository.findByOrganizationId(organizationId);
    }
    
    public List<DeviceSafetyPrecaution> getActiveSafetyPrecautionsByDevice(String deviceId, String organizationId) {
        logger.info("Fetching active safety precautions for device: {} in organization: {}", deviceId, organizationId);
        return deviceSafetyPrecautionRepository.findByDeviceIdAndIsActiveTrueAndOrganizationId(deviceId, organizationId);
    }
    
    public Optional<DeviceSafetyPrecaution> getSafetyPrecautionById(String id) {
        logger.info("Fetching safety precaution by ID: {}", id);
        return deviceSafetyPrecautionRepository.findById(id);
    }
    
    public DeviceSafetyPrecaution createSafetyPrecaution(DeviceSafetyPrecaution safetyPrecaution) {
        logger.info("Creating new safety precaution for device: {}", safetyPrecaution.getDeviceId());
        
        // Validate required fields
        if (safetyPrecaution.getTitle() == null || safetyPrecaution.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Safety precaution title cannot be null or empty");
        }
        if (safetyPrecaution.getDescription() == null || safetyPrecaution.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Safety precaution description cannot be null or empty");
        }
        
        // Ensure ID is set
        if (safetyPrecaution.getId() == null || safetyPrecaution.getId().trim().isEmpty()) {
            safetyPrecaution.setId(UUID.randomUUID().toString());
        }
        
        // Ensure timestamps are set
        safetyPrecaution.setCreatedAt(LocalDateTime.now());
        safetyPrecaution.setUpdatedAt(LocalDateTime.now());
        
        // Normalize enum values
        safetyPrecaution.setSeverity(normalizeSeverity(safetyPrecaution.getSeverity()));
        safetyPrecaution.setType(normalizeType(safetyPrecaution.getType()));
        
        // Ensure precaution type is set if not provided
        if (safetyPrecaution.getPrecautionType() == null || safetyPrecaution.getPrecautionType().trim().isEmpty()) {
            safetyPrecaution.setPrecautionType(determinePrecautionType(safetyPrecaution.getTitle(), safetyPrecaution.getCategory()));
        }
        safetyPrecaution.setPrecautionType(normalizePrecautionType(safetyPrecaution.getPrecautionType()));
        
        // Log the safety precaution details for debugging
        logger.debug("Creating safety precaution: ID={}, Title={}, Type={}, Category={}, DeviceId={}", 
            safetyPrecaution.getId(), safetyPrecaution.getTitle(), safetyPrecaution.getType(), 
            safetyPrecaution.getCategory(), safetyPrecaution.getDeviceId());
        
        DeviceSafetyPrecaution savedPrecaution = deviceSafetyPrecautionRepository.save(safetyPrecaution);
        logger.info("Safety precaution created successfully with ID: {}", savedPrecaution.getId());
        
        return savedPrecaution;
    }
    
    public List<DeviceSafetyPrecaution> createMultipleSafetyPrecautions(List<DeviceSafetyPrecaution> safetyPrecautions) {
        logger.info("Creating {} safety precautions", safetyPrecautions.size());
        
        for (DeviceSafetyPrecaution precaution : safetyPrecautions) {
            // Ensure ID is set
            if (precaution.getId() == null || precaution.getId().trim().isEmpty()) {
                precaution.setId(UUID.randomUUID().toString());
            }
            
            // Ensure timestamps are set
            precaution.setCreatedAt(LocalDateTime.now());
            precaution.setUpdatedAt(LocalDateTime.now());
            
            // Normalize enum values
            precaution.setSeverity(normalizeSeverity(precaution.getSeverity()));
            precaution.setType(normalizeType(precaution.getType()));
            
            // Ensure precaution type is set if not provided
            if (precaution.getPrecautionType() == null || precaution.getPrecautionType().trim().isEmpty()) {
                precaution.setPrecautionType(determinePrecautionType(precaution.getTitle(), precaution.getCategory()));
            }
            precaution.setPrecautionType(normalizePrecautionType(precaution.getPrecautionType()));
            
            // Log the safety precaution details for debugging
            logger.debug("Preparing safety precaution: ID={}, Title={}, Type={}, Category={}, DeviceId={}", 
                precaution.getId(), precaution.getTitle(), precaution.getType(), 
                precaution.getCategory(), precaution.getDeviceId());
        }
        
        List<DeviceSafetyPrecaution> savedPrecautions = deviceSafetyPrecautionRepository.saveAll(safetyPrecautions);
        logger.info("Successfully created {} safety precautions", savedPrecautions.size());
        
        return savedPrecautions;
    }
    
    public DeviceSafetyPrecaution updateSafetyPrecaution(String id, DeviceSafetyPrecaution updatedPrecaution) {
        logger.info("Updating safety precaution with ID: {}", id);
        
        Optional<DeviceSafetyPrecaution> existingPrecaution = deviceSafetyPrecautionRepository.findById(id);
        if (existingPrecaution.isPresent()) {
            DeviceSafetyPrecaution precaution = existingPrecaution.get();
            
            precaution.setTitle(updatedPrecaution.getTitle());
            precaution.setDescription(updatedPrecaution.getDescription());
            precaution.setType(normalizeType(updatedPrecaution.getType()));
            precaution.setCategory(updatedPrecaution.getCategory());
            precaution.setSeverity(normalizeSeverity(updatedPrecaution.getSeverity()));
            precaution.setPrecautionType(normalizePrecautionType(updatedPrecaution.getPrecautionType()));
            precaution.setRecommendedAction(updatedPrecaution.getRecommendedAction());
            precaution.setMitigation(updatedPrecaution.getMitigation());
            precaution.setAboutReaction(updatedPrecaution.getAboutReaction());
            precaution.setCauses(updatedPrecaution.getCauses());
            precaution.setHowToAvoid(updatedPrecaution.getHowToAvoid());
            precaution.setSafetyInfo(updatedPrecaution.getSafetyInfo());
            precaution.setIsActive(updatedPrecaution.getIsActive());
            precaution.setUpdatedAt(LocalDateTime.now());
            
            DeviceSafetyPrecaution savedPrecaution = deviceSafetyPrecautionRepository.save(precaution);
            logger.info("Safety precaution updated successfully");
            
            return savedPrecaution;
        } else {
            logger.warn("Safety precaution with ID: {} not found", id);
            throw new RuntimeException("Safety precaution not found");
        }
    }
    
    public void deleteSafetyPrecaution(String id) {
        logger.info("Deleting safety precaution with ID: {}", id);
        deviceSafetyPrecautionRepository.deleteById(id);
        logger.info("Safety precaution deleted successfully");
    }
    
    public void deleteSafetyPrecautionsByDevice(String deviceId, String organizationId) {
        logger.info("Deleting all safety precautions for device: {} in organization: {}", deviceId, organizationId);
        deviceSafetyPrecautionRepository.deleteByDeviceIdAndOrganizationId(deviceId, organizationId);
        logger.info("Safety precautions deleted successfully");
    }
    
    public List<DeviceSafetyPrecaution> getSafetyPrecautionsByType(String deviceId, String type, String organizationId) {
        logger.info("Fetching safety precautions by type: {} for device: {}", type, deviceId);
        return deviceSafetyPrecautionRepository.findByDeviceIdAndTypeAndOrganizationId(deviceId, type, organizationId);
    }
    
    public List<DeviceSafetyPrecaution> getSafetyPrecautionsByCategory(String deviceId, String category, String organizationId) {
        logger.info("Fetching safety precautions by category: {} for device: {}", category, deviceId);
        return deviceSafetyPrecautionRepository.findByDeviceIdAndCategoryAndOrganizationId(deviceId, category, organizationId);
    }
    
    public List<DeviceSafetyPrecaution> getSafetyPrecautionsBySeverity(String deviceId, String severity, String organizationId) {
        logger.info("Fetching safety precautions by severity: {} for device: {}", severity, deviceId);
        return deviceSafetyPrecautionRepository.findByDeviceIdAndSeverityAndOrganizationId(deviceId, severity, organizationId);
    }
    
    public long getActiveSafetyPrecautionsCount(String deviceId, String organizationId) {
        logger.info("Counting active safety precautions for device: {}", deviceId);
        return deviceSafetyPrecautionRepository.countActiveByDeviceIdAndOrganizationId(deviceId, organizationId);
    }
    
    public List<DeviceSafetyPrecaution> getSafetyPrecautionsByDeviceId(String deviceId) {
        logger.info("Fetching safety precautions for device: {}", deviceId);
        return deviceSafetyPrecautionRepository.findByDeviceId(deviceId);
    }
    
    public void createSafetyFromPDF(List<SafetyGenerationResponse.SafetyPrecaution> safetyPrecautions, String deviceId, String organizationId, String currentUserId) {
        logger.info("Creating safety precautions from PDF for device: {} in organization: {}", deviceId, organizationId);
        
        int processedCount = 0;
        int skippedCount = 0;
        
        try {
            for (SafetyGenerationResponse.SafetyPrecaution safetyData : safetyPrecautions) {
                try {
                    String safetyTitle = safetyData.getTitle();
                    
                    // Validate that title is not null or empty
                    if (safetyTitle == null || safetyTitle.trim().isEmpty()) {
                        logger.warn("⚠️ Safety precaution has null/empty title for device: {}, skipping", deviceId);
                        skippedCount++;
                        continue;
                    }
                    
                    // Check if safety precaution already exists for this device (deviceId + title)
                    Optional<DeviceSafetyPrecaution> existingSafety = deviceSafetyPrecautionRepository
                        .findByDeviceIdAndTitleAndOrganizationId(deviceId, safetyTitle, organizationId);
                    if (existingSafety.isPresent()) {
                        logger.info("⚠️ Safety precaution '{}' already exists for device: {}, skipping", safetyTitle, deviceId);
                        skippedCount++;
                        continue;
                    }
                    
                    DeviceSafetyPrecaution safety = new DeviceSafetyPrecaution();
                    safety.setId(UUID.randomUUID().toString());
                    safety.setDeviceId(deviceId);
                    safety.setOrganizationId(organizationId);
                    safety.setTitle(safetyData.getTitle());
                    safety.setDescription(safetyData.getDescription());
                    safety.setCategory(safetyData.getCategory());
                    safety.setSeverity(normalizeSeverity(safetyData.getSeverity()));
                    safety.setType(normalizeType(safetyData.getType() != null ? safetyData.getType() : "PDF_GENERATED"));
                    safety.setPrecautionType(normalizePrecautionType(determinePrecautionType(safetyData.getTitle(), safetyData.getCategory())));
                    safety.setRecommendedAction(safetyData.getRecommendedAction());
                    safety.setMitigation(safetyData.getMitigation());
                    safety.setAboutReaction(safetyData.getAboutReaction());
                    safety.setCauses(safetyData.getCauses());
                    safety.setHowToAvoid(safetyData.getHowToAvoid());
                    safety.setSafetyInfo(safetyData.getSafetyInfo());
                    safety.setIsActive(true);
                    safety.setCreatedBy(currentUserId);
                    safety.setCreatedAt(LocalDateTime.now());
                    safety.setUpdatedAt(LocalDateTime.now());
                    
                    logger.debug("Creating safety precaution from PDF: ID={}, Title={}, Type={}, Category={}, Severity={}", 
                        safety.getId(), safety.getTitle(), safety.getType(), safety.getCategory(), safety.getSeverity());
                    logger.debug("📊 Safety Data from API: Title='{}', Type='{}', Category='{}', Severity='{}', PrecautionType='{}'", 
                        safetyData.getTitle(), safetyData.getType(), safetyData.getCategory(), safetyData.getSeverity(), safety.getPrecautionType());
                    
                    deviceSafetyPrecautionRepository.save(safety);
                    processedCount++;
                    
                    logger.debug("✅ Created safety precaution: {} for device: {}", safetyTitle, deviceId);
                    
                } catch (Exception e) {
                    logger.error("❌ Failed to create safety precaution: {} for device: {} - {}", 
                               safetyData.getTitle(), deviceId, e.getMessage(), e);
                }
            }
            
            logger.info("Safety precautions processing completed for device: {} - Processed: {}, Skipped: {}", 
                       deviceId, processedCount, skippedCount);
        } catch (Exception e) {
            logger.error("Error creating safety precautions from PDF for device: {} - Error: {}", deviceId, e.getMessage(), e);
            throw e; // Re-throw to ensure proper error handling
        }
    }
    
    /**
     * Validate that all required fields are set for a safety precaution
     */
    private void validateSafetyPrecaution(DeviceSafetyPrecaution safetyPrecaution) {
        if (safetyPrecaution.getDeviceId() == null || safetyPrecaution.getDeviceId().trim().isEmpty()) {
            logger.error("DeviceSafetyPrecaution validation failed: deviceId is required");
            throw new IllegalArgumentException("Device ID is required");
        }
        
        if (safetyPrecaution.getTitle() == null || safetyPrecaution.getTitle().trim().isEmpty()) {
            logger.error("DeviceSafetyPrecaution validation failed: title is required");
            throw new IllegalArgumentException("Title is required");
        }
        
        if (safetyPrecaution.getDescription() == null || safetyPrecaution.getDescription().trim().isEmpty()) {
            logger.error("DeviceSafetyPrecaution validation failed: description is required");
            throw new IllegalArgumentException("Description is required");
        }
        
        if (safetyPrecaution.getType() == null || safetyPrecaution.getType().trim().isEmpty()) {
            logger.error("DeviceSafetyPrecaution validation failed: type is required");
            throw new IllegalArgumentException("Type is required");
        }
        
        if (safetyPrecaution.getCategory() == null || safetyPrecaution.getCategory().trim().isEmpty()) {
            logger.error("DeviceSafetyPrecaution validation failed: category is required");
            throw new IllegalArgumentException("Category is required");
        }
        
        if (safetyPrecaution.getOrganizationId() == null || safetyPrecaution.getOrganizationId().trim().isEmpty()) {
            logger.error("DeviceSafetyPrecaution validation failed: organizationId is required");
            throw new IllegalArgumentException("Organization ID is required");
        }
        
        logger.debug("DeviceSafetyPrecaution validation passed for device: {}", safetyPrecaution.getDeviceId());
    }
    
    /**
     * Determines the precaution type based on title and category
     * @param title The safety precaution title
     * @param category The safety precaution category
     * @return The appropriate precaution type
     */
    private String determinePrecautionType(String title, String category) {
        if (title == null && category == null) {
            return "general";
        }
        
        String titleLower = title != null ? title.toLowerCase() : "";
        String categoryLower = category != null ? category.toLowerCase() : "";
        
        // Check for electrical hazards
        if (titleLower.contains("electrical") || titleLower.contains("shock") || 
            categoryLower.contains("electrical")) {
            return "electrical";
        }
        
        // Check for mechanical hazards
        if (titleLower.contains("mechanical") || titleLower.contains("crushing") || 
            titleLower.contains("pinch") || titleLower.contains("entanglement") ||
            titleLower.contains("tipping") || categoryLower.contains("mechanical")) {
            return "mechanical";
        }
        
        // Check for chemical hazards
        if (titleLower.contains("chemical") || titleLower.contains("dust") || 
            titleLower.contains("explosion") || categoryLower.contains("chemical")) {
            return "chemical";
        }
        
        // Check for environmental hazards
        if (titleLower.contains("environmental") || titleLower.contains("temperature") ||
            titleLower.contains("weather") || categoryLower.contains("environmental")) {
            return "environmental";
        }
        
        // Default to general if no specific type can be determined
        return "general";
    }
    
    /**
     * Normalize severity values to standard format (case-insensitive)
     */
    private String normalizeSeverity(String severity) {
        if (severity == null || severity.trim().isEmpty()) {
            return "MEDIUM"; // Default value
        }
        
        String normalized = severity.trim().toUpperCase();
        
        // Validate and normalize severity values
        switch (normalized) {
            case "LOW":
            case "L":
                return "LOW";
            case "MEDIUM":
            case "MED":
            case "M":
                return "MEDIUM";
            case "HIGH":
            case "H":
                return "HIGH";
            case "CRITICAL":
            case "CRIT":
            case "C":
                return "CRITICAL";
            default:
                logger.debug("📋 Unrecognized severity value: '{}', defaulting to MEDIUM", severity);
                return "MEDIUM";
        }
    }
    
    /**
     * Normalize type values to standard format (case-insensitive)
     */
    private String normalizeType(String type) {
        if (type == null || type.trim().isEmpty()) {
            return "warning"; // Default value
        }
        
        String normalized = type.trim().toLowerCase();
        
        // Validate and normalize type values
        switch (normalized) {
            case "warning":
            case "warn":
            case "w":
                return "warning";
            case "procedure":
            case "proc":
            case "p":
                return "procedure";
            case "caution":
            case "caut":
            case "c":
                return "caution";
            case "note":
            case "n":
                return "note";
            default:
                logger.debug("📋 Unrecognized type value: '{}', defaulting to warning", type);
                return "warning";
        }
    }
    
    /**
     * Normalize precaution type values to standard format (case-insensitive)
     */
    private String normalizePrecautionType(String precautionType) {
        if (precautionType == null || precautionType.trim().isEmpty()) {
            return "general"; // Default value
        }
        
        String normalized = precautionType.trim().toLowerCase();
        
        // Validate and normalize precaution type values
        switch (normalized) {
            case "electrical":
            case "electric":
            case "elec":
            case "e":
                return "electrical";
            case "mechanical":
            case "mech":
            case "m":
                return "mechanical";
            case "chemical":
            case "chem":
            case "c":
                return "chemical";
            case "environmental":
            case "env":
            case "environment":
                return "environmental";
            case "general":
            case "gen":
            case "g":
                return "general";
            default:
                logger.debug("📋 Unrecognized precaution type value: '{}', defaulting to general", precautionType);
                return "general";
        }
    }
}
