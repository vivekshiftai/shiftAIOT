package com.iotplatform.controller;

import com.iotplatform.model.User;
import com.iotplatform.model.UserPreferences;
import com.iotplatform.repository.UserPreferencesRepository;
import com.iotplatform.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for managing user settings including notification and dashboard preferences.
 */
@Slf4j
@RestController
@RequestMapping("/api/user-settings")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*")
public class UserSettingsController {
    
    private final UserPreferencesRepository userPreferencesRepository;

    /**
     * Get notification settings for the current user
     */
    @GetMapping("/notifications")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<?> getNotificationSettings(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        User currentUser = userDetails.getUser();
        log.info("Getting notification settings for user: {}", currentUser.getEmail());
        
        try {
            UserPreferences preferences = userPreferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    log.info("Creating default notification settings for user: {}", currentUser.getEmail());
                    UserPreferences defaultPrefs = new UserPreferences();
                    defaultPrefs.setUserId(currentUser.getId());
                    return userPreferencesRepository.save(defaultPrefs);
                });

            Map<String, Object> notificationSettings = new HashMap<>();
            notificationSettings.put("emailNotifications", preferences.isEmailNotifications());
            notificationSettings.put("pushNotifications", preferences.isPushNotifications());
            notificationSettings.put("smsNotifications", false); // Not implemented yet
            notificationSettings.put("deviceAlerts", preferences.isDeviceAlerts());
            notificationSettings.put("systemUpdates", preferences.isSystemUpdates());
            notificationSettings.put("weeklyReports", preferences.isWeeklyReports());
            notificationSettings.put("criticalAlerts", preferences.isCriticalAlerts());
            notificationSettings.put("performanceAlerts", preferences.isPerformanceAlerts());
            notificationSettings.put("securityAlerts", preferences.isSecurityAlerts());
            notificationSettings.put("maintenanceAlerts", preferences.isMaintenanceAlerts());
            notificationSettings.put("dataBackupAlerts", preferences.isDataBackupAlerts());
            notificationSettings.put("userActivityAlerts", preferences.isUserActivityAlerts());
            notificationSettings.put("ruleTriggerAlerts", preferences.isRuleTriggerAlerts());
            notificationSettings.put("quietHoursEnabled", false); // Not implemented yet
            notificationSettings.put("quietHoursStart", "22:00");
            notificationSettings.put("quietHoursEnd", "08:00");
            notificationSettings.put("timezone", "UTC");

