package com.iotplatform.dto;

import com.iotplatform.model.NotificationTemplate;
import com.iotplatform.model.Notification;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Map;

/**
 * DTO for notification template requests
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationTemplateRequest {
    
    @NotBlank(message = "Template name is required")
    @Size(max = 100, message = "Template name must not exceed 100 characters")
    private String name;
    
    @NotNull(message = "Template type is required")
    private NotificationTemplate.TemplateType type;
    
    @NotBlank(message = "Template title is required")
    @Size(max = 200, message = "Template title must not exceed 200 characters")
    private String titleTemplate;
    
    @NotBlank(message = "Template message is required")
    @Size(max = 1000, message = "Template message must not exceed 1000 characters")
    private String messageTemplate;
    
    @NotNull(message = "Notification type is required")
    private Notification.NotificationType notificationType;
    
    private boolean active = true;
    
    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;
    
    private Map<String, String> variables;
    
    /**
     * Convert to NotificationTemplate entity
     */
    public NotificationTemplate toEntity(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName(this.name);
        template.setType(this.type);
        template.setTitleTemplate(this.titleTemplate);
        template.setMessageTemplate(this.messageTemplate);
        template.setNotificationType(this.notificationType);
        template.setActive(this.active);
        template.setDescription(this.description);
        template.setVariables(this.variables);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        return template;
    }
}
