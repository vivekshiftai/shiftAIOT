package com.iotplatform.util;

import com.iotplatform.model.Notification;
import org.springframework.util.StringUtils;

import java.util.Map;

/**
 * Utility class for validating notification data
 */
public class NotificationValidator {
    
    /**
     * Validates a notification object for creation
     * @param notification the notification to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateForCreation(Notification notification) {
        if (notification == null) {
            throw new IllegalArgumentException("Notification cannot be null");
        }
        
        validateTitle(notification.getTitle());
        validateMessage(notification.getMessage());
        validateUserId(notification.getUserId());
        validateOrganizationId(notification.getOrganizationId());
        validateType(notification.getType());
    }
    
    /**
     * Validates notification title
     * @param title the title to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateTitle(String title) {
        if (!StringUtils.hasText(title)) {
            throw new IllegalArgumentException("Notification title is required");
        }
        
        if (title.length() > 200) {
            throw new IllegalArgumentException("Notification title must not exceed 200 characters");
        }
    }
    
    /**
     * Validates notification message
     * @param message the message to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateMessage(String message) {
        if (!StringUtils.hasText(message)) {
            throw new IllegalArgumentException("Notification message is required");
        }
        
        if (message.length() > 1000) {
            throw new IllegalArgumentException("Notification message must not exceed 1000 characters");
        }
    }
    
    /**
     * Validates user ID
     * @param userId the user ID to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateUserId(String userId) {
        if (!StringUtils.hasText(userId)) {
            throw new IllegalArgumentException("User ID is required");
        }
    }
    
    /**
     * Validates organization ID
     * @param organizationId the organization ID to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateOrganizationId(String organizationId) {
        if (!StringUtils.hasText(organizationId)) {
            throw new IllegalArgumentException("Organization ID is required");
        }
    }
    
    /**
     * Validates notification type
     * @param type the type to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateType(Notification.NotificationType type) {
        if (type == null) {
            throw new IllegalArgumentException("Notification type is required");
        }
    }
    
    /**
     * Validates notification ID
     * @param id the ID to validate
     * @throws IllegalArgumentException if validation fails
     */
    public static void validateId(String id) {
        if (!StringUtils.hasText(id)) {
            throw new IllegalArgumentException("Notification ID is required");
        }
    }
    
    /**
     * Validates metadata map
     * @param metadata the metadata to validate
     * @return true if valid, false if null or empty
     */
    public static boolean isValidMetadata(Map<String, String> metadata) {
        return metadata != null && !metadata.isEmpty();
    }
    
    /**
     * Sanitizes notification data by trimming strings and setting defaults
     * @param notification the notification to sanitize
     */
    public static void sanitizeNotification(Notification notification) {
        if (notification == null) {
            return;
        }
        
        // Trim strings
        if (notification.getTitle() != null) {
            notification.setTitle(notification.getTitle().trim());
        }
        
        if (notification.getMessage() != null) {
            notification.setMessage(notification.getMessage().trim());
        }
        
        if (notification.getUserId() != null) {
            notification.setUserId(notification.getUserId().trim());
        }
        
        if (notification.getOrganizationId() != null) {
            notification.setOrganizationId(notification.getOrganizationId().trim());
        }
        
        if (notification.getDeviceId() != null) {
            notification.setDeviceId(notification.getDeviceId().trim());
        }
        
        if (notification.getRuleId() != null) {
            notification.setRuleId(notification.getRuleId().trim());
        }
        
        // Set defaults
        if (notification.getType() == null) {
            notification.setType(Notification.NotificationType.INFO);
        }
        
        // Ensure read status is false for new notifications
        notification.setRead(false);
    }
}
