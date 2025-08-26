package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response for maintenance generation operation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceGenerationResponse {
    @JsonProperty("success")
    private boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("maintenance_tasks")
    private List<MaintenanceTask> maintenanceTasks;
    
    @JsonProperty("processing_time")
    private String processingTime;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MaintenanceTask {
        @JsonProperty("task_name")
        private String taskName;
        
        @JsonProperty("description")
        private String description;
        
        @JsonProperty("frequency")
        private String frequency;
        
        @JsonProperty("priority")
        private String priority;
        
        @JsonProperty("estimated_duration")
        private String estimatedDuration;
        
        @JsonProperty("required_tools")
        private String requiredTools;
        
        @JsonProperty("category")
        private String category;
        
        @JsonProperty("safety_notes")
        private String safetyNotes;
    }
}
