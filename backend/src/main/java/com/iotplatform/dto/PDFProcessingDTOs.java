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
 * Contains request objects and unique response objects for PDF processing.
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
        @Builder.Default
        private Integer topK = 5;
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
        @JsonProperty("task_name")
        private String taskName;
        
        private String description;
        private String frequency;
        private String priority;
        @JsonProperty("estimated_duration")
        private String estimatedDuration;
        @JsonProperty("required_tools")
        private String requiredTools;
        @JsonProperty("last_maintenance")
        private String lastMaintenance;
    }

    /**
     * Safety precaution generated from PDF content.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyPrecaution {
        private String title;
        private String description;
        private String category;
        private String severity;
        private String mitigation;
    }
}
