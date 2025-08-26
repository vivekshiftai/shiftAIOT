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
     * Create maintenance tasks from PDF with enhanced data processing and validation.
     */
    public void createMaintenanceFromPDF(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceTasks, String deviceId, String organizationId) {
        log.info("Creating maintenance tasks from PDF for device: {} in organization: {}", deviceId, organizationId);
        
        for (MaintenanceGenerationResponse.MaintenanceTask maintenanceData : maintenanceTasks) {
            try {
                DeviceMaintenance maintenance = new DeviceMaintenance();
                maintenance.setId(UUID.randomUUID().toString());
                maintenance.setDeviceName("Device " + deviceId);
                maintenance.setOrganizationId(organizationId);
                
                // Enhanced data processing and validation
                maintenance.setTaskName(processTaskName(maintenanceData.getTaskName()));
                maintenance.setDescription(processDescription(maintenanceData.getDescription()));
                maintenance.setFrequency(processFrequency(maintenanceData.getFrequency()));
                maintenance.setPriority(convertPriority(maintenanceData.getPriority()));
                maintenance.setEstimatedDuration(processDuration(maintenanceData.getEstimatedDuration()));
                maintenance.setRequiredTools(processTools(maintenanceData.getRequiredTools()));
                maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
                
                // Calculate next maintenance date based on processed frequency
                LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenance.getFrequency());
                maintenance.setNextMaintenance(nextMaintenance);
                
                // Set last maintenance to null (first time maintenance)
                maintenance.setLastMaintenance(null);
                
                maintenance.setCreatedAt(LocalDateTime.now());
                maintenance.setUpdatedAt(LocalDateTime.now());
                
                deviceMaintenanceRepository.save(maintenance);
                
                log.info("Created maintenance task: '{}' with next maintenance date: {} (frequency: {})", 
                        maintenance.getTaskName(), nextMaintenance, maintenance.getFrequency());
                        
            } catch (Exception e) {
                log.error("Failed to create maintenance task from PDF data: {}", maintenanceData.getTaskName(), e);
                // Continue with next task instead of failing completely
            }
        }
        
        log.info("Successfully created {} maintenance tasks from PDF for device: {}", maintenanceTasks.size(), deviceId);
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
     * Enhanced version that handles complex frequency patterns and numeric values.
     */
    public LocalDate calculateNextMaintenanceDate(String frequency) {
        if (frequency == null || frequency.trim().isEmpty()) {
            log.warn("Frequency is null or empty, defaulting to monthly");
            return LocalDate.now().plusMonths(1);
        }
        
        String normalizedFrequency = frequency.toLowerCase().trim();
        LocalDate today = LocalDate.now();
        
        try {
            // Enhanced pattern matching for complex frequencies
            if (normalizedFrequency.contains("daily") || normalizedFrequency.contains("every day")) {
                return today.plusDays(1);
            } else if (normalizedFrequency.contains("weekly") || normalizedFrequency.contains("every week")) {
                return today.plusWeeks(1);
            } else if (normalizedFrequency.contains("monthly") || normalizedFrequency.contains("every month")) {
                return today.plusMonths(1);
            } else if (normalizedFrequency.contains("quarterly") || normalizedFrequency.contains("every 3 months")) {
                return today.plusMonths(3);
            } else if (normalizedFrequency.contains("semi-annual") || normalizedFrequency.contains("every 6 months")) {
                return today.plusMonths(6);
            } else if (normalizedFrequency.contains("annual") || normalizedFrequency.contains("yearly") || normalizedFrequency.contains("every year")) {
                return today.plusYears(1);
            } else if (normalizedFrequency.contains("bi-annual") || normalizedFrequency.contains("every 2 years")) {
                return today.plusYears(2);
            }
            
            // Regex pattern for numeric frequencies (e.g., "30 days", "6 months", "2 years")
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+)\\s*(day|week|month|year)s?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(normalizedFrequency);
            
            if (matcher.find()) {
                int number = Integer.parseInt(matcher.group(1));
                String unit = matcher.group(2).toLowerCase();
                
                switch (unit) {
                    case "day":
                        return today.plusDays(number);
                    case "week":
                        return today.plusWeeks(number);
                    case "month":
                        return today.plusMonths(number);
                    case "year":
                        return today.plusYears(number);
                }
            }
            
            // Handle "every X hours" patterns (convert to days for approximation)
            java.util.regex.Pattern hoursPattern = java.util.regex.Pattern.compile("every\\s+(\\d+)\\s+hours?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher hoursMatcher = hoursPattern.matcher(normalizedFrequency);
            
            if (hoursMatcher.find()) {
                int hours = Integer.parseInt(hoursMatcher.group(1));
                int days = Math.max(1, hours / 24); // Convert hours to days, minimum 1 day
                log.info("Converting {} hours to {} days for maintenance scheduling", hours, days);
                return today.plusDays(days);
            }
            
            log.warn("Unknown frequency format: '{}', defaulting to monthly", frequency);
            return today.plusMonths(1);
            
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
     */
    private String processFrequency(String frequency) {
        if (frequency == null || frequency.trim().isEmpty()) {
            return "monthly";
        }
        
        String processed = frequency.trim().toLowerCase();
        
        // Normalize common frequency patterns
        if (processed.contains("every") && processed.contains("hour")) {
            return processed; // Keep as is for hour-based frequencies
        } else if (processed.contains("daily") || processed.contains("every day")) {
            return "daily";
        } else if (processed.contains("weekly") || processed.contains("every week")) {
            return "weekly";
        } else if (processed.contains("monthly") || processed.contains("every month")) {
            return "monthly";
        } else if (processed.contains("quarterly") || processed.contains("every 3 months")) {
            return "quarterly";
        } else if (processed.contains("semi-annual") || processed.contains("every 6 months")) {
            return "semi-annual";
        } else if (processed.contains("annual") || processed.contains("yearly") || processed.contains("every year")) {
            return "annual";
        } else if (processed.contains("bi-annual") || processed.contains("every 2 years")) {
            return "bi-annual";
        }
        
        return processed; // Return as is if no pattern matches
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
}
