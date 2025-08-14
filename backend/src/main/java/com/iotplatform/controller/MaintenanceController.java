package com.iotplatform.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.model.User;
import com.iotplatform.repository.MaintenanceScheduleRepository;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/maintenance")
public class MaintenanceController {

    @Autowired
    private MaintenanceScheduleRepository repo;

    @GetMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getAll(@AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.findByOrganizationId(user.getOrganizationId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<MaintenanceSchedule> getOne(@PathVariable String id, @AuthenticationPrincipal User user) {
        Optional<MaintenanceSchedule> task = repo.findByIdAndOrganizationId(id, user.getOrganizationId());
        return task.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> create(@Valid @RequestBody MaintenanceSchedule task, @AuthenticationPrincipal User user) {
        // Set organization ID and default values
        task.setOrganizationId(user.getOrganizationId());
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("pending");
        }
        if (task.getPriority() == null || task.getPriority().isBlank()) {
            task.setPriority("medium");
        }
        
        MaintenanceSchedule saved = repo.save(task);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_WRITE')")
    public ResponseEntity<MaintenanceSchedule> update(@PathVariable String id, @Valid @RequestBody MaintenanceSchedule updates, @AuthenticationPrincipal User user) {
        return repo.findByIdAndOrganizationId(id, user.getOrganizationId()).map(existing -> {
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
            
            MaintenanceSchedule saved = repo.save(existing);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MAINTENANCE_DELETE')")
    public ResponseEntity<?> delete(@PathVariable String id, @AuthenticationPrincipal User user) {
        return repo.findByIdAndOrganizationId(id, user.getOrganizationId()).map(existing -> {
            repo.delete(existing);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> search(
            @RequestParam String query, 
            @AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.searchByOrganizationIdAndTaskNameOrDescription(user.getOrganizationId(), query);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/overdue")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getOverdueTasks(@AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.findOverdueTasks(user.getOrganizationId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getUpcomingTasks(@AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.findUpcomingTasks(user.getOrganizationId());
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getByStatus(
            @PathVariable String status, 
            @AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.findByOrganizationIdAndStatus(user.getOrganizationId(), status);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/priority/{priority}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getByPriority(
            @PathVariable String priority, 
            @AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.findByOrganizationIdAndPriority(user.getOrganizationId(), priority);
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('MAINTENANCE_READ')")
    public ResponseEntity<List<MaintenanceSchedule>> getByDevice(
            @PathVariable String deviceId, 
            @AuthenticationPrincipal User user) {
        List<MaintenanceSchedule> tasks = repo.findByOrganizationIdAndDeviceId(user.getOrganizationId(), deviceId);
        return ResponseEntity.ok(tasks);
    }
}
