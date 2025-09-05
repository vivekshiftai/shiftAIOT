package com.iotplatform.service;

import com.iotplatform.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service that intercepts notification creation and automatically sends
 * notifications to Slack via the SlackNotificationService
 * 
 * This service acts as a hook that gets called after every notification
 * is created in the system, ensuring all notifications are also sent to Slack.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class NotificationInterceptorService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(NotificationInterceptorService.class);
    
    private final SlackNotificationService slackNotificationService;

    /**
     * Intercept notification creation and send to Slack
     * This method should be called after every notification is created
     * 
     * @param notification The notification that was just created
     */
    public void onNotificationCreated(Notification notification) {
        try {
            log.debug("🔄 Intercepting notification creation for Slack: {}", notification.getTitle());
            
            // Send to Slack asynchronously
            slackNotificationService.sendNotificationToSlack(notification);
            
            log.debug("✅ Notification intercepted and sent to Slack: {}", notification.getTitle());
            
        } catch (Exception e) {
            log.error("❌ Failed to intercept notification for Slack: {}", e.getMessage(), e);
            // Don't fail the main notification creation if Slack fails
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
            log.debug("🔄 Intercepting notification creation for Slack with context: {} - {}", 
                     context, notification.getTitle());
            
            // Send to Slack asynchronously
            slackNotificationService.sendNotificationToSlack(notification);
            
            log.debug("✅ Notification intercepted and sent to Slack with context: {} - {}", 
                     context, notification.getTitle());
            
        } catch (Exception e) {
            log.error("❌ Failed to intercept notification for Slack with context: {}", e.getMessage(), e);
            // Don't fail the main notification creation if Slack fails
        }
    }
}
