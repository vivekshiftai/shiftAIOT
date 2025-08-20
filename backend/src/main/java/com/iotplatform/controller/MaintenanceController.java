package com.iotplatform.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.MaintenanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin(origins = "*")
public class MaintenanceController {

    private final MaintenanceService maintenanceService;

    public MaintenanceController(MaintenanceService maintenanceService) {
        this.maintenanceService = maintenanceService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getAll(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> tasks = maintenanceService.getAllTasks(user.getOrganizationId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<MaintenanceSchedule> getOne(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        return maintenanceService.getTask(id, user.getOrganizationId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> create(@Valid @RequestBody MaintenanceSchedule task, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        task.setOrganizationId(user.getOrganizationId());
        MaintenanceSchedule createdTask = maintenanceService.createTask(task);
        return ResponseEntity.ok(createdTask);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> update(@PathVariable String id, @Valid @RequestBody MaintenanceSchedule updates, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            MaintenanceSchedule updatedTask = maintenanceService.updateTask(id, updates, user.getOrganizationId());
            return ResponseEntity.ok(updatedTask);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_DELETE')")
    public ResponseEntity<?> delete(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            maintenanceService.deleteTask(id, user.getOrganizationId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> markAsCompleted(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            MaintenanceSchedule completedTask = maintenanceService.markAsCompleted(id, user.getOrganizationId());
            return ResponseEntity.ok(completedTask);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getOverdueTasks(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> overdueTasks = maintenanceService.getOverdueTasks(user.getOrganizationId());
        return ResponseEntity.ok(overdueTasks);
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getUpcomingTasks(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> upcomingTasks = maintenanceService.getUpcomingTasks(user.getOrganizationId());
        return ResponseEntity.ok(upcomingTasks);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<MaintenanceStats> getStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        MaintenanceStats stats = maintenanceService.getStats(user.getOrganizationId());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getTasksByDevice(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> deviceTasks = maintenanceService.getTasksByDevice(deviceId, user.getOrganizationId());
        return ResponseEntity.ok(deviceTasks);
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getTasksByType(@PathVariable String type, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> typeTasks = maintenanceService.getTasksByType(type, user.getOrganizationId());
        return ResponseEntity.ok(typeTasks);
    }

    // DTO for maintenance statistics
    public static class MaintenanceStats {
        private long totalTasks;
        private long completedTasks;
        private long overdueTasks;
        private long upcomingTasks;

        public MaintenanceStats(long totalTasks, long completedTasks, long overdueTasks, long upcomingTasks) {
            this.totalTasks = totalTasks;
            this.completedTasks = completedTasks;
            this.overdueTasks = overdueTasks;
            this.upcomingTasks = upcomingTasks;
        }

        // Getters
        public long getTotalTasks() { return totalTasks; }
        public long getCompletedTasks() { return completedTasks; }
        public long getOverdueTasks() { return overdueTasks; }
        public long getUpcomingTasks() { return upcomingTasks; }
    }
}
