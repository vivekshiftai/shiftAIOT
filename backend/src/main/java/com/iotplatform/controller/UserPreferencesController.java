package com.iotplatform.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.model.User;
import com.iotplatform.model.UserPreferences;
import com.iotplatform.repository.UserPreferencesRepository;

@CrossOrigin(originPatterns = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/user-preferences")
public class UserPreferencesController {

    private static final Logger logger = LoggerFactory.getLogger(UserPreferencesController.class);

    @Autowired
    private UserPreferencesRepository preferencesRepository;

    @GetMapping
    public ResponseEntity<?> getPreferences(@AuthenticationPrincipal com.iotplatform.security.CustomUserDetails userDetails) {
        logger.info("🔧 User preferences request from user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ Unauthorized preferences request - no user details");
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User currentUser = userDetails.getUser();
        
        try {
            UserPreferences prefs = preferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    logger.info("ℹ️ Creating new preferences for user: {}", currentUser.getEmail());
                    UserPreferences newPrefs = new UserPreferences();
                    newPrefs.setUserId(currentUser.getId());
                    return preferencesRepository.save(newPrefs);
                });
            
            logger.info("✅ Preferences retrieved successfully for user: {}", currentUser.getEmail());
            return ResponseEntity.ok(prefs);
        } catch (Exception e) {
            logger.error("❌ Error retrieving preferences for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to retrieve preferences"));
        }
    }

    @PostMapping
    public ResponseEntity<?> savePreferences(@AuthenticationPrincipal com.iotplatform.security.CustomUserDetails userDetails,
                                             @RequestBody UserPreferences request) {
        logger.info("🔧 User preferences save request from user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ Unauthorized preferences save request - no user details");
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User currentUser = userDetails.getUser();
        
        try {
            UserPreferences prefs = preferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    logger.info("ℹ️ Creating new preferences for user: {}", currentUser.getEmail());
                    UserPreferences p = new UserPreferences();
                    p.setUserId(currentUser.getId());
                    return p;
                });

            // Copy editable fields
            prefs.setEmailNotifications(request.isEmailNotifications());
            prefs.setPushNotifications(request.isPushNotifications());
            prefs.setDeviceAlerts(request.isDeviceAlerts());
            prefs.setSystemUpdates(request.isSystemUpdates());
            prefs.setWeeklyReports(request.isWeeklyReports());
            prefs.setCriticalAlerts(request.isCriticalAlerts());
            prefs.setPerformanceAlerts(request.isPerformanceAlerts());
            prefs.setSecurityAlerts(request.isSecurityAlerts());
            prefs.setMaintenanceAlerts(request.isMaintenanceAlerts());
            prefs.setDataBackupAlerts(request.isDataBackupAlerts());
            prefs.setUserActivityAlerts(request.isUserActivityAlerts());
            prefs.setRuleTriggerAlerts(request.isRuleTriggerAlerts());
            prefs.setDashboardShowRealTimeCharts(request.isDashboardShowRealTimeCharts());
            prefs.setDashboardAutoRefresh(request.isDashboardAutoRefresh());
            prefs.setDashboardRefreshInterval(request.getDashboardRefreshInterval());
            prefs.setDashboardShowDeviceStatus(request.isDashboardShowDeviceStatus());
            prefs.setDashboardShowAlerts(request.isDashboardShowAlerts());
            prefs.setDashboardShowPerformanceMetrics(request.isDashboardShowPerformanceMetrics());

            UserPreferences savedPrefs = preferencesRepository.save(prefs);
            logger.info("✅ Preferences saved successfully for user: {}", currentUser.getEmail());
            return ResponseEntity.ok(savedPrefs);
        } catch (Exception e) {
            logger.error("❌ Error saving preferences for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to save preferences"));
        }
    }
}


