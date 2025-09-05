package com.iotplatform.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.util.Map;

@Entity
@Table(name = "rule_actions")
public class RuleAction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ActionType type;

    @ElementCollection
    @MapKeyColumn(name = "config_key")
    @Column(name = "config_value")
    private Map<String, String> config;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id")
    @JsonIgnore
    private Rule rule;

    public enum ActionType {
        NOTIFICATION, DEVICE_CONTROL, WEBHOOK, LOG
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ActionType getType() { return type; }
    public void setType(ActionType type) { this.type = type; }

    public Map<String, String> getConfig() { return config; }
    public void setConfig(Map<String, String> config) { this.config = config; }

    public Rule getRule() { return rule; }
    public void setRule(Rule rule) { this.rule = rule; }
}