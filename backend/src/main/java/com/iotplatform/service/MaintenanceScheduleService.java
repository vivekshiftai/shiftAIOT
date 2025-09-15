package com.iotplatform.service;

import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.Device;
import com.iotplatform.model.MaintenanceHistory;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.DeviceRepository;
import com.iotplatform.repository.MaintenanceHistoryRepository;
import com.iotplatform.dto.MaintenanceGenerationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Service for managing maintenance schedules with proper date calculations.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceScheduleService {
    
    private static final Logger log = LoggerFactory.getLogger(MaintenanceScheduleService.class);
    private final MaintenanceScheduleRepository maintenanceScheduleRepository;
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final DeviceRepository deviceRepository;
    private final MaintenanceHistoryRepository maintenanceHistoryRepository;
    
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
        log.info("Creating maintenance task for device: {}", maintenance.getDevice() != null ? maintenance.getDevice().getId() : "null");
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
     * Get today's maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getTodayMaintenance(String organizationId) {
        log.info("Fetching today's maintenance tasks for organization: {}", organizationId);
        // Get all maintenance for organization and filter for today's tasks
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        log.info("Found {} total maintenance tasks for organization: {}", allMaintenance.size(), organizationId);
        
        LocalDate today = LocalDate.now();
        log.info("Today's date: {}", today);
        
        List<DeviceMaintenance> todayTasks = allMaintenance.stream()
                .filter(maintenance -> {
                    boolean hasNextMaintenance = maintenance.getNextMaintenance() != null;
                    boolean isToday = hasNextMaintenance && maintenance.getNextMaintenance().equals(today);
                    boolean isActive = maintenance.getStatus() == DeviceMaintenance.Status.ACTIVE;
                    
                    log.debug("Maintenance task: {} - nextMaintenance: {}, isToday: {}, isActive: {}", 
                        maintenance.getTaskName(), maintenance.getNextMaintenance(), isToday, isActive);
                    
                    return hasNextMaintenance && isToday && isActive;
                })
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} maintenance tasks scheduled for today", todayTasks.size());
        return todayTasks;
    }

    /**
     * Get upcoming maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getUpcomingMaintenanceByOrganization(String organizationId) {
        log.info("Fetching upcoming maintenance tasks for organization: {}", organizationId);
        // Get all maintenance for organization and filter for upcoming ones (next 90 days for debugging)
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysFromNow = today.plusDays(90); // Extended to 90 days for debugging
        
        log.info("Found {} total maintenance tasks for organization: {}", allMaintenance.size(), organizationId);
        log.info("Filtering for upcoming tasks between {} and {} (90-day window for debugging)", today, thirtyDaysFromNow);
        
        List<DeviceMaintenance> upcomingMaintenance = allMaintenance.stream()
                .filter(maintenance -> {
                    boolean hasNextMaintenance = maintenance.getNextMaintenance() != null;
                    boolean isNotBeforeToday = hasNextMaintenance && !maintenance.getNextMaintenance().isBefore(today);
                    boolean isNotAfterThirtyDays = hasNextMaintenance && !maintenance.getNextMaintenance().isAfter(thirtyDaysFromNow);
                    boolean isActive = maintenance.getStatus() == DeviceMaintenance.Status.ACTIVE;
                    
                    log.debug("Maintenance task '{}': nextMaintenance={}, hasNextMaintenance={}, isNotBeforeToday={}, isNotAfterThirtyDays={}, isActive={}", 
                             maintenance.getTaskName(), maintenance.getNextMaintenance(), hasNextMaintenance, isNotBeforeToday, isNotAfterThirtyDays, isActive);
                    
                    return hasNextMaintenance && isNotBeforeToday && isNotAfterThirtyDays && isActive;
                })
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} upcoming maintenance tasks for organization: {}", upcomingMaintenance.size(), organizationId);
        return upcomingMaintenance;
    }
    
    /**
     * Get total maintenance count for an organization.
     */
    public long getMaintenanceCountByOrganization(String organizationId) {
        log.info("Fetching total maintenance count for organization: {}", organizationId);
        return deviceMaintenanceRepository.countByOrganizationIdAndStatus(organizationId, DeviceMaintenance.Status.ACTIVE);
    }
    
    /**
     * Get tomorrow's maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getTomorrowMaintenance(String organizationId) {
        log.info("Fetching tomorrow's maintenance tasks for organization: {}", organizationId);
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        log.info("Tomorrow's date: {}", tomorrow);
        
        List<DeviceMaintenance> tomorrowTasks = allMaintenance.stream()
                .filter(maintenance -> {
                    boolean hasNextMaintenance = maintenance.getNextMaintenance() != null;
                    boolean isTomorrow = hasNextMaintenance && maintenance.getNextMaintenance().equals(tomorrow);
                    boolean isActive = maintenance.getStatus() == DeviceMaintenance.Status.ACTIVE;
                    
                    log.debug("Maintenance task: {} - nextMaintenance: {}, isTomorrow: {}, isActive: {}", 
                        maintenance.getTaskName(), maintenance.getNextMaintenance(), isTomorrow, isActive);
                    
                    return hasNextMaintenance && isTomorrow && isActive;
                })
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} maintenance tasks scheduled for tomorrow", tomorrowTasks.size());
        return tomorrowTasks;
    }
    
    /**
     * Get maintenance tasks for the next N days for an organization.
     */
    public List<DeviceMaintenance> getNextDaysMaintenance(String organizationId, int days) {
        log.info("Fetching next {} days maintenance tasks for organization: {}", days, organizationId);
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(days);
        
        List<DeviceMaintenance> nextDaysTasks = allMaintenance.stream()
                .filter(maintenance -> {
                    boolean hasNextMaintenance = maintenance.getNextMaintenance() != null;
                    boolean isInRange = hasNextMaintenance && 
                            !maintenance.getNextMaintenance().isBefore(today) && 
                            !maintenance.getNextMaintenance().isAfter(endDate);
                    boolean isActive = maintenance.getStatus() == DeviceMaintenance.Status.ACTIVE;
                    
                    return hasNextMaintenance && isInRange && isActive;
                })
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} maintenance tasks for next {} days", nextDaysTasks.size(), days);
        return nextDaysTasks;
    }
    
    /**
     * Get recently completed maintenance tasks for an organization.
     */
    public List<DeviceMaintenance> getRecentCompletedMaintenance(String organizationId, int days) {
        log.info("Fetching recently completed maintenance tasks for organization: {} (last {} days)", organizationId, days);
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        
        LocalDate cutoffDate = LocalDate.now().minusDays(days);
        
        List<DeviceMaintenance> recentCompletedTasks = allMaintenance.stream()
                .filter(maintenance -> {
                    boolean isCompleted = maintenance.getStatus() == DeviceMaintenance.Status.COMPLETED;
                    boolean hasLastMaintenance = maintenance.getLastMaintenance() != null;
                    boolean isRecent = hasLastMaintenance && !maintenance.getLastMaintenance().isBefore(cutoffDate);
                    
                    return isCompleted && hasLastMaintenance && isRecent;
                })
                .sorted((a, b) -> b.getLastMaintenance().compareTo(a.getLastMaintenance())) // Most recent first
                .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} recently completed maintenance tasks", recentCompletedTasks.size());
        return recentCompletedTasks;
    }
    
    /**
     * Create maintenance tasks from PDF with strict validation.
     * Skips tasks with empty required fields (task, frequency, description, priority, estimated_duration, required_tools, safety_notes).
     * Safety notes are part of maintenance tasks and are stored with them.
     */
    public void createMaintenanceFromPDF(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceTasks, String deviceId, String organizationId, String currentUserId) {
        log.info("Creating maintenance tasks from PDF for device: {} in organization: {}", deviceId, organizationId);
        
        // Get device assignee for auto-assignment
        Optional<Device> device = deviceRepository.findById(deviceId);
        String deviceAssignee = device.map(Device::getAssignedUserId).orElse(null);
        
        log.info("🔍 Device lookup for maintenance assignment - Device ID: {}, Assigned User: '{}'", deviceId, deviceAssignee);
        
        // Additional validation - ensure device exists and has assigned user
        if (!device.isPresent()) {
            log.error("❌ CRITICAL: Device not found in database during maintenance assignment! Device ID: {}", deviceId);
            throw new RuntimeException("Device not found during maintenance assignment: " + deviceId);
        }
        
        if (deviceAssignee == null || deviceAssignee.trim().isEmpty()) {
            log.error("❌ CRITICAL: Device has no assigned user! Device ID: {}, Device Name: '{}'", 
                     deviceId, device.get().getName());
            log.error("❌ This means the device was created without proper user assignment!");
            log.error("❌ Maintenance tasks will be created without assignment");
        }
        
        int processedCount = 0;
        int skippedCount = 0;
        int assignedCount = 0;
        
        for (MaintenanceGenerationResponse.MaintenanceTask maintenanceData : maintenanceTasks) {
            try {
                // Get task title - prefer 'task' field over 'task_name' field
                String taskTitle = maintenanceData.getTask() != null && !maintenanceData.getTask().trim().isEmpty() 
                    ? maintenanceData.getTask().trim() 
                    : maintenanceData.getTaskName() != null ? maintenanceData.getTaskName().trim() : null;
                
                // STRICT VALIDATION: Check all required fields - skip if any are missing or empty
                if (taskTitle == null || taskTitle.isEmpty()) {
                    log.warn("Skipping maintenance task - task title is missing or empty");
                    skippedCount++;
                    continue;
                }
                
                if (maintenanceData.getFrequency() == null || maintenanceData.getFrequency().trim().isEmpty()) {
                    log.warn("Skipping maintenance task '{}' - frequency is missing or empty", taskTitle);
                    skippedCount++;
                    continue;
                }
                
                if (maintenanceData.getDescription() == null || maintenanceData.getDescription().trim().isEmpty()) {
                    log.warn("Skipping maintenance task '{}' - description is missing or empty", taskTitle);
                    skippedCount++;
                    continue;
                }
                
                if (maintenanceData.getPriority() == null || maintenanceData.getPriority().trim().isEmpty()) {
                    log.warn("Skipping maintenance task '{}' - priority is missing or empty", taskTitle);
                    skippedCount++;
                    continue;
                }
                
                if (maintenanceData.getEstimatedDuration() == null || maintenanceData.getEstimatedDuration().trim().isEmpty()) {
                    log.warn("Skipping maintenance task '{}' - estimated_duration is missing or empty", taskTitle);
                    skippedCount++;
                    continue;
                }
                
                if (maintenanceData.getRequiredTools() == null || maintenanceData.getRequiredTools().trim().isEmpty()) {
                    log.warn("Skipping maintenance task '{}' - required_tools is missing or empty", taskTitle);
                    skippedCount++;
                    continue;
                }
                
                if (maintenanceData.getSafetyNotes() == null || maintenanceData.getSafetyNotes().trim().isEmpty()) {
                    log.warn("Skipping maintenance task '{}' - safety_notes is missing or empty", taskTitle);
                    skippedCount++;
                    continue;
                }
                
                // Check if maintenance task already exists for this device (deviceId + taskName)
                Optional<DeviceMaintenance> existingMaintenance = deviceMaintenanceRepository
                    .findByDeviceIdAndTaskNameAndOrganizationId(deviceId, taskTitle, organizationId);
                if (existingMaintenance.isPresent()) {
                    DeviceMaintenance existingTask = existingMaintenance.get();
                    
                    // If task exists but is not assigned, assign it to the device assignee
                    if (existingTask.getAssignedTo() == null || existingTask.getAssignedTo().trim().isEmpty()) {
                        if (deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
                            existingTask.setAssignedTo(deviceAssignee);
                            existingTask.setAssignedBy(currentUserId);
                            existingTask.setAssignedAt(LocalDateTime.now());
                            deviceMaintenanceRepository.save(existingTask);
                            assignedCount++;
                            log.info("✅ Existing maintenance task '{}' assigned to user: {} by: {}", taskTitle, deviceAssignee, currentUserId);
                        } else {
                            log.warn("⚠️ Existing maintenance task '{}' not assigned - no device assignee found", taskTitle);
                        }
                    } else {
                        log.info("ℹ️ Maintenance task '{}' already exists and is assigned to: {}", taskTitle, existingTask.getAssignedTo());
                    }
                    
                    skippedCount++;
                    continue;
                }
                
                // All required fields are present, create maintenance task
                DeviceMaintenance maintenance = new DeviceMaintenance();
                maintenance.setId(UUID.randomUUID().toString());
                maintenance.setDeviceId(deviceId);
                maintenance.setOrganizationId(organizationId);
                
                // Set validated fields with actual values (no defaults)
                maintenance.setTaskName(taskTitle);
                maintenance.setComponentName(taskTitle != null && !taskTitle.trim().isEmpty() ? taskTitle.trim() : "General");
                maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                maintenance.setDescription(maintenanceData.getDescription().trim());
                
                log.debug("Set componentName to: '{}' for task: '{}'", maintenance.getComponentName(), taskTitle);
                log.debug("Set maintenanceType to: '{}' for task: '{}'", maintenance.getMaintenanceType(), taskTitle);
                maintenance.setFrequency(maintenanceData.getFrequency().trim());
                maintenance.setPriority(convertPriority(maintenanceData.getPriority().trim()));
                maintenance.setEstimatedDuration(maintenanceData.getEstimatedDuration().trim());
                maintenance.setRequiredTools(maintenanceData.getRequiredTools().trim());
                
                // Store safety notes as part of maintenance task
                maintenance.setSafetyNotes(maintenanceData.getSafetyNotes().trim());
                
                maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
                
                // Calculate next maintenance date based on processed frequency
                LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenance.getFrequency());
                maintenance.setNextMaintenance(nextMaintenance);
                
                // Set last maintenance to null (first time maintenance)
                maintenance.setLastMaintenance(null);
                
                maintenance.setCreatedAt(LocalDateTime.now());
                maintenance.setUpdatedAt(LocalDateTime.now());
                
                // Auto-assign to device assignee
                if (deviceAssignee != null && !deviceAssignee.trim().isEmpty()) {
                    maintenance.setAssignedTo(deviceAssignee);
                    maintenance.setAssignedBy(currentUserId);
                    maintenance.setAssignedAt(LocalDateTime.now());
                    assignedCount++;
                    log.info("✅ Maintenance task '{}' assigned to user: {} by: {}", taskTitle, deviceAssignee, currentUserId);
                } else {
                    log.warn("⚠️ Maintenance task '{}' not assigned - no device assignee found", taskTitle);
                }
                
                // Final validation - ensure maintenance type is set
                if (maintenance.getMaintenanceType() == null) {
                    log.warn("Maintenance type is null for task: {}, setting to GENERAL", taskTitle);
                    maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                }
                
                // Double-check maintenance type before saving
                if (maintenance.getMaintenanceType() == null) {
                    log.error("CRITICAL: Maintenance type is still null for task: {} after setting to GENERAL", taskTitle);
                    maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.GENERAL);
                }
                
                log.info("Final maintenance type before save: {} for task: {}", maintenance.getMaintenanceType(), taskTitle);
                
                deviceMaintenanceRepository.save(maintenance);
                processedCount++;
                
                log.info("STRICT VALIDATION: Created maintenance task: '{}' with next maintenance date: {} (frequency: {}, priority: {})", 
                        maintenance.getTaskName(), nextMaintenance, maintenance.getFrequency(), maintenance.getPriority());
                        
            } catch (Exception e) {
                log.error("Failed to create maintenance task from PDF data: {}", 
                    maintenanceData.getTaskName() != null ? maintenanceData.getTaskName() : "Unknown", e);
                skippedCount++;
                // Continue with next task instead of failing completely
            }
        }
        
        log.info("Maintenance task creation completed for device: {} - Processed: {}, Skipped: {}, Assigned: {}", 
            deviceId, processedCount, skippedCount, assignedCount);
    }
    
    /**
     * Update existing maintenance tasks for a device with assigned user if they don't have one.
     * This is useful for fixing existing data where maintenance tasks were created without assignment.
     */
    public void updateMaintenanceTasksAssignment(String deviceId, String organizationId) {
        log.info("Updating maintenance task assignments for device: {} in organization: {}", deviceId, organizationId);
        
        // Get device assignee
        Optional<Device> device = deviceRepository.findById(deviceId);
        String deviceAssignee = device.map(Device::getAssignedUserId).orElse(null);
        
        if (deviceAssignee == null || deviceAssignee.trim().isEmpty()) {
            log.warn("⚠️ No device assignee found for device: {}, cannot update maintenance assignments", deviceId);
            return;
        }
        
        // Find all maintenance tasks for this device that don't have assigned users
        List<DeviceMaintenance> unassignedTasks = deviceMaintenanceRepository
            .findByDeviceIdAndOrganizationIdAndAssignedToIsNull(deviceId, organizationId);
        
        if (unassignedTasks.isEmpty()) {
            log.info("✅ All maintenance tasks for device: {} are already assigned", deviceId);
            return;
        }
        
        int updatedCount = 0;
        for (DeviceMaintenance task : unassignedTasks) {
            task.setAssignedTo(deviceAssignee);
            task.setUpdatedAt(LocalDateTime.now());
            deviceMaintenanceRepository.save(task);
            updatedCount++;
            log.info("✅ Updated maintenance task '{}' with assigned user: {}", task.getTaskName(), deviceAssignee);
        }
        
        log.info("Maintenance task assignment update completed for device: {} - Updated: {} tasks", deviceId, updatedCount);
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
        LocalDate completionDate = LocalDate.now();
        maintenance.setLastMaintenance(completionDate);
        
        // Calculate next maintenance date based on frequency
        LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenance.getFrequency());
        maintenance.setNextMaintenance(nextMaintenance);
        
        // Update status to completed
        maintenance.setStatus(DeviceMaintenance.Status.COMPLETED);
        maintenance.setUpdatedAt(LocalDateTime.now());
        
        // Save maintenance history for completed task
        saveCompletedMaintenanceHistory(maintenance, completionDate, "System");
        
        DeviceMaintenance savedMaintenance = deviceMaintenanceRepository.save(maintenance);
        
        log.info("Completed maintenance task: {} with next maintenance date: {}", 
                maintenance.getTaskName(), nextMaintenance);
        
        return savedMaintenance;
    }
    
    /**
     * Calculate next maintenance date based on frequency string.
     * Enhanced version that handles complex frequency patterns and numeric values.
     * Uses the provided base date or current date if not provided.
     */
    public LocalDate calculateNextMaintenanceDate(String frequency) {
        return calculateNextMaintenanceDate(frequency, LocalDate.now());
    }
    
    /**
     * Calculate next maintenance date based on frequency string and base date.
     * Enhanced version that handles complex frequency patterns and numeric values.
     */
    public LocalDate calculateNextMaintenanceDate(String frequency, LocalDate baseDate) {
        if (frequency == null || frequency.trim().isEmpty()) {
            log.warn("Frequency is null or empty, defaulting to daily");
            return baseDate.plusDays(1);
        }
        
        if (baseDate == null) {
            log.warn("Base date is null, using current date");
            baseDate = LocalDate.now();
        }
        
        String normalizedFrequency = frequency.toLowerCase().trim();
        
        try {
            // Enhanced pattern matching for complex frequencies
            if (normalizedFrequency.contains("daily") || normalizedFrequency.contains("every day")) {
                return baseDate.plusDays(1);
            } else if (normalizedFrequency.contains("weekly") || normalizedFrequency.contains("every week")) {
                return baseDate.plusWeeks(1);
            } else if (normalizedFrequency.contains("monthly") || normalizedFrequency.contains("every month")) {
                return baseDate.plusMonths(1);
            } else if (normalizedFrequency.contains("quarterly") || normalizedFrequency.contains("every 3 months")) {
                return baseDate.plusMonths(3);
            } else if (normalizedFrequency.contains("semi-annual") || normalizedFrequency.contains("every 6 months")) {
                return baseDate.plusMonths(6);
            } else if (normalizedFrequency.contains("annual") || normalizedFrequency.contains("yearly") || normalizedFrequency.contains("every year")) {
                return baseDate.plusYears(1);
            } else if (normalizedFrequency.contains("bi-annual") || normalizedFrequency.contains("every 2 years")) {
                return baseDate.plusYears(2);
            }
            
            // Regex pattern for numeric frequencies (e.g., "30 days", "6 months", "2 years")
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+)\\s*(day|week|month|year)s?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(normalizedFrequency);
            
            if (matcher.find()) {
                int number = Integer.parseInt(matcher.group(1));
                String unit = matcher.group(2).toLowerCase();
                
                switch (unit) {
                    case "day":
                        return baseDate.plusDays(number);
                    case "week":
                        return baseDate.plusWeeks(number);
                    case "month":
                        return baseDate.plusMonths(number);
                    case "year":
                        return baseDate.plusYears(number);
                }
            }
            
            // Handle "every X hours" patterns (convert to days for approximation)
            java.util.regex.Pattern hoursPattern = java.util.regex.Pattern.compile("every\\s+(\\d+)\\s+hours?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher hoursMatcher = hoursPattern.matcher(normalizedFrequency);
            
            if (hoursMatcher.find()) {
                int hours = Integer.parseInt(hoursMatcher.group(1));
                int days = Math.max(1, hours / 24); // Convert hours to days, minimum 1 day
                log.info("Converting {} hours to {} days for maintenance scheduling", hours, days);
                return baseDate.plusDays(days);
            }
            
            log.warn("Unknown frequency format: '{}', defaulting to daily", frequency);
            return baseDate.plusDays(1);
            
        } catch (Exception e) {
            log.error("Error calculating next maintenance date for frequency: {}", frequency, e);
            return baseDate.plusDays(1);
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

    /**
     * Process and validate task name
     */
    private String processTaskName(String taskName) {
        if (taskName == null || taskName.trim().isEmpty()) {
            return "Unnamed Maintenance Task";
        }
        
        String processed = taskName.trim();
        // Capitalize first letter of each word
        String[] words = processed.split("\\s+");
        StringBuilder result = new StringBuilder();
        for (String word : words) {
            if (word.length() > 0) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1).toLowerCase())
                      .append(" ");
            }
        }
        
        return result.toString().trim();
    }
    
    /**
     * Process and validate description
     */
    private String processDescription(String description) {
        if (description == null || description.trim().isEmpty()) {
            return "No description provided";
        }
        
        String processed = description.trim();
        // Ensure proper sentence formatting
        if (!processed.endsWith(".") && !processed.endsWith("!") && !processed.endsWith("?")) {
            processed += ".";
        }
        
        return processed;
    }
    
    /**
     * Process and normalize frequency string
     * Handles numeric string values and converts them to descriptive frequency strings.
     */
    private String processFrequency(String frequency) {
        if (frequency == null || frequency.trim().isEmpty()) {
            log.debug("Frequency not provided, defaulting to 'daily'");
            return "daily";
        }
        
        String processed = frequency.trim();
        
        // First, try to parse as numeric string (new format)
        try {
            int numericFreq = Integer.parseInt(processed);
            String descriptiveFreq = convertNumericFrequencyToDescriptive(numericFreq);
            log.debug("Converted numeric frequency {} to descriptive: {}", numericFreq, descriptiveFreq);
            return descriptiveFreq;
        } catch (NumberFormatException e) {
            // If not numeric, process as text (legacy format)
            log.debug("Frequency is not numeric, processing as text: {}", processed);
        }
        
        String normalizedFreq = processed.toLowerCase();
        
        // Normalize common frequency patterns (legacy text format)
        if (normalizedFreq.contains("every") && normalizedFreq.contains("hour")) {
            return normalizedFreq; // Keep as is for hour-based frequencies
        } else if (normalizedFreq.contains("daily") || normalizedFreq.contains("every day")) {
            return "daily";
        } else if (normalizedFreq.contains("weekly") || normalizedFreq.contains("every week")) {
            return "weekly";
        } else if (normalizedFreq.contains("monthly") || normalizedFreq.contains("every month")) {
            return "monthly";
        } else if (normalizedFreq.contains("quarterly") || normalizedFreq.contains("every 3 months")) {
            return "quarterly";
        } else if (normalizedFreq.contains("semi-annual") || normalizedFreq.contains("every 6 months")) {
            return "semi-annual";
        } else if (normalizedFreq.contains("annual") || normalizedFreq.contains("yearly") || normalizedFreq.contains("every year")) {
            return "annual";
        } else if (normalizedFreq.contains("bi-annual") || normalizedFreq.contains("every 2 years")) {
            return "bi-annual";
        }
        
        return processed; // Return as is if no pattern matches
    }

    /**
     * Convert numeric frequency values to descriptive frequency strings.
     */
    private String convertNumericFrequencyToDescriptive(int numericFreq) {
        switch (numericFreq) {
            case 1:
                return "daily";
            case 7:
                return "weekly";
            case 30:
                return "monthly";
            case 90:
                return "quarterly";
            case 180:
                return "semi-annual";
            case 365:
                return "annual";
            default:
                log.warn("Unknown numeric frequency: {}, defaulting to daily", numericFreq);
                return "daily";
        }
    }
    
    /**
     * Process and validate estimated duration
     */
    private String processDuration(String duration) {
        if (duration == null || duration.trim().isEmpty()) {
            return "Not specified";
        }
        
        String processed = duration.trim();
        
        // Normalize common duration formats
        if (processed.toLowerCase().contains("hour")) {
            return processed.toLowerCase().replace("hour", "hour(s)");
        } else if (processed.toLowerCase().contains("minute")) {
            return processed.toLowerCase().replace("minute", "minute(s)");
        } else if (processed.toLowerCase().contains("day")) {
            return processed.toLowerCase().replace("day", "day(s)");
        }
        
        return processed;
    }
    
    /**
     * Process and validate required tools
     */
    private String processTools(String tools) {
        if (tools == null || tools.trim().isEmpty()) {
            return "Standard tools";
        }
        
        String processed = tools.trim();
        
        // Clean up tool list formatting
        if (processed.contains(",")) {
            // Split by comma and clean up each tool
            String[] toolArray = processed.split(",");
            StringBuilder result = new StringBuilder();
            for (String tool : toolArray) {
                String cleanedTool = tool.trim();
                if (!cleanedTool.isEmpty()) {
                    if (result.length() > 0) {
                        result.append(", ");
                    }
                    result.append(cleanedTool);
                }
            }
            return result.toString();
        }
        
        return processed;
    }    
    /**
     * Assign a maintenance task to a user
     */
    public DeviceMaintenance assignMaintenanceTask(String maintenanceId, String assigneeId, String assignedBy) {
        log.info("Assigning maintenance task: {} to user: {} by user: {}", maintenanceId, assigneeId, assignedBy);
        
        Optional<DeviceMaintenance> optionalMaintenance = deviceMaintenanceRepository.findById(maintenanceId);
        if (optionalMaintenance.isEmpty()) {
            log.error("Maintenance task not found: {}", maintenanceId);
            throw new IllegalArgumentException("Maintenance task not found: " + maintenanceId);
        }
        
        DeviceMaintenance maintenance = optionalMaintenance.get();
        maintenance.setAssignedTo(assigneeId);
        maintenance.setAssignedBy(assignedBy);
        maintenance.setAssignedAt(LocalDateTime.now());
        maintenance.setUpdatedAt(LocalDateTime.now());
        
        DeviceMaintenance savedMaintenance = deviceMaintenanceRepository.save(maintenance);
        
        log.info("Successfully assigned maintenance task: {} to user: {}", maintenance.getTaskName(), assigneeId);
        
        return savedMaintenance;
    }
    
    /**
     * Remove duplicate maintenance tasks for a device
     */
    public void removeDuplicateMaintenanceTasks(String deviceId, String organizationId) {
        log.info("Removing duplicate maintenance tasks for device: {} in organization: {}", deviceId, organizationId);
        
        try {
            // Get all maintenance tasks for the device
            List<DeviceMaintenance> allTasks = deviceMaintenanceRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
            
            // Group tasks by taskName
            Map<String, List<DeviceMaintenance>> tasksByName = allTasks.stream()
                .collect(Collectors.groupingBy(DeviceMaintenance::getTaskName));
            
            int removedCount = 0;
            
            for (Map.Entry<String, List<DeviceMaintenance>> entry : tasksByName.entrySet()) {
                String taskName = entry.getKey();
                List<DeviceMaintenance> tasks = entry.getValue();
                
                if (tasks.size() > 1) {
                    log.info("Found {} duplicate tasks for '{}', keeping the first one and removing {} duplicates", 
                            tasks.size(), taskName, tasks.size() - 1);
                    
                    // Keep the first task (oldest by creation date), remove the rest
                    DeviceMaintenance keepTask = tasks.stream()
                        .min(Comparator.comparing(DeviceMaintenance::getCreatedAt))
                        .orElse(tasks.get(0));
                    
                    for (DeviceMaintenance task : tasks) {
                        if (!task.getId().equals(keepTask.getId())) {
                            deviceMaintenanceRepository.delete(task);
                            removedCount++;
                            log.debug("Removed duplicate maintenance task: {} (ID: {})", taskName, task.getId());
                        }
                    }
                }
            }
            
            log.info("Duplicate maintenance task cleanup completed - Removed: {} duplicates for device: {}", removedCount, deviceId);
                    
        } catch (Exception e) {
            log.error("Error removing duplicate maintenance tasks for device: {}", deviceId, e);
        }
    }

    /**
     * Update device names for maintenance tasks that don't have them
     */
    public void updateDeviceNamesForMaintenanceTasks(String organizationId) {
        log.info("Updating device names for maintenance tasks in organization: {}", organizationId);
        
        try {
            // Get all maintenance tasks for the organization
            List<DeviceMaintenance> maintenanceTasks = deviceMaintenanceRepository.findByOrganizationId(organizationId);
            
            int updatedCount = 0;
            int skippedCount = 0;
            
            for (DeviceMaintenance maintenance : maintenanceTasks) {
                // Check if deviceName is null or empty
                if (maintenance.getDeviceName() == null || maintenance.getDeviceName().trim().isEmpty()) {
                    // Get device information
                    if (maintenance.getDevice() != null && maintenance.getDevice().getId() != null) {
                        Optional<Device> deviceOpt = deviceRepository.findById(maintenance.getDevice().getId());
                        if (deviceOpt.isPresent()) {
                            maintenance.setDeviceName(deviceOpt.get().getName());
                            deviceMaintenanceRepository.save(maintenance);
                            updatedCount++;
                            log.debug("Updated device name for maintenance task: {} to: {}", 
                                    maintenance.getTaskName(), maintenance.getDeviceName());
                        } else {
                            log.warn("Device not found for maintenance task: {} with device ID: {}", 
                                    maintenance.getTaskName(), maintenance.getDevice().getId());
                            skippedCount++;
                        }
                    } else {
                        log.warn("No device information for maintenance task: {}", maintenance.getTaskName());
                        skippedCount++;
                    }
                } else {
                    skippedCount++;
                }
            }
            
            log.info("Device name update completed - Updated: {}, Skipped: {}, Total: {}", 
                    updatedCount, skippedCount, maintenanceTasks.size());
                    
        } catch (Exception e) {
            log.error("Error updating device names for maintenance tasks", e);
        }
    }
    
    /**
     * Save maintenance history record when maintenance date is updated
     * This creates a permanent record of the maintenance schedule
     */
    public void saveMaintenanceHistory(DeviceMaintenance maintenance, LocalDate scheduledDate, String reason) {
        try {
            log.info("Saving maintenance history for task: {} scheduled for: {} reason: {}", 
                    maintenance.getTaskName(), scheduledDate, reason);
            
            // Get next cycle number for this device
            Integer nextCycleNumber = maintenanceHistoryRepository.findNextCycleNumberForDevice(maintenance.getDeviceId());
            if (nextCycleNumber == null) {
                nextCycleNumber = 1;
            }
            
            // Create maintenance history record
            MaintenanceHistory history = MaintenanceHistory.fromDeviceMaintenance(maintenance, scheduledDate, nextCycleNumber);
            
            // Set additional history-specific fields
            history.setId(java.util.UUID.randomUUID().toString());
            history.setSnapshotType("UPDATE");
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedAt(LocalDateTime.now());
            
            // Save to history table
            maintenanceHistoryRepository.save(history);
            
            log.info("✅ Maintenance history saved for task: {} cycle: {} scheduled: {}", 
                    maintenance.getTaskName(), nextCycleNumber, scheduledDate);
                    
        } catch (Exception e) {
            log.error("❌ Failed to save maintenance history for task: {} scheduled: {}", 
                    maintenance.getTaskName(), scheduledDate, e);
        }
    }
    
    /**
     * Save maintenance history when maintenance is completed
     */
    public void saveCompletedMaintenanceHistory(DeviceMaintenance maintenance, LocalDate completionDate, String completedBy) {
        try {
            log.info("Saving completed maintenance history for task: {} completed on: {} by: {}", 
                    maintenance.getTaskName(), completionDate, completedBy);
            
            // Get next cycle number for this device
            Integer cycleNumber = maintenanceHistoryRepository.findNextCycleNumberForDevice(maintenance.getDeviceId());
            if (cycleNumber == null) {
                cycleNumber = 1;
            }
            
            // Create maintenance history record
            MaintenanceHistory history = MaintenanceHistory.fromDeviceMaintenance(maintenance, maintenance.getLastMaintenance(), cycleNumber);
            
            // Set completion details
            history.setId(java.util.UUID.randomUUID().toString());
            history.setActualDate(completionDate);
            history.setCompletedBy(completedBy);
            history.setCompletedAt(LocalDateTime.now());
            history.setStatus(MaintenanceHistory.Status.COMPLETED);
            history.setSnapshotType("COMPLETION");
            history.setCreatedAt(LocalDateTime.now());
            history.setUpdatedAt(LocalDateTime.now());
            
            // Save to history table
            maintenanceHistoryRepository.save(history);
            
            log.info("✅ Completed maintenance history saved for task: {} cycle: {} completed: {}", 
                    maintenance.getTaskName(), cycleNumber, completionDate);
                    
        } catch (Exception e) {
            log.error("❌ Failed to save completed maintenance history for task: {} completed: {}", 
                    maintenance.getTaskName(), completionDate, e);
        }
    }
}
