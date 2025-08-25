package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Standard error response for API endpoints.
 * Provides consistent error message format across all endpoints.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    
    @JsonProperty("detail")
    private String detail;
    
    /**
     * Creates an error response with the given detail message.
     * 
     * @param detail The error detail message
     * @return ErrorResponse instance
     */
    public static ErrorResponse of(String detail) {
        return ErrorResponse.builder()
            .detail(detail)
            .build();
    }
}
