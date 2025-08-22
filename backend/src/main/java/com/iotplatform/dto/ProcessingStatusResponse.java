package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response for processing status operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessingStatusResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("operation_id")
    private String operationId;
    
    @JsonProperty("status")
    private String status;
    
    @JsonProperty("progress")
    private int progress;
    
    @JsonProperty("result")
    private Object result;
    
    @JsonProperty("error")
    private String error;
}
