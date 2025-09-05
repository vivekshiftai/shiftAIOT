package com.iotplatform.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * MaintenanceHistory entity for storing permanent maintenance records.
 * This table stores historical maintenance data and is NOT deleted when devices are deleted.
 * It provides a complete audit trail of all maintenance activities.
 */
@Entity
@Table(name = "maintenance_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceHistory {
    
    private static final Logger logger = LoggerFactory.getLogger(MaintenanceHistory.class);
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "original_maintenance_id")
    private String originalMaintenanceId; // Reference to original maintenance task (can be null if device deleted)
    
    @NotBlank
    @Column(name = "device_id", nullable = false)
    private String deviceId; // Keep device_id even if device is deleted
    
    @Size(max = 255)
    @Column(name = "device_name")
    private String deviceName; // Store device name at time of maintenance
    
    @NotBlank
    @Size(max = 255)
    @Column(name = "task_name", nullable = false)
    private String taskName;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Size(max = 255)
    @Column(name = "component_name")
    private String componentName = "General";
    
    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false)
    private MaintenanceType maintenanceType = MaintenanceType.GENERAL;
    
    @NotBlank
    @Size(max = 100)
    @Column(name = "frequency", nullable = false)
    private String frequency;
    
    @NotNull
    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate; // When maintenance was scheduled
    
    @Column(name = "actual_date")
    private LocalDate actualDate; // When maintenance was actually performed (null if not done)
    
    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.MEDIUM;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.SCHEDULED;
    
    @Column(name = "estimated_cost", precision = 10, scale = 2)
    private BigDecimal estimatedCost;
    
    @Column(name = "actual_cost", precision = 10, scale = 2)
    private BigDecimal actualCost; // Actual cost if different from estimated
    
    @Size(max = 100)
    @Column(name = "estimated_duration")
    private String estimatedDuration; // e.g., "2 hours", "1 day"
    
    @Size(max = 100)
    @Column(name = "actual_duration")
    private String actualDuration; // Actual time taken
    
    @Column(name = "required_tools", columnDefinition = "TEXT")
    private String requiredTools;
    
    @Column(name = "tools_used", columnDefinition = "TEXT")
    private String toolsUsed; // Actual tools used
    
    @Column(name = "safety_notes", columnDefinition = "TEXT")
    private String safetyNotes;
    
    @Column(name = "completion_notes", columnDefinition = "TEXT")
    private String completionNotes; // Notes from maintenance completion
    
    @Size(max = 100)
    @Column(name = "category")
    private String category;
    
    @Column(name = "assigned_to")
    private String assignedTo;
    
    @Column(name = "assigned_by")
    private String assignedBy;
    
    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;
    
    @Column(name = "completed_by")
    private String completedBy;
    
    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @NotBlank
    @Column(name = "organization_id", nullable = false)
    private String organizationId;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Historical tracking
    @Column(name = "maintenance_cycle_number")
    private Integer maintenanceCycleNumber = 1; // Which cycle this maintenance represents (1st, 2nd, etc.)
    
    @Column(name = "is_historical_record")
    private Boolean isHistoricalRecord = true; // Always true for history table
    
    @Column(name = "snapshot_type")
    private String snapshotType = "DAILY_SNAPSHOT"; // 'DAILY_SNAPSHOT', 'UPDATE', 'COMPLETION', 'MANUAL'
    
    // Enums
    public enum MaintenanceType {
        PREVENTIVE, CORRECTIVE, PREDICTIVE, GENERAL
    }
    
    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }
    
    public enum Status {
        SCHEDULED, COMPLETED, SKIPPED, CANCELLED, OVERDUE
    }
    
    @PrePersist
    protected void onCreate() {
        logger.debug("Creating maintenance history record: {}", taskName);
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isHistoricalRecord == null) {
            isHistoricalRecord = true;
        }
        if (maintenanceCycleNumber == null) {
            maintenanceCycleNumber = 1;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        logger.debug("Updating maintenance history record: {}", id);
        updatedAt = LocalDateTime.now();
    }
    
    @PostLoad
    protected void onLoad() {
        logger.debug("Loaded maintenance history record from database: {}", id);
    }
    
    /**
     * Create a MaintenanceHistory record from a DeviceMaintenance record
     */
    public static MaintenanceHistory fromDeviceMaintenance(DeviceMaintenance maintenance, LocalDate scheduledDate, Integer cycleNumber) {
        MaintenanceHistory history = new MaintenanceHistory();
        
        // Copy all relevant fields
        history.setOriginalMaintenanceId(maintenance.getId());
        history.setDeviceId(maintenance.getDeviceId());
        history.setDeviceName(maintenance.getDeviceName());
        history.setTaskName(maintenance.getTaskName());
        history.setDescription(maintenance.getDescription());
        history.setComponentName(maintenance.getComponentName());
        history.setMaintenanceType(convertMaintenanceType(maintenance.getMaintenanceType()));
        history.setFrequency(maintenance.getFrequency());
        history.setScheduledDate(scheduledDate);
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
        
        // Set status based on maintenance status
        history.setStatus(convertStatus(maintenance.getStatus()));
        
        // If completed, set completion details
        if (maintenance.getStatus() == DeviceMaintenance.Status.COMPLETED) {
            history.setActualDate(maintenance.getLastMaintenance());
            history.setCompletedBy(maintenance.getCompletedBy());
            history.setCompletedAt(maintenance.getCompletedAt());
        }
        
        return history;
    }
    
    private static MaintenanceType convertMaintenanceType(DeviceMaintenance.MaintenanceType type) {
        if (type == null) return MaintenanceType.GENERAL;
        switch (type) {
            case PREVENTIVE: return MaintenanceType.PREVENTIVE;
            case CORRECTIVE: return MaintenanceType.CORRECTIVE;
            case PREDICTIVE: return MaintenanceType.PREDICTIVE;
            default: return MaintenanceType.GENERAL;
        }
    }
    
    private static Priority convertPriority(DeviceMaintenance.Priority priority) {
        if (priority == null) return Priority.MEDIUM;
        switch (priority) {
            case LOW: return Priority.LOW;
            case MEDIUM: return Priority.MEDIUM;
            case HIGH: return Priority.HIGH;
            case CRITICAL: return Priority.CRITICAL;
            default: return Priority.MEDIUM;
        }
    }
    
    private static Status convertStatus(DeviceMaintenance.Status status) {
        if (status == null) return Status.SCHEDULED;
        switch (status) {
            case ACTIVE: return Status.SCHEDULED;
            case COMPLETED: return Status.COMPLETED;
            case CANCELLED: return Status.CANCELLED;
            case OVERDUE: return Status.OVERDUE;
            default: return Status.SCHEDULED;
        }
    }
}
