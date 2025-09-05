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
    
    @Autowired
    private NotificationInterceptorService notificationInterceptorService;

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

    public Optional<Notification> getNotificationById(String id, String organizationId, String userId) {
        logger.debug("Getting notification by ID: {} for user: {} in organization: {}", id, userId, organizationId);
        Optional<Notification> notification = notificationRepository.findById(id);
        
        if (notification.isPresent()) {
            Notification notif = notification.get();
            // Check if the notification belongs to the user's organization and is accessible to the user
            if (notif.getOrganizationId().equals(organizationId) && 
                (notif.getUserId() == null || notif.getUserId().equals(userId))) {
                return notification;
            } else {
                logger.warn("Notification {} not accessible to user {} in organization {}", id, userId, organizationId);
                return Optional.empty();
            }
        }
        
        return Optional.empty();
    }

    public Notification createNotification(Notification notification) {
        try {
            logger.info("🔔 Starting notification creation process for user: {} with title: '{}'", 
                       notification.getUserId(), notification.getTitle());
            
            // Set default type if not provided (for backward compatibility)
            if (notification.getType() == null) {
                notification.setType(determineNotificationType(notification.getCategory()));
                logger.debug("Set default notification type: {} for category: {}", notification.getType(), notification.getCategory());
            }
            
            // Double-check that type is set before saving
            if (notification.getType() == null) {
                logger.warn("⚠️ Notification type is still null after setting default, forcing to INFO");
                notification.setType(Notification.NotificationType.INFO);
            }
            
            // Log notification details before saving for debugging
            logger.debug("🔍 Notification before save - Type: {}, Category: {}, Title: {}, UserId: {}", 
                        notification.getType(), notification.getCategory(), notification.getTitle(), notification.getUserId());
            
            // Sanitize and validate notification
            logger.debug("Sanitizing notification data...");
            NotificationValidator.sanitizeNotification(notification);
            logger.debug("Validating notification data...");
            NotificationValidator.validateForCreation(notification);
            
            logger.info("Creating notification: '{}' for user: {}", notification.getTitle(), notification.getUserId());
            notification.setId(UUID.randomUUID().toString());
            
            logger.debug("Saving notification to database...");
            Notification savedNotification = notificationRepository.save(notification);
            logger.info("✅ Notification created successfully with ID: {} for user: {}", savedNotification.getId(), notification.getUserId());
            
            // Log notification details for debugging
            logger.debug("Notification details - ID: {}, Title: {}, Message: {}, Type: {}, Category: {}, UserId: {}, OrganizationId: {}, DeviceId: {}, Read: {}", 
                        savedNotification.getId(), savedNotification.getTitle(), savedNotification.getMessage(), 
                        savedNotification.getType(), savedNotification.getCategory(), savedNotification.getUserId(), 
                        savedNotification.getOrganizationId(), savedNotification.getDeviceId(), savedNotification.isRead());
            
            // Send notification to Slack via interceptor
            try {
                notificationInterceptorService.onNotificationCreated(savedNotification);
                logger.debug("✅ Notification sent to Slack via interceptor");
            } catch (Exception e) {
                logger.warn("⚠️ Failed to send notification to Slack, but notification was created successfully: {}", e.getMessage());
            }
            
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
        notification.setCategory(Notification.NotificationCategory.RULE_TRIGGERED);
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
                                                              Notification.NotificationCategory category) {
        Notification notification = new Notification();
        notification.setTitle("Device Alert: " + deviceName);
        notification.setMessage(message);
        notification.setCategory(category);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, Notification.NotificationCategory.DEVICE_ASSIGNMENT);
    }

    /**
     * Create a critical alert notification if user has critical alerts enabled.
     */
    public Optional<Notification> createCriticalAlertNotification(String userId, String title, String message, 
                                                                String organizationId, String deviceId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCategory(Notification.NotificationCategory.SECURITY_ALERT);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, Notification.NotificationCategory.SECURITY_ALERT);
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
        notification.setCategory(Notification.NotificationCategory.MAINTENANCE_ALERT);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, Notification.NotificationCategory.MAINTENANCE_ALERT);
    }

    /**
     * Create a security alert notification if user has security alerts enabled.
     */
    public Optional<Notification> createSecurityAlertNotification(String userId, String title, String message, 
                                                                String organizationId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCategory(Notification.NotificationCategory.SECURITY_ALERT);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, Notification.NotificationCategory.SECURITY_ALERT);
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
        notification.setCategory(Notification.NotificationCategory.PERFORMANCE_ALERT);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, Notification.NotificationCategory.PERFORMANCE_ALERT);
    }

    /**
     * Create a system update notification if user has system updates enabled.
     */
    public Optional<Notification> createSystemUpdateNotification(String userId, String title, String message, 
                                                               String organizationId) {
        Notification notification = new Notification();
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setCategory(Notification.NotificationCategory.SYSTEM_UPDATE);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, notification.getCategory());
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
        notification.setCategory(Notification.NotificationCategory.RULE_TRIGGERED);
        notification.setDeviceId(deviceId);
        notification.setUserId(userId);
        notification.setOrganizationId(organizationId);
        
        return notificationSettingsService.createNotificationIfAllowed(
            userId, notification, notification.getCategory());
    }

    /**
     * Check if a user should receive a specific type of notification.
     */
    public boolean shouldSendNotification(String userId, NotificationSettingsService.NotificationType type) {
        return notificationSettingsService.shouldSendNotification(userId, type);
    }

    /**
     * Create a notification with automatic preference checking.
     * This method automatically determines the notification category based on the notification content.
     */
    public Optional<Notification> createNotificationWithPreferenceCheck(String userId, Notification notification) {
        Notification.NotificationCategory category = determineNotificationCategory(notification);
        return notificationSettingsService.createNotificationIfAllowed(userId, notification, category);
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
            notification.setCategory(Notification.NotificationCategory.RULE_TRIGGERED);
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
            logger.error("Error creating notification from template: {}",
                        templateType, e);
            return Optional.empty();
        }
    }
    
    /**
     * Map template type to notification category
     */
    private Notification.NotificationCategory mapTemplateTypeToCategory(NotificationTemplate.TemplateType templateType) {
        return switch (templateType) {
            case DEVICE_ASSIGNMENT -> Notification.NotificationCategory.DEVICE_ASSIGNMENT;
            case DEVICE_CREATION -> Notification.NotificationCategory.DEVICE_CREATION;
            case MAINTENANCE_SCHEDULE -> Notification.NotificationCategory.MAINTENANCE_SCHEDULE;
            case MAINTENANCE_REMINDER -> Notification.NotificationCategory.MAINTENANCE_REMINDER;
            case DEVICE_OFFLINE -> Notification.NotificationCategory.DEVICE_OFFLINE;
            case DEVICE_ONLINE -> Notification.NotificationCategory.DEVICE_ONLINE;
            case TEMPERATURE_ALERT -> Notification.NotificationCategory.TEMPERATURE_ALERT;
            case BATTERY_LOW -> Notification.NotificationCategory.BATTERY_LOW;
            case RULE_TRIGGERED -> Notification.NotificationCategory.RULE_TRIGGERED;
            case SYSTEM_UPDATE -> Notification.NotificationCategory.SYSTEM_UPDATE;
            case SECURITY_ALERT -> Notification.NotificationCategory.SECURITY_ALERT;
            case PERFORMANCE_ALERT -> Notification.NotificationCategory.PERFORMANCE_ALERT;
            case CUSTOM -> Notification.NotificationCategory.CUSTOM;
        };
    }

    /**
     * Determine notification category based on notification content.
     */
    private Notification.NotificationCategory determineNotificationCategory(Notification notification) {
        String title = notification.getTitle() != null ? notification.getTitle().toLowerCase() : "";
        String message = notification.getMessage() != null ? notification.getMessage().toLowerCase() : "";
        String category = notification.getCategory() != null ? notification.getCategory().toString() : "";

        // Device-related notifications
        if (title.contains("device") || message.contains("device")) {
            if (title.contains("offline") || message.contains("offline")) {
                return Notification.NotificationCategory.DEVICE_OFFLINE;
            }
            if (title.contains("online") || message.contains("online")) {
                return Notification.NotificationCategory.DEVICE_ONLINE;
            }
            if (title.contains("added") || message.contains("added")) {
                return Notification.NotificationCategory.DEVICE_CREATION;
            }
            if (title.contains("assignment") || message.contains("assignment")) {
                return Notification.NotificationCategory.DEVICE_ASSIGNMENT;
            }
            if (title.contains("assigned") || message.contains("assigned")) {
                return Notification.NotificationCategory.DEVICE_ASSIGNMENT;
            }
            // Default for any device-related notification
            return Notification.NotificationCategory.DEVICE_UPDATE;
        }

        // Critical alerts
        if (category.contains("ERROR") || title.contains("critical") || title.contains("error")) {
            return Notification.NotificationCategory.SECURITY_ALERT;
        }

        // Security alerts
        if (title.contains("security") || message.contains("security")) {
            return Notification.NotificationCategory.SECURITY_ALERT;
        }

        // Performance alerts
        if (title.contains("performance") || message.contains("performance")) {
            return Notification.NotificationCategory.PERFORMANCE_ALERT;
        }

        // Maintenance alerts
        if (title.contains("maintenance") || message.contains("maintenance")) {
            return Notification.NotificationCategory.MAINTENANCE_ALERT;
        }

        // Rule triggers
        if (title.contains("rule") || message.contains("rule")) {
            return Notification.NotificationCategory.RULE_TRIGGERED;
        }

        // System updates
        if (title.contains("system") || title.contains("update")) {
            return Notification.NotificationCategory.SYSTEM_UPDATE;
        }

        // Weekly reports
        if (title.contains("weekly") || title.contains("report")) {
            return Notification.NotificationCategory.CUSTOM;
        }

        // Data backup
        if (title.contains("backup") || message.contains("backup")) {
            return Notification.NotificationCategory.CUSTOM;
        }

        // User activity
        if (title.contains("user") || title.contains("login")) {
            return Notification.NotificationCategory.CUSTOM;
        }

        // Default to device update for unknown types
        return Notification.NotificationCategory.DEVICE_UPDATE;
    }
    
    /**
     * Determine notification type based on category for backward compatibility.
     */
    private Notification.NotificationType determineNotificationType(Notification.NotificationCategory category) {
        if (category == null) {
            return Notification.NotificationType.INFO;
        }
        
        return switch (category) {
            case DEVICE_ASSIGNMENT, DEVICE_CREATION, DEVICE_UPDATE, DEVICE_ONLINE, 
                 MAINTENANCE_SCHEDULE, MAINTENANCE_REMINDER, MAINTENANCE_ASSIGNMENT,
                 RULE_CREATED, SYSTEM_UPDATE, CUSTOM -> Notification.NotificationType.INFO;
            case DEVICE_OFFLINE, MAINTENANCE_ALERT, TEMPERATURE_ALERT, BATTERY_LOW,
                 RULE_TRIGGERED, PERFORMANCE_ALERT -> Notification.NotificationType.WARNING;
            case SECURITY_ALERT, SAFETY_ALERT -> Notification.NotificationType.ERROR;
            default -> Notification.NotificationType.INFO;
        };
    }
}