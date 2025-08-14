package com.iotplatform.controller;

import java.util.Map;

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

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/user-preferences")
public class UserPreferencesController {

    @Autowired
    private UserPreferencesRepository preferencesRepository;

    @GetMapping
    public ResponseEntity<?> getPreferences(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return ResponseEntity.ok(
            preferencesRepository.findByUserId(currentUser.getId())
                .orElseGet(() -> {
                    UserPreferences prefs = new UserPreferences();
                    prefs.setUserId(currentUser.getId());
                    return preferencesRepository.save(prefs);
                })
        );
    }

    @PostMapping
    public ResponseEntity<?> savePreferences(@AuthenticationPrincipal User currentUser,
                                             @RequestBody UserPreferences request) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        UserPreferences prefs = preferencesRepository.findByUserId(currentUser.getId())
            .orElseGet(() -> {
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

        return ResponseEntity.ok(preferencesRepository.save(prefs));
    }
}


