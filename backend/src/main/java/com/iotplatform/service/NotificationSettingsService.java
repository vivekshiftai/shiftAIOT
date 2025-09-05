package com.iotplatform.service;

import com.iotplatform.model.Notification;
import com.iotplatform.model.UserPreferences;
import com.iotplatform.repository.UserPreferencesRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Service for managing notification settings and ensuring notifications
 * are only sent based on user preferences.
 */
@Service
@RequiredArgsConstructor
public class NotificationSettingsService {
    
    private static final Logger log = LoggerFactory.getLogger(NotificationSettingsService.class);
    
    private final UserPreferencesRepository userPreferencesRepository;
    @Lazy
    private final NotificationService notificationService;

    /**
     * Ensure user preferences are initialized for a user.
     * This method should be called when a new user is created.
     */
    public void ensureUserPreferencesInitialized(String userId) {
        try {
            Optional<UserPreferences> preferencesOpt = userPreferencesRepository.findByUserId(userId);
            
            if (preferencesOpt.isEmpty()) {
                log.info("Initializing default preferences for new user: {}", userId);
                UserPreferences defaultPreferences = new UserPreferences();
                defaultPreferences.setUserId(userId);
                // Set all notification types to true by default to prevent blocking
                defaultPreferences.setDeviceAlerts(true);
                defaultPreferences.setSystemUpdates(true);
                defaultPreferences.setWeeklyReports(true);
                defaultPreferences.setCriticalAlerts(true);
                defaultPreferences.setPerformanceAlerts(true);
                defaultPreferences.setSecurityAlerts(true);
                defaultPreferences.setMaintenanceAlerts(true);
                defaultPreferences.setDataBackupAlerts(true);
                defaultPreferences.setUserActivityAlerts(true);
                defaultPreferences.setRuleTriggerAlerts(true);
                defaultPreferences.setEmailNotifications(true);
                defaultPreferences.setPushNotifications(true);
                
                userPreferencesRepository.save(defaultPreferences);
                log.info("✅ Default preferences initialized for user: {}", userId);
            } else {
                log.debug("User preferences already exist for user: {}", userId);
            }
        } catch (Exception e) {
            log.error("Failed to initialize user preferences for user: {}", userId, e);
        }
    }

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
    public Optional<Notification> createNotificationIfAllowed(String userId, Notification notification, Notification.NotificationCategory category) {
        log.info("🔔 Checking if notification is allowed for user: {} category: {}", userId, category);
        
        if (shouldSendNotification(userId, mapCategoryToType(category))) {
            log.info("✅ Notification allowed for user: {} category: {}", userId, category);
            try {
                Notification createdNotification = notificationService.createNotification(notification);
                log.info("✅ Notification created successfully for user: {} category: {}", userId, category);
                return Optional.of(createdNotification);
            } catch (Exception e) {
                log.error("❌ Failed to create notification for user: {} category: {}", userId, category, e);
                return Optional.empty();
            }
        } else {
            log.info("⚠️ Notification blocked for user: {} category: {} (preference disabled)", userId, category);
            return Optional.empty();
        }
    }
    
    /**
     * Map notification category to notification type for preference checking
     */
    private NotificationType mapCategoryToType(Notification.NotificationCategory category) {
        return switch (category) {
            case DEVICE_ASSIGNMENT, DEVICE_CREATION, DEVICE_UPDATE -> NotificationType.DEVICE_ALERT;
            case MAINTENANCE_SCHEDULE, MAINTENANCE_REMINDER, MAINTENANCE_ASSIGNMENT, MAINTENANCE_ALERT -> NotificationType.MAINTENANCE_ALERT;
            case DEVICE_OFFLINE, DEVICE_ONLINE -> NotificationType.DEVICE_ALERT;
            case TEMPERATURE_ALERT, BATTERY_LOW -> NotificationType.PERFORMANCE_ALERT;
            case RULE_TRIGGERED, RULE_CREATED -> NotificationType.RULE_TRIGGER_ALERT;
            case SYSTEM_UPDATE -> NotificationType.SYSTEM_UPDATE;
            case SECURITY_ALERT -> NotificationType.SECURITY_ALERT;
            case PERFORMANCE_ALERT -> NotificationType.PERFORMANCE_ALERT;
            case SAFETY_ALERT -> NotificationType.SECURITY_ALERT;
            case CUSTOM -> NotificationType.USER_ACTIVITY_ALERT;
        };
    }

    /**
     * Get default notification setting for a type when user preferences are not available.
     * All notifications are enabled by default to prevent blocking.
     */
    private boolean getDefaultSetting(NotificationType type) {
        // All notifications enabled by default to prevent blocking
        return true;
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
     * Update all existing users to have all notification preferences enabled.
     * This method can be called to ensure no notifications are blocked.
     */
    public void enableAllNotificationsForAllUsers() {
        try {
            log.info("🔧 Updating all user preferences to enable all notifications...");
            
            // Get all user preferences
            java.util.List<UserPreferences> allPreferences = userPreferencesRepository.findAll();
            
            int updatedCount = 0;
            for (UserPreferences preferences : allPreferences) {
                // Set all notification types to true
                preferences.setDeviceAlerts(true);
                preferences.setSystemUpdates(true);
                preferences.setWeeklyReports(true);
                preferences.setCriticalAlerts(true);
                preferences.setPerformanceAlerts(true);
                preferences.setSecurityAlerts(true);
                preferences.setMaintenanceAlerts(true);
                preferences.setDataBackupAlerts(true);
                preferences.setUserActivityAlerts(true);
                preferences.setRuleTriggerAlerts(true);
                preferences.setEmailNotifications(true);
                preferences.setPushNotifications(true);
                
                userPreferencesRepository.save(preferences);
                updatedCount++;
            }
            
            log.info("✅ Updated {} user preferences to enable all notifications", updatedCount);
            
        } catch (Exception e) {
            log.error("❌ Failed to update user preferences: {}", e.getMessage(), e);
        }
    }

    /**
     * Update a specific user's preferences to enable all notifications.
     */
    public void enableAllNotificationsForUser(String userId) {
        try {
            log.info("🔧 Updating user preferences for user: {} to enable all notifications", userId);
            
            Optional<UserPreferences> preferencesOpt = userPreferencesRepository.findByUserId(userId);
            
            if (preferencesOpt.isPresent()) {
                UserPreferences preferences = preferencesOpt.get();
                
                // Set all notification types to true
                preferences.setDeviceAlerts(true);
                preferences.setSystemUpdates(true);
                preferences.setWeeklyReports(true);
                preferences.setCriticalAlerts(true);
                preferences.setPerformanceAlerts(true);
                preferences.setSecurityAlerts(true);
                preferences.setMaintenanceAlerts(true);
                preferences.setDataBackupAlerts(true);
                preferences.setUserActivityAlerts(true);
                preferences.setRuleTriggerAlerts(true);
                preferences.setEmailNotifications(true);
                preferences.setPushNotifications(true);
                
                userPreferencesRepository.save(preferences);
                log.info("✅ Updated user preferences for user: {} to enable all notifications", userId);
            } else {
                // If no preferences exist, initialize them with all enabled
                ensureUserPreferencesInitialized(userId);
                log.info("✅ Initialized user preferences for user: {} with all notifications enabled", userId);
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to update user preferences for user: {}: {}", userId, e.getMessage(), e);
        }
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
