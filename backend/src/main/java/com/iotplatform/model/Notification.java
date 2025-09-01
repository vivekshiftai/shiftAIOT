package com.iotplatform.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank(message = "Notification title is required")
    @Size(max = 200, message = "Title must not exceed 200 characters")
    private String title;

    @NotBlank(message = "Notification message is required")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false)
    private NotificationCategory category = NotificationCategory.DEVICE_ASSIGNMENT;

    @Column(nullable = false)
    private boolean read = false;

    @Column(name = "device_id", nullable = true)
    private String deviceId;

    @Column(name = "rule_id", nullable = true)
    private String ruleId;

    @Column(name = "user_id", nullable = false)
    @NotBlank(message = "User ID is required")
    private String userId;

    @Column(name = "organization_id", nullable = false)
    @NotBlank(message = "Organization ID is required")
    private String organizationId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @MapKeyColumn(name = "metadata_key")
    @Column(name = "metadata_value")
    @CollectionTable(name = "notification_metadata", joinColumns = @JoinColumn(name = "notification_id"))
    private Map<String, String> metadata;

    // Enhanced device information fields
    @Column(name = "device_name")
    private String deviceName;

    @Column(name = "device_type")
    private String deviceType;

    @Column(name = "device_location")
    private String deviceLocation;

    @Column(name = "device_status")
    private String deviceStatus;

    @Column(name = "maintenance_rules_count")
    private Integer maintenanceRulesCount;

    @Column(name = "safety_rules_count")
    private Integer safetyRulesCount;

    @Column(name = "total_rules_count")
    private Integer totalRulesCount;

    @Column(name = "device_manufacturer")
    private String deviceManufacturer;

    @Column(name = "device_model")
    private String deviceModel;

    public enum NotificationCategory {
        DEVICE_ASSIGNMENT,
        DEVICE_CREATION,
        DEVICE_UPDATE,
        MAINTENANCE_SCHEDULE,
        MAINTENANCE_REMINDER,
        MAINTENANCE_ASSIGNMENT,
        DEVICE_OFFLINE,
        DEVICE_ONLINE,
        TEMPERATURE_ALERT,
        BATTERY_LOW,
        RULE_TRIGGERED,
        RULE_CREATED,
        SYSTEM_UPDATE,
        SECURITY_ALERT,
        PERFORMANCE_ALERT,
        SAFETY_ALERT,
        CUSTOM
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public NotificationCategory getCategory() { return category; }
    public void setCategory(NotificationCategory category) { this.category = category; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getRuleId() { return ruleId; }
    public void setRuleId(String ruleId) { this.ruleId = ruleId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public Map<String, String> getMetadata() { return metadata; }
    public void setMetadata(Map<String, String> metadata) { this.metadata = metadata; }

    // Enhanced device information getters and setters
    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

    public String getDeviceLocation() { return deviceLocation; }
    public void setDeviceLocation(String deviceLocation) { this.deviceLocation = deviceLocation; }

    public String getDeviceStatus() { return deviceStatus; }
    public void setDeviceStatus(String deviceStatus) { this.deviceStatus = deviceStatus; }

    public Integer getMaintenanceRulesCount() { return maintenanceRulesCount; }
    public void setMaintenanceRulesCount(Integer maintenanceRulesCount) { this.maintenanceRulesCount = maintenanceRulesCount; }

    public Integer getSafetyRulesCount() { return safetyRulesCount; }
    public void setSafetyRulesCount(Integer safetyRulesCount) { this.safetyRulesCount = safetyRulesCount; }

    public Integer getTotalRulesCount() { return totalRulesCount; }
    public void setTotalRulesCount(Integer totalRulesCount) { this.totalRulesCount = totalRulesCount; }

    public String getDeviceManufacturer() { return deviceManufacturer; }
    public void setDeviceManufacturer(String deviceManufacturer) { this.deviceManufacturer = deviceManufacturer; }

    public String getDeviceModel() { return deviceModel; }
    public void setDeviceModel(String deviceModel) { this.deviceModel = deviceModel; }
}