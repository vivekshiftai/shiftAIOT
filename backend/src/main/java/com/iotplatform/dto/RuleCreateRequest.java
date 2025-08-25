package com.iotplatform.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class RuleCreateRequest {
    
    @NotBlank
    @Size(max = 100)
    private String name;
    
    @Size(max = 500)
    private String description;
    
    @NotNull
    private boolean active = true;
    
    private String deviceId; // Add device ID field
    
    @NotNull
    private List<RuleConditionRequest> conditions;
    
    @NotNull
    private List<RuleActionRequest> actions;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public List<RuleConditionRequest> getConditions() { return conditions; }
    public void setConditions(List<RuleConditionRequest> conditions) { this.conditions = conditions; }

    public List<RuleActionRequest> getActions() { return actions; }
    public void setActions(List<RuleActionRequest> actions) { this.actions = actions; }
    
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
