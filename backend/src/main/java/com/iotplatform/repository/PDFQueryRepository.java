package com.iotplatform.repository;

import com.iotplatform.model.PDFQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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
    List<PDFQuery> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId);

    /**
     * Find queries by user ID with pagination (active only)
     */
    Page<PDFQuery> findByUserIdAndDeletedFalseOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /**
     * Find queries by status (active only)
     */
    List<PDFQuery> findByStatusAndDeletedFalseOrderByCreatedAtDesc(PDFQuery.QueryStatus status);

    /**
     * Find queries by status and user ID (active only)
     */
    List<PDFQuery> findByStatusAndUserIdAndDeletedFalseOrderByCreatedAtDesc(
        PDFQuery.QueryStatus status, Long userId);

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
    long countByUserIdAndDeletedFalse(Long userId);

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
        @Param("userId") Long userId,
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
    List<PDFQuery> findFailedQueriesByUserId(@Param("userId") Long userId);

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
    List<PDFQuery> findRecentQueriesByUserId(@Param("userId") Long userId, Pageable pageable);

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
     * Delete queries by user ID
     */
    @Query("UPDATE PDFQuery q SET q.deleted = true, q.deletedAt = :deletedAt " +
           "WHERE q.userId = :userId AND q.deleted = false")
    int deleteByUserId(
        @Param("userId") Long userId,
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
    Object[] getQueryStatisticsByUserId(@Param("userId") Long userId);

    /**
     * Get query statistics by PDF document ID
     */
    @Query("SELECT COUNT(q) as totalQueries, " +
           "COUNT(CASE WHEN q.status = 'COMPLETED' THEN 1 END) as successfulQueries, " +
           "COUNT(CASE WHEN q.status = 'FAILED' THEN 1 END) as failedQueries, " +
           "AVG(CAST(SUBSTRING(q.processingTime, 1, LOCATE(' ', q.processingTime) - 1) AS double)) as avgProcessingTime " +
           "FROM PDFQuery q WHERE q.pdfDocument.id = :pdfDocumentId AND q.deleted = false")
    Object[] getQueryStatisticsByPdfDocumentId(@Param("pdfDocumentId") Long pdfDocumentId);
}
