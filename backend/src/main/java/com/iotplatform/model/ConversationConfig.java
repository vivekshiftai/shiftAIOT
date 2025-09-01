package com.iotplatform.model;

import java.time.LocalDateTime;
import java.util.Map;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

import com.iotplatform.config.JsonConverter;

@Entity
@Table(name = "conversation_configs")
public class ConversationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "platform_name", nullable = false)
    private String platformName;

    @Column(name = "platform_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private PlatformType platformType;

    @Column(name = "credentials", nullable = false, columnDefinition = "JSONB")
    @Convert(converter = JsonConverter.class)
    private Map<String, Object> credentials;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        validateCredentials();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        validateCredentials();
    }

    // Validation method to ensure credentials are properly formatted
    private void validateCredentials() {
        if (credentials == null || credentials.isEmpty()) {
            throw new IllegalArgumentException("Credentials cannot be null or empty");
        }
        
        // Validate that credentials contain required fields based on platform type
        if (platformType != null) {
            switch (platformType) {
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
                        throw new IllegalArgumentException(platformType.getDisplayName() + " credentials must contain 'webhook_url' field");
                    }
                    break;
                case SMS:
                    if (!credentials.containsKey("api_key") || !credentials.containsKey("phone_number")) {
                        throw new IllegalArgumentException("SMS credentials must contain 'api_key' and 'phone_number' fields");
                    }
                    break;
            }
        }
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getPlatformName() { return platformName; }
    public void setPlatformName(String platformName) { this.platformName = platformName; }

    public PlatformType getPlatformType() { return platformType; }
    public void setPlatformType(PlatformType platformType) { this.platformType = platformType; }

    public Map<String, Object> getCredentials() { return credentials; }
    public void setCredentials(Map<String, Object> credentials) { 
        this.credentials = credentials;
        // Validate credentials when setting them
        if (platformType != null) {
            validateCredentials();
        }
    }

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
