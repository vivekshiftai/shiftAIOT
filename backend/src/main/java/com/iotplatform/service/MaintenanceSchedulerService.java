package com.iotplatform.service;

import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceSchedulerService {
    
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final MaintenanceScheduleService maintenanceScheduleService;
    
    /**
     * Update maintenance schedules when the application starts
     */
    @EventListener(ApplicationReadyEvent.class)
    public void updateMaintenanceSchedulesOnStartup() {
        log.info("🚀 Application started - updating maintenance schedules...");
        log.info("📅 Maintenance Scheduler Service initialized");
        log.info("⏰ Scheduled to run daily at 6:00 AM");
        updateMaintenanceSchedules();
    }
    
    /**
     * Update maintenance schedules daily at 6:00 AM
     */
    @Scheduled(cron = "0 0 6 * * ?") // Every day at 6:00 AM
    public void updateMaintenanceSchedulesDaily() {
        log.info("⏰ Daily maintenance schedule update triggered at 6:00 AM");
        log.info("📋 Processing all active maintenance tasks...");
        updateMaintenanceSchedules();
    }
    
    /**
     * Main method to update maintenance schedules
     */
    private void updateMaintenanceSchedules() {
        try {
            log.info("🔄 Starting maintenance schedule update process...");
            
            // Get all active maintenance tasks
            List<DeviceMaintenance> activeMaintenanceTasks = deviceMaintenanceRepository.findByStatus(DeviceMaintenance.Status.ACTIVE);
            log.info("📊 Found {} active maintenance tasks to process", activeMaintenanceTasks.size());
            
            int updatedCount = 0;
            int overdueCount = 0;
            
            LocalDate today = LocalDate.now();
            
            for (DeviceMaintenance maintenance : activeMaintenanceTasks) {
                try {
                    // Check if the maintenance is overdue (next maintenance date is in the past)
                    if (maintenance.getNextMaintenance() != null && maintenance.getNextMaintenance().isBefore(today)) {
                        log.info("Maintenance task '{}' is overdue. Last due: {}, Current date: {}", 
                                maintenance.getTaskName(), maintenance.getNextMaintenance(), today);
                        
                        // Calculate the next maintenance date based on frequency
                        LocalDate nextMaintenance = calculateNextMaintenanceDateFromLast(maintenance.getLastMaintenance(), maintenance.getFrequency());
                        
                        // Update the maintenance task
                        maintenance.setNextMaintenance(nextMaintenance);
                        maintenance.setUpdatedAt(LocalDateTime.now());
                        
                        // If lastMaintenance was null, set it to the overdue date
                        if (maintenance.getLastMaintenance() == null) {
                            maintenance.setLastMaintenance(maintenance.getNextMaintenance());
                        }
                        
                        deviceMaintenanceRepository.save(maintenance);
                        updatedCount++;
                        overdueCount++;
                        
                        log.info("Updated overdue maintenance task '{}' with new next maintenance date: {}", 
                                maintenance.getTaskName(), nextMaintenance);
                    }
                    // Check if maintenance is due today and needs to be updated for next cycle
                    else if (maintenance.getNextMaintenance() != null && maintenance.getNextMaintenance().equals(today)) {
                        log.info("Maintenance task '{}' is due today. Calculating next maintenance date...", 
                                maintenance.getTaskName());
                        
                        // Calculate next maintenance date from today
                        LocalDate nextMaintenance = calculateNextMaintenanceDateFromLast(today, maintenance.getFrequency());
                        
                        // Update the maintenance task
                        maintenance.setNextMaintenance(nextMaintenance);
                        maintenance.setLastMaintenance(today); // Set last maintenance to today
                        maintenance.setUpdatedAt(LocalDateTime.now());
                        
                        deviceMaintenanceRepository.save(maintenance);
                        updatedCount++;
                        
                        log.info("Updated maintenance task '{}' due today with new next maintenance date: {}", 
                                maintenance.getTaskName(), nextMaintenance);
                    }
                    
                } catch (Exception e) {
                    log.error("Error updating maintenance task '{}': {}", maintenance.getTaskName(), e.getMessage(), e);
                }
            }
            
            log.info("✅ Maintenance schedule update completed. Updated {} tasks ({} overdue tasks processed)", 
                    updatedCount, overdueCount);
            
        } catch (Exception e) {
            log.error("Error during maintenance schedule update: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Calculate next maintenance date based on last maintenance date and frequency
     */
    private LocalDate calculateNextMaintenanceDateFromLast(LocalDate lastMaintenance, String frequency) {
        if (lastMaintenance == null) {
            log.warn("Last maintenance date is null, using today as base date");
            lastMaintenance = LocalDate.now();
        }
        
        if (frequency == null || frequency.trim().isEmpty()) {
            log.warn("Frequency is null or empty, defaulting to daily");
            return lastMaintenance.plusDays(1);
        }
        
        String normalizedFrequency = frequency.toLowerCase().trim();
        
        try {
            // Enhanced pattern matching for complex frequencies
            if (normalizedFrequency.contains("daily") || normalizedFrequency.contains("every day")) {
                return lastMaintenance.plusDays(1);
            } else if (normalizedFrequency.contains("weekly") || normalizedFrequency.contains("every week")) {
                return lastMaintenance.plusWeeks(1);
            } else if (normalizedFrequency.contains("monthly") || normalizedFrequency.contains("every month")) {
                return lastMaintenance.plusMonths(1);
            } else if (normalizedFrequency.contains("quarterly") || normalizedFrequency.contains("every 3 months")) {
                return lastMaintenance.plusMonths(3);
            } else if (normalizedFrequency.contains("semi-annual") || normalizedFrequency.contains("every 6 months")) {
                return lastMaintenance.plusMonths(6);
            } else if (normalizedFrequency.contains("annual") || normalizedFrequency.contains("yearly") || normalizedFrequency.contains("every year")) {
                return lastMaintenance.plusYears(1);
            } else if (normalizedFrequency.contains("bi-annual") || normalizedFrequency.contains("every 2 years")) {
                return lastMaintenance.plusYears(2);
            }
            
            // Regex pattern for numeric frequencies (e.g., "30 days", "6 months", "2 years")
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("(\\d+)\\s*(day|week|month|year)s?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher matcher = pattern.matcher(normalizedFrequency);
            
            if (matcher.find()) {
                int number = Integer.parseInt(matcher.group(1));
                String unit = matcher.group(2).toLowerCase();
                
                switch (unit) {
                    case "day":
                        return lastMaintenance.plusDays(number);
                    case "week":
                        return lastMaintenance.plusWeeks(number);
                    case "month":
                        return lastMaintenance.plusMonths(number);
                    case "year":
                        return lastMaintenance.plusYears(number);
                }
            }
            
            // Handle "every X hours" patterns (convert to days for approximation)
            java.util.regex.Pattern hoursPattern = java.util.regex.Pattern.compile("every\\s+(\\d+)\\s+hours?", java.util.regex.Pattern.CASE_INSENSITIVE);
            java.util.regex.Matcher hoursMatcher = hoursPattern.matcher(normalizedFrequency);
            
            if (hoursMatcher.find()) {
                int hours = Integer.parseInt(hoursMatcher.group(1));
                int days = Math.max(1, hours / 24); // Convert hours to days, minimum 1 day
                log.info("Converting {} hours to {} days for maintenance scheduling", hours, days);
                return lastMaintenance.plusDays(days);
            }
            
            log.warn("Unknown frequency format: '{}', defaulting to daily", frequency);
            return lastMaintenance.plusDays(1);
            
        } catch (Exception e) {
            log.error("Error calculating next maintenance date for frequency: {}", frequency, e);
            return lastMaintenance.plusDays(1);
        }
    }
    
    /**
     * Manual trigger for maintenance schedule update (for testing or manual execution)
     */
    public void manualUpdateMaintenanceSchedules() {
        log.info("Manual maintenance schedule update triggered");
        updateMaintenanceSchedules();
    }
    
    /**
     * Get maintenance tasks that need immediate attention (overdue or due today)
     */
    public List<DeviceMaintenance> getMaintenanceTasksNeedingAttention() {
        LocalDate today = LocalDate.now();
        return deviceMaintenanceRepository.findByStatusAndNextMaintenanceLessThanEqual(
                DeviceMaintenance.Status.ACTIVE, today);
    }
}
