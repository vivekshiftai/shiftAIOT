package com.iotplatform.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "notification_templates")
public class NotificationTemplate {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @NotBlank(message = "Template name is required")
    @Size(max = 100, message = "Template name must not exceed 100 characters")
    @Column(name = "name", nullable = false)
    private String name;
    
    @NotBlank(message = "Template type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private TemplateType type;
    
    @NotBlank(message = "Template title is required")
    @Size(max = 200, message = "Template title must not exceed 200 characters")
    @Column(name = "title_template", nullable = false)
    private String titleTemplate;
    
    @NotBlank(message = "Template message is required")
    @Size(max = 1000, message = "Template message must not exceed 1000 characters")
    @Column(name = "message_template", nullable = false)
    private String messageTemplate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false)
    private Notification.NotificationType notificationType = Notification.NotificationType.INFO;
    
    @Column(name = "is_active", nullable = false)
    private boolean active = true;
    
    @Column(name = "organization_id", nullable = false)
    private String organizationId;
    
    @Column(name = "created_by")
    private String createdBy;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @ElementCollection(fetch = FetchType.LAZY)
    @MapKeyColumn(name = "variable_key")
    @Column(name = "variable_description")
    @CollectionTable(name = "notification_template_variables", joinColumns = @JoinColumn(name = "template_id"))
    private Map<String, String> variables;
    
    @Column(name = "description")
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    public enum TemplateType {
        DEVICE_ASSIGNMENT,
        DEVICE_CREATION,
        MAINTENANCE_SCHEDULE,
        MAINTENANCE_REMINDER,
        DEVICE_OFFLINE,
        DEVICE_ONLINE,
        TEMPERATURE_ALERT,
        BATTERY_LOW,
        RULE_TRIGGERED,
        SYSTEM_UPDATE,
        SECURITY_ALERT,
        PERFORMANCE_ALERT,
        CUSTOM
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public TemplateType getType() { return type; }
    public void setType(TemplateType type) { this.type = type; }
    
    public String getTitleTemplate() { return titleTemplate; }
    public void setTitleTemplate(String titleTemplate) { this.titleTemplate = titleTemplate; }
    
    public String getMessageTemplate() { return messageTemplate; }
    public void setMessageTemplate(String messageTemplate) { this.messageTemplate = messageTemplate; }
    
    public Notification.NotificationType getNotificationType() { return notificationType; }
    public void setNotificationType(Notification.NotificationType notificationType) { this.notificationType = notificationType; }
    
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    
    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
    
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public Map<String, String> getVariables() { return variables; }
    public void setVariables(Map<String, String> variables) { this.variables = variables; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
