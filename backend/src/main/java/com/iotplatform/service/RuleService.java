package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.Rule;
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