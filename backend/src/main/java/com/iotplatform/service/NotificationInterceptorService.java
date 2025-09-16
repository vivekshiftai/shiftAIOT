package com.iotplatform.service;

import com.iotplatform.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service that intercepts notification creation and automatically sends
 * notifications to the conversation channel (Slack) via the ConversationNotificationService
 * 
 * This service acts as a hook that gets called after every notification
 * is created in the system, ensuring all notifications are also sent to the conversation channel.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class NotificationInterceptorService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationInterceptorService.class);
    
    private final ConversationNotificationService conversationNotificationService;

    /**
     * Intercept notification creation and send to conversation channel
     * This method should be called after every notification is created
     * 
     * @param notification The notification that was just created
     */
    public void onNotificationCreated(Notification notification) {
        try {
            log.debug("🔄 Intercepting notification creation for conversation channel: {}", notification.getTitle());
            
            // Send to conversation channel asynchronously
            sendNotificationToConversationChannel(notification);
            
            log.debug("✅ Notification intercepted and sent to conversation channel: {}", notification.getTitle());
            
        } catch (Exception e) {
            log.error("❌ Failed to intercept notification for conversation channel: {}", e.getMessage(), e);
            // Don't fail the main notification creation if conversation channel fails
        }
    }

    /**
     * Intercept notification creation with additional context
     * 
     * @param notification The notification that was just created
     * @param context Additional context information
     */
    public void onNotificationCreated(Notification notification, String context) {
        try {
            log.debug("🔄 Intercepting notification creation for conversation channel with context: {} - {}", 
                     context, notification.getTitle());
            
            // Send to conversation channel asynchronously
            sendNotificationToConversationChannel(notification);
            
            log.debug("✅ Notification intercepted and sent to conversation channel with context: {} - {}", 
                     context, notification.getTitle());
            
        } catch (Exception e) {
            log.error("❌ Failed to intercept notification for conversation channel with context: {}", e.getMessage(), e);
            // Don't fail the main notification creation if conversation channel fails
        }
    }
    
    /**
     * Send notification to conversation channel using the conversation API
     * 
     * @param notification The notification to send
     */
    private void sendNotificationToConversationChannel(Notification notification) {
        try {
            // Create a rich message format for general notifications with category-specific styling
            String message = String.format(
                "Post a Slack message to channel_id=C092C9RHPKN.\n\n" +
                "Important: Do not forget to include both plain text and blocks in the same message.\n\n" +
                "Text: '%s %s - %s'\n\n" +
                "Blocks:\n" +
                "1. Header block with %s color: '%s %s'\n\n" +
                "2. Section block with fields summarizing the notification:\n" +
                "   - Category: %s\n" +
                "   - Priority: %s\n" +
                "   - Status: %s\n" +
                "   - Timestamp: %s\n" +
                "   - Notification ID: %s\n\n" +
                "3. Section block with plain text: '%s'\n\n" +
                "4. Context block with additional details:\n" +
                "   - Source: IoT Platform\n" +
                "   - Type: %s\n" +
                "   - Severity: %s\n\n" +
                "5. Divider block\n\n" +
                "6. Actions block with buttons:\n" +
                "   - 'View Full Details' (primary style)\n" +
                "   - 'Mark as Read' (default style)\n" +
                "   - 'Archive' (default style)\n\n" +
                "Ensure that the final Slack message contains BOTH the plain text and the blocks together.",
                getNotificationEmoji(notification.getCategory()),
                notification.getTitle(),
                getCategoryDisplayName(notification.getCategory()),
                getCategoryColor(notification.getCategory()),
                getNotificationEmoji(notification.getCategory()),
                notification.getTitle(),
                getCategoryDisplayName(notification.getCategory()),
                getPriorityLevel(notification.getCategory()),
                "New",
                java.time.ZonedDateTime.now(java.time.ZoneId.of("Asia/Kolkata")).format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a z")),
                notification.getId() != null ? notification.getId().substring(0, Math.min(8, notification.getId().length())) : "N/A",
                notification.getMessage(),
                getNotificationType(notification.getCategory()),
                getSeverityLevel(notification.getCategory())
            );
            
            // Send the message to conversation API
            conversationNotificationService.sendCustomMessageToConversationChannel(message);
            
        } catch (Exception e) {
            log.error("❌ Failed to send notification to conversation channel: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Get appropriate emoji for notification category
     * 
     * @param category The notification category
     * @return Emoji string
     */
    private String getNotificationEmoji(Notification.NotificationCategory category) {
        if (category == null) {
            return "🔔";
        }
        
        switch (category) {
            case DEVICE_ASSIGNMENT:
            case DEVICE_CREATION:
            case DEVICE_UPDATE:
                return "📱";
            case MAINTENANCE_ASSIGNMENT:
            case MAINTENANCE_SCHEDULE:
            case MAINTENANCE_REMINDER:
                return "🔧";
            case RULE_TRIGGERED:
            case RULE_CREATED:
                return "📋";
            case SAFETY_ALERT:
                return "⚠️";
            case SYSTEM_UPDATE:
            case SECURITY_ALERT:
            case PERFORMANCE_ALERT:
                return "🚨";
            case DEVICE_OFFLINE:
            case DEVICE_ONLINE:
            case TEMPERATURE_ALERT:
            case BATTERY_LOW:
                return "📊";
            default:
                return "🔔";
        }
    }
    
    /**
     * Get category-specific color for Slack blocks
     * 
     * @param category The notification category
     * @return Color string for Slack blocks
     */
    private String getCategoryColor(Notification.NotificationCategory category) {
        if (category == null) {
            return "good"; // Green
        }
        
        switch (category) {
            case DEVICE_ASSIGNMENT:
            case DEVICE_CREATION:
            case DEVICE_UPDATE:
                return "good"; // Green - Device operations
            case MAINTENANCE_ASSIGNMENT:
            case MAINTENANCE_SCHEDULE:
            case MAINTENANCE_REMINDER:
                return "warning"; // Yellow - Maintenance
            case RULE_TRIGGERED:
            case RULE_CREATED:
                return "#36a2eb"; // Blue - Rules
            case SAFETY_ALERT:
                return "danger"; // Red - Safety
            case SYSTEM_UPDATE:
            case SECURITY_ALERT:
            case PERFORMANCE_ALERT:
                return "danger"; // Red - Critical alerts
            case DEVICE_OFFLINE:
            case DEVICE_ONLINE:
            case TEMPERATURE_ALERT:
            case BATTERY_LOW:
                return "#ff6b6b"; // Orange - Device status
            default:
                return "good"; // Green - Default
        }
    }
    
    /**
     * Get display name for notification category
     * 
     * @param category The notification category
     * @return Display name string
     */
    private String getCategoryDisplayName(Notification.NotificationCategory category) {
        if (category == null) {
            return "General Notification";
        }
        
        switch (category) {
            case DEVICE_ASSIGNMENT:
                return "Device Assignment";
            case DEVICE_CREATION:
                return "Device Creation";
            case DEVICE_UPDATE:
                return "Device Update";
            case MAINTENANCE_ASSIGNMENT:
                return "Maintenance Assignment";
            case MAINTENANCE_SCHEDULE:
                return "Maintenance Schedule";
            case MAINTENANCE_REMINDER:
                return "Maintenance Reminder";
            case RULE_TRIGGERED:
                return "Rule Triggered";
            case RULE_CREATED:
                return "Rule Created";
            case SAFETY_ALERT:
                return "Safety Alert";
            case SYSTEM_UPDATE:
                return "System Update";
            case SECURITY_ALERT:
                return "Security Alert";
            case PERFORMANCE_ALERT:
                return "Performance Alert";
            case DEVICE_OFFLINE:
                return "Device Offline";
            case DEVICE_ONLINE:
                return "Device Online";
            case TEMPERATURE_ALERT:
                return "Temperature Alert";
            case BATTERY_LOW:
                return "Battery Low";
            default:
                return "General Notification";
        }
    }
    
    /**
     * Get priority level for notification category
     * 
     * @param category The notification category
     * @return Priority level string
     */
    private String getPriorityLevel(Notification.NotificationCategory category) {
        if (category == null) {
            return "Medium";
        }
        
        switch (category) {
            case SAFETY_ALERT:
            case SECURITY_ALERT:
            case DEVICE_OFFLINE:
                return "High";
            case MAINTENANCE_REMINDER:
            case PERFORMANCE_ALERT:
            case TEMPERATURE_ALERT:
            case BATTERY_LOW:
                return "Medium";
            case DEVICE_ASSIGNMENT:
            case DEVICE_CREATION:
            case DEVICE_UPDATE:
            case MAINTENANCE_ASSIGNMENT:
            case MAINTENANCE_SCHEDULE:
            case RULE_TRIGGERED:
            case RULE_CREATED:
            case SYSTEM_UPDATE:
            case DEVICE_ONLINE:
            default:
                return "Low";
        }
    }
    
    /**
     * Get notification type for category
     * 
     * @param category The notification category
     * @return Notification type string
     */
    private String getNotificationType(Notification.NotificationCategory category) {
        if (category == null) {
            return "Information";
        }
        
        switch (category) {
            case SAFETY_ALERT:
            case SECURITY_ALERT:
            case DEVICE_OFFLINE:
            case PERFORMANCE_ALERT:
            case TEMPERATURE_ALERT:
            case BATTERY_LOW:
                return "Alert";
            case MAINTENANCE_ASSIGNMENT:
            case MAINTENANCE_SCHEDULE:
            case MAINTENANCE_REMINDER:
                return "Task";
            case DEVICE_ASSIGNMENT:
            case DEVICE_CREATION:
            case DEVICE_UPDATE:
            case RULE_TRIGGERED:
            case RULE_CREATED:
            case SYSTEM_UPDATE:
            case DEVICE_ONLINE:
            default:
                return "Information";
        }
    }
    
    /**
     * Get severity level for notification category
     * 
     * @param category The notification category
     * @return Severity level string
     */
    private String getSeverityLevel(Notification.NotificationCategory category) {
        if (category == null) {
            return "Info";
        }
        
        switch (category) {
            case SAFETY_ALERT:
            case SECURITY_ALERT:
                return "Critical";
            case DEVICE_OFFLINE:
            case PERFORMANCE_ALERT:
            case TEMPERATURE_ALERT:
            case BATTERY_LOW:
                return "Warning";
            case MAINTENANCE_REMINDER:
                return "Medium";
            case DEVICE_ASSIGNMENT:
            case DEVICE_CREATION:
            case DEVICE_UPDATE:
            case MAINTENANCE_ASSIGNMENT:
            case MAINTENANCE_SCHEDULE:
            case RULE_TRIGGERED:
            case RULE_CREATED:
            case SYSTEM_UPDATE:
            case DEVICE_ONLINE:
            default:
                return "Info";
        }
    }
}
