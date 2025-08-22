package com.iotplatform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entity representing a PDF query interaction.
 * Stores user queries and AI responses for audit trails and analytics.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Entity
@Table(name = "pdf_queries", indexes = {
    @Index(name = "idx_pdf_query_doc_id", columnList = "pdf_document_id"),
    @Index(name = "idx_pdf_query_user_id", columnList = "user_id"),
    @Index(name = "idx_pdf_query_created_at", columnList = "created_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class PDFQuery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Reference to the PDF document that was queried
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pdf_document_id", nullable = false)
    private PDFDocument pdfDocument;

    /**
     * ID of the user who made the query
     */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /**
     * The user's query text
     */
    @Column(name = "user_query", nullable = false, columnDefinition = "TEXT")
    private String userQuery;

    /**
     * The AI-generated response
     */
    @Column(name = "ai_response", nullable = false, columnDefinition = "TEXT")
    private String aiResponse;

    /**
     * Chunks used to generate the response (comma-separated)
     */
    @Column(name = "chunks_used", columnDefinition = "TEXT")
    private String chunksUsed;

    /**
     * Processing time for the query
     */
    @Column(name = "processing_time", length = 100)
    private String processingTime;

    /**
     * Query status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private QueryStatus status;

    /**
     * Error message if query failed
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * Timestamp when the query was created
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Soft delete flag
     */
    @Column(name = "deleted", nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    /**
     * Timestamp when the record was soft deleted
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * Enum for query status
     */
    public enum QueryStatus {
        PENDING,
        PROCESSING,
        COMPLETED,
        FAILED
    }

    /**
     * Pre-persist hook to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = QueryStatus.PENDING;
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (deleted == null) {
            deleted = false;
        }
    }

    /**
     * Soft delete the query
     */
    public void softDelete() {
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * Check if the query is active (not deleted)
     */
    public boolean isActive() {
        return !deleted;
    }

    /**
     * Check if the query was successful
     */
    public boolean isSuccessful() {
        return status == QueryStatus.COMPLETED;
    }

    /**
     * Get the number of chunks used
     */
    public int getChunkCount() {
        if (chunksUsed == null || chunksUsed.trim().isEmpty()) {
            return 0;
        }
        return chunksUsed.split(",").length;
    }
}
