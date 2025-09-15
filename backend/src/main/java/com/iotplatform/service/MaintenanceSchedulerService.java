package com.iotplatform.service;

import com.iotplatform.model.Device;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceSchedulerService {
    
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final DeviceRepository deviceRepository;
    private final MaintenanceScheduleService maintenanceScheduleService;
    private final MaintenanceNotificationScheduler maintenanceNotificationScheduler;
    
    /**
     * Update maintenance schedules when the application starts
     */
    @EventListener(ApplicationReadyEvent.class)
    public void updateMaintenanceSchedulesOnStartup() {
        log.info("🚀 Application started - updating maintenance schedules...");
        log.info("📅 Maintenance Scheduler Service initialized");
        log.info("⏰ Scheduled to run daily at 5:50 AM");
        updateMaintenanceSchedules();
    }
    
    /**
     * Update maintenance schedules daily at 5:00 AM
     */
    @Scheduled(cron = "0 0 5 * * ?") // Every day at 5:00 AM
    public void updateMaintenanceSchedulesDaily() {
        log.info("⏰ Daily maintenance schedule update triggered at 5:00 AM");
        log.info("📋 Processing all active maintenance tasks...");
        updateMaintenanceSchedules();
    }
    
    /**
     * Main method to update maintenance schedules
     */
    private void updateMaintenanceSchedules() {
        try {
            log.info("🔄 Starting maintenance schedule update process...");
            log.info("📅 Current date: {}", LocalDate.now());
            
            // Get all active maintenance tasks that need attention (due today, overdue, or need rescheduling)
            List<DeviceMaintenance> activeMaintenanceTasks = deviceMaintenanceRepository.findByStatus(DeviceMaintenance.Status.ACTIVE);
            log.info("📊 Found {} active maintenance tasks to process", activeMaintenanceTasks.size());
            
            // Also get tasks that are due today or overdue
            List<DeviceMaintenance> tasksNeedingAttention = getMaintenanceTasksNeedingAttention();
            log.info("📊 Found {} tasks needing immediate attention (due today or overdue)", tasksNeedingAttention.size());
            
            int updatedCount = 0;
            int overdueCount = 0;
            int dueTodayCount = 0;
            
            LocalDate today = LocalDate.now();
            
            for (DeviceMaintenance maintenance : activeMaintenanceTasks) {
                try {
                    // Check if the maintenance is overdue (next maintenance date is in the past)
                    if (maintenance.getNextMaintenance() != null && maintenance.getNextMaintenance().isBefore(today)) {
                        log.info("⚠️ Maintenance task '{}' is overdue. Last due: {}, Current date: {}", 
                                maintenance.getTaskName(), maintenance.getNextMaintenance(), today);
                        
                        // Calculate the next maintenance date based on frequency from the overdue date
                        LocalDate nextMaintenance = maintenanceScheduleService.calculateNextMaintenanceDate(maintenance.getFrequency(), maintenance.getNextMaintenance());
                        
                        // Save maintenance history before updating
                        maintenanceScheduleService.saveMaintenanceHistory(maintenance, maintenance.getNextMaintenance(), "Overdue task rescheduled");
                        
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
                        
                        log.info("✅ Updated overdue maintenance task '{}' with new next maintenance date: {}", 
                                maintenance.getTaskName(), nextMaintenance);
                    }
                    // Check if maintenance is due today and needs to be updated for next cycle
                    else if (maintenance.getNextMaintenance() != null && maintenance.getNextMaintenance().equals(today)) {
                        log.info("📅 Maintenance task '{}' is due today. Calculating next maintenance date...", 
                                maintenance.getTaskName());
                        
                        // Calculate next maintenance date from today
                        LocalDate nextMaintenance = maintenanceScheduleService.calculateNextMaintenanceDate(maintenance.getFrequency(), today);
                        
                        // Save maintenance history before updating
                        maintenanceScheduleService.saveMaintenanceHistory(maintenance, today, "Task due today - rescheduled");
                        
                        // Update the maintenance task
                        maintenance.setNextMaintenance(nextMaintenance);
                        maintenance.setLastMaintenance(today); // Set last maintenance to today
                        maintenance.setUpdatedAt(LocalDateTime.now());
                        
                        deviceMaintenanceRepository.save(maintenance);
                        updatedCount++;
                        dueTodayCount++;
                        
                        log.info("✅ Updated maintenance task '{}' due today with new next maintenance date: {}", 
                                maintenance.getTaskName(), nextMaintenance);
                    }
                    
                } catch (Exception e) {
                    log.error("Error updating maintenance task '{}': {}", maintenance.getTaskName(), e.getMessage(), e);
                }
            }
            
            log.info("✅ Maintenance schedule update completed successfully!");
            log.info("📊 Summary: Updated {} tasks total ({} overdue, {} due today)", 
                    updatedCount, overdueCount, dueTodayCount);
            log.info("📅 Next scheduled run: Daily at 5:50 AM");
            
        } catch (Exception e) {
            log.error("Error during maintenance schedule update: {}", e.getMessage(), e);
        }
    }
    
    
    /**
     * Manual trigger for maintenance schedule update (for testing or manual execution)
     * This method updates schedules and triggers notifications for updated tasks
     */
    public void manualUpdateMaintenanceSchedules() {
        log.info("🔄 Manual maintenance schedule update triggered");
        log.info("📋 Starting comprehensive maintenance update process...");
        
        try {
            // Update all maintenance schedules
            updateMaintenanceSchedules();
            
            // Finally, trigger notifications for any tasks that were updated
            log.info("📢 Triggering maintenance notifications for updated tasks...");
            int notificationsSent = maintenanceNotificationScheduler.triggerMaintenanceNotifications();
            
            log.info("✅ Manual maintenance update completed successfully");
            log.info("📊 Summary: Notifications sent to {} users", notificationsSent);
            
        } catch (Exception e) {
            log.error("❌ Error during manual maintenance schedule update: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update maintenance schedules: " + e.getMessage(), e);
        }
    }
    
    /**
     * Ensure that some maintenance tasks exist for testing purposes.
     * This creates test maintenance tasks if none exist.
     */
    private void ensureMaintenanceTasksExist() {
        try {
            List<DeviceMaintenance> existingTasks = deviceMaintenanceRepository.findAll();
            if (existingTasks.isEmpty()) {
                log.info("🔧 No maintenance tasks found, creating test tasks...");
                createTestMaintenanceTasks();
            } else {
                log.info("✅ Found {} existing maintenance tasks", existingTasks.size());
            }
        } catch (Exception e) {
            log.error("❌ Error checking for existing maintenance tasks: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Create test maintenance tasks for devices that don't have any.
     */
    private void createTestMaintenanceTasks() {
        try {
            // Get all devices
            List<Device> devices = deviceRepository.findAll();
            if (devices.isEmpty()) {
                log.warn("⚠️ No devices found - cannot create maintenance tasks");
                return;
            }
            
            LocalDate today = LocalDate.now();
            int tasksCreated = 0;
            
            for (Device device : devices) {
                try {
                    // Check if device already has maintenance tasks
                    List<DeviceMaintenance> existingTasks = deviceMaintenanceRepository.findByDeviceId(device.getId());
                    if (!existingTasks.isEmpty()) {
                        continue; // Skip devices that already have maintenance tasks
                    }
                    
                    // Create a test maintenance task
                    DeviceMaintenance maintenance = new DeviceMaintenance();
                    maintenance.setId(UUID.randomUUID().toString());
                    maintenance.setDeviceId(device.getId());
                    maintenance.setTaskName("Routine Inspection - " + device.getName());
                    maintenance.setDescription("Regular inspection and maintenance of " + device.getName());
                    maintenance.setComponentName("General");
                    maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.PREVENTIVE);
                    maintenance.setFrequency("Weekly");
                    maintenance.setLastMaintenance(today.minusDays(7)); // Last week
                    maintenance.setNextMaintenance(today); // Due today
                    maintenance.setPriority(DeviceMaintenance.Priority.MEDIUM);
                    maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
                    maintenance.setEstimatedCost(new BigDecimal("100.00"));
                    maintenance.setEstimatedDuration("2 hours");
                    maintenance.setRequiredTools("Basic tools, safety equipment");
                    maintenance.setSafetyNotes("Follow standard safety procedures");
                    maintenance.setCategory("Preventive");
                    maintenance.setOrganizationId(device.getOrganizationId());
                    maintenance.setCreatedAt(LocalDateTime.now());
                    maintenance.setUpdatedAt(LocalDateTime.now());
                    
                    deviceMaintenanceRepository.save(maintenance);
                    tasksCreated++;
                    log.info("✅ Created test maintenance task for device: {}", device.getName());
                    
                } catch (Exception e) {
                    log.error("❌ Failed to create maintenance task for device '{}': {}", device.getName(), e.getMessage());
                }
            }
            
            log.info("✅ Created {} test maintenance tasks", tasksCreated);
            
        } catch (Exception e) {
            log.error("❌ Error creating test maintenance tasks: {}", e.getMessage(), e);
        }
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
