package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.controller.RuleController;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.Rule;
import com.iotplatform.model.RuleAction;
import com.iotplatform.model.RuleCondition;
import com.iotplatform.repository.DeviceRepository;
import com.iotplatform.repository.RuleRepository;

@Service
public class RuleService {

    @Autowired
    private RuleRepository ruleRepository;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private NotificationService notificationService;

    public List<Rule> getAllRules(String organizationId) {
        return ruleRepository.findByOrganizationId(organizationId);
    }

    public Optional<Rule> getRule(String id, String organizationId) {
        return ruleRepository.findByIdAndOrganizationId(id, organizationId);
    }

    public Rule createRule(Rule rule, String organizationId) {
        rule.setId(UUID.randomUUID().toString());
        rule.setOrganizationId(organizationId);
        return ruleRepository.save(rule);
    }

    public List<Rule> createBulkRules(List<java.util.Map<String, Object>> rulesData, String organizationId) {
        List<Rule> createdRules = new java.util.ArrayList<>();
        
        for (java.util.Map<String, Object> ruleData : rulesData) {
            try {
                Rule rule = new Rule();
                rule.setId(UUID.randomUUID().toString());
                rule.setName((String) ruleData.get("name"));
                rule.setDescription((String) ruleData.get("description"));
                rule.setActive(true);
                rule.setOrganizationId(organizationId);
                
                // Create simple condition and action based on the data
                if (ruleData.containsKey("condition") && ruleData.containsKey("action")) {
                    List<RuleCondition> conditions = new java.util.ArrayList<>();
                    List<RuleAction> actions = new java.util.ArrayList<>();
                    
                    // Create condition
                    RuleCondition condition = new RuleCondition();
                    condition.setId(UUID.randomUUID().toString());
                    condition.setType(RuleCondition.ConditionType.TELEMETRY_THRESHOLD);
                    condition.setMetric("condition");
                    condition.setOperator(RuleCondition.Operator.EQUALS);
                    condition.setValue((String) ruleData.get("condition"));
                    condition.setLogicOperator(RuleCondition.LogicOperator.AND);
                    condition.setRule(rule);
                    
                    // Set device ID if provided
                    if (ruleData.containsKey("deviceId")) {
                        condition.setDeviceId((String) ruleData.get("deviceId"));
                    }
                    
                    conditions.add(condition);
                    
                    // Create action
                    RuleAction action = new RuleAction();
                    action.setId(UUID.randomUUID().toString());
                    action.setType(RuleAction.ActionType.NOTIFICATION);
                    
                    // Set action config
                    java.util.Map<String, String> config = new java.util.HashMap<>();
                    config.put("message", (String) ruleData.get("action"));
                    if (ruleData.containsKey("priority")) {
                        config.put("priority", (String) ruleData.get("priority"));
                    }
                    if (ruleData.containsKey("category")) {
                        config.put("category", (String) ruleData.get("category"));
                    }
                    action.setConfig(config);
                    action.setRule(rule);
                    
                    actions.add(action);
                    
                    rule.setConditions(conditions);
                    rule.setActions(actions);
                }
                
                Rule savedRule = ruleRepository.save(rule);
                createdRules.add(savedRule);
                
            } catch (Exception e) {
                System.err.println("Failed to create rule: " + e.getMessage());
                e.printStackTrace();
                // Continue with other rules
            }
        }
        
        return createdRules;
    }

    public Rule updateRule(String id, Rule ruleDetails, String organizationId) {
        Rule rule = ruleRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));

        rule.setName(ruleDetails.getName());
        rule.setDescription(ruleDetails.getDescription());
        rule.setActive(ruleDetails.isActive());
        rule.setConditions(ruleDetails.getConditions());
        rule.setActions(ruleDetails.getActions());

        return ruleRepository.save(rule);
    }

    public void deleteRule(String id, String organizationId) {
        Rule rule = ruleRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Rule not found"));
        ruleRepository.delete(rule);
    }

    public List<Rule> getActiveRules(String organizationId) {
        return ruleRepository.findByOrganizationIdAndActive(organizationId, true);
    }

    public RuleController.RuleStats getRuleStats(String organizationId) {
        long totalRules = ruleRepository.findByOrganizationId(organizationId).size();
        long activeRules = ruleRepository.findByOrganizationIdAndActive(organizationId, true).size();
        
        // For now, return placeholder values for triggered counts
        // In a real implementation, you would query actual trigger history
        long triggeredToday = 0;
        long triggeredThisWeek = 0;
        
        return new RuleController.RuleStats(totalRules, activeRules, triggeredToday, triggeredThisWeek);
    }

    public void evaluateRules(String deviceId, TelemetryDataRequest telemetryData, String organizationId) {
        // Get device
        Device device = deviceRepository.findByIdAndOrganizationId(deviceId, organizationId)
                .orElse(null);
        
        if (device == null) return;

        // Get active rules for this organization
        List<Rule> activeRules = ruleRepository.findByOrganizationIdAndActive(organizationId, true);

        for (Rule rule : activeRules) {
            if (evaluateRuleConditions(rule, telemetryData)) {
                executeRuleActions(rule, device, telemetryData);
                
                // Update last triggered timestamp
                rule.setLastTriggered(LocalDateTime.now());
                ruleRepository.save(rule);
            }
        }
    }

    private boolean evaluateRuleConditions(Rule rule, TelemetryDataRequest telemetryData) {
        // Simplified rule evaluation - in production, implement complex logic
        for (RuleCondition condition : rule.getConditions()) {
            if (condition.getType() == RuleCondition.ConditionType.TELEMETRY_THRESHOLD) {
                String metric = condition.getMetric();
                if (telemetryData.getMetrics().containsKey(metric)) {
                    double actualValue = telemetryData.getMetrics().get(metric);
                    double expectedValue = Double.parseDouble(condition.getValue());
                    
                    return switch (condition.getOperator()) {
                        case GREATER_THAN -> actualValue > expectedValue;
                        case LESS_THAN -> actualValue < expectedValue;
                        case EQUALS -> actualValue == expectedValue;
                        case GREATER_THAN_OR_EQUAL -> actualValue >= expectedValue;
                        case LESS_THAN_OR_EQUAL -> actualValue <= expectedValue;
                    };
                }
            }
        }
        return false;
    }

    private void executeRuleActions(Rule rule, Device device, TelemetryDataRequest telemetryData) {
        // Simplified action execution - in production, implement all action types
        System.out.println("Executing actions for rule: " + rule.getName());
        System.out.println("Device: " + device.getName());
        System.out.println("Telemetry: " + telemetryData.getMetrics());
        
        // Create notification
        try {
            notificationService.createRuleTriggeredNotification(rule, device, telemetryData);
        } catch (Exception e) {
            System.err.println("Failed to create notification: " + e.getMessage());
        }
    }
}