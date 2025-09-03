package com.iotplatform.service;

import com.iotplatform.model.UnifiedPDF;
import com.iotplatform.repository.UnifiedPDFRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Unified PDF Service - Single service for all PDF operations in the system.
 * Consolidates device documentation, knowledge documents, and general PDF management.
 * 
 * @author IoT Platform Team
 * @version 2.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UnifiedPDFService {

    private final UnifiedPDFRepository unifiedPDFRepository;

    /**
     * Create a new PDF document entry
     */
    public UnifiedPDF createPDF(String originalFilename, String title, UnifiedPDF.DocumentType documentType,
                               Long fileSize, String filePath, String organizationId, String uploadedBy,
                               String deviceId, String deviceName) {
        
        log.info("🔄 Creating unified PDF entry: {} for organization: {} device: {}", 
                originalFilename, organizationId, deviceId);
        
        try {
            // Generate unique PDF name for external service
            String pdfName = generatePDFName(originalFilename);
            
            UnifiedPDF pdf = UnifiedPDF.builder()
                    .id(UUID.randomUUID().toString())
                    .name(pdfName)
                    .originalFilename(originalFilename)
                    .title(title)
                    .documentType(documentType)
                    .fileSize(fileSize)
                    .filePath(filePath)
                    .processingStatus(UnifiedPDF.ProcessingStatus.PENDING)
                    .vectorized(false)
                    .deviceId(deviceId)
                    .deviceName(deviceName)
                    .organizationId(organizationId)
                    .uploadedBy(uploadedBy)
                    .uploadedAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .deleted(false)
                    .build();
            
            UnifiedPDF savedPDF = unifiedPDFRepository.save(pdf);
            log.info("✅ Unified PDF created successfully: {} with ID: {}", originalFilename, savedPDF.getId());
            
            return savedPDF;
            
        } catch (Exception e) {
            log.error("❌ Failed to create unified PDF: {} - {}", originalFilename, e.getMessage(), e);
            throw new RuntimeException("Failed to create PDF entry", e);
        }
    }

    /**
     * Create PDF entry for device onboarding
     */
    public UnifiedPDF createDevicePDF(String deviceId, String deviceName, String originalFilename,
                                    String title, UnifiedPDF.DocumentType documentType, Long fileSize,
                                    String organizationId, String uploadedBy) {
        
        log.info("🔄 Creating device PDF entry: {} for device: {} ({})", 
                originalFilename, deviceName, deviceId);
        
        return createPDF(originalFilename, title, documentType, fileSize, "external_service", 
                        organizationId, uploadedBy, deviceId, deviceName);
    }

    /**
     * Create general PDF entry (not device-specific)
     */
    public UnifiedPDF createGeneralPDF(String originalFilename, String title, Long fileSize,
                                     String filePath, String organizationId, String uploadedBy) {
        
        log.info("🔄 Creating general PDF entry: {} for organization: {}", originalFilename, organizationId);
        
        return createPDF(originalFilename, title, UnifiedPDF.DocumentType.GENERAL, fileSize, filePath,
                        organizationId, uploadedBy, null, null);
    }

    /**
     * Update PDF processing response from external service
     */
    public UnifiedPDF updateProcessingResponse(String pdfId, String pdfName, Integer chunksProcessed,
                                            String processingTime, String collectionName) {
        
        log.info("🔄 Updating processing response for PDF: {} (ID: {})", pdfName, pdfId);
        
        try {
            Optional<UnifiedPDF> pdfOpt = unifiedPDFRepository.findById(pdfId);
            if (pdfOpt.isEmpty()) {
                log.error("❌ PDF not found with ID: {}", pdfId);
                throw new RuntimeException("PDF not found: " + pdfId);
            }
            
            UnifiedPDF pdf = pdfOpt.get();
            
            // Update processing details
            pdf.setName(pdfName);
            pdf.setProcessedChunks(chunksProcessed);
            pdf.setProcessingTime(processingTime);
            pdf.setCollectionName(collectionName);
            pdf.setProcessingStatus(UnifiedPDF.ProcessingStatus.COMPLETED);
            pdf.setVectorized(true);
            pdf.setProcessedAt(LocalDateTime.now());
            pdf.setUpdatedAt(LocalDateTime.now());
            
            UnifiedPDF updatedPDF = unifiedPDFRepository.save(pdf);
            log.info("✅ Processing response updated successfully for PDF: {}", pdfName);
            
            return updatedPDF;
            
        } catch (Exception e) {
            log.error("❌ Failed to update processing response for PDF: {} - {}", pdfId, e.getMessage(), e);
            throw new RuntimeException("Failed to update processing response", e);
        }
    }

    /**
     * Update PDF processing status
     */
    public UnifiedPDF updateProcessingStatus(String pdfId, UnifiedPDF.ProcessingStatus status) {
        
        log.info("🔄 Updating processing status for PDF: {} to {}", pdfId, status);
        
        try {
            Optional<UnifiedPDF> pdfOpt = unifiedPDFRepository.findById(pdfId);
            if (pdfOpt.isEmpty()) {
                log.error("❌ PDF not found with ID: {}", pdfId);
                throw new RuntimeException("PDF not found: " + pdfId);
            }
            
            UnifiedPDF pdf = pdfOpt.get();
            pdf.setProcessingStatus(status);
            pdf.setUpdatedAt(LocalDateTime.now());
            
            if (status == UnifiedPDF.ProcessingStatus.COMPLETED) {
                pdf.setProcessedAt(LocalDateTime.now());
            }
            
            UnifiedPDF updatedPDF = unifiedPDFRepository.save(pdf);
            log.info("✅ Processing status updated successfully for PDF: {} to {}", pdfId, status);
            
            return updatedPDF;
            
        } catch (Exception e) {
            log.error("❌ Failed to update processing status for PDF: {} - {}", pdfId, e.getMessage(), e);
            throw new RuntimeException("Failed to update processing status", e);
        }
    }

    /**
     * Get PDF by ID
     */
    public Optional<UnifiedPDF> getPDFById(String pdfId) {
        return unifiedPDFRepository.findById(pdfId);
    }

    /**
     * Get PDF by name and organization
     */
    public Optional<UnifiedPDF> getPDFByName(String pdfName, String organizationId) {
        return unifiedPDFRepository.findByNameAndOrganizationIdAndDeletedFalse(pdfName, organizationId);
    }

    /**
     * Get PDFs by organization ID
     */
    public List<UnifiedPDF> getPDFsByOrganization(String organizationId) {
        return unifiedPDFRepository.findByOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(organizationId);
    }

    /**
     * Get PDFs by organization ID with pagination
     */
    public Page<UnifiedPDF> getPDFsByOrganization(String organizationId, Pageable pageable) {
        return unifiedPDFRepository.findByOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(organizationId, pageable);
    }

    /**
     * Get PDFs by device ID
     */
    public List<UnifiedPDF> getPDFsByDevice(String deviceId) {
        return unifiedPDFRepository.findByDeviceIdAndDeletedFalseOrderByUploadedAtDesc(deviceId);
    }

    /**
     * Get PDFs by device ID and organization
     */
    public List<UnifiedPDF> getPDFsByDeviceAndOrganization(String deviceId, String organizationId) {
        return unifiedPDFRepository.findByDeviceIdAndOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(deviceId, organizationId);
    }

    /**
     * Get device-specific PDFs by organization
     */
    public List<UnifiedPDF> getDevicePDFsByOrganization(String organizationId) {
        return unifiedPDFRepository.findDevicePDFsByOrganizationId(organizationId);
    }

    /**
     * Get general PDFs by organization (not device-specific)
     */
    public List<UnifiedPDF> getGeneralPDFsByOrganization(String organizationId) {
        return unifiedPDFRepository.findGeneralPDFsByOrganizationId(organizationId);
    }

    /**
     * Get PDFs ready for queries (completed and vectorized)
     */
    public List<UnifiedPDF> getReadyPDFsByOrganization(String organizationId) {
        return unifiedPDFRepository.findReadyPDFsByOrganizationId(organizationId);
    }

    /**
     * Get PDFs ready for queries by device
     */
    public List<UnifiedPDF> getReadyPDFsByDevice(String deviceId) {
        return unifiedPDFRepository.findReadyPDFsByDeviceId(deviceId);
    }

    /**
     * Search PDFs by term in filename or title
     */
    public List<UnifiedPDF> searchPDFs(String organizationId, String searchTerm) {
        return unifiedPDFRepository.findByOrganizationIdAndSearchTerm(organizationId, searchTerm);
    }

    /**
     * Search PDFs by device name
     */
    public List<UnifiedPDF> searchPDFsByDeviceName(String organizationId, String deviceName) {
        return unifiedPDFRepository.findByOrganizationIdAndDeviceName(organizationId, deviceName);
    }

    /**
     * Get PDFs by document type
     */
    public List<UnifiedPDF> getPDFsByType(String organizationId, UnifiedPDF.DocumentType documentType) {
        return unifiedPDFRepository.findByOrganizationIdAndDocumentTypeAndDeletedFalseOrderByUploadedAtDesc(organizationId, documentType);
    }

    /**
     * Get PDFs by processing status
     */
    public List<UnifiedPDF> getPDFsByStatus(String organizationId, UnifiedPDF.ProcessingStatus status) {
        return unifiedPDFRepository.findByOrganizationIdAndProcessingStatusAndDeletedFalseOrderByUploadedAtDesc(organizationId, status);
    }

    /**
     * Get PDFs by vectorized status
     */
    public List<UnifiedPDF> getPDFsByVectorizedStatus(String organizationId, Boolean vectorized) {
        return unifiedPDFRepository.findByOrganizationIdAndVectorizedAndDeletedFalseOrderByUploadedAtDesc(organizationId, vectorized);
    }

    /**
     * Get PDFs that need processing
     */
    public List<UnifiedPDF> getPDFsNeedingProcessing(String organizationId) {
        return unifiedPDFRepository.findPDFsNeedingProcessing(organizationId);
    }

    /**
     * Get PDFs by date range
     */
    public List<UnifiedPDF> getPDFsByDateRange(String organizationId, LocalDateTime startDate, LocalDateTime endDate) {
        return unifiedPDFRepository.findByOrganizationIdAndDateRange(organizationId, startDate, endDate);
    }

    /**
     * Count PDFs by organization
     */
    public long countPDFsByOrganization(String organizationId) {
        return unifiedPDFRepository.countByOrganizationIdAndDeletedFalse(organizationId);
    }

    /**
     * Count PDFs by device
     */
    public long countPDFsByDevice(String deviceId) {
        return unifiedPDFRepository.countByDeviceIdAndDeletedFalse(deviceId);
    }

    /**
     * Count PDFs by status
     */
    public long countPDFsByStatus(String organizationId, UnifiedPDF.ProcessingStatus status) {
        return unifiedPDFRepository.countByOrganizationIdAndProcessingStatusAndDeletedFalse(organizationId, status);
    }

    /**
     * Count PDFs by vectorized status
     */
    public long countPDFsByVectorizedStatus(String organizationId, Boolean vectorized) {
        return unifiedPDFRepository.countByOrganizationIdAndVectorizedAndDeletedFalse(organizationId, vectorized);
    }

    /**
     * Soft delete PDF by ID
     */
    public boolean softDeletePDF(String pdfId) {
        try {
            Optional<UnifiedPDF> pdfOpt = unifiedPDFRepository.findById(pdfId);
            if (pdfOpt.isEmpty()) {
                log.warn("⚠️ PDF not found for deletion: {}", pdfId);
                return false;
            }
            
            UnifiedPDF pdf = pdfOpt.get();
            pdf.setDeleted(true);
            pdf.setDeletedAt(LocalDateTime.now());
            pdf.setUpdatedAt(LocalDateTime.now());
            
            unifiedPDFRepository.save(pdf);
            log.info("✅ PDF soft deleted successfully: {}", pdfId);
            return true;
            
        } catch (Exception e) {
            log.error("❌ Failed to soft delete PDF: {} - {}", pdfId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Soft delete PDFs by device ID
     */
    public int softDeletePDFsByDevice(String deviceId) {
        try {
            int deletedCount = unifiedPDFRepository.softDeleteByDeviceId(deviceId, LocalDateTime.now());
            log.info("✅ Soft deleted {} PDFs for device: {}", deletedCount, deviceId);
            return deletedCount;
            
        } catch (Exception e) {
            log.error("❌ Failed to soft delete PDFs for device: {} - {}", deviceId, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Soft delete PDFs by organization
     */
    public int softDeletePDFsByOrganization(String organizationId) {
        try {
            int deletedCount = unifiedPDFRepository.softDeleteByOrganizationId(organizationId, LocalDateTime.now());
            log.info("✅ Soft deleted {} PDFs for organization: {}", deletedCount, organizationId);
            return deletedCount;
            
        } catch (Exception e) {
            log.error("❌ Failed to soft delete PDFs for organization: {} - {}", organizationId, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Generate unique PDF name for external service
     */
    private String generatePDFName(String originalFilename) {
        String baseName = originalFilename.substring(0, originalFilename.lastIndexOf("."));
        String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String timestamp = String.valueOf(System.currentTimeMillis());
        return baseName + "_" + timestamp + extension;
    }

    /**
     * Check if PDF is ready for queries
     */
    public boolean isPDFReadyForQueries(String pdfId) {
        Optional<UnifiedPDF> pdfOpt = getPDFById(pdfId);
        return pdfOpt.map(UnifiedPDF::isReadyForQueries).orElse(false);
    }

    /**
     * Get PDF display name for UI
     */
    public String getPDFDisplayName(String pdfId) {
        Optional<UnifiedPDF> pdfOpt = getPDFById(pdfId);
        return pdfOpt.map(UnifiedPDF::getDisplayName).orElse("Unknown PDF");
    }
}
