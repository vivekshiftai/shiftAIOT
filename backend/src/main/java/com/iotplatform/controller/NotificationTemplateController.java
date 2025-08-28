package com.iotplatform.controller;

import com.iotplatform.dto.NotificationTemplateRequest;
import com.iotplatform.model.NotificationTemplate;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.NotificationTemplateService;
import com.iotplatform.service.NotificationTemplateService.ProcessedTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for managing notification templates
 */
@RestController
@RequestMapping("/api/notification-templates")
@PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
public class NotificationTemplateController {
    
    private static final Logger logger = LoggerFactory.getLogger(NotificationTemplateController.class);
    
    @Autowired
    private NotificationTemplateService templateService;
    
    /**
     * Create a new notification template
     */
    @PostMapping
    public ResponseEntity<NotificationTemplate> createTemplate(
            @Valid @RequestBody NotificationTemplateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            NotificationTemplate template = request.toEntity(user.getOrganizationId(), user.getId());
            NotificationTemplate createdTemplate = templateService.createTemplate(template);
            return ResponseEntity.ok(createdTemplate);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid template creation request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error creating notification template", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Get all active templates for the organization
     */
    @GetMapping
    public ResponseEntity<List<NotificationTemplate>> getTemplates(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            List<NotificationTemplate> templates = templateService.getActiveTemplates(user.getOrganizationId());
            return ResponseEntity.ok(templates);
        } catch (Exception e) {
            logger.error("Error fetching notification templates", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Get template by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<NotificationTemplate> getTemplate(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            return templateService.getTemplateById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching notification template: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Update template
     */
    @PutMapping("/{id}")
    public ResponseEntity<NotificationTemplate> updateTemplate(
            @PathVariable String id,
            @Valid @RequestBody NotificationTemplateRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            NotificationTemplate template = request.toEntity(user.getOrganizationId(), user.getId());
            NotificationTemplate updatedTemplate = templateService.updateTemplate(id, template);
            return ResponseEntity.ok(updatedTemplate);
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid template update request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error updating notification template: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Delete template
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTemplate(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            templateService.deleteTemplate(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting notification template: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Toggle template active status
     */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<NotificationTemplate> toggleTemplateStatus(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            NotificationTemplate updatedTemplate = templateService.toggleTemplateStatus(id);
            return ResponseEntity.ok(updatedTemplate);
        } catch (IllegalArgumentException e) {
            logger.warn("Template not found: {}", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error toggling template status: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Process template with variables (for testing)
     */
    @PostMapping("/{id}/process")
    public ResponseEntity<ProcessedTemplate> processTemplate(
            @PathVariable String id,
            @RequestBody Map<String, String> variables,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            return templateService.getTemplateById(id)
                    .map(template -> {
                        ProcessedTemplate processed = templateService.processTemplate(template, variables);
                        return ResponseEntity.ok(processed);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error processing template: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Extract variables from template
     */
    @GetMapping("/{id}/variables")
    public ResponseEntity<List<String>> extractVariables(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        try {
            return templateService.getTemplateById(id)
                    .map(template -> {
                        List<String> titleVars = templateService.extractVariables(template.getTitleTemplate());
                        List<String> messageVars = templateService.extractVariables(template.getMessageTemplate());
                        
                        // Combine and deduplicate
                        Map<String, String> allVars = new HashMap<>();
                        titleVars.forEach(var -> allVars.put(var, var));
                        messageVars.forEach(var -> allVars.put(var, var));
                        
                        return ResponseEntity.ok(allVars.keySet().stream().toList());
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error extracting variables from template: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Get template by type
     */
    @GetMapping("/type/{type}")
    public ResponseEntity<NotificationTemplate> getTemplateByType(
            @PathVariable NotificationTemplate.TemplateType type,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            return templateService.getTemplateByType(type, user.getOrganizationId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching template by type: {}", type, e);
            return ResponseEntity.status(500).build();
        }
    }
}
