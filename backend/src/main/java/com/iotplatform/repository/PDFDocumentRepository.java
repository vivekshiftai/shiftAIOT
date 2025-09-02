package com.iotplatform.repository;

import com.iotplatform.model.PDFDocument;
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
 * Repository for PDF document operations.
 * Provides data access methods for PDF document management.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Repository
public interface PDFDocumentRepository extends JpaRepository<PDFDocument, Long> {

    /**
     * Find PDF document by name and organization ID
     */
    Optional<PDFDocument> findByNameAndOrganizationId(String name, String organizationId);

    /**
     * Find PDF document by name and organization ID (active only)
     */
    Optional<PDFDocument> findByNameAndOrganizationIdAndDeletedFalse(String name, String organizationId);

    /**
     * Find all PDF documents for an organization with pagination (active only)
     */
    Page<PDFDocument> findByOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(
        String organizationId, Pageable pageable);

    /**
     * Find all PDF documents for an organization (active only)
     */
    List<PDFDocument> findByOrganizationIdAndDeletedFalseOrderByUploadedAtDesc(String organizationId);



    /**
     * Find PDF documents by status and organization
     */
    List<PDFDocument> findByStatusAndOrganizationIdAndDeletedFalse(
        PDFDocument.PDFStatus status, String organizationId);

    /**
     * Count PDF documents by organization (active only)
     */
    long countByOrganizationIdAndDeletedFalse(String organizationId);

    /**
     * Count PDF documents by status and organization (active only)
     */
    long countByStatusAndOrganizationIdAndDeletedFalse(PDFDocument.PDFStatus status, String organizationId);

    /**
     * Find PDF documents uploaded within a date range
     */
    @Query("SELECT p FROM PDFDocument p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false AND p.uploadedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY p.uploadedAt DESC")
    List<PDFDocument> findByOrganizationIdAndUploadDateRange(
        @Param("organizationId") String organizationId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    /**
     * Find PDF documents by filename pattern
     */
    @Query("SELECT p FROM PDFDocument p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false AND p.originalFilename LIKE %:filenamePattern% " +
           "ORDER BY p.uploadedAt DESC")
    List<PDFDocument> findByOrganizationIdAndFilenamePattern(
        @Param("organizationId") String organizationId,
        @Param("filenamePattern") String filenamePattern);

    /**
     * Find PDF documents with processing errors
     */
    @Query("SELECT p FROM PDFDocument p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false AND p.status = 'FAILED' " +
           "ORDER BY p.uploadedAt DESC")
    List<PDFDocument> findFailedDocumentsByOrganization(
        @Param("organizationId") String organizationId);

    /**
     * Find PDF documents that are still processing
     */
    @Query("SELECT p FROM PDFDocument p WHERE p.organizationId = :organizationId " +
           "AND p.deleted = false AND p.status IN ('UPLOADING', 'PROCESSING') " +
           "ORDER BY p.uploadedAt DESC")
    List<PDFDocument> findProcessingDocumentsByOrganization(
        @Param("organizationId") String organizationId);

    /**
     * Find all PDF documents for an organization with pagination
     */
    Page<PDFDocument> findByOrganizationIdOrderByUploadedAtDesc(String organizationId, Pageable pageable);

    /**
     * Find PDF documents by collection name
     */
    List<PDFDocument> findByCollectionNameAndOrganizationIdAndDeletedFalse(
        String collectionName, String organizationId);

    /**
     * Check if a PDF document exists by name and organization
     */
    boolean existsByNameAndOrganizationIdAndDeletedFalse(String name, String organizationId);

    /**
     * Soft delete all PDF documents for an organization
     */
    @Modifying
    @Query("UPDATE PDFDocument p SET p.deleted = true, p.deletedAt = :deletedAt " +
           "WHERE p.organizationId = :organizationId AND p.deleted = false")
    int softDeleteAllByOrganizationId(
        @Param("organizationId") String organizationId,
        @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Get storage statistics for an organization
     */
    @Query("SELECT COUNT(p) as totalDocuments, " +
           "SUM(p.fileSize) as totalSize, " +
           "AVG(p.fileSize) as averageSize, " +
           "SUM(p.chunksProcessed) as totalChunks " +
           "FROM PDFDocument p " +
           "WHERE p.organizationId = :organizationId AND p.deleted = false")
    Object[] getStorageStatistics(@Param("organizationId") String organizationId);
}
