package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from PDF upload operation.
 */

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PDFUploadResponse {
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
    
    // Explicit getter methods in case Lombok fails
    public boolean isSuccess() {
        return success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public String getPdfName() {
        return pdfName;
    }
    
    public Integer getChunksProcessed() {
        return chunksProcessed;
    }
    
    public String getProcessingTime() {
        return processingTime;
    }
    
    public String getCollectionName() {
        return collectionName;
    }
}
