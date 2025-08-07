package com.iotplatform.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class RuleConditionRequest {
    
    private String id;
    
    @NotNull
    private String type;
    
    private String deviceId;
    
    @NotBlank
    private String metric;
    
    @NotBlank
    private String operator;
    
    @NotBlank
    private String value;
    
    private String logicOperator;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLogicOperator() { return logicOperator; }
    public void setLogicOperator(String logicOperator) { this.logicOperator = logicOperator; }
}
