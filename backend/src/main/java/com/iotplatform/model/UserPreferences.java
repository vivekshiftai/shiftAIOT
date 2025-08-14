package com.iotplatform.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    // Notification settings
    @Column(name = "email_notifications")
    private boolean emailNotifications = true;

    @Column(name = "push_notifications")
    private boolean pushNotifications = true;

    @Column(name = "device_alerts")
    private boolean deviceAlerts = true;

    @Column(name = "system_updates")
    private boolean systemUpdates = false;

    @Column(name = "weekly_reports")
    private boolean weeklyReports = true;

    @Column(name = "critical_alerts")
    private boolean criticalAlerts = true;

    @Column(name = "performance_alerts")
    private boolean performanceAlerts = true;

    @Column(name = "security_alerts")
    private boolean securityAlerts = true;

    @Column(name = "maintenance_alerts")
    private boolean maintenanceAlerts = false;

    @Column(name = "data_backup_alerts")
    private boolean dataBackupAlerts = true;

    @Column(name = "user_activity_alerts")
    private boolean userActivityAlerts = false;

    @Column(name = "rule_trigger_alerts")
    private boolean ruleTriggerAlerts = true;

    // Dashboard settings
    @Column(name = "dashboard_show_real_time_charts")
    private boolean dashboardShowRealTimeCharts = true;

    @Column(name = "dashboard_auto_refresh")
    private boolean dashboardAutoRefresh = true;

    @Column(name = "dashboard_refresh_interval")
    private int dashboardRefreshInterval = 30;

    @Column(name = "dashboard_show_device_status")
    private boolean dashboardShowDeviceStatus = true;

    @Column(name = "dashboard_show_alerts")
    private boolean dashboardShowAlerts = true;

    @Column(name = "dashboard_show_performance_metrics")
    private boolean dashboardShowPerformanceMetrics = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public boolean isPushNotifications() { return pushNotifications; }
    public void setPushNotifications(boolean pushNotifications) { this.pushNotifications = pushNotifications; }
    public boolean isDeviceAlerts() { return deviceAlerts; }
    public void setDeviceAlerts(boolean deviceAlerts) { this.deviceAlerts = deviceAlerts; }
    public boolean isSystemUpdates() { return systemUpdates; }
    public void setSystemUpdates(boolean systemUpdates) { this.systemUpdates = systemUpdates; }
    public boolean isWeeklyReports() { return weeklyReports; }
    public void setWeeklyReports(boolean weeklyReports) { this.weeklyReports = weeklyReports; }
    public boolean isCriticalAlerts() { return criticalAlerts; }
    public void setCriticalAlerts(boolean criticalAlerts) { this.criticalAlerts = criticalAlerts; }
    public boolean isPerformanceAlerts() { return performanceAlerts; }
    public void setPerformanceAlerts(boolean performanceAlerts) { this.performanceAlerts = performanceAlerts; }
    public boolean isSecurityAlerts() { return securityAlerts; }
    public void setSecurityAlerts(boolean securityAlerts) { this.securityAlerts = securityAlerts; }
    public boolean isMaintenanceAlerts() { return maintenanceAlerts; }
    public void setMaintenanceAlerts(boolean maintenanceAlerts) { this.maintenanceAlerts = maintenanceAlerts; }
    public boolean isDataBackupAlerts() { return dataBackupAlerts; }
    public void setDataBackupAlerts(boolean dataBackupAlerts) { this.dataBackupAlerts = dataBackupAlerts; }
    public boolean isUserActivityAlerts() { return userActivityAlerts; }
    public void setUserActivityAlerts(boolean userActivityAlerts) { this.userActivityAlerts = userActivityAlerts; }
    public boolean isRuleTriggerAlerts() { return ruleTriggerAlerts; }
    public void setRuleTriggerAlerts(boolean ruleTriggerAlerts) { this.ruleTriggerAlerts = ruleTriggerAlerts; }
    public boolean isDashboardShowRealTimeCharts() { return dashboardShowRealTimeCharts; }
    public void setDashboardShowRealTimeCharts(boolean dashboardShowRealTimeCharts) { this.dashboardShowRealTimeCharts = dashboardShowRealTimeCharts; }
    public boolean isDashboardAutoRefresh() { return dashboardAutoRefresh; }
    public void setDashboardAutoRefresh(boolean dashboardAutoRefresh) { this.dashboardAutoRefresh = dashboardAutoRefresh; }
    public int getDashboardRefreshInterval() { return dashboardRefreshInterval; }
    public void setDashboardRefreshInterval(int dashboardRefreshInterval) { this.dashboardRefreshInterval = dashboardRefreshInterval; }
    public boolean isDashboardShowDeviceStatus() { return dashboardShowDeviceStatus; }
    public void setDashboardShowDeviceStatus(boolean dashboardShowDeviceStatus) { this.dashboardShowDeviceStatus = dashboardShowDeviceStatus; }
    public boolean isDashboardShowAlerts() { return dashboardShowAlerts; }
    public void setDashboardShowAlerts(boolean dashboardShowAlerts) { this.dashboardShowAlerts = dashboardShowAlerts; }
    public boolean isDashboardShowPerformanceMetrics() { return dashboardShowPerformanceMetrics; }
    public void setDashboardShowPerformanceMetrics(boolean dashboardShowPerformanceMetrics) { this.dashboardShowPerformanceMetrics = dashboardShowPerformanceMetrics; }
}


