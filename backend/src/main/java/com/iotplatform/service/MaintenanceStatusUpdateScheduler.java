package com.iotplatform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Scheduled service for updating maintenance task statuses.
 * Runs daily to mark overdue tasks and ensure proper maintenance scheduling.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaintenanceStatusUpdateScheduler {

    private final MaintenanceScheduleService maintenanceScheduleService;

    @Value("${maintenance.status-updater.enabled:true}")
    private boolean statusUpdaterEnabled;

    /**
     * Daily maintenance status update scheduler.
     * Runs every day at 2:00 AM to update maintenance task statuses.
     */
    @Scheduled(cron = "${maintenance.status-updater.cron:0 0 2 * * ?}")
    public void updateMaintenanceStatuses() {
        if (!statusUpdaterEnabled) {
            log.info("Maintenance status updater is disabled");
            return;
        }

        log.info("Starting daily maintenance status update process for date: {}", LocalDate.now());

        try {
            // Update overdue maintenance tasks
            maintenanceScheduleService.updateOverdueMaintenance();
            
            log.info("Daily maintenance status update process completed successfully");

        } catch (Exception e) {
            log.error("Error in daily maintenance status update scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for maintenance status updates (for testing purposes).
     */
    public void triggerMaintenanceStatusUpdate() {
        log.info("Manual trigger of maintenance status update");
        
        try {
            maintenanceScheduleService.updateOverdueMaintenance();
            log.info("Manual maintenance status update completed successfully");
        } catch (Exception e) {
            log.error("Error in manual maintenance status update: {}", e.getMessage(), e);
        }
    }
}
