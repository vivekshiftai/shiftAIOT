package com.iotplatform.controller;

import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.service.MaintenanceSchedulerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maintenance-scheduler")
@RequiredArgsConstructor
@Slf4j
public class MaintenanceSchedulerController {
    
    private final MaintenanceSchedulerService maintenanceSchedulerService;
    
    /**
     * Manually trigger maintenance schedule update
     */
    @PostMapping("/update")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<?> manualUpdateMaintenanceSchedules() {
        try {
            log.info("Manual maintenance schedule update requested");
            maintenanceSchedulerService.manualUpdateMaintenanceSchedules();
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Maintenance schedule update completed successfully");
            response.put("status", "success");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error during manual maintenance schedule update: {}", e.getMessage(), e);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to update maintenance schedules: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get maintenance tasks that need immediate attention (overdue or due today)
     */
    @GetMapping("/attention-needed")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<?> getMaintenanceTasksNeedingAttention() {
        try {
            log.info("Fetching maintenance tasks needing attention");
            List<DeviceMaintenance> tasks = maintenanceSchedulerService.getMaintenanceTasksNeedingAttention();
            
            Map<String, Object> response = new HashMap<>();
            response.put("tasks", tasks);
            response.put("count", tasks.size());
            response.put("status", "success");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching maintenance tasks needing attention: {}", e.getMessage(), e);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to fetch maintenance tasks: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    /**
     * Get scheduler status and information
     */
    @GetMapping("/status")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<?> getSchedulerStatus() {
        try {
            Map<String, Object> status = new HashMap<>();
            status.put("schedulerEnabled", true);
            status.put("nextScheduledRun", "Daily at 6:00 AM");
            status.put("lastRun", "On application startup and daily at 6:00 AM");
            status.put("status", "active");
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Error getting scheduler status: {}", e.getMessage(), e);
            
            Map<String, String> response = new HashMap<>();
            response.put("message", "Failed to get scheduler status: " + e.getMessage());
            response.put("status", "error");
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
