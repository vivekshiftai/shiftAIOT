package com.iotplatform.service;

import com.iotplatform.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Service for sending web push notifications to browsers.
 * Uses the Web Push protocol to send notifications to subscribed clients.
 */
@Service
@RequiredArgsConstructor
public class PushNotificationService {
    
    private static final Logger log = LoggerFactory.getLogger(PushNotificationService.class);

    @Lazy
    private final NotificationSettingsService notificationSettingsService;
    
    @Value("${push.vapid.public.key:}")
    private String vapidPublicKey;
    
    @Value("${push.vapid.private.key:}")
    private String vapidPrivateKey;
    
    @Value("${push.vapid.subject:mailto:admin@iotplatform.com}")
    private String vapidSubject;

    private PushService pushService;
    private final Map<String, Subscription> userSubscriptions = new ConcurrentHashMap<>();
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);

    @PostConstruct
    public void initialize() {
        try {
            // Add BouncyCastle provider for encryption
            Security.addProvider(new BouncyCastleProvider());
            
            if (vapidPrivateKey != null && !vapidPrivateKey.isEmpty()) {
                pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
                log.info("Push notification service initialized successfully");
            } else {
                log.warn("VAPID keys not configured, push notifications will be disabled");
            }
        } catch (Exception e) {
            log.error("Failed to initialize push notification service", e);
        }
    }

    /**
     * Register a user's push subscription.
     */
    public void registerSubscription(String userId, String endpoint, String p256dh, String auth) {
        try {
            Subscription.Keys keys = new Subscription.Keys(p256dh, auth);
            Subscription subscription = new Subscription(endpoint, keys);
            userSubscriptions.put(userId, subscription);
            log.info("Push subscription registered for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to register push subscription for user: {}", userId, e);
        }
    }

    /**
     * Unregister a user's push subscription.
     */
    public void unregisterSubscription(String userId) {
        userSubscriptions.remove(userId);
        log.info("Push subscription unregistered for user: {}", userId);
    }

    /**
     * Send a push notification to a specific user.
     */
    public void sendPushNotification(String userId, com.iotplatform.model.Notification notification) {
        if (!notificationSettingsService.isPushEnabled(userId)) {
            log.debug("Push notifications disabled for user: {}", userId);
            return;
        }

        Subscription subscription = userSubscriptions.get(userId);
        if (subscription == null) {
            log.debug("No push subscription found for user: {}", userId);
            return;
        }

        if (pushService == null) {
            log.warn("Push service not initialized, cannot send notification to user: {}", userId);
            return;
        }

        executorService.submit(() -> {
            try {
                String payload = createNotificationPayload(notification);
                nl.martijndwars.webpush.Notification webPushNotification = new nl.martijndwars.webpush.Notification(subscription, payload);
                
                pushService.send(webPushNotification);
                log.info("Push notification sent successfully to user: {}", userId);
                
            } catch (Exception e) {
                log.error("Failed to send push notification to user: {}", userId, e);
                
                // Remove invalid subscription
                if (e.getMessage().contains("410") || e.getMessage().contains("404")) {
                    log.info("Removing invalid push subscription for user: {}", userId);
                    unregisterSubscription(userId);
                }
            }
        });
    }

    /**
     * Send push notification to multiple users.
     */
    public void sendPushNotificationToUsers(Iterable<String> userIds, com.iotplatform.model.Notification notification) {
        for (String userId : userIds) {
            sendPushNotification(userId, notification);
        }
    }

    /**
     * Create notification payload for web push.
     */
    private String createNotificationPayload(com.iotplatform.model.Notification notification) {
        // Create a simple JSON payload for the push notification
        return String.format(
            "{\"title\":\"%s\",\"body\":\"%s\",\"icon\":\"/favicon.ico\",\"badge\":\"/favicon.ico\",\"data\":{\"notificationId\":\"%s\",\"type\":\"%s\"}}",
            escapeJson(notification.getTitle()),
            escapeJson(notification.getMessage()),
            notification.getId(),
            notification.getCategory().toString()
        );
    }

    /**
     * Escape JSON string to prevent injection.
     */
    private String escapeJson(String input) {
        if (input == null) return "";
        return input.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }

    /**
     * Get VAPID public key for client subscription.
     */
    public String getVapidPublicKey() {
        return vapidPublicKey;
    }

    /**
     * Check if push notifications are enabled for a user.
     */
    public boolean isPushEnabled(String userId) {
        return notificationSettingsService.isPushEnabled(userId);
    }

    /**
     * Check if user has an active push subscription.
     */
    public boolean hasSubscription(String userId) {
        return userSubscriptions.containsKey(userId);
    }

    /**
     * Get subscription count for monitoring.
     */
    public int getSubscriptionCount() {
        return userSubscriptions.size();
    }
}
