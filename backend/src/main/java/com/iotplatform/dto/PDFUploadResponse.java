package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDateTime;

/**
 * Response DTO for PDF upload operations.
 * Contains metadata about the uploaded and processed PDF document.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
public class PDFUploadResponse {
    
    @JsonProperty("success")
    @NotNull(message = "Success status is required")
    private Boolean success;
    
    @JsonProperty("message")
    @NotBlank(message = "Response message is required")
    private String message;
    
    @JsonProperty("pdf_name")
    @NotBlank(message = "PDF name is required")
    private String pdfName;
    
    @JsonProperty("chunks_processed")
    @Positive(message = "Chunks processed must be positive")
    private Integer chunksProcessed;
    
    @JsonProperty("processing_time")
    @NotBlank(message = "Processing time is required")
    private String processingTime;
    
    @JsonProperty("collection_name")
    @NotBlank(message = "Collection name is required")
    private String collectionName;
    
    @JsonProperty("file_size")
    @Positive(message = "File size must be positive")
    private Long fileSize;
    
    @JsonProperty("uploaded_at")
    @NotNull(message = "Upload timestamp is required")
    private LocalDateTime uploadedAt;
    
    @JsonProperty("organization_id")
    @NotBlank(message = "Organization ID is required")
    private String organizationId;
    
    @JsonProperty("status")
    @NotBlank(message = "Processing status is required")
    private String status;
    
    // Default constructor for JSON deserialization
    public PDFUploadResponse() {}
    
    // Builder constructor
    public PDFUploadResponse(Boolean success, String message, String pdfName, 
                           Integer chunksProcessed, String processingTime, 
                           String collectionName, Long fileSize, 
                           LocalDateTime uploadedAt, String organizationId, String status) {
        this.success = success;
        this.message = message;
        this.pdfName = pdfName;
        this.chunksProcessed = chunksProcessed;
        this.processingTime = processingTime;
        this.collectionName = collectionName;
        this.fileSize = fileSize;
        this.uploadedAt = uploadedAt;
        this.organizationId = organizationId;
        this.status = status;
    }
    
    // Getters and Setters
    public Boolean getSuccess() {
        return success;
    }
    
    public void setSuccess(Boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getPdfName() {
        return pdfName;
    }
    
    public void setPdfName(String pdfName) {
        this.pdfName = pdfName;
    }
    
    public Integer getChunksProcessed() {
        return chunksProcessed;
    }
    
    public void setChunksProcessed(Integer chunksProcessed) {
        this.chunksProcessed = chunksProcessed;
    }
    
    public String getProcessingTime() {
        return processingTime;
    }
    
    public void setProcessingTime(String processingTime) {
        this.processingTime = processingTime;
    }
    
    public String getCollectionName() {
        return collectionName;
    }
    
    public void setCollectionName(String collectionName) {
        this.collectionName = collectionName;
    }
    
    public Long getFileSize() {
        return fileSize;
    }
    
    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
    
    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
    
    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
    
    public String getOrganizationId() {
        return organizationId;
    }
    
    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    @Override
    public String toString() {
        return "PDFUploadResponse{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", pdfName='" + pdfName + '\'' +
                ", chunksProcessed=" + chunksProcessed +
                ", processingTime='" + processingTime + '\'' +
                ", collectionName='" + collectionName + '\'' +
                ", fileSize=" + fileSize +
                ", uploadedAt=" + uploadedAt +
                ", organizationId='" + organizationId + '\'' +
                ", status='" + status + '\'' +
                '}';
    }
    
    /**
     * Builder class for PDFUploadResponse
     */
    public static class Builder {
        private Boolean success;
        private String message;
        private String pdfName;
        private Integer chunksProcessed;
        private String processingTime;
        private String collectionName;
        private Long fileSize;
        private LocalDateTime uploadedAt;
        private String organizationId;
        private String status;
        
        public Builder success(Boolean success) {
            this.success = success;
            return this;
        }
        
        public Builder message(String message) {
            this.message = message;
            return this;
        }
        
        public Builder pdfName(String pdfName) {
            this.pdfName = pdfName;
            return this;
        }
        
        public Builder chunksProcessed(Integer chunksProcessed) {
            this.chunksProcessed = chunksProcessed;
            return this;
        }
        
        public Builder processingTime(String processingTime) {
            this.processingTime = processingTime;
            return this;
        }
        
        public Builder collectionName(String collectionName) {
            this.collectionName = collectionName;
            return this;
        }
        
        public Builder fileSize(Long fileSize) {
            this.fileSize = fileSize;
            return this;
        }
        
        public Builder uploadedAt(LocalDateTime uploadedAt) {
            this.uploadedAt = uploadedAt;
            return this;
        }
        
        public Builder organizationId(String organizationId) {
            this.organizationId = organizationId;
            return this;
        }
        
        public Builder status(String status) {
            this.status = status;
            return this;
        }
        
        public PDFUploadResponse build() {
            return new PDFUploadResponse(success, message, pdfName, chunksProcessed, 
                                       processingTime, collectionName, fileSize, 
                                       uploadedAt, organizationId, status);
        }
    }
    
    public static Builder builder() {
        return new Builder();
    }
}
