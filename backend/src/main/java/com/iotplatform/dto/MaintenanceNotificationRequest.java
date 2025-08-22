package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * DTO for maintenance notification requests sent to the conversation flow endpoint.
 * This represents the formatted message structure for daily maintenance reminders.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceNotificationRequest {
    
    @JsonProperty("userId")
    private String userId;
    
    @JsonProperty("deviceName")
    private String deviceName;
    
    @JsonProperty("task")
    private String task;
    
    @JsonProperty("dueTime")
    @JsonFormat(pattern = "HH:mm a")
    private LocalTime dueTime;
    
    @JsonProperty("priority")
    private String priority;
    
    @JsonProperty("maintenanceType")
    private String maintenanceType;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("assignedTo")
    private String assignedTo;
    
    @JsonProperty("organizationId")
    private String organizationId;
}
