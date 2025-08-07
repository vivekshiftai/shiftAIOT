package com.iotplatform.dto;

import java.util.Map;

import jakarta.validation.constraints.NotBlank;

public class RuleActionRequest {
    
    private String id;
    
    @NotBlank
    private String type;
    
    private Map<String, String> config;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Map<String, String> getConfig() { return config; }
    public void setConfig(Map<String, String> config) { this.config = config; }
}
