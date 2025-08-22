package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Information about a PDF document.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PDFDocumentInfo {
    @JsonProperty("collection_name")
    private String collectionName;
    
    @JsonProperty("pdf_name")
    private String pdfName;
    
    @JsonProperty("created_at")
    private String createdAt;
    
    @JsonProperty("chunk_count")
    private Integer chunkCount;
    
    @JsonProperty("file_size")
    private Long fileSize;
    
    @JsonProperty("status")
    private String status;
}
