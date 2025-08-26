package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for safety generation operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyGenerationResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("safety_precautions")
    private List<SafetyPrecaution> safetyPrecautions;
    
    @JsonProperty("safety_information")
    private List<SafetyPrecaution> safetyInformation;
    
    @JsonProperty("processing_time")
    private String processingTime;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SafetyPrecaution {
        @JsonProperty("title")
        private String title;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("category")
        private String category;
        
        @JsonProperty("severity")
        private String severity;
        
        @JsonProperty("mitigation")
        private String mitigation;
        
        @JsonProperty("about_reaction")
        private String aboutReaction;
        
        @JsonProperty("causes")
        private String causes;
        
        @JsonProperty("how_to_avoid")
        private String howToAvoid;
        
        @JsonProperty("safety_info")
        private String safetyInfo;
    }
}
