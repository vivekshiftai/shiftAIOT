package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response from PDF query operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PDFQueryResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("response")
    private String response;
    
    @JsonProperty("chunks_used")
    private String[] chunksUsed;
    
    @JsonProperty("processing_time")
    private String processingTime;
}
