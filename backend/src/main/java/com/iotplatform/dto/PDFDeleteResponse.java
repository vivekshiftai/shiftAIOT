package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for PDF deletion operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PDFDeleteResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("deleted_pdf")
    private String deletedPdf;
    
    @JsonProperty("processing_time")
    private String processingTime;
}
