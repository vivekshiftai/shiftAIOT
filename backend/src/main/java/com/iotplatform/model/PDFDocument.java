package com.iotplatform.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Entity representing a PDF document in the system.
 * Stores metadata about uploaded PDF files and their processing status.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Entity
@Table(name = "pdf_documents", indexes = {
    @Index(name = "idx_pdf_org_id", columnList = "organization_id"),
    @Index(name = "idx_pdf_name_org", columnList = "name, organization_id"),
    @Index(name = "idx_pdf_uploaded_at", columnList = "uploaded_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class PDFDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Name of the PDF as returned by the processing service
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Original filename as uploaded by the user
     */
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    /**
     * File size in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Number of chunks processed by the AI service
     */
    @Column(name = "chunks_processed")
    private Integer chunksProcessed;

    /**
     * Processing time reported by the external service
     */
    @Column(name = "processing_time", length = 100)
    private String processingTime;

    /**
     * Collection name in the vector database
     */
    @Column(name = "collection_name", length = 255)
    private String collectionName;

    /**
     * Current status of the PDF document
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 50)
    private PDFStatus status;

    /**
     * Organization ID for data isolation
     */
    @Column(name = "organization_id", nullable = false, length = 255)
    private String organizationId;

    /**
     * Timestamp when the PDF was uploaded
     */
    @CreatedDate
    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    /**
     * Timestamp when the PDF was processed
     */
    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    /**
     * Timestamp when the record was last modified
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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
     * Enum for PDF document status
     */
    public enum PDFStatus {
        UPLOADING,
        PROCESSING,
        COMPLETED,
        FAILED,
        DELETED
    }

    /**
     * Pre-persist hook to set default values
     */
    @PrePersist
    protected void onCreate() {
        if (status == null) {
            status = PDFStatus.UPLOADING;
        }
        if (uploadedAt == null) {
            uploadedAt = LocalDateTime.now();
        }
        if (deleted == null) {
            deleted = false;
        }
    }

    /**
     * Pre-update hook to set updated timestamp
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Soft delete the document
     */
    public void softDelete() {
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
        this.status = PDFStatus.DELETED;
    }

    /**
     * Check if the document is active (not deleted)
     */
    public boolean isActive() {
        return !deleted;
    }

    /**
     * Check if the document is completed and ready for querying
     */
    public boolean isReadyForQuery() {
        return status == PDFStatus.COMPLETED && isActive();
    }
}
