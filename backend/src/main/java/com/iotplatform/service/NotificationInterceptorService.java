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
            // Create a simple message format for general notifications
            String message = String.format(
                "Post a Slack message to channel_id=C092C9RHPKN.\n\n" +
                "Important: Do not forget to include both plain text and blocks in the same message.\n\n" +
                "Text: '%s %s'\n\n" +
                "Blocks:\n" +
                "1. Header block: '%s %s'\n\n" +
                "2. Section block with plain text: '%s'\n\n" +
                "3. Divider block\n\n" +
                "4. Actions block with buttons:\n" +
                "   - 'View Details' (default style)\n" +
                "   - 'Mark as Read' (primary style)\n\n" +
                "Ensure that the final Slack message contains BOTH the plain text and the blocks together.",
                getNotificationEmoji(notification.getCategory()),
                notification.getTitle(),
                getNotificationEmoji(notification.getCategory()),
                notification.getTitle(),
                notification.getMessage()
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
}
