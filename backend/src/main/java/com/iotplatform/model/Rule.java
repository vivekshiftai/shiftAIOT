package com.iotplatform.model;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "rules")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Rule {
    
    private static final Logger logger = LoggerFactory.getLogger(Rule.class);
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false)
    private String name;

    @Size(max = 500)
    @Column(name = "description")
    private String description;

    @Size(max = 100)
    @Column(name = "metric")
    private String metric;

    @Size(max = 100)
    @Column(name = "metric_value")
    private String metricValue;

    @Size(max = 200)
    @Column(name = "threshold")
    private String threshold;

    @Size(max = 500)
    @Column(name = "consequence")
    private String consequence;

    @Column(name = "device_id")
    private String deviceId;

    @Column(name = "active", nullable = false)
    private boolean active = true;

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<RuleCondition> conditions;

    @OneToMany(mappedBy = "rule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<RuleAction> actions;

    @Column(name = "organization_id", nullable = false)
    private String organizationId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_triggered")
    private LocalDateTime lastTriggered;

    @PrePersist
    protected void onCreate() {
        logger.debug("Creating new rule: {}", name);
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        logger.debug("Updating rule: {}", id);
        updatedAt = LocalDateTime.now();
    }

    @PostLoad
    protected void onLoad() {
        logger.debug("Loaded rule from PostgreSQL: {}", id);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public String getMetricValue() { return metricValue; }
    public void setMetricValue(String metricValue) { this.metricValue = metricValue; }

    public String getThreshold() { return threshold; }
    public void setThreshold(String threshold) { this.threshold = threshold; }

    public String getConsequence() { return consequence; }
    public void setConsequence(String consequence) { this.consequence = consequence; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { 
        logger.info("Rule {} active status changed from {} to {}", id, this.active, active);
        this.active = active; 
    }

    public List<RuleCondition> getConditions() { return conditions; }
    public void setConditions(List<RuleCondition> conditions) { this.conditions = conditions; }

    public List<RuleAction> getActions() { return actions; }
    public void setActions(List<RuleAction> actions) { this.actions = actions; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastTriggered() { return lastTriggered; }
    public void setLastTriggered(LocalDateTime lastTriggered) { 
        logger.info("Rule {} last triggered updated to: {}", id, lastTriggered);
        this.lastTriggered = lastTriggered; 
    }
}