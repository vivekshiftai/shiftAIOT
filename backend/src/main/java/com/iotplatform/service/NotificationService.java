package com.iotplatform.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.Notification;
import com.iotplatform.model.NotificationTemplate;
import com.iotplatform.model.Rule;
import com.iotplatform.repository.NotificationRepository;
import com.iotplatform.util.NotificationValidator;
import com.iotplatform.service.NotificationTemplateService;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;
    
    @Autowired
    private NotificationTemplateService templateService;
    
    @Autowired
    @Lazy
    private NotificationSettingsService notificationSettingsService;

    public List<Notification> getAllNotifications(String organizationId) {
        logger.debug("Getting all notifications for organization: {}", organizationId);
        return notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
    }

    public List<Notification> getUserNotifications(String organizationId, String userId) {
        logger.debug("Getting notifications for user: {} in organization: {}", userId, organizationId);
        List<Notification> notifications = notificationRepository.findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
        logger.debug("Found {} notifications for user: {}", notifications.size(), userId);
        return notifications;
    }

    public Notification createNotification(Notification notification) {
        try {
            // Sanitize and validate notification
            NotificationValidator.sanitizeNotification(notification);
            NotificationValidator.validateForCreation(notification);
            
            logger.info("Creating notification: '{}' for user: {}", notification.getTitle(), notification.getUserId());
            notification.setId(UUID.randomUUID().toString());
            Notification savedNotification = notificationRepository.save(notification);
            logger.info("✅ Notification created successfully with ID: {} for user: {}", savedNotification.getId(), notification.getUserId());
            return savedNotification;
        } catch (IllegalArgumentException e) {
            logger.error("❌ Notification validation failed: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("❌ Failed to create notification for user: {} title: {}", notification.getUserId(), notification.getTitle(), e);
            throw new RuntimeException("Failed to create notification: " + e.getMessage(), e);
        }
    }

    public void markAsRead(String notificationId) {
        logger.debug("Marking notification as read: {}", notificationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
            logger.debug("Notification {} marked as read", notificationId);
        });
    }

    public void markAsRead(String notificationId, String organizationId, String userId) {
        logger.debug("User {} marking notification {} as read in organization {}", userId, notificationId, organizationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            // Validate that the notification belongs to the user
            if (notification.getOrganizationId().equals(organizationId) && 
                notification.getUserId().equals(userId)) {
                notification.setRead(true);
                notificationRepository.save(notification);
                logger.debug("Notification {} marked as read by user {}", notificationId, userId);
            } else {
                logger.warn("User {} attempted to mark notification {} as read but doesn't own it", userId, notificationId);
            }
        });
    }

    public void markAllAsRead(String organizationId, String userId) {
        logger.info("User {} marking all notifications as read in organization {}", userId, organizationId);
        List<Notification> notifications = notificationRepository
                .findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
        
        notifications.forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
        
        logger.info("Marked {} notifications as read for user {}", notifications.size(), userId);
    }

    public long getUnreadCount(String organizationId, String userId) {
        logger.debug("Getting unread count for user: {} in organization: {}", userId, organizationId);
        long count = notificationRepository.countUnreadByOrganizationIdAndUserId(organizationId, userId);
        logger.debug("User {} has {} unread notifications", userId, count);
        return count;
    }

    public void deleteNotification(String notificationId, String organizationId, String userId) {
        logger.debug("User {} deleting notification {} in organization {}", userId, notificationId, organizationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            // Validate that the notification belongs to the user
            if (notification.getOrganizationId().equals(organizationId) && 
                notification.getUserId().equals(userId)) {
                notificationRepository.delete(notification);
                logger.info("Notification {} deleted by user {}", notificationId, userId);
            } else {
                logger.warn("User {} attempted to delete notification {} but doesn't own it", userId, notificationId);
                throw new RuntimeException("Notification not found or access denied");
            }
        });
    }

    public void deleteAllNotifications(String organizationId, String userId) {
        logger.info("User {} deleting all notifications in organization {}", userId, organizationId);
        List<Notification> notifications = notificationRepository
                .findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
        
        notificationRepository.deleteAll(notifications);
        logger.info("Deleted {} notifications for user {}", notifications.size(), userId);
    }

    public void createRuleTriggeredNotification(Rule rule, Device device, TelemetryDataRequest telemetryData) {
        logger.info("Creating rule-triggered notification for device: {} and rule: {}", device.getName(), rule.getName());
        Notification notification = new Notification();
        notification.setTitle("Rule Triggered: " + rule.getName());
        notification.setMessage("Device " + device.getName() + " has triggered rule \"" + rule.getName() + "\"");
        notification.setType(Notification.NotificationType.WARNING);
        notification.setDeviceId(device.getId());
        notification.setRuleId(rule.getId());
        notification.setOrganizationId(device.getOrganizationId());
        // Note: userId will be set when the notification is created for a specific user
        // For now, we'll create it as a general notification for the organization
        
        createNotification(notification);
    }

    // ===== NEW METHODS WITH USER PREFERENCES INTEGRATION =====

    /**
     * Create a device alert notification if user has device alerts enabled.
     */
    public Optional<Notification> createDeviceAlertNotification(String userId, String deviceName, String deviceId, 
                                                              String organizationId, String message, 
                                                              Notification.NotificationType type) {
        Notification notification = new Notification();
        notification.setTitle("Device Alert: " + deviceName);
        notification.setMessage(message);
        notification.setType(type);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.DEVICE_ALERT);
    }

    /**
     * Create a critical alert notification if user has critical alerts enabled.
     */
    public Optional<Notification> createCriticalAlertNotification(String userId, String title, String message, 
                                                                String organizationId, String deviceId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.ERROR);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.CRITICAL_ALERT);
    }

    /**
     * Create a maintenance alert notification if user has maintenance alerts enabled.
     */
    public Optional<Notification> createMaintenanceAlertNotification(String userId, String deviceName, 
                                                                   String deviceId, String organizationId, 
                                                                   String message) {
        Notification notification = new Notification();
        notification.setTitle("Maintenance Alert: " + deviceName);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.WARNING);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.MAINTENANCE_ALERT);
    }

    /**
     * Create a security alert notification if user has security alerts enabled.
     */
    public Optional<Notification> createSecurityAlertNotification(String userId, String title, String message, 
                                                                String organizationId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.ERROR);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.SECURITY_ALERT);
    }

    /**
     * Create a performance alert notification if user has performance alerts enabled.
     */
    public Optional<Notification> createPerformanceAlertNotification(String userId, String deviceName, 
                                                                   String deviceId, String organizationId, 
                                                                   String message) {
        Notification notification = new Notification();
        notification.setTitle("Performance Alert: " + deviceName);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.WARNING);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.PERFORMANCE_ALERT);
    }

    /**
     * Create a system update notification if user has system updates enabled.
     */
    public Optional<Notification> createSystemUpdateNotification(String userId, String title, String message, 
                                                               String organizationId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(Notification.NotificationType.INFO);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.SYSTEM_UPDATE);
    }

    /**
     * Create a rule trigger notification if user has rule trigger alerts enabled.
     */
    public Optional<Notification> createRuleTriggerNotification(String userId, String ruleName, String deviceName, 
                                                              String deviceId, String organizationId, 
                                                              String message) {
        Notification notification = new Notification();
        notification.setTitle("Rule Triggered: " + ruleName);
        notification.setMessage("Device " + deviceName + " triggered rule: " + message);
        notification.setType(Notification.NotificationType.WARNING);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, NotificationSettingsService.NotificationType.RULE_TRIGGER_ALERT);
    }

    /**
     * Check if a user should receive a specific type of notification.
     */
    public boolean shouldSendNotification(String userId, NotificationSettingsService.NotificationType type) {
        return notificationSettingsService.shouldSendNotification(userId, type);
    }

    /**
     * Create a notification with automatic preference checking.
     * This method automatically determines the notification type based on the notification content.
     */
    public Optional<Notification> createNotificationWithPreferenceCheck(String userId, Notification notification) {
        NotificationSettingsService.NotificationType type = determineNotificationType(notification);
        return notificationSettingsService.createNotificationIfAllowed(userId, notification, type);
    }
    
    /**
     * Create notification using template
     */
    public Optional<Notification> createNotificationFromTemplate(
            String userId, 
            NotificationTemplate.TemplateType templateType, 
            String organizationId, 
            Map<String, String> variables) {
        
        try {
            // Get template for the organization
            Optional<NotificationTemplate> templateOpt = templateService.getTemplateByType(templateType, organizationId);
            if (templateOpt.isEmpty()) {
                logger.warn("No template found for type: {} in organization: {}", templateType, organizationId);
                return Optional.empty();
            }
            
            NotificationTemplate template = templateOpt.get();
            
            // Process template with variables
            NotificationTemplateService.ProcessedTemplate processed = templateService.processTemplate(template, variables);
            
            // Create notification
            Notification notification = new Notification();
            notification.setTitle(processed.getTitle());
            notification.setMessage(processed.getMessage());
            notification.setType(processed.getType());
            notification.setUserId(userId);
            notification.setOrganizationId(organizationId);
            notification.setRead(false);
            
            // Add device ID if present in variables
            if (variables.containsKey("deviceId")) {
                notification.setDeviceId(variables.get("deviceId"));
            }
            
            // Add rule ID if present in variables
            if (variables.containsKey("ruleId")) {
                notification.setRuleId(variables.get("ruleId"));
            }
            
            // Add metadata
            notification.setMetadata(variables);
            
            // Check preferences and create
            return createNotificationWithPreferenceCheck(userId, notification);
            
        } catch (Exception e) {
            logger.error("Error creating notification from template: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Determine notification type based on notification content.
     */
    private NotificationSettingsService.NotificationType determineNotificationType(Notification notification) {
        String title = notification.getTitle() != null ? notification.getTitle().toLowerCase() : "";
        String message = notification.getMessage() != null ? notification.getMessage().toLowerCase() : "";
        String type = notification.getType() != null ? notification.getType().toString() : "";

        // Device-related notifications
        if (title.contains("device") || message.contains("device")) {
            if (title.contains("offline") || message.contains("offline")) {
                return NotificationSettingsService.NotificationType.DEVICE_ALERT;
            }
            if (title.contains("online") || message.contains("online")) {
                return NotificationSettingsService.NotificationType.DEVICE_ALERT;
            }
            if (title.contains("added") || message.contains("added")) {
                return NotificationSettingsService.NotificationType.DEVICE_ALERT;
            }
        }

        // Critical alerts
        if (type.equals("ERROR") || title.contains("critical") || title.contains("error")) {
            return NotificationSettingsService.NotificationType.CRITICAL_ALERT;
        }

        // Security alerts
        if (title.contains("security") || message.contains("security")) {
            return NotificationSettingsService.NotificationType.SECURITY_ALERT;
        }

        // Performance alerts
        if (title.contains("performance") || message.contains("performance")) {
            return NotificationSettingsService.NotificationType.PERFORMANCE_ALERT;
        }

        // Maintenance alerts
        if (title.contains("maintenance") || message.contains("maintenance")) {
            return NotificationSettingsService.NotificationType.MAINTENANCE_ALERT;
        }

        // Rule triggers
        if (title.contains("rule") || message.contains("rule")) {
            return NotificationSettingsService.NotificationType.RULE_TRIGGER_ALERT;
        }

        // System updates
        if (title.contains("system") || title.contains("update")) {
            return NotificationSettingsService.NotificationType.SYSTEM_UPDATE;
        }

        // Weekly reports
        if (title.contains("weekly") || title.contains("report")) {
            return NotificationSettingsService.NotificationType.WEEKLY_REPORT;
        }

        // Data backup
        if (title.contains("backup") || message.contains("backup")) {
            return NotificationSettingsService.NotificationType.DATA_BACKUP_ALERT;
        }

        // User activity
        if (title.contains("user") || title.contains("login")) {
            return NotificationSettingsService.NotificationType.USER_ACTIVITY_ALERT;
        }

        // Default to device alert for unknown types
        return NotificationSettingsService.NotificationType.DEVICE_ALERT;
    }
}