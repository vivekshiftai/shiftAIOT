package com.iotplatform.service;

import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.dto.MaintenanceGenerationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing maintenance schedules with proper date calculations.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceScheduleService {
    
    private final MaintenanceScheduleRepository maintenanceScheduleRepository;
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    
    // Simple frequency mapping for basic string formats
    private static final Map<String, java.time.temporal.ChronoUnit> FREQUENCY_MAP = Map.of(
        "daily", java.time.temporal.ChronoUnit.DAYS,
        "weekly", java.time.temporal.ChronoUnit.WEEKS,
        "monthly", java.time.temporal.ChronoUnit.MONTHS,
        "quarterly", java.time.temporal.ChronoUnit.MONTHS,
        "yearly", java.time.temporal.ChronoUnit.YEARS,
        "annually", java.time.temporal.ChronoUnit.YEARS
    );
    
    /**
     * Create a new maintenance schedule with proper date calculations.
     */
    public MaintenanceSchedule createSchedule(MaintenanceSchedule schedule) {
        log.info("Creating maintenance schedule for device: {}", schedule.getDeviceId());
        
        // Calculate next maintenance date if not provided
        if (schedule.getNextMaintenance() == null) {
            schedule.setNextMaintenance(calculateNextMaintenanceDate(schedule.getFrequency()));
        }
        
        return maintenanceScheduleRepository.save(schedule);
    }
    
    /**
     * Get all maintenance schedules for a device.
     */
    public List<MaintenanceSchedule> getSchedulesByDeviceId(String deviceId) {
        log.info("Fetching maintenance schedules for device: {}", deviceId);
        return maintenanceScheduleRepository.findByDeviceId(deviceId);
    }
    
    /**
     * Get a maintenance schedule by ID.
     */
    public Optional<MaintenanceSchedule> getScheduleById(String id) {
        return maintenanceScheduleRepository.findById(id);
    }
    
    /**
     * Update a maintenance schedule.
     */
    public MaintenanceSchedule updateSchedule(MaintenanceSchedule schedule) {
        log.info("Updating maintenance schedule: {}", schedule.getId());
        return maintenanceScheduleRepository.save(schedule);
    }
    
    /**
     * Delete a maintenance schedule.
     */
    public void deleteSchedule(String id) {
        log.info("Deleting maintenance schedule: {}", id);
        maintenanceScheduleRepository.deleteById(id);
    }
    
    /**
     * Get all maintenance schedules.
     */
    public List<MaintenanceSchedule> getAllSchedules() {
        return maintenanceScheduleRepository.findAll();
    }
    
    /**
     * Get maintenance tasks by device ID.
     */
    public List<DeviceMaintenance> getMaintenanceByDeviceId(String deviceId) {
        log.info("Fetching maintenance tasks for device: {}", deviceId);
        return deviceMaintenanceRepository.findByDeviceId(deviceId);
    }

    /**
     * Get a maintenance task by ID.
     */
    public Optional<DeviceMaintenance> getMaintenanceById(String id) {
        log.info("Fetching maintenance task by ID: {}", id);
        return deviceMaintenanceRepository.findById(id);
    }

    /**
     * Create a new maintenance task.
     */
    public DeviceMaintenance createMaintenance(DeviceMaintenance maintenance) {
        log.info("Creating maintenance task for device: {}", maintenance.getDeviceId());
        return deviceMaintenanceRepository.save(maintenance);
    }

    /**
     * Update a maintenance task.
     */
    public DeviceMaintenance updateMaintenance(DeviceMaintenance maintenance) {
        log.info("Updating maintenance task: {}", maintenance.getId());
        return deviceMaintenanceRepository.save(maintenance);
    }

    /**
     * Delete a maintenance task.
     */
    public void deleteMaintenance(String id) {
        log.info("Deleting maintenance task: {}", id);
        deviceMaintenanceRepository.deleteById(id);
    }

    /**
     * Get all maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getAllMaintenanceByOrganization(String organizationId) {
        log.info("Fetching all maintenance tasks for organization: {}", organizationId);
        return deviceMaintenanceRepository.findByOrganizationId(organizationId);
    }

    /**
     * Get overdue maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getOverdueMaintenanceByOrganization(String organizationId) {
        log.info("Fetching overdue maintenance tasks for organization: {}", organizationId);
        // Get all maintenance for organization and filter for overdue ones
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        LocalDate today = LocalDate.now();
        return allMaintenance.stream()
                .filter(maintenance -> maintenance.getNextMaintenance() != null && 
                        maintenance.getNextMaintenance().isBefore(today) && 
                        maintenance.getStatus() == DeviceMaintenance.Status.ACTIVE)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Get upcoming maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getUpcomingMaintenanceByOrganization(String organizationId) {
        log.info("Fetching upcoming maintenance tasks for organization: {}", organizationId);
        // Get all maintenance for organization and filter for upcoming ones (next 30 days)
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(30);
        return allMaintenance.stream()
                .filter(maintenance -> maintenance.getNextMaintenance() != null && 
                        !maintenance.getNextMaintenance().isBefore(today) && 
                        !maintenance.getNextMaintenance().isAfter(thirtyDaysFromNow) && 
                        maintenance.getStatus() == DeviceMaintenance.Status.ACTIVE)
                .collect(java.util.stream.Collectors.toList());
    }
    
    /**
     * Create maintenance tasks from PDF with proper date calculations.
     */
    public void createMaintenanceFromPDF(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceTasks, String deviceId, String organizationId) {
        log.info("Creating maintenance tasks from PDF for device: {}", deviceId);
        
        for (MaintenanceGenerationResponse.MaintenanceTask maintenanceData : maintenanceTasks) {
            DeviceMaintenance maintenance = new DeviceMaintenance();
            maintenance.setId(UUID.randomUUID().toString());
            maintenance.setDeviceName("Device " + deviceId);
            maintenance.setOrganizationId(organizationId);
            maintenance.setTaskName(maintenanceData.getTaskName());
            maintenance.setDescription(maintenanceData.getDescription());
            maintenance.setFrequency(maintenanceData.getFrequency());
            maintenance.setPriority(convertPriority(maintenanceData.getPriority()));
            maintenance.setEstimatedDuration(maintenanceData.getEstimatedDuration());
            maintenance.setRequiredTools(maintenanceData.getRequiredTools());
            maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
            
            // Calculate next maintenance date based on frequency
            LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenanceData.getFrequency());
            maintenance.setNextMaintenance(nextMaintenance);
            
            // Set last maintenance to null (first time maintenance)
            maintenance.setLastMaintenance(null);
            
            maintenance.setCreatedAt(LocalDateTime.now());
            maintenance.setUpdatedAt(LocalDateTime.now());
            
            deviceMaintenanceRepository.save(maintenance);
            
            log.info("Created maintenance task: {} with next maintenance date: {}", 
                    maintenanceData.getTaskName(), nextMaintenance);
        }
        
        log.info("Created {} maintenance tasks from PDF for device: {}", maintenanceTasks.size(), deviceId);
    }
    
    /**
     * Mark maintenance task as completed and calculate next maintenance date.
     */
    public DeviceMaintenance completeMaintenanceTask(String maintenanceId) {
        log.info("Completing maintenance task: {}", maintenanceId);
        
        Optional<DeviceMaintenance> optionalMaintenance = deviceMaintenanceRepository.findById(maintenanceId);
        if (optionalMaintenance.isEmpty()) {
            log.error("Maintenance task not found: {}", maintenanceId);
            throw new IllegalArgumentException("Maintenance task not found: " + maintenanceId);
        }
        
        DeviceMaintenance maintenance = optionalMaintenance.get();
        
        // Set last maintenance to today
        maintenance.setLastMaintenance(LocalDate.now());
        
        // Calculate next maintenance date based on frequency
        LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenance.getFrequency());
        maintenance.setNextMaintenance(nextMaintenance);
        
        // Update status to completed
        maintenance.setStatus(DeviceMaintenance.Status.COMPLETED);
        maintenance.setUpdatedAt(LocalDateTime.now());
        
        DeviceMaintenance savedMaintenance = deviceMaintenanceRepository.save(maintenance);
        
        log.info("Completed maintenance task: {} with next maintenance date: {}", 
                maintenance.getTaskName(), nextMaintenance);
        
        return savedMaintenance;
    }
    
    /**
     * Calculate next maintenance date based on frequency string.
     * Supports basic formats: "daily", "weekly", "monthly", "quarterly", "yearly", "annually"
     */
    public LocalDate calculateNextMaintenanceDate(String frequency) {
        if (frequency == null || frequency.trim().isEmpty()) {
            log.warn("Frequency is null or empty, defaulting to monthly");
            return LocalDate.now().plusMonths(1);
        }
        
        String normalizedFrequency = frequency.toLowerCase().trim();
        LocalDate today = LocalDate.now();
        
        try {
            // Check for basic frequency formats
            switch (normalizedFrequency) {
                case "daily":
                    return today.plusDays(1);
                case "weekly":
                    return today.plusWeeks(1);
                case "monthly":
                    return today.plusMonths(1);
                case "quarterly":
                    return today.plusMonths(3);
                case "yearly":
                case "annually":
                    return today.plusYears(1);
                default:
                    log.warn("Unknown frequency format: '{}', defaulting to monthly", frequency);
                    return today.plusMonths(1);
            }
        } catch (Exception e) {
            log.error("Error calculating next maintenance date for frequency: {}", frequency, e);
            return today.plusMonths(1);
        }
    }
    
    /**
     * Get overdue maintenance tasks for a device.
     */
    public List<DeviceMaintenance> getOverdueMaintenance(String deviceId) {
        log.info("Fetching overdue maintenance for device: {}", deviceId);
        return deviceMaintenanceRepository.findByDeviceIdAndStatusAndNextMaintenanceBefore(
                deviceId, DeviceMaintenance.Status.ACTIVE, LocalDate.now());
    }
    
    /**
     * Get upcoming maintenance for a device (next 30 days).
     */
    public List<DeviceMaintenance> getUpcomingMaintenance(String deviceId) {
        log.info("Fetching upcoming maintenance for device: {}", deviceId);
        LocalDate thirtyDaysFromNow = LocalDate.now().plusDays(30);
        return deviceMaintenanceRepository.findByDeviceIdAndStatusAndNextMaintenanceBetween(
                deviceId, DeviceMaintenance.Status.ACTIVE, LocalDate.now(), thirtyDaysFromNow);
    }
    
    /**
     * Get maintenance count for a device.
     */
    public long getMaintenanceCount(String deviceId) {
        log.info("Fetching maintenance count for device: {}", deviceId);
        return deviceMaintenanceRepository.countByDeviceIdAndStatus(deviceId, DeviceMaintenance.Status.ACTIVE);
    }
    
    /**
     * Convert string priority to enum priority.
     */
    private DeviceMaintenance.Priority convertPriority(String priorityStr) {
        if (priorityStr == null) return DeviceMaintenance.Priority.MEDIUM;
        
        try {
            return DeviceMaintenance.Priority.valueOf(priorityStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid priority value: {}, using MEDIUM", priorityStr);
            return DeviceMaintenance.Priority.MEDIUM;
        }
    }
    
    /**
     * Update maintenance status to overdue for tasks past their due date.
     */
    public void updateOverdueMaintenance() {
        log.info("Updating overdue maintenance tasks");
        
        List<DeviceMaintenance> overdueTasks = deviceMaintenanceRepository
                .findByStatusAndNextMaintenanceBefore(DeviceMaintenance.Status.ACTIVE, LocalDate.now());
        
        for (DeviceMaintenance task : overdueTasks) {
            task.setStatus(DeviceMaintenance.Status.OVERDUE);
            task.setUpdatedAt(LocalDateTime.now());
            deviceMaintenanceRepository.save(task);
            log.info("Marked maintenance task as overdue: {}", task.getTaskName());
        }
        
        log.info("Updated {} overdue maintenance tasks", overdueTasks.size());
    }
}
