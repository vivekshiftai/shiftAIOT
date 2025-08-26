package com.iotplatform.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "device_documentation")
public class DeviceDocumentation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotNull
    @Column(name = "device_id", nullable = false)
    private String deviceId;
    
    @NotBlank
    @Size(max = 50)
    @Column(name = "document_type", nullable = false)
    private String documentType; // 'manual', 'datasheet', 'certificate'
    
    @NotBlank
    @Size(max = 255)
    @Column(name = "filename", nullable = false)
    private String filename;
    
    @NotBlank
    @Size(max = 255)
    @Column(name = "original_filename", nullable = false)
    private String originalFilename;
    
    @NotNull
    @Column(name = "file_size", nullable = false)
    private Long fileSize;
    
    @NotBlank
    @Size(max = 500)
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Size(max = 50)
    @Column(name = "processing_status")
    private String processingStatus = "PENDING"; // 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    
    @Column(name = "processing_summary")
    private String processingSummary;
    
    @Column(name = "total_pages")
    private Integer totalPages;
    
    @Column(name = "processed_chunks")
    private Integer processedChunks;
    
    @Size(max = 100)
    @Column(name = "processing_time")
    private String processingTime; // Store as string (e.g., "12.45s")
    
    @Size(max = 255)
    @Column(name = "collection_name")
    private String collectionName; // From external service response
    
    @Size(max = 255)
    @Column(name = "pdf_name")
    private String pdfName; // From external service response
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Constructors
    public DeviceDocumentation() {}
    
    public DeviceDocumentation(String deviceId, String documentType, String filename, String originalFilename, 
                              Long fileSize, String filePath) {
        this.deviceId = deviceId;
        this.documentType = documentType;
        this.filename = filename;
        this.originalFilename = originalFilename;
        this.fileSize = fileSize;
        this.filePath = filePath;
        this.processingStatus = "PENDING";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    
    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }
    
    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    
    public String getOriginalFilename() { return originalFilename; }
    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public String getProcessingStatus() { return processingStatus; }
    public void setProcessingStatus(String processingStatus) { this.processingStatus = processingStatus; }
    
    public String getProcessingSummary() { return processingSummary; }
    public void setProcessingSummary(String processingSummary) { this.processingSummary = processingSummary; }
    
    public Integer getTotalPages() { return totalPages; }
    public void setTotalPages(Integer totalPages) { this.totalPages = totalPages; }
    
    public Integer getProcessedChunks() { return processedChunks; }
    public void setProcessedChunks(Integer processedChunks) { this.processedChunks = processedChunks; }
    
    public String getProcessingTime() { return processingTime; }
    public void setProcessingTime(String processingTime) { this.processingTime = processingTime; }
    
    public String getCollectionName() { return collectionName; }
    public void setCollectionName(String collectionName) { this.collectionName = collectionName; }
    
    public String getPdfName() { return pdfName; }
    public void setPdfName(String pdfName) { this.pdfName = pdfName; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    // Method to update processing status and details from external service response
    public void updateFromProcessingResponse(String pdfName, Integer chunksProcessed, String processingTime, String collectionName) {
        this.pdfName = pdfName;
        this.processedChunks = chunksProcessed;
        this.processingTime = processingTime;
        this.collectionName = collectionName;
        this.processingStatus = "COMPLETED";
        this.updatedAt = LocalDateTime.now();
    }
    
    // Method to mark processing as failed
    public void markProcessingFailed(String errorMessage) {
        this.processingStatus = "FAILED";
        this.processingSummary = errorMessage;
        this.updatedAt = LocalDateTime.now();
    }
    
    // Method to mark processing as in progress
    public void markProcessingInProgress() {
        this.processingStatus = "PROCESSING";
        this.updatedAt = LocalDateTime.now();
    }
}
