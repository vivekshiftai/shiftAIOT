package com.iotplatform.controller;

import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.Notification;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.MaintenanceScheduleService;
import com.iotplatform.service.MaintenanceNotificationScheduler;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.iotplatform.model.User;
import com.iotplatform.service.NotificationService;

/**
 * REST Controller for maintenance operations.
 * Provides endpoints for managing maintenance tasks and schedules.
 */
@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
public class MaintenanceController {
    
    private static final Logger log = LoggerFactory.getLogger(MaintenanceController.class);
    private final MaintenanceScheduleService maintenanceScheduleService;
    private final NotificationService notificationService;
    private final MaintenanceNotificationScheduler maintenanceNotificationScheduler;

    /**
     * Get today's maintenance tasks for the organization.
     */
            @GetMapping("/today")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<DeviceMaintenance>> getTodayMaintenance(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Fetching today's maintenance tasks for organization: {} by user: {}", 
                    userDetails.getUser().getOrganizationId(), userDetails.getUsername());

            String organizationId = userDetails.getUser().getOrganizationId();
            List<DeviceMaintenance> todayMaintenance = maintenanceScheduleService.getTodayMaintenance(organizationId);
            
            log.info("Returning {} today's maintenance tasks for organization: {}", todayMaintenance.size(), organizationId);
            if (!todayMaintenance.isEmpty()) {
                log.info("Today's tasks: {}", todayMaintenance.stream()
                    .map(task -> String.format("'%s' (device: %s, assigned: %s, status: %s)", 
                        task.getTaskName(), task.getDeviceName(), task.getAssignedTo(), task.getStatus()))
                    .collect(java.util.stream.Collectors.joining(", ")));
            }