            log.info("✅ Notification settings retrieved for user: {}", currentUser.getEmail());
            return ResponseEntity.ok(notificationSettings);
            
        } catch (Exception e) {
            log.error("❌ Error retrieving notification settings for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to retrieve notification settings"));
        }
    }

    /**
     * Update notification settings for the current user
     */
    @PutMapping("/notifications")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<?> updateNotificationSettings(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                       @RequestBody Map<String, Object> settings) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        User currentUser = userDetails.getUser();
        log.info("Updating notification settings for user: {}", currentUser.getEmail());
        
        try {
            UserPreferences preferences = userPreferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    log.info("Creating new preferences for user: {}", currentUser.getEmail());
                    UserPreferences newPrefs = new UserPreferences();
                    newPrefs.setUserId(currentUser.getId());
                    return newPrefs;
                });

            // Update notification settings
            if (settings.containsKey("emailNotifications")) {
                preferences.setEmailNotifications((Boolean) settings.get("emailNotifications"));
            }
            if (settings.containsKey("pushNotifications")) {
                preferences.setPushNotifications((Boolean) settings.get("pushNotifications"));
            }
            if (settings.containsKey("deviceAlerts")) {
                preferences.setDeviceAlerts((Boolean) settings.get("deviceAlerts"));
            }
            if (settings.containsKey("systemUpdates")) {
                preferences.setSystemUpdates((Boolean) settings.get("systemUpdates"));
            }
            if (settings.containsKey("weeklyReports")) {
                preferences.setWeeklyReports((Boolean) settings.get("weeklyReports"));
            }
            if (settings.containsKey("criticalAlerts")) {
                preferences.setCriticalAlerts((Boolean) settings.get("criticalAlerts"));
            }
            if (settings.containsKey("performanceAlerts")) {
                preferences.setPerformanceAlerts((Boolean) settings.get("performanceAlerts"));
            }
            if (settings.containsKey("securityAlerts")) {
                preferences.setSecurityAlerts((Boolean) settings.get("securityAlerts"));
            }
            if (settings.containsKey("maintenanceAlerts")) {
                preferences.setMaintenanceAlerts((Boolean) settings.get("maintenanceAlerts"));
            }
            if (settings.containsKey("dataBackupAlerts")) {
                preferences.setDataBackupAlerts((Boolean) settings.get("dataBackupAlerts"));
            }
            if (settings.containsKey("userActivityAlerts")) {
                preferences.setUserActivityAlerts((Boolean) settings.get("userActivityAlerts"));
            }
            if (settings.containsKey("ruleTriggerAlerts")) {
                preferences.setRuleTriggerAlerts((Boolean) settings.get("ruleTriggerAlerts"));
            }

            UserPreferences savedPreferences = userPreferencesRepository.save(preferences);
            log.info("✅ Notification settings updated for user: {}", currentUser.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "message", "Notification settings updated successfully",
                "settings", savedPreferences
            ));
            
        } catch (Exception e) {
            log.error("❌ Error updating notification settings for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update notification settings"));
        }
    }

    /**
     * Get dashboard settings for the current user
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasAuthority('USER_READ')")
    public ResponseEntity<?> getDashboardSettings(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        User currentUser = userDetails.getUser();
        log.info("Getting dashboard settings for user: {}", currentUser.getEmail());
        
        try {
            UserPreferences preferences = userPreferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    log.info("Creating default dashboard settings for user: {}", currentUser.getEmail());
                    UserPreferences defaultPrefs = new UserPreferences();
                    defaultPrefs.setUserId(currentUser.getId());
                    return userPreferencesRepository.save(defaultPrefs);
                });

            Map<String, Object> dashboardSettings = new HashMap<>();
            dashboardSettings.put("theme", "auto"); // Not stored in preferences yet
            dashboardSettings.put("layout", "grid"); // Not stored in preferences yet
            dashboardSettings.put("defaultView", "overview"); // Not stored in preferences yet
            dashboardSettings.put("refreshInterval", preferences.getDashboardRefreshInterval());
            dashboardSettings.put("showCharts", preferences.isDashboardShowRealTimeCharts());
            dashboardSettings.put("showNotifications", preferences.isDashboardShowAlerts());
            dashboardSettings.put("showQuickActions", true); // Not stored in preferences yet
            dashboardSettings.put("showDeviceStatus", preferences.isDashboardShowDeviceStatus());
            dashboardSettings.put("showPerformanceMetrics", preferences.isDashboardShowPerformanceMetrics());
            dashboardSettings.put("showMaintenanceAlerts", preferences.isMaintenanceAlerts());
            dashboardSettings.put("autoRefresh", preferences.isDashboardAutoRefresh());
            dashboardSettings.put("compactMode", false); // Not stored in preferences yet
            dashboardSettings.put("responsiveLayout", true); // Not stored in preferences yet
            dashboardSettings.put("widgetOrder", new String[]{"overview", "devices", "analytics", "maintenance"});
            dashboardSettings.put("hiddenWidgets", new String[]{});

            log.info("✅ Dashboard settings retrieved for user: {}", currentUser.getEmail());
            return ResponseEntity.ok(dashboardSettings);
            
        } catch (Exception e) {
            log.error("❌ Error retrieving dashboard settings for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to retrieve dashboard settings"));
        }
    }

    /**
     * Update dashboard settings for the current user
     */
    @PutMapping("/dashboard")
    @PreAuthorize("hasAuthority('USER_WRITE')")
    public ResponseEntity<?> updateDashboardSettings(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                    @RequestBody Map<String, Object> settings) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        User currentUser = userDetails.getUser();
        log.info("Updating dashboard settings for user: {}", currentUser.getEmail());
        
        try {
            UserPreferences preferences = userPreferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    log.info("Creating new preferences for user: {}", currentUser.getEmail());
                    UserPreferences newPrefs = new UserPreferences();
                    newPrefs.setUserId(currentUser.getId());
                    return newPrefs;
                });

            // Update dashboard settings
            if (settings.containsKey("refreshInterval")) {
                preferences.setDashboardRefreshInterval((Integer) settings.get("refreshInterval"));
            }
            if (settings.containsKey("showCharts")) {
                preferences.setDashboardShowRealTimeCharts((Boolean) settings.get("showCharts"));
            }
            if (settings.containsKey("showNotifications")) {
                preferences.setDashboardShowAlerts((Boolean) settings.get("showNotifications"));
            }
            if (settings.containsKey("showDeviceStatus")) {
                preferences.setDashboardShowDeviceStatus((Boolean) settings.get("showDeviceStatus"));
            }
            if (settings.containsKey("showPerformanceMetrics")) {
                preferences.setDashboardShowPerformanceMetrics((Boolean) settings.get("showPerformanceMetrics"));
            }
            if (settings.containsKey("showMaintenanceAlerts")) {
                preferences.setMaintenanceAlerts((Boolean) settings.get("showMaintenanceAlerts"));
            }
            if (settings.containsKey("autoRefresh")) {
                preferences.setDashboardAutoRefresh((Boolean) settings.get("autoRefresh"));
            }

            UserPreferences savedPreferences = userPreferencesRepository.save(preferences);
            log.info("✅ Dashboard settings updated for user: {}", currentUser.getEmail());
            
            return ResponseEntity.ok(Map.of(
                "message", "Dashboard settings updated successfully",
                "settings", savedPreferences
            ));
            
        } catch (Exception e) {
            log.error("❌ Error updating dashboard settings for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update dashboard settings"));
        }
    }
}
