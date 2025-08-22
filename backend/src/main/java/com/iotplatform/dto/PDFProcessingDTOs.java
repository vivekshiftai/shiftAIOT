package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * DTOs for PDF processing operations.
 * Contains all request and response objects for PDF upload, query, generation, and management.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
public class PDFProcessingDTOs {

    /**
     * Request for uploading a PDF file to the processing service.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFUploadRequest {
        @NotNull(message = "File is required")
        private Object file; // MultipartFile in controller
        
        @NotBlank(message = "Organization ID is required")
        @Size(max = 255, message = "Organization ID must not exceed 255 characters")
        private String organizationId;
    }

    /**
     * Response from PDF upload operation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFUploadResponse {
        @JsonProperty("success")
        private boolean success;
        
        @JsonProperty("message")
        private String message;
        
        @JsonProperty("pdf_name")
        private String pdfName;
        
        @JsonProperty("chunks_processed")
        private Integer chunksProcessed;
        
        @JsonProperty("processing_time")
        private String processingTime;
        
        @JsonProperty("collection_name")
        private String collectionName;
    }

    /**
     * Request for querying a PDF document with natural language.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFQueryRequest {
        @NotBlank(message = "PDF name is required")
        @Size(max = 255, message = "PDF name must not exceed 255 characters")
        @JsonProperty("pdf_name")
        private String pdfName;
        
        @NotBlank(message = "Query text is required")
        @Size(max = 1000, message = "Query text must not exceed 1000 characters")
        private String query;
        
        @JsonProperty("top_k")
        private Integer topK = 5;
    }

    /**
     * Response from PDF query operation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFQueryResponse {
        @JsonProperty("success")
        private boolean success;
        
        @JsonProperty("message")
        private String message;
        
        private String response;
        
        @JsonProperty("chunks_used")
        private List<String> chunksUsed;
        
        private List<PDFImage> images;
        
        private List<String> tables;
        
        @JsonProperty("processing_time")
        private String processingTime;
    }

    /**
     * PDF image information extracted from documents.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFImage {
        private String filename;
        private String data; // Base64 encoded
        @JsonProperty("mime_type")
        private String mimeType;
        private Long size;
    }

    /**
     * Response for listing PDF documents.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFListResponse {
        private boolean success;
        private List<PDFDocumentInfo> pdfs;
        @JsonProperty("total_count")
        private Integer totalCount;
        @JsonProperty("current_page")
        private Integer currentPage;
        @JsonProperty("total_pages")
        private Integer totalPages;
    }

    /**
     * Information about a PDF document.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFDocumentInfo {
        @JsonProperty("collection_name")
        private String collectionName;
        
        @JsonProperty("pdf_name")
        private String pdfName;
        
        @JsonProperty("created_at")
        private String createdAt;
        
        @JsonProperty("chunk_count")
        private Integer chunkCount;
    }

    /**
     * IoT Rule generated from PDF content.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IoTRule {
        @JsonProperty("rule_name")
        private String ruleName;
        
        private String threshold;
        private String metric;
        @JsonProperty("metric_value")
        private String metricValue;
        private String description;
        private String consequence;
    }

    /**
     * Maintenance task generated from PDF content.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceTask {
        private String task;
        private String frequency;
        private String category;
        private String description;
        private String priority;
        @JsonProperty("estimated_duration")
        private String estimatedDuration;
        @JsonProperty("required_tools")
        private String requiredTools;
        @JsonProperty("safety_notes")
        private String safetyNotes;
    }

    /**
     * Safety information generated from PDF content.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyInformation {
        private String name;
        @JsonProperty("about_reaction")
        private String aboutReaction;
        private String causes;
        @JsonProperty("how_to_avoid")
        private String howToAvoid;
        @JsonProperty("safety_info")
        private String safetyInfo;
    }

    /**
     * Response from IoT rules generation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RulesGenerationResponse {
        private boolean success;
        @JsonProperty("pdf_name")
        private String pdfName;
        private List<IoTRule> rules;
        @JsonProperty("processing_time")
        private String processingTime;
    }

    /**
     * Response from maintenance schedule generation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceGenerationResponse {
        private boolean success;
        @JsonProperty("pdf_name")
        private String pdfName;
        @JsonProperty("maintenance_tasks")
        private List<MaintenanceTask> maintenanceTasks;
        @JsonProperty("processing_time")
        private String processingTime;
    }

    /**
     * Response from safety information generation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyGenerationResponse {
        private boolean success;
        @JsonProperty("pdf_name")
        private String pdfName;
        @JsonProperty("safety_information")
        private List<SafetyInformation> safetyInformation;
        @JsonProperty("processing_time")
        private String processingTime;
    }

    /**
     * Response from PDF deletion operation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFDeleteResponse {
        private boolean success;
        private String message;
        @JsonProperty("pdf_name")
        private String pdfName;
        @JsonProperty("deleted_at")
        private String deletedAt;
    }

    /**
     * Response from health check operation.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthCheckResponse {
        private String status;
        private String service;
        private String version;
        private HealthComponents components;
    }

    /**
     * Health check components information.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthComponents {
        private String upload;
        private String query;
        private String pdfs;
        private String rules;
        private String maintenance;
        private String safety;
    }

    /**
     * Request for generating content from PDF (rules, maintenance, safety).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFGenerationRequest {
        @NotBlank(message = "PDF name is required")
        @Size(max = 255, message = "PDF name must not exceed 255 characters")
        @JsonProperty("pdf_name")
        private String pdfName;
        
        @NotBlank(message = "Device ID is required")
        @Size(max = 255, message = "Device ID must not exceed 255 characters")
        @JsonProperty("device_id")
        private String deviceId;
        
        @NotBlank(message = "Organization ID is required")
        @Size(max = 255, message = "Organization ID must not exceed 255 characters")
        @JsonProperty("organization_id")
        private String organizationId;
    }

    /**
     * Response wrapper for async operations.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AsyncResponse<T> {
        private String taskId;
        private String status; // PENDING, PROCESSING, COMPLETED, FAILED
        private T result;
        private String error;
        @JsonProperty("created_at")
        private String createdAt;
        @JsonProperty("completed_at")
        private String completedAt;
    }

    /**
     * Request for checking async task status.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskStatusRequest {
        @NotBlank(message = "Task ID is required")
        @Size(max = 255, message = "Task ID must not exceed 255 characters")
        @JsonProperty("task_id")
        private String taskId;
    }
}
