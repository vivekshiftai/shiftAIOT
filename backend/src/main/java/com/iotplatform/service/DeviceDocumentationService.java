package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.DeviceDocumentation;
import com.iotplatform.model.KnowledgeDocument;
import com.iotplatform.repository.DeviceDocumentationRepository;
import com.iotplatform.repository.KnowledgeDocumentRepository;
import com.iotplatform.model.Device;
import com.iotplatform.repository.DeviceRepository;

@Service
public class DeviceDocumentationService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeviceDocumentationService.class);
    
    @Autowired
    private DeviceDocumentationRepository deviceDocumentationRepository;
    
    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    @Autowired
    private DeviceRepository deviceRepository;
    
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

    /**
     * Store PDF reference in knowledge_documents table for device chat queries
     * This ensures that PDFs can be queried by name from device details
     * Simplified to store only essential data for querying
     */
    public void storePDFInKnowledgeSystem(String deviceId, String deviceName, String originalFileName, 
                                        Long fileSize, String documentType, String organizationId) {
        try {
            // Basic validation - only check for absolutely essential fields
            if (deviceId == null || deviceId.trim().isEmpty()) {
                logger.error("❌ Device ID cannot be null or empty - cannot store PDF reference");
                return;
            }
            if (originalFileName == null || originalFileName.trim().isEmpty()) {
                logger.error("❌ Original filename cannot be null or empty for device: {} - cannot store PDF reference", deviceId);
                return;
            }
            if (organizationId == null || organizationId.trim().isEmpty()) {
                logger.error("❌ Organization ID cannot be null or empty - cannot store PDF reference");
                return;
            }
            
            logger.info("🔄 Storing PDF reference for device: {} PDF: {}", deviceId, originalFileName);
            
            // Create minimal knowledge document entry - just what's needed for querying
            KnowledgeDocument knowledgeDoc = new KnowledgeDocument();
            knowledgeDoc.setName(originalFileName.trim()); // Essential: PDF name for querying
            knowledgeDoc.setType("pdf");
            knowledgeDoc.setFilePath("device_onboarding");
            knowledgeDoc.setSize(fileSize != null ? fileSize : 0L); // Use 0 if null
            knowledgeDoc.setStatus("completed");
            knowledgeDoc.setVectorized(true);
            knowledgeDoc.setOrganizationId(organizationId.trim());
            knowledgeDoc.setDeviceId(deviceId.trim()); // Essential: Device ID for association
            knowledgeDoc.setDeviceName(deviceName != null ? deviceName.trim() : "Unknown Device"); // Use default if null
            
            // Save to knowledge documents table
            logger.info("💾 Saving PDF reference to knowledge_documents table...");
            KnowledgeDocument savedDoc = knowledgeDocumentRepository.save(knowledgeDoc);
            
            logger.info("✅ PDF reference stored successfully - ID: {}, Name: {}, DeviceID: {}", 
                    savedDoc.getId(), savedDoc.getName(), savedDoc.getDeviceId());
                    
        } catch (Exception e) {
            logger.error("❌ Failed to store PDF reference for device: {} PDF: {} - {}", 
                        deviceId, originalFileName, e.getMessage());
            
            // Try to store with minimal data if the full storage failed
            try {
                logger.info("🔄 Attempting minimal PDF reference storage...");
                KnowledgeDocument minimalDoc = new KnowledgeDocument();
                minimalDoc.setName(originalFileName != null ? originalFileName.trim() : "unknown.pdf");
                minimalDoc.setType("pdf");
                minimalDoc.setFilePath("device_onboarding");
                minimalDoc.setSize(0L);
                minimalDoc.setStatus("completed");
                minimalDoc.setVectorized(true);
                minimalDoc.setOrganizationId(organizationId != null ? organizationId.trim() : "default");
                minimalDoc.setDeviceId(deviceId.trim());
                minimalDoc.setDeviceName("Unknown Device");
                
                KnowledgeDocument savedMinimal = knowledgeDocumentRepository.save(minimalDoc);
                logger.info("✅ Minimal PDF reference stored successfully - ID: {}, Name: {}, DeviceID: {}", 
                           savedMinimal.getId(), savedMinimal.getName(), savedMinimal.getDeviceId());
                
            } catch (Exception minimalError) {
                logger.error("❌ Even minimal PDF reference storage failed for device: {} - {}", 
                           deviceId, minimalError.getMessage());
            }
        }
    }

    /**
     * Get all PDF references for a device from knowledge system
     * Simplified to focus on getting PDF names for querying
     */
    public List<KnowledgeDocument> getDevicePDFReferences(String deviceId, String organizationId) {
        try {
            // Basic validation
            if (deviceId == null || deviceId.trim().isEmpty()) {
                logger.error("❌ Device ID cannot be null or empty");
                return new ArrayList<>();
            }
            if (organizationId == null || organizationId.trim().isEmpty()) {
                logger.error("❌ Organization ID cannot be null or empty");
                return new ArrayList<>();
            }
            
            logger.info("🔍 Fetching PDF references for device: {} in organization: {}", deviceId, organizationId);
            
            // Try to get PDF references from knowledge system
            List<KnowledgeDocument> documents = knowledgeDocumentRepository
                .findByOrganizationIdAndDeviceIdOrderByUploadedAtDesc(organizationId.trim(), deviceId.trim());
            
            logger.info("📊 Found {} PDF references for device: {}", documents.size(), deviceId);
            
            // If no documents found, try to migrate existing documentation
            if (documents.isEmpty()) {
                logger.info("⚠️ No PDF references found, attempting migration...");
                migrateExistingDeviceDocumentation(deviceId, organizationId);
                
                // Try to fetch again after migration
                documents = knowledgeDocumentRepository
                    .findByOrganizationIdAndDeviceIdOrderByUploadedAtDesc(organizationId, deviceId);
                
                if (!documents.isEmpty()) {
                    logger.info("✅ Migration successful - found {} PDF references", documents.size());
                } else {
                    logger.info("❌ No PDF references found even after migration");
                }
            }
            
            return documents;
            
        } catch (Exception e) {
            logger.error("❌ Failed to fetch PDF references for device: {} - {}", deviceId, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Get PDF reference by name for device chat queries
     */
    public KnowledgeDocument getPDFReferenceByName(String pdfName, String organizationId) {
        try {
            // Validate required parameters
            if (pdfName == null || pdfName.trim().isEmpty()) {
                logger.error("❌ PDF name cannot be null or empty");
                return null;
            }
            if (organizationId == null || organizationId.trim().isEmpty()) {
                logger.error("❌ Organization ID cannot be null or empty");
                return null;
            }
            
            logger.debug("Fetching PDF reference by name: {} in organization: {}", pdfName, organizationId);
            
            Optional<KnowledgeDocument> document = knowledgeDocumentRepository
                .findByNameAndOrganizationId(pdfName.trim(), organizationId.trim());
            
            if (document.isPresent()) {
                logger.debug("Found PDF reference: {} for device: {}", pdfName, document.get().getDeviceId());
                return document.get();
            } else {
                logger.debug("No PDF reference found for name: {}", pdfName);
                return null;
            }
            
        } catch (Exception e) {
            logger.error("Failed to fetch PDF reference by name: {} - {}", pdfName, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Migrate existing device documentation to knowledge system for existing devices
     * This ensures that devices created before this fix can still use chat functionality
     */
    public void migrateExistingDeviceDocumentation(String deviceId, String organizationId) {
        try {
            // Validate required parameters
            if (deviceId == null || deviceId.trim().isEmpty()) {
                logger.error("❌ Device ID cannot be null or empty for migration");
                return;
            }
            if (organizationId == null || organizationId.trim().isEmpty()) {
                logger.error("❌ Organization ID cannot be null or empty for migration");
                return;
            }
            
            logger.info("Migrating existing device documentation to knowledge system for device: {}", deviceId);
            
            // Get existing device documentation
            List<DeviceDocumentation> existingDocs = deviceDocumentationRepository.findByDeviceId(deviceId.trim());
            logger.info("📚 Found {} existing device documentation records for device: {}", existingDocs.size(), deviceId);
            
            if (existingDocs.isEmpty()) {
                logger.info("❌ No existing device documentation found for device: {}", deviceId);
                return;
            }
            
            // Get device name for association
            Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
            if (deviceOpt.isEmpty()) {
                logger.warn("Device not found for migration: {}", deviceId);
                return;
            }
            
            String deviceName = deviceOpt.get().getName();
            int migratedCount = 0;
            
            for (DeviceDocumentation doc : existingDocs) {
                try {
                    // Check if already exists in knowledge system
                    Optional<KnowledgeDocument> existingKnowledge = knowledgeDocumentRepository
                        .findByNameAndOrganizationId(doc.getOriginalFilename(), organizationId);
                    
                    if (existingKnowledge.isPresent()) {
                        logger.debug("PDF reference already exists in knowledge system: {} for device: {}", 
                                   doc.getOriginalFilename(), deviceId);
                        continue;
                    }
                    
                    // Create knowledge document entry
                    KnowledgeDocument knowledgeDoc = new KnowledgeDocument();
                    knowledgeDoc.setName(doc.getOriginalFilename() != null ? doc.getOriginalFilename().trim() : "unknown_filename"); // Use the actual uploaded filename
                    knowledgeDoc.setType("pdf");
                    knowledgeDoc.setFilePath("device_onboarding"); // Mark as uploaded during device onboarding
                    knowledgeDoc.setSize(doc.getFileSize() != null ? doc.getFileSize() : 0L); // Handle null file size
                    knowledgeDoc.setStatus("completed"); // Already processed
                    knowledgeDoc.setVectorized(true); // Already vectorized by external service
                    knowledgeDoc.setOrganizationId(organizationId.trim());
                    knowledgeDoc.setDeviceId(deviceId.trim());
                    knowledgeDoc.setDeviceName(deviceName != null ? deviceName.trim() : null); // Allow null device name
                    
                    // Handle null timestamps safely - DeviceDocumentation already uses LocalDateTime
                    LocalDateTime now = LocalDateTime.now();
                    knowledgeDoc.setUploadedAt(doc.getCreatedAt() != null ? doc.getCreatedAt() : now);
                    knowledgeDoc.setProcessedAt(doc.getUpdatedAt() != null ? doc.getUpdatedAt() : now);
                    
                    // Save to knowledge documents table
                    KnowledgeDocument savedDoc = knowledgeDocumentRepository.save(knowledgeDoc);
                    migratedCount++;
                    
                    logger.debug("✅ Migrated PDF reference: {} for device: {}", savedDoc.getId(), deviceId);
                    
                } catch (Exception e) {
                    logger.error("❌ Failed to migrate PDF reference: {} for device: {} - {}", 
                               doc.getOriginalFilename() != null ? doc.getOriginalFilename() : "unknown", deviceId, e.getMessage(), e);
                    // Continue with other documents
                }
            }
            
            logger.info("✅ Migration completed for device: {} - {} PDF references migrated", deviceId, migratedCount);
            
        } catch (Exception e) {
            logger.error("❌ Failed to migrate device documentation for device: {} - {}", deviceId, e.getMessage(), e);
        }
    }
}
