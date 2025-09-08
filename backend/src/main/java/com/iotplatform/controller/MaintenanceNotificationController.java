package com.iotplatform.controller;

import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.MaintenanceNotificationScheduler;
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
import java.util.Map;
import java.util.HashMap;

/**
 * REST Controller for maintenance notification operations.
 * Provides endpoints for manual testing and triggering of maintenance notifications.
 */
@Slf4j
@RestController
@RequestMapping("/api/maintenance-notifications")
@RequiredArgsConstructor
@Tag(name = "Maintenance Notifications", description = "Maintenance notification management and testing")
public class MaintenanceNotificationController {

    private final MaintenanceNotificationScheduler maintenanceNotificationScheduler;

    /**
     * Manually trigger maintenance notifications for testing purposes.
     */
    @Operation(
        summary = "Trigger Maintenance Notifications",
        description = "Manually trigger maintenance notifications for the specified organization"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Notifications triggered successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/trigger")
    @PreAuthorize("hasAuthority('MAINTENANCE_NOTIFICATION_WRITE')")
    public ResponseEntity<Map<String, Object>> triggerMaintenanceNotifications(
            @Parameter(description = "Organization ID to process")
            @RequestParam(required = false) String organizationId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            // Use provided organization ID or default to user's organization
            String targetOrganizationId = organizationId != null ? organizationId : userDetails.getUser().getOrganizationId();
            
            log.info("Manual maintenance notification trigger requested by user: {} for organization: {}", 
                    userDetails.getUsername(), targetOrganizationId);

            int notificationsSent = maintenanceNotificationScheduler.triggerMaintenanceNotifications();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Maintenance notifications triggered successfully");
            response.put("notificationsSent", notificationsSent);
            response.put("organizationId", targetOrganizationId);
            response.put("triggeredBy", userDetails.getUsername());

            log.info("Maintenance notification trigger completed. Sent: {} notifications", notificationsSent);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error triggering maintenance notifications: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to trigger maintenance notifications: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Get scheduler status and configuration.
     */
    @Operation(
        summary = "Get Scheduler Status",
        description = "Get the current status and configuration of the maintenance notification scheduler"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/status")
    @PreAuthorize("hasAuthority('MAINTENANCE_NOTIFICATION_READ')")
    public ResponseEntity<Map<String, Object>> getSchedulerStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        Map<String, Object> status = new HashMap<>();
        status.put("schedulerEnabled", true); // This would come from configuration
        status.put("nextRunTime", "06:00 AM daily"); // This would be calculated
        status.put("lastRunTime", "Not available"); // This would be tracked
        status.put("organizationId", userDetails.getUser().getOrganizationId());
        status.put("user", userDetails.getUsername());

        return ResponseEntity.ok(status);
    }

    /**
     * Debug maintenance tasks to troubleshoot notification issues.
     */
    @Operation(
        summary = "Debug Maintenance Tasks",
        description = "Debug maintenance tasks to understand why notifications might not be sent"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Debug information retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    @GetMapping("/debug")
    @PreAuthorize("hasAuthority('MAINTENANCE_NOTIFICATION_READ')")
    public ResponseEntity<Map<String, Object>> debugMaintenanceTasks(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            log.info("Debug maintenance tasks requested by user: {}", userDetails.getUsername());
            
            // Call the debug method
            maintenanceNotificationScheduler.debugMaintenanceTasks();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Debug information logged to server logs");
            response.put("user", userDetails.getUsername());
            response.put("timestamp", java.time.LocalDateTime.now());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during maintenance task debug: {}", e.getMessage(), e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to debug maintenance tasks: " + e.getMessage());
            
            return ResponseEntity.status(500).body(response);
        }
    }
}
