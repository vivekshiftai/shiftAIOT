package com.iotplatform.controller;

import com.iotplatform.service.NotificationSettingsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for managing notification settings
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/notification-settings")
@RequiredArgsConstructor
@Slf4j
public class NotificationSettingsController {

    private final NotificationSettingsService notificationSettingsService;

    /**
     * Enable all notifications for all users
     * This endpoint can be used to ensure no notifications are blocked
     */
    @PostMapping("/enable-all-for-all-users")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> enableAllNotificationsForAllUsers() {
        try {
            log.info("🔧 Admin requested to enable all notifications for all users");
            
            notificationSettingsService.enableAllNotificationsForAllUsers();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All user notification preferences have been updated to enable all notifications"
            ));
            
        } catch (Exception e) {
            log.error("❌ Failed to enable all notifications for all users: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to update user preferences: " + e.getMessage()
            ));
        }
    }

    /**
     * Enable all notifications for a specific user
     */
    @PostMapping("/enable-all-for-user/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> enableAllNotificationsForUser(@PathVariable String userId) {
        try {
            log.info("🔧 Admin requested to enable all notifications for user: {}", userId);
            
            notificationSettingsService.enableAllNotificationsForUser(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User notification preferences have been updated to enable all notifications",
                "userId", userId
            ));
            
        } catch (Exception e) {
            log.error("❌ Failed to enable all notifications for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to update user preferences: " + e.getMessage(),
                "userId", userId
            ));
        }
    }

    /**
     * Initialize user preferences for a specific user
     */
    @PostMapping("/initialize/{userId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> initializeUserPreferences(@PathVariable String userId) {
        try {
            log.info("🔧 Admin requested to initialize user preferences for user: {}", userId);
            
            notificationSettingsService.ensureUserPreferencesInitialized(userId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "User preferences have been initialized with all notifications enabled",
                "userId", userId
            ));
            
        } catch (Exception e) {
            log.error("❌ Failed to initialize user preferences for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to initialize user preferences: " + e.getMessage(),
                "userId", userId
            ));
        }
    }
}
