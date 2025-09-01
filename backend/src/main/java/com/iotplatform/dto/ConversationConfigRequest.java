package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;
import java.util.Arrays;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.iotplatform.model.PlatformType;

public class ConversationConfigRequest {
    
    @NotBlank(message = "Platform name cannot be blank")
    @JsonProperty("platformName")
    private String platformName;
    
    @NotBlank(message = "Platform type cannot be blank")
    @JsonProperty("platformType")
    private String platformType;
    
    @NotNull(message = "Credentials cannot be null")
    @JsonProperty("credentials")
    private Map<String, Object> credentials;
    
    @JsonProperty("isActive")
    private boolean isActive = true;

    // Validation method to ensure credentials are properly formatted
    public void validateCredentials() {
        if (credentials == null || credentials.isEmpty()) {
            throw new IllegalArgumentException("Credentials cannot be null or empty");
        }
        
        // Validate platform type
        if (!PlatformType.isValid(platformType)) {
            throw new IllegalArgumentException("Invalid platform type: " + platformType + 
                ". Supported types: " + String.join(", ", Arrays.stream(PlatformType.values())
                    .map(PlatformType::getValue).toArray(String[]::new)));
        }
        
        PlatformType type = PlatformType.fromString(platformType);
        
        // Validate that credentials contain required fields based on platform type
        switch (type) {
            case SLACK:
                if (!credentials.containsKey("token") || !credentials.containsKey("channel")) {
                    throw new IllegalArgumentException("Slack credentials must contain 'token' and 'channel' fields");
                }
                break;
            case GMAIL:
                if (!credentials.containsKey("token") || !credentials.containsKey("refresh_token")) {
                    throw new IllegalArgumentException("Gmail credentials must contain 'token' and 'refresh_token' fields");
                }
                break;
            case TEAMS:
            case GOOGLE_CHAT:
                if (!credentials.containsKey("webhook_url")) {
                    throw new IllegalArgumentException(type.getDisplayName() + " credentials must contain 'webhook_url' field");
                }
                break;
            case SMS:
                if (!credentials.containsKey("api_key") || !credentials.containsKey("phone_number")) {
                    throw new IllegalArgumentException("SMS credentials must contain 'api_key' and 'phone_number' fields");
                }
                break;
        }
    }

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
