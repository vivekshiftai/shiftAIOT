package com.iotplatform.service;

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
        
        if (safetyPrecaution.getId() == null || safetyPrecaution.getId().trim().isEmpty()) {
            safetyPrecaution.setId(UUID.randomUUID().toString());
        }
        
        safetyPrecaution.setCreatedAt(LocalDateTime.now());
        safetyPrecaution.setUpdatedAt(LocalDateTime.now());
        
        DeviceSafetyPrecaution savedPrecaution = deviceSafetyPrecautionRepository.save(safetyPrecaution);
        logger.info("Safety precaution created successfully with ID: {}", savedPrecaution.getId());
        
        return savedPrecaution;
    }
    
    public List<DeviceSafetyPrecaution> createMultipleSafetyPrecautions(List<DeviceSafetyPrecaution> safetyPrecautions) {
        logger.info("Creating {} safety precautions", safetyPrecautions.size());
        
        for (DeviceSafetyPrecaution precaution : safetyPrecautions) {
            if (precaution.getId() == null || precaution.getId().trim().isEmpty()) {
                precaution.setId(UUID.randomUUID().toString());
            }
            precaution.setCreatedAt(LocalDateTime.now());
            precaution.setUpdatedAt(LocalDateTime.now());
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
            precaution.setType(updatedPrecaution.getType());
            precaution.setCategory(updatedPrecaution.getCategory());
            precaution.setSeverity(updatedPrecaution.getSeverity());
            precaution.setRecommendedAction(updatedPrecaution.getRecommendedAction());
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
    
    public List<DeviceSafetyPrecaution> getAllSafetyPrecautionsByOrganization(String organizationId) {
        logger.info("Fetching all safety precautions for organization: {}", organizationId);
        return deviceSafetyPrecautionRepository.findByOrganizationId(organizationId);
    }
}
