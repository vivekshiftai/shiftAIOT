package com.iotplatform.service;

import com.iotplatform.model.Notification;
import com.iotplatform.model.UserPreferences;
import com.iotplatform.repository.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for managing notification settings and ensuring notifications
 * are only sent based on user preferences.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationSettingsService {

    private final UserPreferencesRepository userPreferencesRepository;
    private final NotificationService notificationService;

    /**
     * Check if a user should receive a specific type of notification
     * based on their preferences.
     */
    public boolean shouldSendNotification(String userId, NotificationType notificationType) {
        try {
            Optional<UserPreferences> preferencesOpt = userPreferencesRepository.findByUserId(userId);
            
            if (preferencesOpt.isEmpty()) {
                log.debug("No preferences found for user: {}, using default settings", userId);
                return getDefaultSetting(notificationType);
            }

            UserPreferences preferences = preferencesOpt.get();
            
            boolean shouldSend = switch (notificationType) {
                case DEVICE_ALERT -> preferences.isDeviceAlerts();
                case SYSTEM_UPDATE -> preferences.isSystemUpdates();
                case WEEKLY_REPORT -> preferences.isWeeklyReports();
                case CRITICAL_ALERT -> preferences.isCriticalAlerts();
                case PERFORMANCE_ALERT -> preferences.isPerformanceAlerts();
                case SECURITY_ALERT -> preferences.isSecurityAlerts();
                case MAINTENANCE_ALERT -> preferences.isMaintenanceAlerts();
                case DATA_BACKUP_ALERT -> preferences.isDataBackupAlerts();
                case USER_ACTIVITY_ALERT -> preferences.isUserActivityAlerts();
                case RULE_TRIGGER_ALERT -> preferences.isRuleTriggerAlerts();
                case EMAIL_NOTIFICATION -> preferences.isEmailNotifications();
                case PUSH_NOTIFICATION -> preferences.isPushNotifications();
            };

            log.debug("Notification {} for user {}: {}", notificationType, userId, shouldSend ? "ALLOWED" : "BLOCKED");
            return shouldSend;

        } catch (Exception e) {
            log.error("Error checking notification preferences for user: {}", userId, e);
            return getDefaultSetting(notificationType);
        }
    }

    /**
     * Create a notification only if the user has enabled that type of notification.
     */
    public Optional<Notification> createNotificationIfAllowed(String userId, Notification notification, NotificationType type) {
        if (shouldSendNotification(userId, type)) {
            try {
                Notification createdNotification = notificationService.createNotification(notification);
                log.info("Notification created for user: {} type: {}", userId, type);
                return Optional.of(createdNotification);
            } catch (Exception e) {
                log.error("Failed to create notification for user: {} type: {}", userId, type, e);
                return Optional.empty();
            }
        } else {
            log.debug("Notification blocked for user: {} type: {} (preference disabled)", userId, type);
            return Optional.empty();
        }
    }

    /**
     * Get default notification setting for a type when user preferences are not available.
     */
    private boolean getDefaultSetting(NotificationType type) {
        return switch (type) {
            case DEVICE_ALERT, CRITICAL_ALERT, SECURITY_ALERT -> true; // Critical notifications enabled by default
            case SYSTEM_UPDATE, USER_ACTIVITY_ALERT -> false; // Non-critical notifications disabled by default
            case WEEKLY_REPORT, PERFORMANCE_ALERT, MAINTENANCE_ALERT, 
                 DATA_BACKUP_ALERT, RULE_TRIGGER_ALERT, 
                 EMAIL_NOTIFICATION, PUSH_NOTIFICATION -> true; // Most notifications enabled by default
        };
    }

    /**
     * Check if user has email notifications enabled.
     */
    public boolean isEmailEnabled(String userId) {
        return shouldSendNotification(userId, NotificationType.EMAIL_NOTIFICATION);
    }

    /**
     * Check if user has push notifications enabled.
     */
    public boolean isPushEnabled(String userId) {
        return shouldSendNotification(userId, NotificationType.PUSH_NOTIFICATION);
    }

    /**
     * Notification types that correspond to user preference settings.
     */
    public enum NotificationType {
        DEVICE_ALERT,
        SYSTEM_UPDATE,
        WEEKLY_REPORT,
        CRITICAL_ALERT,
        PERFORMANCE_ALERT,
        SECURITY_ALERT,
        MAINTENANCE_ALERT,
        DATA_BACKUP_ALERT,
        USER_ACTIVITY_ALERT,
        RULE_TRIGGER_ALERT,
        EMAIL_NOTIFICATION,
        PUSH_NOTIFICATION
    }
}
