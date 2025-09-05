package com.iotplatform.controller;

import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.Notification;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.MaintenanceScheduleService;
import com.iotplatform.service.MaintenanceNotificationScheduler;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Maintenance Management", description = "APIs for managing device maintenance tasks, schedules, and notifications")
public class MaintenanceController {
    
    private static final Logger log = LoggerFactory.getLogger(MaintenanceController.class);
    private final MaintenanceScheduleService maintenanceScheduleService;
    private final NotificationService notificationService;
    private final MaintenanceNotificationScheduler maintenanceNotificationScheduler;

    /**
     * Get today's maintenance tasks for the organization.
     */
    @Operation(
        summary = "Get Today's Maintenance Tasks",
        description = "Get all maintenance tasks scheduled for today for the current user's organization"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Today's maintenance tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
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
    @Operation(
        summary = "Get All Maintenance Tasks",
        description = "Get all maintenance tasks for the current user's organization"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
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
    @Operation(
        summary = "Get Maintenance Task by ID",
        description = "Get a specific maintenance task by its ID"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance task retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Maintenance task not found")
    })
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<DeviceMaintenance> getMaintenanceById(
            @Parameter(description = "Maintenance task ID")
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
    @Operation(
        summary = "Create Maintenance Task",
        description = "Create a new maintenance task"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Maintenance task created successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
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

            // Send notification to assigned user
            if (maintenance.getAssignedTo() != null && !maintenance.getAssignedTo().trim().isEmpty()) {
                try {
                    Notification notification = new Notification();
                    notification.setUserId(maintenance.getAssignedTo());
                    notification.setTitle("New Maintenance Task Assigned");
                    notification.setMessage(String.format(
                        "You have been assigned maintenance task '%s' for device '%s'. " +
                        "Priority: %s. Please review and schedule accordingly.",
                        maintenance.getTaskName(), 
                        maintenance.getDeviceName() != null ? maintenance.getDeviceName() : "Unknown Device",
                        maintenance.getPriority() != null ? maintenance.getPriority().toString() : "Medium"
                    ));
                    notification.setCategory(Notification.NotificationCategory.MAINTENANCE_ASSIGNMENT);
                    notification.setOrganizationId(userDetails.getUser().getOrganizationId());
                    notification.setDeviceId(maintenance.getDeviceId());
                    notification.setRead(false);
                    
                    Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(maintenance.getAssignedTo(), notification);
                    if (createdNotification.isPresent()) {
                        log.info("✅ Created maintenance task notification for user: {} for task: {}", 
                               maintenance.getAssignedTo(), maintenance.getTaskName());
                    } else {
                        log.info("⚠️ Maintenance task notification blocked by user preferences for user: {}", 
                               maintenance.getAssignedTo());
                    }
                } catch (Exception e) {
                    log.error("❌ Failed to create maintenance task notification for user: {} task: {}", 
                             maintenance.getAssignedTo(), maintenance.getTaskName(), e);
                    // Don't fail the maintenance creation if notification fails
                }
            }

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
    @Operation(
        summary = "Update Maintenance Task",
        description = "Update an existing maintenance task"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance task updated successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Maintenance task not found")
    })
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<DeviceMaintenance> updateMaintenance(
            @Parameter(description = "Maintenance task ID")
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
    @Operation(
        summary = "Delete Maintenance Task",
        description = "Delete a maintenance task"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Maintenance task deleted successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Maintenance task not found")
    })
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<Void> deleteMaintenance(
            @Parameter(description = "Maintenance task ID")
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
    @Operation(
        summary = "Complete Maintenance Task",
        description = "Mark a maintenance task as completed and calculate the next maintenance date based on frequency"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance task completed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "Maintenance task not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/{maintenanceId}/complete")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<Map<String, Object>> completeMaintenanceTask(
            @Parameter(description = "Maintenance task ID")
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
    @Operation(
        summary = "Get Device Maintenance Tasks",
        description = "Get all maintenance tasks for a specific device"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<Map<String, Object>> getDeviceMaintenance(
            @Parameter(description = "Device ID")
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
    @Operation(
        summary = "Get Overdue Maintenance Tasks",
        description = "Get all overdue maintenance tasks for a specific device"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Overdue maintenance tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/device/{deviceId}/overdue")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<Map<String, Object>> getOverdueMaintenance(
            @Parameter(description = "Device ID")
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
    @Operation(
        summary = "Get Upcoming Maintenance Tasks",
        description = "Get all upcoming maintenance tasks for a specific device (next 30 days)"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Upcoming maintenance tasks retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/device/{deviceId}/upcoming")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<Map<String, Object>> getUpcomingMaintenance(
            @Parameter(description = "Device ID")
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
            
            // Send notification to assignee
            Notification notification = new Notification();
            notification.setUserId(assigneeId);
            notification.setTitle("Maintenance Task Assigned");
            notification.setMessage(String.format(
                "You have been assigned maintenance task '%s' for device '%s'. " +
                "Priority: %s. Please review and schedule accordingly.",
                assignedTask.getTaskName(),
                assignedTask.getDeviceName() != null ? assignedTask.getDeviceName() : "Unknown Device",
                assignedTask.getPriority() != null ? assignedTask.getPriority().toString() : "Medium"
            ));
            notification.setCategory(Notification.NotificationCategory.MAINTENANCE_ASSIGNMENT);
            notification.setOrganizationId(user.getOrganizationId());
            notification.setDeviceId(assignedTask.getDeviceId());
            notification.setRead(false);
            
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(assigneeId, notification);
            if (createdNotification.isPresent()) {
                log.info("✅ Created maintenance assignment notification for user: {} for task: {}", 
                       assigneeId, assignedTask.getTaskName());
            } else {
                log.warn("⚠️ Maintenance assignment notification blocked by user preferences for user: {}", assigneeId);
            }
            
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
    @Operation(
        summary = "Trigger Maintenance Notifications",
        description = "Manually trigger the daily maintenance notification process for testing purposes"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Maintenance notifications triggered successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden - Admin access required")
    })
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
