package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for listing PDF documents.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PDFListResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("pdfs")
    private List<PDFDocument> pdfs;
    
    @JsonProperty("total")
    private int total;
    
    @JsonProperty("total_count")
    private int totalCount;
    
    @JsonProperty("page")
    private int page;
    
    @JsonProperty("size")
    private int size;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PDFDocument {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("uploaded_at")
        private String uploadedAt;
        
        @JsonProperty("file_size")
        private Long fileSize;
        
        @JsonProperty("status")
        private String status;
    }
}
