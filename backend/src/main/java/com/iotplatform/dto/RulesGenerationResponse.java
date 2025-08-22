package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for rules generation operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RulesGenerationResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("rules")
    private List<Rule> rules;
    
    @JsonProperty("processing_time")
    private String processingTime;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Rule {
        @JsonProperty("name")
        private String name;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("metric")
        private String metric;
        
        @JsonProperty("metric_value")
        private String metricValue;
        
        @JsonProperty("threshold")
        private String threshold;
        
        @JsonProperty("consequence")
        private String consequence;
        
        @JsonProperty("condition")
        private String condition;
        
        @JsonProperty("action")
        private String action;
        
        @JsonProperty("priority")
        private String priority;
    }
}
