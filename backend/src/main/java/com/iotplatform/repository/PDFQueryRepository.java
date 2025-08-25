package com.iotplatform.repository;

import com.iotplatform.model.PDFQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for PDF query operations.
 * Provides data access methods for query history and audit trails.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Repository
public interface PDFQueryRepository extends JpaRepository<PDFQuery, Long> {

    /**
     * Find queries by PDF document ID (active only)
     */
    List<PDFQuery> findByPdfDocumentIdAndDeletedFalseOrderByCreatedAtDesc(Long pdfDocumentId);

    /**
     * Find queries by PDF document ID with pagination (active only)
     */
    Page<PDFQuery> findByPdfDocumentIdAndDeletedFalseOrderByCreatedAtDesc(
        Long pdfDocumentId, Pageable pageable);

    /**
     * Find queries by user ID (active only)
     */
    List<PDFQuery> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(String userId);

    /**
     * Find queries by user ID with pagination (active only)
     */
    Page<PDFQuery> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(String userId, Pageable pageable);

    /**
     * Find queries by status (active only)
     */
    List<PDFQuery> findByStatusAndDeletedFalseOrderByCreatedAtDesc(PDFQuery.QueryStatus status);

    /**
     * Find queries by status and user ID (active only)
     */
    List<PDFQuery> findByStatusAndUserIdAndDeletedFalseOrderByCreatedAtDesc(
        PDFQuery.QueryStatus status, String userId);

    /**
     * Find queries by status and PDF document ID (active only)
     */
    List<PDFQuery> findByStatusAndPdfDocumentIdAndDeletedFalseOrderByCreatedAtDesc(
        PDFQuery.QueryStatus status, Long pdfDocumentId);

    /**
     * Count queries by PDF document ID (active only)
     */
    long countByPdfDocumentIdAndDeletedFalse(Long pdfDocumentId);

    /**
     * Count queries by user ID (active only)
     */
    long countByUserIdAndDeletedFalse(String userId);

    /**
     * Count queries by status (active only)
     */
    long countByStatusAndDeletedFalse(PDFQuery.QueryStatus status);

