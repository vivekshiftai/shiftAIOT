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
    
    // Explicit getter methods in case Lombok fails
    public boolean isSuccess() {
        return success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public List<SafetyPrecaution> getSafetyPrecautions() {
        return safetyPrecautions;
    }
    
    public List<SafetyPrecaution> getSafetyInformation() {
        return safetyInformation;
    }
    
    public String getProcessingTime() {
        return processingTime;
    }
    
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
        
        @JsonProperty("type")
        private String type;
        
        @JsonProperty("recommended_action")
        private String recommendedAction;
        
        // Explicit getter methods in case Lombok fails
        public String getTitle() {
            return title;
        }
        
        public String getDescription() {
            return description;
        }
        
        public String getCategory() {
            return category;
        }
        
        public String getSeverity() {
            return severity;
        }
        
        public String getMitigation() {
            return mitigation;
        }
        
        public String getAboutReaction() {
            return aboutReaction;
        }
        
        public String getCauses() {
            return causes;
        }
        
        public String getHowToAvoid() {
            return howToAvoid;
        }
        
        public String getSafetyInfo() {
            return safetyInfo;
        }
        
        public String getType() {
            return type;
        }
        
        public String getRecommendedAction() {
            return recommendedAction;
        }
    }
}
