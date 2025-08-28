package com.iotplatform.service;

import com.iotplatform.model.NotificationTemplate;
import com.iotplatform.repository.NotificationTemplateRepository;
import com.iotplatform.util.NotificationValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NotificationTemplateService {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationTemplateService.class);
    private static final Pattern VARIABLE_PATTERN = Pattern.compile("\\{\\{(\\w+)\\}\\}");
    
    @Autowired
    private NotificationTemplateRepository templateRepository;
    
    /**
     * Create a new notification template
     */
    public NotificationTemplate createTemplate(NotificationTemplate template) {
        // Validate template
        validateTemplate(template);
        
        // Check for duplicate names in organization
        if (templateRepository.existsByNameAndOrganizationId(template.getName(), template.getOrganizationId())) {
            throw new IllegalArgumentException("Template name already exists in this organization");
        }
        
        // Set creation timestamp
        template.setCreatedAt(LocalDateTime.now());
        
        NotificationTemplate savedTemplate = templateRepository.save(template);
        logger.info("Created notification template: {} for organization: {}", 
                   savedTemplate.getName(), savedTemplate.getOrganizationId());
        
        return savedTemplate;
    }
    
    /**
     * Update an existing notification template
     */
    public NotificationTemplate updateTemplate(String templateId, NotificationTemplate template) {
        Optional<NotificationTemplate> existingOpt = templateRepository.findById(templateId);
        if (existingOpt.isEmpty()) {
            throw new IllegalArgumentException("Template not found: " + templateId);
        }
        
        NotificationTemplate existing = existingOpt.get();
        
        // Validate template
        validateTemplate(template);
        
        // Check for duplicate names (excluding current template)
        if (!existing.getName().equals(template.getName()) && 
            templateRepository.existsByNameAndOrganizationId(template.getName(), template.getOrganizationId())) {
            throw new IllegalArgumentException("Template name already exists in this organization");
        }
        
        // Update fields
        existing.setName(template.getName());
        existing.setType(template.getType());
        existing.setTitleTemplate(template.getTitleTemplate());
        existing.setMessageTemplate(template.getMessageTemplate());
        existing.setNotificationType(template.getNotificationType());
        existing.setActive(template.isActive());
        existing.setDescription(template.getDescription());
        existing.setVariables(template.getVariables());
        existing.setUpdatedAt(LocalDateTime.now());
        
        NotificationTemplate updatedTemplate = templateRepository.save(existing);
        logger.info("Updated notification template: {} for organization: {}", 
                   updatedTemplate.getName(), updatedTemplate.getOrganizationId());
        
        return updatedTemplate;
    }
    
    /**
     * Get template by ID
     */
    public Optional<NotificationTemplate> getTemplateById(String templateId) {
        return templateRepository.findById(templateId);
    }
    
    /**
     * Get all active templates for an organization
     */
    public List<NotificationTemplate> getActiveTemplates(String organizationId) {
        return templateRepository.findByOrganizationIdAndActiveTrueOrderByNameAsc(organizationId);
    }
    
    /**
     * Get template by type for an organization
     */
    public Optional<NotificationTemplate> getTemplateByType(NotificationTemplate.TemplateType type, String organizationId) {
        return templateRepository.findByTypeAndOrganizationIdAndActiveTrue(type, organizationId);
    }
    
    /**
     * Process template with variables
     */
    public ProcessedTemplate processTemplate(NotificationTemplate template, Map<String, String> variables) {
        if (template == null) {
            throw new IllegalArgumentException("Template cannot be null");
        }
        
        if (variables == null) {
            variables = new HashMap<>();
        }
        
        // Add default variables
        variables.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        variables.put("date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));
        variables.put("time", LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
        
        String processedTitle = processTemplateString(template.getTitleTemplate(), variables);
        String processedMessage = processTemplateString(template.getMessageTemplate(), variables);
        
        return new ProcessedTemplate(processedTitle, processedMessage, template.getNotificationType());
    }
    
    /**
     * Process template string with variables
     */
    private String processTemplateString(String template, Map<String, String> variables) {
        if (!StringUtils.hasText(template)) {
            return template;
        }
        
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        StringBuffer result = new StringBuffer();
        
        while (matcher.find()) {
            String variableName = matcher.group(1);
            String replacement = variables.getOrDefault(variableName, "{{" + variableName + "}}");
            matcher.appendReplacement(result, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(result);
        
        return result.toString();
    }
    
    /**
     * Extract variables from template
     */
    public List<String> extractVariables(String template) {
        if (!StringUtils.hasText(template)) {
            return List.of();
        }
        
        Matcher matcher = VARIABLE_PATTERN.matcher(template);
        return matcher.results()
                .map(match -> match.group(1))
                .distinct()
                .toList();
    }
    
    /**
     * Validate template
     */
    private void validateTemplate(NotificationTemplate template) {
        if (template == null) {
            throw new IllegalArgumentException("Template cannot be null");
        }
        
        if (!StringUtils.hasText(template.getName())) {
            throw new IllegalArgumentException("Template name is required");
        }
        
        if (template.getName().length() > 100) {
            throw new IllegalArgumentException("Template name must not exceed 100 characters");
        }
        
        if (template.getType() == null) {
            throw new IllegalArgumentException("Template type is required");
        }
        
        if (!StringUtils.hasText(template.getTitleTemplate())) {
            throw new IllegalArgumentException("Template title is required");
        }
        
        if (template.getTitleTemplate().length() > 200) {
            throw new IllegalArgumentException("Template title must not exceed 200 characters");
        }
        
        if (!StringUtils.hasText(template.getMessageTemplate())) {
            throw new IllegalArgumentException("Template message is required");
        }
        
        if (template.getMessageTemplate().length() > 1000) {
            throw new IllegalArgumentException("Template message must not exceed 1000 characters");
        }
        
        if (template.getNotificationType() == null) {
            throw new IllegalArgumentException("Notification type is required");
        }
        
        if (!StringUtils.hasText(template.getOrganizationId())) {
            throw new IllegalArgumentException("Organization ID is required");
        }
        
        if (template.getDescription() != null && template.getDescription().length() > 500) {
            throw new IllegalArgumentException("Description must not exceed 500 characters");
        }
    }
    
    /**
     * Delete template
     */
    public void deleteTemplate(String templateId) {
        Optional<NotificationTemplate> templateOpt = templateRepository.findById(templateId);
        if (templateOpt.isPresent()) {
            NotificationTemplate template = templateOpt.get();
            templateRepository.delete(template);
            logger.info("Deleted notification template: {} for organization: {}", 
                       template.getName(), template.getOrganizationId());
        }
    }
    
    /**
     * Toggle template active status
     */
    public NotificationTemplate toggleTemplateStatus(String templateId) {
        Optional<NotificationTemplate> templateOpt = templateRepository.findById(templateId);
        if (templateOpt.isEmpty()) {
            throw new IllegalArgumentException("Template not found: " + templateId);
        }
        
        NotificationTemplate template = templateOpt.get();
        template.setActive(!template.isActive());
        template.setUpdatedAt(LocalDateTime.now());
        
        NotificationTemplate updatedTemplate = templateRepository.save(template);
        logger.info("Toggled template status: {} (active: {}) for organization: {}", 
                   updatedTemplate.getName(), updatedTemplate.isActive(), updatedTemplate.getOrganizationId());
        
        return updatedTemplate;
    }
    
    /**
     * Inner class for processed template result
     */
    public static class ProcessedTemplate {
        private final String title;
        private final String message;
        private final com.iotplatform.model.Notification.NotificationType type;
        
        public ProcessedTemplate(String title, String message, com.iotplatform.model.Notification.NotificationType type) {
            this.title = title;
            this.message = message;
            this.type = type;
        }
        
        public String getTitle() { return title; }
        public String getMessage() { return message; }
        public com.iotplatform.model.Notification.NotificationType getType() { return type; }
    }
}
