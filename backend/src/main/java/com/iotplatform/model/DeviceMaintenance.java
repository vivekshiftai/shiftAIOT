package com.iotplatform.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "device_maintenance")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DeviceMaintenance {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Size(max = 255)
    @Column(name = "task_name", nullable = false)
    private String taskName;

    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Size(max = 255)
    @Column(name = "device_name")
    private String deviceName;

    @Size(max = 255)
    @Column(name = "component_name")
    private String componentName;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type")
    private MaintenanceType maintenanceType;

    @NotBlank
    @Size(max = 100)
    @Column(name = "frequency", nullable = false)
    private String frequency;

    @Column(name = "last_maintenance")
    private LocalDate lastMaintenance;

    @Column(name = "next_maintenance", nullable = false)
    private LocalDate nextMaintenance;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    private Priority priority = Priority.MEDIUM;

    @Column(name = "estimated_cost", precision = 10, scale = 2)
    private BigDecimal estimatedCost;

    @Size(max = 100)
    @Column(name = "estimated_duration")
    private String estimatedDuration;

    @Column(name = "required_tools", columnDefinition = "TEXT")
    private String requiredTools;

    @Column(name = "safety_notes", columnDefinition = "TEXT")
    private String safetyNotes;

    @Size(max = 255)
    @Column(name = "assigned_to")
    private String assignedTo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.ACTIVE;

    @Column(name = "organization_id", nullable = false)
    private String organizationId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum MaintenanceType {
        PREVENTIVE, CORRECTIVE, PREDICTIVE, GENERAL
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Status {
        ACTIVE, COMPLETED, CANCELLED, OVERDUE, PENDING
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTaskName() { return taskName; }
    public void setTaskName(String taskName) { this.taskName = taskName; }

    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }

    public String getDeviceName() { return deviceName; }
    public void setDeviceName(String deviceName) { this.deviceName = deviceName; }

    public String getComponentName() { return componentName; }
    public void setComponentName(String componentName) { this.componentName = componentName; }

    public MaintenanceType getMaintenanceType() { return maintenanceType; }
    public void setMaintenanceType(MaintenanceType maintenanceType) { this.maintenanceType = maintenanceType; }

    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }

    public LocalDate getLastMaintenance() { return lastMaintenance; }
    public void setLastMaintenance(LocalDate lastMaintenance) { this.lastMaintenance = lastMaintenance; }

    public LocalDate getNextMaintenance() { return nextMaintenance; }
    public void setNextMaintenance(LocalDate nextMaintenance) { this.nextMaintenance = nextMaintenance; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public BigDecimal getEstimatedCost() { return estimatedCost; }
    public void setEstimatedCost(BigDecimal estimatedCost) { this.estimatedCost = estimatedCost; }

    public String getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(String estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public String getRequiredTools() { return requiredTools; }
    public void setRequiredTools(String requiredTools) { this.requiredTools = requiredTools; }

    public String getSafetyNotes() { return safetyNotes; }
    public void setSafetyNotes(String safetyNotes) { this.safetyNotes = safetyNotes; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public void setDeviceId(String deviceId) {
        if (this.device == null) {
            this.device = new Device();
        }
        this.device.setId(deviceId);
    }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
