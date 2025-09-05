package com.iotplatform.service;

import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.MaintenanceHistory;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.MaintenanceHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Daily Maintenance Snapshot Scheduler
 * 
 * This service runs daily at a specific time and creates a snapshot
 * of ALL maintenance tasks in the database, recording their current
 * status in the maintenance_history table.
 * 
 * This provides a complete daily audit trail of maintenance data.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceSnapshotScheduler {
    
    private static final Logger log = LoggerFactory.getLogger(MaintenanceSnapshotScheduler.class);
    
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final MaintenanceHistoryRepository maintenanceHistoryRepository;
    
    /**
     * Run maintenance snapshot on application startup
     */
    @EventListener(ApplicationReadyEvent.class)
    public void runMaintenanceSnapshotOnStartup() {
        log.info("🚀 Application started - running initial maintenance snapshot...");
        log.info("📅 Maintenance Snapshot Scheduler initialized");
        log.info("⏰ Scheduled to run daily at 6:00 AM");
        createDailyMaintenanceSnapshot();
    }
    
    /**
     * Create daily maintenance snapshot at 6:00 AM
     * This records the current status of ALL maintenance tasks
     */
    @Scheduled(cron = "0 0 6 * * ?") // Every day at 6:00 AM
    public void createDailyMaintenanceSnapshot() {
        log.info("⏰ Daily maintenance snapshot triggered at 6:00 AM");
        log.info("📋 Creating snapshot of all maintenance tasks...");
        
        try {
            // Get all active maintenance tasks
            List<DeviceMaintenance> allMaintenanceTasks = deviceMaintenanceRepository.findAll();
            
            if (allMaintenanceTasks.isEmpty()) {
                log.info("📝 No maintenance tasks found to snapshot");
                return;
            }
            
            log.info("📊 Found {} maintenance tasks to snapshot", allMaintenanceTasks.size());
            
            int snapshotCount = 0;
            int skippedCount = 0;
            LocalDate snapshotDate = LocalDate.now();
            
            for (DeviceMaintenance maintenance : allMaintenanceTasks) {
                try {
                    // Create maintenance history record for current status
                    MaintenanceHistory history = createMaintenanceSnapshot(maintenance, snapshotDate);
                    
                    // Save to history table
                    maintenanceHistoryRepository.save(history);
                    snapshotCount++;
                    
                    log.debug("📸 Snapshot created for maintenance task: {} - Status: {}", 
                            maintenance.getTaskName(), maintenance.getStatus());
                    
                } catch (Exception e) {
                    log.error("❌ Failed to create snapshot for maintenance task: {} - Error: {}", 
                            maintenance.getTaskName(), e.getMessage());
                    skippedCount++;
                }
            }
            
            log.info("✅ Daily maintenance snapshot completed - Created: {}, Skipped: {}, Total: {}", 
                    snapshotCount, skippedCount, allMaintenanceTasks.size());
            
            // Log summary statistics
            logMaintenanceStatistics(allMaintenanceTasks);
            
        } catch (Exception e) {
            log.error("❌ Failed to create daily maintenance snapshot", e);
        }
    }
    
    /**
     * Create a maintenance history record from current maintenance status
     */
    private MaintenanceHistory createMaintenanceSnapshot(DeviceMaintenance maintenance, LocalDate snapshotDate) {
        // Get next cycle number for this device
        Integer cycleNumber = maintenanceHistoryRepository.findNextCycleNumberForDevice(maintenance.getDeviceId());
        if (cycleNumber == null) {
            cycleNumber = 1;
        }
        
        // Create maintenance history record
        MaintenanceHistory history = new MaintenanceHistory();
        
        // Set basic information
        history.setId(java.util.UUID.randomUUID().toString());
        history.setOriginalMaintenanceId(maintenance.getId());
        history.setDeviceId(maintenance.getDeviceId());
        history.setDeviceName(maintenance.getDeviceName());
        history.setTaskName(maintenance.getTaskName());
        history.setDescription(maintenance.getDescription());
        history.setComponentName(maintenance.getComponentName());
        history.setMaintenanceType(convertMaintenanceType(maintenance.getMaintenanceType()));
        history.setFrequency(maintenance.getFrequency());
        history.setPriority(convertPriority(maintenance.getPriority()));
        history.setEstimatedCost(maintenance.getEstimatedCost());
        history.setEstimatedDuration(maintenance.getEstimatedDuration());
        history.setRequiredTools(maintenance.getRequiredTools());
        history.setSafetyNotes(maintenance.getSafetyNotes());
        history.setCategory(maintenance.getCategory());
        history.setAssignedTo(maintenance.getAssignedTo());
        history.setAssignedBy(maintenance.getAssignedBy());
        history.setAssignedAt(maintenance.getAssignedAt());
        history.setOrganizationId(maintenance.getOrganizationId());
        history.setMaintenanceCycleNumber(cycleNumber);
        history.setIsHistoricalRecord(true);
        
        // Set snapshot-specific information
        history.setScheduledDate(maintenance.getNextMaintenance() != null ? 
                maintenance.getNextMaintenance() : snapshotDate);
        history.setActualDate(maintenance.getLastMaintenance());
        history.setStatus(convertStatus(maintenance.getStatus()));
        
        // Set completion details if completed
        if (maintenance.getStatus() == DeviceMaintenance.Status.COMPLETED) {
            history.setCompletedBy(maintenance.getCompletedBy());
            history.setCompletedAt(maintenance.getCompletedAt());
        }
        
        // Set timestamps
        history.setCreatedAt(LocalDateTime.now());
        history.setUpdatedAt(LocalDateTime.now());
        
        return history;
    }
    
    /**
     * Convert DeviceMaintenance.MaintenanceType to MaintenanceHistory.MaintenanceType
     */
    private MaintenanceHistory.MaintenanceType convertMaintenanceType(DeviceMaintenance.MaintenanceType type) {
        if (type == null) return MaintenanceHistory.MaintenanceType.GENERAL;
        switch (type) {
            case PREVENTIVE: return MaintenanceHistory.MaintenanceType.PREVENTIVE;
            case CORRECTIVE: return MaintenanceHistory.MaintenanceType.CORRECTIVE;
            case PREDICTIVE: return MaintenanceHistory.MaintenanceType.PREDICTIVE;
            default: return MaintenanceHistory.MaintenanceType.GENERAL;
        }
    }
    
    /**
     * Convert DeviceMaintenance.Priority to MaintenanceHistory.Priority
     */
    private MaintenanceHistory.Priority convertPriority(DeviceMaintenance.Priority priority) {
        if (priority == null) return MaintenanceHistory.Priority.MEDIUM;
        switch (priority) {
            case LOW: return MaintenanceHistory.Priority.LOW;
            case MEDIUM: return MaintenanceHistory.Priority.MEDIUM;
            case HIGH: return MaintenanceHistory.Priority.HIGH;
            case CRITICAL: return MaintenanceHistory.Priority.CRITICAL;
            default: return MaintenanceHistory.Priority.MEDIUM;
        }
    }
    
    /**
     * Convert DeviceMaintenance.Status to MaintenanceHistory.Status
     */
    private MaintenanceHistory.Status convertStatus(DeviceMaintenance.Status status) {
        if (status == null) return MaintenanceHistory.Status.SCHEDULED;
        switch (status) {
            case ACTIVE: return MaintenanceHistory.Status.SCHEDULED;
            case COMPLETED: return MaintenanceHistory.Status.COMPLETED;
            case CANCELLED: return MaintenanceHistory.Status.CANCELLED;
            case OVERDUE: return MaintenanceHistory.Status.OVERDUE;
            default: return MaintenanceHistory.Status.SCHEDULED;
        }
    }
    
    /**
     * Log maintenance statistics for the snapshot
     */
    private void logMaintenanceStatistics(List<DeviceMaintenance> maintenanceTasks) {
        long activeCount = maintenanceTasks.stream()
                .filter(m -> m.getStatus() == DeviceMaintenance.Status.ACTIVE)
                .count();
        
        long completedCount = maintenanceTasks.stream()
                .filter(m -> m.getStatus() == DeviceMaintenance.Status.COMPLETED)
                .count();
        
        long overdueCount = maintenanceTasks.stream()
                .filter(m -> m.getStatus() == DeviceMaintenance.Status.OVERDUE)
                .count();
        
        long cancelledCount = maintenanceTasks.stream()
                .filter(m -> m.getStatus() == DeviceMaintenance.Status.CANCELLED)
                .count();
        
        log.info("📊 Maintenance Statistics Snapshot:");
        log.info("   • Active: {}", activeCount);
        log.info("   • Completed: {}", completedCount);
        log.info("   • Overdue: {}", overdueCount);
        log.info("   • Cancelled: {}", cancelledCount);
        log.info("   • Total: {}", maintenanceTasks.size());
    }
    
    /**
     * Manual trigger for creating maintenance snapshot
     * Can be called via API or admin interface
     */
    public void createManualMaintenanceSnapshot() {
        log.info("🔧 Manual maintenance snapshot triggered");
        createDailyMaintenanceSnapshot();
    }
    
    /**
     * Create snapshot for specific organization
     */
    public void createOrganizationMaintenanceSnapshot(String organizationId) {
        log.info("🏢 Creating maintenance snapshot for organization: {}", organizationId);
        
        try {
            List<DeviceMaintenance> orgMaintenanceTasks = deviceMaintenanceRepository.findByOrganizationId(organizationId);
            
            if (orgMaintenanceTasks.isEmpty()) {
                log.info("📝 No maintenance tasks found for organization: {}", organizationId);
                return;
            }
            
            log.info("📊 Found {} maintenance tasks for organization: {}", orgMaintenanceTasks.size(), organizationId);
            
            int snapshotCount = 0;
            LocalDate snapshotDate = LocalDate.now();
            
            for (DeviceMaintenance maintenance : orgMaintenanceTasks) {
                try {
                    MaintenanceHistory history = createMaintenanceSnapshot(maintenance, snapshotDate);
                    maintenanceHistoryRepository.save(history);
                    snapshotCount++;
                } catch (Exception e) {
                    log.error("❌ Failed to create snapshot for maintenance task: {} - Error: {}", 
                            maintenance.getTaskName(), e.getMessage());
                }
            }
            
            log.info("✅ Organization maintenance snapshot completed - Created: {} snapshots for organization: {}", 
                    snapshotCount, organizationId);
            
        } catch (Exception e) {
            log.error("❌ Failed to create organization maintenance snapshot for: {}", organizationId, e);
        }
    }
}
