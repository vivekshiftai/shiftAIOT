package com.iotplatform.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "device_safety_precautions")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DeviceSafetyPrecaution {
    
    @Id
    private String id;
    
    @Column(name = "device_id", nullable = false)
    private String deviceId;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;
    
    @Column(nullable = false)
    private String type; // 'warning', 'procedure', 'caution', 'note'
    
    @Column(nullable = false)
    private String category; // 'thermal_hazard', 'electrical_hazard', 'mechanical_hazard', 'emergency_procedures', 'ppe_requirements'
    
    @Column
    private String severity = "MEDIUM"; // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    
    @Column(columnDefinition = "TEXT")
    private String recommendedAction;
    
    @Column(name = "about_reaction", columnDefinition = "TEXT")
    private String aboutReaction;
    
    @Column(name = "causes", columnDefinition = "TEXT")
    private String causes;
    
    @Column(name = "how_to_avoid", columnDefinition = "TEXT")
    private String howToAvoid;
    
    @Column(name = "safety_info", columnDefinition = "TEXT")
    private String safetyInfo;
    
    @Column(name = "is_active")
    private Boolean isActive = true;
    
    @Column(name = "organization_id", nullable = false)
    private String organizationId;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Constructors
    public DeviceSafetyPrecaution() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    
    public DeviceSafetyPrecaution(String id, String deviceId, String title, String description, 
                                 String type, String category, String organizationId) {
        this();
        this.id = id;
        this.deviceId = deviceId;
        this.title = title;
        this.description = description;
        this.type = type;
        this.category = category;
        this.organizationId = organizationId;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getSeverity() {
        return severity;
    }
    
    public void setSeverity(String severity) {
        this.severity = severity;
    }
    
    public String getRecommendedAction() {
        return recommendedAction;
    }
    
    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }
    
    public String getAboutReaction() {
        return aboutReaction;
    }
    
    public void setAboutReaction(String aboutReaction) {
        this.aboutReaction = aboutReaction;
    }
    
    public String getCauses() {
        return causes;
    }
    
    public void setCauses(String causes) {
        this.causes = causes;
    }
    
    public String getHowToAvoid() {
        return howToAvoid;
    }
    
    public void setHowToAvoid(String howToAvoid) {
        this.howToAvoid = howToAvoid;
    }
    
    public String getSafetyInfo() {
        return safetyInfo;
    }
    
    public void setSafetyInfo(String safetyInfo) {
        this.safetyInfo = safetyInfo;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public String getOrganizationId() {
        return organizationId;
    }
    
    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    /**
     * Validates the safety precaution data before saving
     * @return true if valid, false otherwise
     */
    public boolean isValid() {
        return id != null && !id.trim().isEmpty() &&
               deviceId != null && !deviceId.trim().isEmpty() &&
               title != null && !title.trim().isEmpty() &&
               type != null && !type.trim().isEmpty() &&
               category != null && !category.trim().isEmpty() &&
               organizationId != null && !organizationId.trim().isEmpty();
    }
    
    /**
     * Gets a summary of validation issues
     * @return List of validation error messages
     */
    public List<String> getValidationErrors() {
        List<String> errors = new ArrayList<>();
        
        if (id == null || id.trim().isEmpty()) {
            errors.add("ID is required");
        }
        if (deviceId == null || deviceId.trim().isEmpty()) {
            errors.add("Device ID is required");
        }
        if (title == null || title.trim().isEmpty()) {
            errors.add("Title is required");
        }
        if (type == null || type.trim().isEmpty()) {
            errors.add("Type is required");
        }
        if (category == null || category.trim().isEmpty()) {
            errors.add("Category is required");
        }
        if (organizationId == null || organizationId.trim().isEmpty()) {
            errors.add("Organization ID is required");
        }
        
        return errors;
    }
}
