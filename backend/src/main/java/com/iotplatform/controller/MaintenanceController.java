package com.iotplatform.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.model.User;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import com.iotplatform.security.CustomUserDetails;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/maintenance")
@CrossOrigin(origins = "*")
public class MaintenanceController {

    private final MaintenanceScheduleRepository maintenanceRepository;

    public MaintenanceController(MaintenanceScheduleRepository maintenanceRepository) {
        this.maintenanceRepository = maintenanceRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getAll(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> tasks = maintenanceRepository.findByOrganizationId(user.getOrganizationId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<MaintenanceSchedule> getOne(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        Optional<MaintenanceSchedule> task = maintenanceRepository.findByIdAndOrganizationId(id, user.getOrganizationId());
        return task.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> create(@Valid @RequestBody MaintenanceSchedule task, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        task.setOrganizationId(user.getOrganizationId());
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("pending");
        }
        if (task.getPriority() == null || task.getPriority().isBlank()) {
            task.setPriority("medium");
        }
        MaintenanceSchedule createdTask = maintenanceRepository.save(task);
        return ResponseEntity.ok(createdTask);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<List<MaintenanceSchedule>> createBulk(@RequestBody List<MaintenanceSchedule> tasks, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        List<MaintenanceSchedule> createdTasks = tasks.stream()
            .map(task -> {
                task.setOrganizationId(user.getOrganizationId());
                if (task.getStatus() == null || task.getStatus().isBlank()) {
                    task.setStatus("pending");
                }
                if (task.getPriority() == null || task.getPriority().isBlank()) {
                    task.setPriority("medium");
                }
                return maintenanceRepository.save(task);
            })
            .toList();
        
        return ResponseEntity.ok(createdTasks);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> update(@PathVariable String id, @Valid @RequestBody MaintenanceSchedule updates, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        return maintenanceRepository.findByIdAndOrganizationId(id, user.getOrganizationId()).map(existing -> {
            // Update fields if provided
            if (updates.getTaskName() != null) existing.setTaskName(updates.getTaskName());
            if (updates.getDeviceId() != null) existing.setDeviceId(updates.getDeviceId());
            if (updates.getDeviceName() != null) existing.setDeviceName(updates.getDeviceName());
            if (updates.getComponentName() != null) existing.setComponentName(updates.getComponentName());
            if (updates.getMaintenanceType() != null) existing.setMaintenanceType(updates.getMaintenanceType());
            if (updates.getFrequency() != null) existing.setFrequency(updates.getFrequency());
            if (updates.getLastMaintenance() != null) existing.setLastMaintenance(updates.getLastMaintenance());
            if (updates.getNextMaintenance() != null) existing.setNextMaintenance(updates.getNextMaintenance());
            if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
            if (updates.getPriority() != null) existing.setPriority(updates.getPriority());
            if (updates.getAssignedTo() != null) existing.setAssignedTo(updates.getAssignedTo());
            if (updates.getNotes() != null) existing.setNotes(updates.getNotes());
            if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
            
            MaintenanceSchedule saved = maintenanceRepository.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_DELETE')")
    public ResponseEntity<?> delete(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        return maintenanceRepository.findByIdAndOrganizationId(id, user.getOrganizationId()).map(existing -> {
            maintenanceRepository.delete(existing);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> markAsCompleted(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        return maintenanceRepository.findByIdAndOrganizationId(id, user.getOrganizationId()).map(existing -> {
            existing.setStatus("completed");
            MaintenanceSchedule completedTask = maintenanceRepository.save(existing);
            return ResponseEntity.ok(completedTask);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getOverdueTasks(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> overdueTasks = maintenanceRepository.findOverdueTasks(user.getOrganizationId());
        return ResponseEntity.ok(overdueTasks);
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getUpcomingTasks(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> upcomingTasks = maintenanceRepository.findUpcomingTasks(user.getOrganizationId());
        return ResponseEntity.ok(upcomingTasks);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<MaintenanceStats> getStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        long totalTasks = maintenanceRepository.countByOrganizationId(user.getOrganizationId());
        long completedTasks = maintenanceRepository.countByOrganizationIdAndStatus(user.getOrganizationId(), "completed");
        long overdueTasks = maintenanceRepository.findOverdueTasks(user.getOrganizationId()).size();
        long upcomingTasks = maintenanceRepository.findUpcomingTasks(user.getOrganizationId()).size();
        
        MaintenanceStats stats = new MaintenanceStats(totalTasks, completedTasks, overdueTasks, upcomingTasks);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getTasksByDevice(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> deviceTasks = maintenanceRepository.findByOrganizationIdAndDeviceId(user.getOrganizationId(), deviceId);
        return ResponseEntity.ok(deviceTasks);
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getTasksByType(@PathVariable String type, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<MaintenanceSchedule> typeTasks = maintenanceRepository.findByOrganizationIdAndMaintenanceType(user.getOrganizationId(), type);
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
