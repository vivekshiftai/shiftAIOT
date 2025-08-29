package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response wrapper for async operations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AsyncResponse<T> {
    @JsonProperty("task_id")
    private String taskId;
    
    private String status; // PENDING, PROCESSING, COMPLETED, FAILED
    
    private T result;
    
    private String error;
    
    @JsonProperty("created_at")
    private String createdAt;
    
    @JsonProperty("completed_at")
    private String completedAt;
    
    // Additional getter methods for compatibility
    public String getTaskId() {
        return taskId;
    }
    
    public void setTaskId(String taskId) {
        this.taskId = taskId;
    }
    
    // Static builder methods for different response types
    public static <T> AsyncResponseBuilder<T> builder() {
        return new AsyncResponseBuilder<T>();
    }
}
