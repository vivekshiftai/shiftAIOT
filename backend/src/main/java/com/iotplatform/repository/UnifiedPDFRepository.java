package com.iotplatform.repository;

import com.iotplatform.model.UnifiedPDF;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for UnifiedPDF entity - provides data access methods for the unified PDF storage system.
 * 
 * @author IoT Platform Team
 * @version 2.0
 */
@Repository
public interface UnifiedPDFRepository extends JpaRepository<UnifiedPDF, String> {

    /**
     * Find PDFs by organization ID (active only)
     */
    List<UnifiedPDF> findByOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String organizationId);

    /**
     * Find PDFs by organization ID with pagination (active only)
     */
    Page<UnifiedPDF> findByOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String organizationId, Pageable pageable);

    /**
     * Find PDFs by device ID (active only)
     */
    List<UnifiedPDF> findByDeviceIdAndDeletedFalseOrderByUploadedAtDesc(String deviceId);

    /**
     * Find PDFs by device ID and organization ID (active only)
     */
    List<UnifiedPDF> findByDeviceIdAndOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String deviceId, String organizationId);

    /**
     * Find PDFs by device name and organization ID (active only) - exact match
     */
    List<UnifiedPDF> findByDeviceNameAndOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String deviceName, String organizationId);

    /**
     * Find PDFs by device name and organization ID (active only) - case insensitive
     */
    List<UnifiedPDF> findByDeviceNameIgnoreCaseAndOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String deviceName, String organizationId);

    /**
     * Find PDFs by device name and organization ID (active only) - partial match
     */
    List<UnifiedPDF> findByDeviceNameContainingIgnoreCaseAndOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String deviceName, String organizationId);

    /**
     * Find PDFs by organization ID and document type (active only)
     */
    List<UnifiedPDF> findByOrganizationIdAndDocumentTypeAndDeletedFalseOrderByUploadedAtDesc(String organizationId, UnifiedPDF.DocumentType documentType);

    /**
     * Find PDFs by organization ID and processing status (active only)
     */
    List<UnifiedPDF> findByOrganizationIdAndProcessingStatusAndDeletedFalseOrderByUploadedAtDesc(String organizationId, UnifiedPDF.ProcessingStatus status);

    /**
     * Find PDFs by organization ID and vectorized status (active only)
     */
    List<UnifiedPDF> findByOrganizationIdAndVectorizedAndDeletedFalseOrderByUploadedAtDesc(String organizationId, Boolean vectorized);

    /**
     * Find PDF by name and organization ID (active only)
     */
    Optional<UnifiedPDF> findByNameAndOrganizationIdAndDeletedFalse(String name, String organizationId);

    /**
     * Find PDF by original filename and organization ID (active only)
     */
    Optional<UnifiedPDF> findByOriginalFilenameAndOrganizationIdAndDeletedFalse(String originalFilename, String organizationId);

    /**
     * Find PDFs by organization ID and device association (active only)
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND (p.deviceId IS NOT NULL OR p.deviceId != '') " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findDevicePDFsByOrganizationId(@Param("organizationId") String organizationId);

    /**
     * Find general PDFs (not device-specific) by organization ID (active only)
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND (p.deviceId IS NULL OR p.deviceId = '') " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findGeneralPDFsByOrganizationId(@Param("organizationId") String organizationId);

    /**
     * Find PDFs ready for queries (completed and vectorized) by organization ID
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND p.processingStatus = 'COMPLETED' " +
           "AND p.vectorized = true " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findReadyPDFsByOrganizationId(@Param("organizationId") String organizationId);

    /**
     * Find PDFs ready for queries by device ID
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.deviceId = :deviceId " +
           "AND p.deleted = false " +
           "AND p.processingStatus = 'COMPLETED' " +
           "AND p.vectorized = true " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findReadyPDFsByDeviceId(@Param("deviceId") String deviceId);

    /**
     * Count PDFs by organization ID (active only)
     */
    long countByOrganizationIdAndDeletedFalse(String organizationId);

    /**
     * Count PDFs by device ID (active only)
     */
    long countByDeviceIdAndDeletedFalse(String deviceId);

    /**
     * Count PDFs by organization ID and processing status (active only)
     */
    long countByOrganizationIdAndProcessingStatusAndDeletedFalse(String organizationId, UnifiedPDF.ProcessingStatus status);

    /**
     * Count PDFs by organization ID and vectorized status (active only)
     */
    long countByOrganizationIdAndVectorizedAndDeletedFalse(String organizationId, Boolean vectorized);

    /**
     * Find PDFs by organization ID and search term in filename or title (active only)
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND (LOWER(p.originalFilename) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(p.title) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findByOrganizationIdAndSearchTerm(@Param("organizationId") String organizationId, @Param("searchTerm") String searchTerm);

    /**
     * Find PDFs by organization ID and device name (active only)
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND LOWER(p.deviceName) LIKE LOWER(CONCAT('%', :deviceName, '%')) " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findByOrganizationIdAndDeviceName(@Param("organizationId") String organizationId, @Param("deviceName") String deviceName);

    /**
     * Soft delete PDFs by device ID
     */
    @Modifying
    @Query("UPDATE UnifiedPDF p SET p.deleted = true, p.deletedAt = :deletedAt " +
           "WHERE p.deviceId = :deviceId AND p.deleted = false")
    int softDeleteByDeviceId(@Param("deviceId") String deviceId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Soft delete PDFs by organization ID
     */
    @Modifying
    @Query("UPDATE UnifiedPDF p SET p.deleted = true, p.deletedAt = :deletedAt " +
           "WHERE p.organizationId = :organizationId AND p.deleted = false")
    int softDeleteByOrganizationId(@Param("organizationId") String organizationId, @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Update processing status by ID
     */
    @Modifying
    @Query("UPDATE UnifiedPDF p SET p.processingStatus = :status, p.updatedAt = :updatedAt " +
           "WHERE p.id = :id")
    int updateProcessingStatus(@Param("id") String id, @Param("status") UnifiedPDF.ProcessingStatus status, @Param("updatedAt") LocalDateTime updatedAt);

    /**
     * Update processing response details by ID
     */
    @Modifying
    @Query("UPDATE UnifiedPDF p SET p.processedChunks = :chunks, p.processingTime = :time, " +
           "p.collectionName = :collection, p.updatedAt = :updatedAt " +
           "WHERE p.id = :id")
    int updateProcessingResponse(@Param("id") String id, @Param("chunks") Integer chunks, 
                               @Param("time") String time, @Param("collection") String collection, 
                               @Param("updatedAt") LocalDateTime updatedAt);

    /**
     * Mark PDF as vectorized by ID
     */
    @Modifying
    @Query("UPDATE UnifiedPDF p SET p.vectorized = true, p.processedAt = :processedAt, " +
           "p.updatedAt = :updatedAt WHERE p.id = :id")
    int markAsVectorized(@Param("id") String id, @Param("processedAt") LocalDateTime processedAt, @Param("updatedAt") LocalDateTime updatedAt);

    /**
     * Find PDFs that need processing (pending or failed status)
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND p.processingStatus IN ('PENDING', 'FAILED') " +
           "ORDER BY p.uploadedAt ASC")
    List<UnifiedPDF> findPDFsNeedingProcessing(@Param("organizationId") String organizationId);

    /**
     * Find PDFs by collection name (for external service integration)
     */
    List<UnifiedPDF> findByCollectionNameAndDeletedFalse(String collectionName);

    /**
     * Find PDFs by organization ID and date range (active only)
     */
    @Query("SELECT p FROM UnifiedPDF p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false " +
           "AND p.uploadedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY p.uploadedAt DESC")
    List<UnifiedPDF> findByOrganizationIdAndDateRange(@Param("organizationId") String organizationId, 
                                                     @Param("startDate") LocalDateTime startDate, 
                                                     @Param("endDate") LocalDateTime endDate);
}
