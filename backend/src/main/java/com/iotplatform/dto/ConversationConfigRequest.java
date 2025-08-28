package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class ConversationConfigRequest {
    
    @NotBlank
    @JsonProperty("platformName")
    private String platformName;
    
    @NotBlank
    @JsonProperty("platformType")
    private String platformType;
    
    @NotNull(message = "Credentials cannot be null")
    @JsonProperty("credentials")
    private Map<String, Object> credentials;
    
    @JsonProperty("isActive")
    private boolean isActive = true;

    // Getters and Setters
    public String getPlatformName() { return platformName; }
    public void setPlatformName(String platformName) { this.platformName = platformName; }

    public String getPlatformType() { return platformType; }
    public void setPlatformType(String platformType) { this.platformType = platformType; }

    public Map<String, Object> getCredentials() { return credentials; }
    public void setCredentials(Map<String, Object> credentials) { this.credentials = credentials; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }
}