            return ResponseEntity.ok(todayMaintenance);

        } catch (Exception e) {
            log.error("Error fetching today's maintenance tasks", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get all maintenance tasks for the organization.
     */
            @GetMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<DeviceMaintenance>> getAllMaintenance(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Fetching all maintenance tasks for organization: {} by user: {}", 
                    userDetails.getUser().getOrganizationId(), userDetails.getUsername());

            String organizationId = userDetails.getUser().getOrganizationId();
            List<DeviceMaintenance> allMaintenance = maintenanceScheduleService.getAllMaintenanceByOrganization(organizationId);

            return ResponseEntity.ok(allMaintenance);

        } catch (Exception e) {
            log.error("Error fetching all maintenance tasks", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Get a maintenance task by ID.
     */
            @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<DeviceMaintenance> getMaintenanceById(
                        @PathVariable String id,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Fetching maintenance task: {} by user: {}", id, userDetails.getUsername());

            DeviceMaintenance maintenance = maintenanceScheduleService.getMaintenanceById(id)
                    .orElse(null);

            if (maintenance == null) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(maintenance);

        } catch (Exception e) {
            log.error("Error fetching maintenance task: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Create a new maintenance task.
     */
            @PostMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<DeviceMaintenance> createMaintenance(
            @RequestBody DeviceMaintenance maintenance,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Creating maintenance task by user: {} for device: {}", userDetails.getUsername(), maintenance.getDevice() != null ? maintenance.getDevice().getId() : "null");

            maintenance.setOrganizationId(userDetails.getUser().getOrganizationId());
            DeviceMaintenance createdMaintenance = maintenanceScheduleService.createMaintenance(maintenance);

            // Notification creation removed - only create notifications after full data generation in onboarding flow

            log.info("Successfully created maintenance task: {} for device: {}", createdMaintenance.getId(), createdMaintenance.getDevice() != null ? createdMaintenance.getDevice().getId() : "null");

            return ResponseEntity.status(201).body(createdMaintenance);

        } catch (Exception e) {
            log.error("Error creating maintenance task", e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Update a maintenance task.
     */
            @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<DeviceMaintenance> updateMaintenance(
                        @PathVariable String id,
            
            @RequestBody DeviceMaintenance maintenance,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Updating maintenance task: {} by user: {}", id, userDetails.getUsername());

            maintenance.setId(id);
            maintenance.setOrganizationId(userDetails.getUser().getOrganizationId());
            DeviceMaintenance updatedMaintenance = maintenanceScheduleService.updateMaintenance(maintenance);

            return ResponseEntity.ok(updatedMaintenance);

        } catch (Exception e) {
            log.error("Error updating maintenance task: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Delete a maintenance task.
     */
            @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<Void> deleteMaintenance(
                        @PathVariable String id,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Deleting maintenance task: {} by user: {}", id, userDetails.getUsername());

            maintenanceScheduleService.deleteMaintenance(id);

            return ResponseEntity.noContent().build();

        } catch (Exception e) {
            log.error("Error deleting maintenance task: {}", id, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Complete a maintenance task and calculate next maintenance date.
     */
            @PostMapping("/{maintenanceId}/complete")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<Map<String, Object>> completeMaintenanceTask(
                        @PathVariable String maintenanceId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Completing maintenance task: {} by user: {}", maintenanceId, userDetails.getUsername());

            DeviceMaintenance completedMaintenance = maintenanceScheduleService.completeMaintenanceTask(maintenanceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Maintenance task completed successfully");
            response.put("maintenanceTask", completedMaintenance);
            response.put("nextMaintenanceDate", completedMaintenance.getNextMaintenance());
            response.put("completedBy", userDetails.getUsername());

            log.info("Maintenance task completed successfully: {}", maintenanceId);

            return ResponseEntity.ok(response);

        } catch (IllegalArgumentException e) {
            log.error("Maintenance task not found: {}", maintenanceId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Maintenance task not found: " + e.getMessage());
            
            return ResponseEntity.status(404).body(response);
        } catch (Exception e) {
            log.error("Error completing maintenance task: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to complete maintenance task: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get maintenance tasks for a device.
     */
            @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<Map<String, Object>> getDeviceMaintenance(
                        @PathVariable String deviceId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Fetching maintenance tasks for device: {} by user: {}", deviceId, userDetails.getUsername());

            List<DeviceMaintenance> maintenanceTasks = maintenanceScheduleService.getMaintenanceByDeviceId(deviceId);
            List<DeviceMaintenance> overdueTasks = maintenanceScheduleService.getOverdueMaintenance(deviceId);
            List<DeviceMaintenance> upcomingTasks = maintenanceScheduleService.getUpcomingMaintenance(deviceId);
            long totalCount = maintenanceScheduleService.getMaintenanceCount(deviceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("deviceId", deviceId);
            response.put("maintenanceTasks", maintenanceTasks);
            response.put("overdueTasks", overdueTasks);
            response.put("upcomingTasks", upcomingTasks);
            response.put("totalCount", totalCount);
            response.put("requestedBy", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching maintenance tasks for device: {}", deviceId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch maintenance tasks: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get overdue maintenance tasks for a device.
     */
            @GetMapping("/device/{deviceId}/overdue")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<Map<String, Object>> getOverdueMaintenance(
                        @PathVariable String deviceId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Fetching overdue maintenance tasks for device: {} by user: {}", deviceId, userDetails.getUsername());

            List<DeviceMaintenance> overdueTasks = maintenanceScheduleService.getOverdueMaintenance(deviceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("deviceId", deviceId);
            response.put("overdueTasks", overdueTasks);
            response.put("overdueCount", overdueTasks.size());
            response.put("requestedBy", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching overdue maintenance tasks for device: {}", deviceId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch overdue maintenance tasks: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get upcoming maintenance tasks for a device.
     */
        @GetMapping("/device/{deviceId}/upcoming")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<Map<String, Object>> getUpcomingMaintenance(
                        @PathVariable String deviceId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Fetching upcoming maintenance tasks for device: {} by user: {}", deviceId, userDetails.getUsername());

            List<DeviceMaintenance> upcomingTasks = maintenanceScheduleService.getUpcomingMaintenance(deviceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("deviceId", deviceId);
            response.put("upcomingTasks", upcomingTasks);
            response.put("upcomingCount", upcomingTasks.size());
            response.put("requestedBy", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error fetching upcoming maintenance tasks for device: {}", deviceId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch upcoming maintenance tasks: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Update device names for maintenance tasks that don't have them
     */
    @PostMapping("/update-device-names")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
            public ResponseEntity<Map<String, Object>> updateDeviceNames(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Updating device names for maintenance tasks by user: {}", userDetails.getUsername());

            String organizationId = userDetails.getUser().getOrganizationId();
            maintenanceScheduleService.updateDeviceNamesForMaintenanceTasks(organizationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Device names updated successfully");
            response.put("organizationId", organizationId);
            response.put("requestedBy", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error updating device names for maintenance tasks", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to update device names: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Update maintenance task assignments for a specific device
     */
    @PostMapping("/update-assignments/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
            public ResponseEntity<Map<String, Object>> updateMaintenanceAssignments(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Updating maintenance task assignments for device: {} by user: {}", deviceId, userDetails.getUsername());

            String organizationId = userDetails.getUser().getOrganizationId();
            maintenanceScheduleService.updateMaintenanceTasksAssignment(deviceId, organizationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Maintenance task assignments updated successfully");
            response.put("deviceId", deviceId);
            response.put("organizationId", organizationId);
            response.put("requestedBy", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error updating maintenance task assignments for device: {}", deviceId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to update maintenance task assignments: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Remove duplicate maintenance tasks for a device
     */
    @PostMapping("/remove-duplicates/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
            public ResponseEntity<Map<String, Object>> removeDuplicateMaintenanceTasks(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Removing duplicate maintenance tasks for device: {} by user: {}", deviceId, userDetails.getUsername());

            String organizationId = userDetails.getUser().getOrganizationId();
            maintenanceScheduleService.removeDuplicateMaintenanceTasks(deviceId, organizationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Duplicate maintenance tasks removed successfully");
            response.put("deviceId", deviceId);
            response.put("organizationId", organizationId);
            response.put("requestedBy", userDetails.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error removing duplicate maintenance tasks for device: {}", deviceId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to remove duplicate maintenance tasks: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get day-wise maintenance tasks grouped by date ranges
     */
    @GetMapping("/daywise")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<?> getDayWiseMaintenance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            String organizationId = user.getOrganizationId();
            log.info("Fetching day-wise maintenance tasks for organization: {}", organizationId);
            
            Map<String, Object> response = new HashMap<>();
            
            // Get today's maintenance tasks
            List<DeviceMaintenance> todayTasks = maintenanceScheduleService.getTodayMaintenance(organizationId);
            response.put("today", todayTasks);
            
            // Get tomorrow's maintenance tasks
            List<DeviceMaintenance> tomorrowTasks = maintenanceScheduleService.getTomorrowMaintenance(organizationId);
            response.put("tomorrow", tomorrowTasks);
            
            // Get next 7 days maintenance tasks
            List<DeviceMaintenance> next7DaysTasks = maintenanceScheduleService.getNextDaysMaintenance(organizationId, 7);
            response.put("next7Days", next7DaysTasks);
            
            // Get next 30 days maintenance tasks
            List<DeviceMaintenance> next30DaysTasks = maintenanceScheduleService.getNextDaysMaintenance(organizationId, 30);
            response.put("next30Days", next30DaysTasks);
            
            // Get overdue maintenance tasks
            List<DeviceMaintenance> overdueTasks = maintenanceScheduleService.getOverdueMaintenanceByOrganization(organizationId);
            response.put("overdue", overdueTasks);
            
            // Get completed tasks from last 7 days
            List<DeviceMaintenance> recentCompletedTasks = maintenanceScheduleService.getRecentCompletedMaintenance(organizationId, 7);
            response.put("recentCompleted", recentCompletedTasks);
            
            // Summary statistics
            Map<String, Object> summary = new HashMap<>();
            summary.put("todayCount", todayTasks.size());
            summary.put("tomorrowCount", tomorrowTasks.size());
            summary.put("next7DaysCount", next7DaysTasks.size());
            summary.put("next30DaysCount", next30DaysTasks.size());
            summary.put("overdueCount", overdueTasks.size());
            summary.put("recentCompletedCount", recentCompletedTasks.size());
            summary.put("totalActive", maintenanceScheduleService.getMaintenanceCountByOrganization(organizationId));
            
            response.put("summary", summary);
            
            log.info("Day-wise maintenance data fetched successfully for organization: {}", organizationId);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error fetching day-wise maintenance tasks for organization: {}", user.getOrganizationId(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch maintenance data"));
        }
    }

    /**
     * Assign a maintenance task to a user
     */
    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<?> assignMaintenanceTask(@PathVariable String id, @RequestBody Map<String, String> request, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            String assigneeId = request.get("assigneeId");
            if (assigneeId == null || assigneeId.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Assignee ID is required"));
            }
            
            log.info("Assigning maintenance task: {} to user: {} by user: {}", id, assigneeId, user.getUsername());
            
            DeviceMaintenance assignedTask = maintenanceScheduleService.assignMaintenanceTask(id, assigneeId, user.getId());
            
            // Notification creation removed - only create notifications after full data generation in onboarding flow
            
            log.info("Maintenance task assigned successfully: {} to user: {}", id, assigneeId);
            return ResponseEntity.ok(assignedTask);
            
        } catch (IllegalArgumentException e) {
            log.error("Maintenance task or user not found: {}", id);
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error assigning maintenance task: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to assign maintenance task"));
        }
    }

    /**
     * Manually trigger maintenance notifications for testing.
     */
            @PostMapping("/trigger-notifications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> triggerMaintenanceNotifications(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            log.warn("Unauthorized access attempt to trigger maintenance notifications");
            return ResponseEntity.status(401).build();
        }
        
        try {
            log.info("Manual trigger of maintenance notifications requested by user: {}", 
                    userDetails.getUser().getUsername());
            
            // Trigger the maintenance notification scheduler
            int notificationsSent = maintenanceNotificationScheduler.triggerMaintenanceNotifications();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Maintenance notifications triggered successfully");
            response.put("notificationsSent", notificationsSent);
            response.put("triggeredBy", userDetails.getUser().getUsername());
            response.put("timestamp", java.time.LocalDateTime.now());
            
            log.info("✅ Manual maintenance notification trigger completed successfully by user: {}", 
                    userDetails.getUser().getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error triggering maintenance notifications manually: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to trigger maintenance notifications");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}
