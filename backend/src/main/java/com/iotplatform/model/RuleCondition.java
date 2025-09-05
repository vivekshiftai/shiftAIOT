package com.iotplatform.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "rule_conditions")
public class RuleCondition {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConditionType type;

    @Column(name = "device_id")
    private String deviceId;

    private String metric;

    @Enumerated(EnumType.STRING)
    private Operator operator;

    @Column(name = "condition_value")
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(name = "logic_operator")
    private LogicOperator logicOperator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id")
    @JsonIgnore
    private Rule rule;

    public enum ConditionType {
        DEVICE_STATUS, TELEMETRY_THRESHOLD, TIME_BASED
    }

    public enum Operator {
        GREATER_THAN, LESS_THAN, EQUALS, GREATER_THAN_OR_EQUAL, LESS_THAN_OR_EQUAL
    }

    public enum LogicOperator {
        AND, OR
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public ConditionType getType() { return type; }
    public void setType(ConditionType type) { this.type = type; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public Operator getOperator() { return operator; }
    public void setOperator(Operator operator) { this.operator = operator; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public LogicOperator getLogicOperator() { return logicOperator; }
    public void setLogicOperator(LogicOperator logicOperator) { this.logicOperator = logicOperator; }

    public Rule getRule() { return rule; }
    public void setRule(Rule rule) { this.rule = rule; }
}