    /**
     * Find queries within a date range
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.deleted = false " +
           "AND q.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    /**
     * Find queries by user ID within a date range
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.userId = :userId " +
           "AND q.deleted = false AND q.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findByUserIdAndDateRange(
        @Param("userId") String userId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    /**
     * Find queries by PDF document ID within a date range
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.pdfDocument.id = :pdfDocumentId " +
           "AND q.deleted = false AND q.createdAt BETWEEN :startDate AND :endDate " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findByPdfDocumentIdAndDateRange(
        @Param("pdfDocumentId") Long pdfDocumentId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    /**
     * Find failed queries
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.deleted = false " +
           "AND q.status = 'FAILED' ORDER BY q.createdAt DESC")
    List<PDFQuery> findFailedQueries();

    /**
     * Find failed queries by user ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.userId = :userId " +
           "AND q.deleted = false AND q.status = 'FAILED' " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findFailedQueriesByUserId(@Param("userId") String userId);

    /**
     * Find failed queries by PDF document ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.pdfDocument.id = :pdfDocumentId " +
           "AND q.deleted = false AND q.status = 'FAILED' " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findFailedQueriesByPdfDocumentId(@Param("pdfDocumentId") Long pdfDocumentId);

    /**
     * Find queries with long processing times
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.deleted = false " +
           "AND q.processingTime IS NOT NULL " +
           "AND CAST(SUBSTRING(q.processingTime, 1, LOCATE(' ', q.processingTime) - 1) AS double) > :threshold " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findQueriesWithLongProcessingTime(@Param("threshold") double thresholdSeconds);

    /**
     * Find most recent queries
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.deleted = false " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findRecentQueries(Pageable pageable);

    /**
     * Find most recent queries by user ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.userId = :userId " +
           "AND q.deleted = false ORDER BY q.createdAt DESC")
    List<PDFQuery> findRecentQueriesByUserId(@Param("userId") String userId, Pageable pageable);

    /**
     * Find most recent queries by PDF document ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.pdfDocument.id = :pdfDocumentId " +
           "AND q.deleted = false ORDER BY q.createdAt DESC")
    List<PDFQuery> findRecentQueriesByPdfDocumentId(@Param("pdfDocumentId") Long pdfDocumentId, Pageable pageable);

    /**
     * Delete queries by PDF document ID
     */
    @Query("UPDATE PDFQuery q SET q.deleted = true, q.deletedAt = :deletedAt " +
           "WHERE q.pdfDocument.id = :pdfDocumentId AND q.deleted = false")
    int deleteByPdfDocumentId(
        @Param("pdfDocumentId") Long pdfDocumentId,
        @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Soft delete queries by user ID
     */
    @Modifying
    @Query("UPDATE PDFQuery q SET q.deleted = true, q.deletedAt = :deletedAt " +
           "WHERE q.userId = :userId AND q.deleted = false")
    int deleteByUserId(
        @Param("userId") String userId,
        @Param("deletedAt") LocalDateTime deletedAt);

    /**
     * Get query statistics
     */
    @Query("SELECT COUNT(q) as totalQueries, " +
           "COUNT(CASE WHEN q.status = 'COMPLETED' THEN 1 END) as successfulQueries, " +
           "COUNT(CASE WHEN q.status = 'FAILED' THEN 1 END) as failedQueries, " +
           "AVG(CAST(SUBSTRING(q.processingTime, 1, LOCATE(' ', q.processingTime) - 1) AS double)) as avgProcessingTime " +
           "FROM PDFQuery q WHERE q.deleted = false")
    Object[] getQueryStatistics();

    /**
     * Get query statistics by user ID
     */
    @Query("SELECT COUNT(q) as totalQueries, " +
           "COUNT(CASE WHEN q.status = 'COMPLETED' THEN 1 END) as successfulQueries, " +
           "COUNT(CASE WHEN q.status = 'FAILED' THEN 1 END) as failedQueries, " +
           "AVG(CAST(SUBSTRING(q.processingTime, 1, LOCATE(' ', q.processingTime) - 1) AS double)) as avgProcessingTime " +
           "FROM PDFQuery q WHERE q.userId = :userId AND q.deleted = false")
    Object[] getQueryStatisticsByUserId(@Param("userId") String userId);

    /**
     * Get query statistics by PDF document ID
     */
    @Query("SELECT COUNT(q) as totalQueries, " +
           "COUNT(CASE WHEN q.status = 'COMPLETED' THEN 1 END) as successfulQueries, " +
           "COUNT(CASE WHEN q.status = 'FAILED' THEN 1 END) as failedQueries, " +
           "AVG(CAST(SUBSTRING(q.processingTime, 1, LOCATE(' ', q.processingTime) - 1) AS double)) as avgProcessingTime " +
           "FROM PDFQuery q WHERE q.pdfDocument.id = :pdfDocumentId AND q.deleted = false")
    Object[] getQueryStatisticsByPdfDocumentId(@Param("pdfDocumentId") Long pdfDocumentId);

    /**
     * Find chat history by user ID and organization ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.userId = :userId " +
           "AND q.organizationId = :organizationId AND q.deleted = false " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findChatHistoryByUserIdAndOrganizationId(
        @Param("userId") String userId, 
        @Param("organizationId") String organizationId, 
        Pageable pageable);

    /**
     * Find chat history by user ID, device ID and organization ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.userId = :userId " +
           "AND q.deviceId = :deviceId AND q.organizationId = :organizationId " +
           "AND q.deleted = false ORDER BY q.createdAt DESC")
    List<PDFQuery> findChatHistoryByUserIdAndDeviceIdAndOrganizationId(
        @Param("userId") String userId, 
        @Param("deviceId") String deviceId,
        @Param("organizationId") String organizationId, 
        Pageable pageable);

    /**
     * Find chat history by device ID and organization ID
     */
    @Query("SELECT q FROM PDFQuery q WHERE q.deviceId = :deviceId " +
           "AND q.organizationId = :organizationId AND q.deleted = false " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findChatHistoryByDeviceIdAndOrganizationId(
        @Param("deviceId") String deviceId,
        @Param("organizationId") String organizationId, 
        Pageable pageable);

    /**
     * Find chat history by PDF name (through document relationship)
     */
    @Query("SELECT q FROM PDFQuery q JOIN q.pdfDocument d WHERE d.name = :pdfName " +
           "AND q.organizationId = :organizationId AND q.deleted = false " +
           "ORDER BY q.createdAt DESC")
    List<PDFQuery> findChatHistoryByPdfNameAndOrganizationId(
        @Param("pdfName") String pdfName,
        @Param("organizationId") String organizationId, 
        Pageable pageable);

    /**
     * Find queries by organization ID (active only)
     */
    List<PDFQuery> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(String organizationId);

    /**
     * Find queries by device ID (active only)
     */
    List<PDFQuery> findByDeviceIdAndDeletedFalseOrderByCreatedAtDesc(String deviceId);
    
    /**
     * Delete queries by device ID
     */
    @Query("UPDATE PDFQuery q SET q.deleted = true, q.deletedAt = :deletedAt " +
           "WHERE q.deviceId = :deviceId AND q.deleted = false")
    int deleteByDeviceId(
        @Param("deviceId") String deviceId,
        @Param("deletedAt") LocalDateTime deletedAt);
}
