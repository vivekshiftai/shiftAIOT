package com.iotplatform.service;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.DeviceDocumentation;
import com.iotplatform.repository.DeviceDocumentationRepository;

@Service
public class DeviceDocumentationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeviceDocumentationService.class);
    
    @Autowired
    private DeviceDocumentationRepository deviceDocumentationRepository;
    
    /**
     * Create a new device documentation entry
     */
    public DeviceDocumentation createDeviceDocumentation(String deviceId, String documentType, 
                                                       String filename, String originalFilename, 
                                                       Long fileSize, String filePath) {
        try {
            DeviceDocumentation documentation = new DeviceDocumentation(
                deviceId, documentType, filename, originalFilename, fileSize, filePath
            );
            
            DeviceDocumentation saved = deviceDocumentationRepository.save(documentation);
            logger.info("✅ Created device documentation: {} for device: {}", saved.getId(), deviceId);
            return saved;
        } catch (Exception e) {
            logger.error("❌ Failed to create device documentation for device: {}", deviceId, e);
            throw new RuntimeException("Failed to create device documentation", e);
        }
    }
    
    /**
     * Update device documentation with processing response from external service
     */
    public DeviceDocumentation updateProcessingResponse(String documentationId, 
                                                      String pdfName, 
                                                      Integer chunksProcessed, 
                                                      String processingTime, 
                                                      String collectionName) {
        try {
            Optional<DeviceDocumentation> optional = deviceDocumentationRepository.findById(documentationId);
            if (optional.isPresent()) {
                DeviceDocumentation documentation = optional.get();
                documentation.updateFromProcessingResponse(pdfName, chunksProcessed, processingTime, collectionName);
                
                DeviceDocumentation updated = deviceDocumentationRepository.save(documentation);
                logger.info("✅ Updated device documentation processing response: {} for device: {}", 
                           updated.getId(), updated.getDeviceId());
                return updated;
            } else {
                logger.error("❌ Device documentation not found: {}", documentationId);
                throw new RuntimeException("Device documentation not found: " + documentationId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to update processing response for documentation: {}", documentationId, e);
            throw new RuntimeException("Failed to update processing response", e);
        }
    }
    
    /**
     * Mark device documentation processing as failed
     */
    public DeviceDocumentation markProcessingFailed(String documentationId, String errorMessage) {
        try {
            Optional<DeviceDocumentation> optional = deviceDocumentationRepository.findById(documentationId);
            if (optional.isPresent()) {
                DeviceDocumentation documentation = optional.get();
                documentation.markProcessingFailed(errorMessage);
                
                DeviceDocumentation updated = deviceDocumentationRepository.save(documentation);
                logger.warn("⚠️ Marked device documentation processing as failed: {} for device: {}", 
                           updated.getId(), updated.getDeviceId());
                return updated;
            } else {
                logger.error("❌ Device documentation not found: {}", documentationId);
                throw new RuntimeException("Device documentation not found: " + documentationId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to mark processing as failed for documentation: {}", documentationId, e);
            throw new RuntimeException("Failed to mark processing as failed", e);
        }
    }
    
    /**
     * Mark device documentation processing as in progress
     */
    public DeviceDocumentation markProcessingInProgress(String documentationId) {
        try {
            Optional<DeviceDocumentation> optional = deviceDocumentationRepository.findById(documentationId);
            if (optional.isPresent()) {
                DeviceDocumentation documentation = optional.get();
                documentation.markProcessingInProgress();
                
                DeviceDocumentation updated = deviceDocumentationRepository.save(documentation);
                logger.info("🔄 Marked device documentation processing as in progress: {} for device: {}", 
                           updated.getId(), updated.getDeviceId());
                return updated;
            } else {
                logger.error("❌ Device documentation not found: {}", documentationId);
                throw new RuntimeException("Device documentation not found: " + documentationId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to mark processing as in progress for documentation: {}", documentationId, e);
            throw new RuntimeException("Failed to mark processing as in progress", e);
        }
    }
    
    /**
     * Get device documentation by ID
     */
    public Optional<DeviceDocumentation> getById(String documentationId) {
        return deviceDocumentationRepository.findById(documentationId);
    }
    
    /**
     * Get all device documentation for a device
     */
    public List<DeviceDocumentation> getByDeviceId(String deviceId) {
        return deviceDocumentationRepository.findByDeviceId(deviceId);
    }
    
    /**
     * Get device documentation by device ID and document type
     */
    public List<DeviceDocumentation> getByDeviceIdAndDocumentType(String deviceId, String documentType) {
        return deviceDocumentationRepository.findByDeviceIdAndDocumentType(deviceId, documentType);
    }
    
    /**
     * Get device documentation by processing status
     */
    public List<DeviceDocumentation> getByProcessingStatus(String processingStatus) {
        return deviceDocumentationRepository.findByProcessingStatus(processingStatus);
    }
    
    /**
     * Get device documentation by device ID and processing status
     */
    public List<DeviceDocumentation> getByDeviceIdAndProcessingStatus(String deviceId, String processingStatus) {
        return deviceDocumentationRepository.findByDeviceIdAndProcessingStatus(deviceId, processingStatus);
    }
    
    /**
     * Get device documentation by collection name (from external service)
     */
    public List<DeviceDocumentation> getByCollectionName(String collectionName) {
        return deviceDocumentationRepository.findByCollectionName(collectionName);
    }
    
    /**
     * Get device documentation by PDF name (from external service)
     */
    public List<DeviceDocumentation> getByPdfName(String pdfName) {
        return deviceDocumentationRepository.findByPdfName(pdfName);
    }
    
    /**
     * Delete device documentation by ID
     */
    public void deleteById(String documentationId) {
        try {
            deviceDocumentationRepository.deleteById(documentationId);
            logger.info("🗑️ Deleted device documentation: {}", documentationId);
        } catch (Exception e) {
            logger.error("❌ Failed to delete device documentation: {}", documentationId, e);
            throw new RuntimeException("Failed to delete device documentation", e);
        }
    }
    
    /**
     * Delete all device documentation for a device
     */
    public void deleteByDeviceId(String deviceId) {
        try {
            deviceDocumentationRepository.deleteByDeviceId(deviceId);
            logger.info("🗑️ Deleted all device documentation for device: {}", deviceId);
        } catch (Exception e) {
            logger.error("❌ Failed to delete device documentation for device: {}", deviceId, e);
            throw new RuntimeException("Failed to delete device documentation", e);
        }
    }
    
    /**
     * Count device documentation by device ID
     */
    public long countByDeviceId(String deviceId) {
        return deviceDocumentationRepository.countByDeviceId(deviceId);
    }
}
