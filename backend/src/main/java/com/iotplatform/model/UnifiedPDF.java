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
 * Unified PDF Document Entity - Single source of truth for all PDFs in the system.
 * Consolidates device documentation, knowledge documents, and general PDF storage.
 * 
 * @author IoT Platform Team
 * @version 2.0
 */
@Entity
@Table(name = "unified_pdfs", indexes = {
    @Index(name = "idx_unified_pdfs_org_id", columnList = "organization_id"),
    @Index(name = "idx_unified_pdfs_device_id", columnList = "device_id"),
    @Index(name = "idx_unified_pdfs_name_org", columnList = "name, organization_id"),
    @Index(name = "idx_unified_pdfs_uploaded_at", columnList = "uploaded_at"),
    @Index(name = "idx_unified_pdfs_status", columnList = "processing_status"),
    @Index(name = "idx_unified_pdfs_deleted", columnList = "deleted"),
    @Index(name = "idx_unified_pdfs_type", columnList = "document_type")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class UnifiedPDF {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /**
     * PDF name as returned by the external processing service
     */
    @Column(name = "name", nullable = false, length = 255)
    private String name;

    /**
     * Original filename as uploaded by the user
     */
    @Column(name = "original_filename", nullable = false, length = 255)
    private String originalFilename;

    /**
     * Document title/description
     */
    @Column(name = "title", length = 255)
    private String title;

    /**
     * Type of document: 'manual', 'datasheet', 'certificate', 'general'
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 50)
    private DocumentType documentType;

    /**
     * File size in bytes
     */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * Path to stored file or 'external_service' if stored externally
     */
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    /**
     * Current processing status
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "processing_status", nullable = false, length = 50)
    @Builder.Default
    private ProcessingStatus processingStatus = ProcessingStatus.PENDING;

    /**
     * Summary of processing results
     */
    @Column(name = "processing_summary", columnDefinition = "TEXT")
    private String processingSummary;

    /**
     * Total number of pages in the PDF
     */
    @Column(name = "total_pages")
    private Integer totalPages;

    /**
     * Number of chunks processed by AI service
     */
    @Column(name = "processed_chunks")
    private Integer processedChunks;

    /**
     * Processing time reported by external service
     */
    @Column(name = "processing_time", length = 100)
    private String processingTime;

    /**
     * Collection name in vector database
     */
    @Column(name = "collection_name", length = 255)
    private String collectionName;

    /**
     * Whether the PDF has been vectorized
     */
    @Column(name = "vectorized", nullable = false)
    @Builder.Default
    private Boolean vectorized = false;

    /**
     * Associated device ID (nullable for general documents)
     */
    @Column(name = "device_id", length = 255)
    private String deviceId;

    /**
     * Stored device name for display purposes
     */
    @Column(name = "device_name", length = 255)
    private String deviceName;

    /**
     * Organization ID for data isolation
     */
    @Column(name = "organization_id", nullable = false, length = 255)
    private String organizationId;

    /**
     * User who uploaded the PDF
     */
    @Column(name = "uploaded_by", length = 255)
    private String uploadedBy;

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
    @Column(name = "updated_at", nullable = false)
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
     * Document type enumeration
     */
    public enum DocumentType {
        MANUAL("manual"),
        DATASHEET("datasheet"),
        CERTIFICATE("certificate"),
        GENERAL("general");

        private final String value;

        DocumentType(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static DocumentType fromString(String text) {
            for (DocumentType type : DocumentType.values()) {
                if (type.value.equalsIgnoreCase(text)) {
                    return type;
                }
            }
            return GENERAL; // Default fallback
        }
    }

    /**
     * Processing status enumeration
     */
    public enum ProcessingStatus {
        PENDING("PENDING"),
        PROCESSING("PROCESSING"),
        COMPLETED("COMPLETED"),
        FAILED("FAILED");

        private final String value;

        ProcessingStatus(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static ProcessingStatus fromString(String text) {
            for (ProcessingStatus status : ProcessingStatus.values()) {
                if (status.value.equalsIgnoreCase(text)) {
                    return status;
                }
            }
            return PENDING; // Default fallback
        }
    }

    /**
     * Check if this PDF is associated with a device
     */
    public boolean isDeviceSpecific() {
        return deviceId != null && !deviceId.trim().isEmpty();
    }

    /**
     * Check if this PDF is ready for queries
     */
    public boolean isReadyForQueries() {
        return ProcessingStatus.COMPLETED.equals(processingStatus) && vectorized;
    }

    /**
     * Get display name for UI (device name + PDF name if device-specific)
     */
    public String getDisplayName() {
        if (isDeviceSpecific() && deviceName != null) {
            return String.format("%s - %s", deviceName, originalFilename);
        }
        return originalFilename;
    }
}
