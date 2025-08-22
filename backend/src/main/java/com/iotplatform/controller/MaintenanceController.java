package com.iotplatform.controller;

import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.MaintenanceScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for maintenance operations.
 * Provides endpoints for managing maintenance tasks and schedules.
 */
@Slf4j
@RestController
@RequestMapping("/api/maintenance")
@RequiredArgsConstructor
@Tag(name = "Maintenance", description = "Maintenance task and schedule management")
public class MaintenanceController {

    private final MaintenanceScheduleService maintenanceScheduleService;

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
            log.info("Creating maintenance task by user: {}", userDetails.getUsername());

            maintenance.setOrganizationId(userDetails.getUser().getOrganizationId());
            DeviceMaintenance createdMaintenance = maintenanceScheduleService.createMaintenance(maintenance);

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
}
