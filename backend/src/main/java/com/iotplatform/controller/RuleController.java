package com.iotplatform.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.dto.RuleCreateRequest;
import com.iotplatform.model.Rule;
import com.iotplatform.model.RuleAction;
import com.iotplatform.model.RuleCondition;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.RuleService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rules")
public class RuleController {

    private final RuleService ruleService;

    public RuleController(RuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<List<Rule>> getAllRules(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<Rule> rules = ruleService.getAllRules(user.getOrganizationId());
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<Rule> getRule(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        Optional<Rule> rule = ruleService.getRule(id, user.getOrganizationId());
        return rule.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<Rule> createRule(@Valid @RequestBody RuleCreateRequest request, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        Rule rule = new Rule();
        rule.setName(request.getName());
        rule.setDescription(request.getDescription());
        rule.setActive(request.isActive());
        rule.setOrganizationId(user.getOrganizationId());

        // Convert conditions
        List<RuleCondition> conditions = request.getConditions().stream()
            .map(this::convertToRuleCondition)
            .toList();
        rule.setConditions(conditions);

        // Convert actions
        List<RuleAction> actions = request.getActions().stream()
            .map(this::convertToRuleAction)
            .toList();
        rule.setActions(actions);

        Rule createdRule = ruleService.createRule(rule, user.getOrganizationId());
        return ResponseEntity.ok(createdRule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<Rule> updateRule(@PathVariable String id, @Valid @RequestBody RuleCreateRequest request, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            Rule rule = new Rule();
            rule.setName(request.getName());
            rule.setDescription(request.getDescription());
            rule.setActive(request.isActive());

            // Convert conditions
            List<RuleCondition> conditions = request.getConditions().stream()
                .map(this::convertToRuleCondition)
                .toList();
            rule.setConditions(conditions);

            // Convert actions
            List<RuleAction> actions = request.getActions().stream()
                .map(this::convertToRuleAction)
                .toList();
            rule.setActions(actions);

            Rule updatedRule = ruleService.updateRule(id, rule, user.getOrganizationId());
            return ResponseEntity.ok(updatedRule);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('RULE_DELETE')")
    public ResponseEntity<?> deleteRule(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            ruleService.deleteRule(id, user.getOrganizationId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<Rule> toggleRule(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            Optional<Rule> ruleOpt = ruleService.getRule(id, user.getOrganizationId());
            if (ruleOpt.isPresent()) {
                Rule rule = ruleOpt.get();
                rule.setActive(!rule.isActive());
                Rule updatedRule = ruleService.updateRule(id, rule, user.getOrganizationId());
                return ResponseEntity.ok(updatedRule);
            }
            return ResponseEntity.notFound().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<List<Rule>> getActiveRules(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<Rule> activeRules = ruleService.getActiveRules(user.getOrganizationId());
        return ResponseEntity.ok(activeRules);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<RuleStats> getRuleStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        RuleStats stats = ruleService.getRuleStats(user.getOrganizationId());
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/generate-rules")
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<?> generateRules(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        try {
            String pdfFilename = (String) request.get("pdf_filename");
            Integer chunkSize = (Integer) request.getOrDefault("chunk_size", 1000);
            @SuppressWarnings("unchecked")
            List<String> ruleTypes = (List<String>) request.getOrDefault("rule_types", 
                List.of("monitoring", "maintenance", "alert"));
            
            if (pdfFilename == null || pdfFilename.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "PDF filename is required"
                ));
            }
            
            // Simulate AI processing time
            Thread.sleep(3000);
            
            // Generate mock rules based on PDF content
            List<Map<String, Object>> iotRules = generateMockIoTRules(pdfFilename);
            List<Map<String, Object>> maintenanceData = generateMockMaintenanceData(pdfFilename);
            List<Map<String, Object>> safetyPrecautions = generateMockSafetyPrecautions(pdfFilename);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "pdf_filename", pdfFilename,
                "total_pages", 50,
                "processed_chunks", 4,
                "processing_time", 45.2,
                "iot_rules", iotRules,
                "maintenance_data", maintenanceData,
                "safety_precautions", safetyPrecautions,
                "summary", String.format("Generated %d IoT rules, %d maintenance records, and %d safety precautions from your device documentation.", 
                    iotRules.size(), maintenanceData.size(), safetyPrecautions.size())
            ));
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    private List<Map<String, Object>> generateMockIoTRules(String pdfFilename) {
        String deviceName = pdfFilename.replace(".pdf", "");
        return List.of(
            Map.of(
                "device_name", deviceName,
                "rule_type", "monitoring",
                "condition", "Temperature exceeds 85°C",
                "action", "Send alert to maintenance team",
                "priority", "high",
                "frequency", "hourly",
                "description", "Monitor equipment temperature to prevent overheating"
            ),
            Map.of(
                "device_name", deviceName,
                "rule_type", "maintenance",
                "condition", "Operating hours reach 1000",
                "action", "Schedule preventive maintenance",
                "priority", "medium",
                "frequency", "weekly",
                "description", "Regular maintenance schedule for motor components"
            ),
            Map.of(
                "device_name", deviceName,
                "rule_type", "alert",
                "condition", "Pressure drops below 2.5 bar",
                "action", "Activate backup pump system",
                "priority", "high",
                "frequency", "real-time",
                "description", "Critical pressure monitoring for system safety"
            ),
            Map.of(
                "device_name", deviceName,
                "rule_type", "monitoring",
                "condition", "Vibration exceeds 5.0 g",
                "action", "Initiate emergency shutdown",
                "priority", "critical",
                "frequency", "real-time",
                "description", "Vibration monitoring for equipment safety"
            ),
            Map.of(
                "device_name", deviceName,
                "rule_type", "maintenance",
                "condition", "Oil level below 20%",
                "action", "Schedule oil change",
                "priority", "medium",
                "frequency", "daily",
                "description", "Oil level monitoring for proper lubrication"
            )
        );
    }
    
    private List<Map<String, Object>> generateMockMaintenanceData(String pdfFilename) {
        return List.of(
            Map.of(
                "component_name", "Filter Assembly",
                "maintenance_type", "preventive",
                "frequency", "Every 3 months",
                "last_maintenance", "2024-01-15",
                "next_maintenance", "2024-04-15",
                "description", "Replace air filters to maintain optimal performance"
            ),
            Map.of(
                "component_name", "Motor Bearings",
                "maintenance_type", "preventive",
                "frequency", "Every 6 months",
                "last_maintenance", "2023-12-01",
                "next_maintenance", "2024-06-01",
                "description", "Lubricate and inspect motor bearings for wear"
            ),
            Map.of(
                "component_name", "Control Panel",
                "maintenance_type", "inspection",
                "frequency", "Monthly",
                "last_maintenance", "2024-02-01",
                "next_maintenance", "2024-03-01",
                "description", "Inspect control panel for proper operation and calibration"
            )
        );
    }
    
    private List<Map<String, Object>> generateMockSafetyPrecautions(String pdfFilename) {
        return List.of(
            Map.of(
                "id", "safety-1",
                "title", "High Temperature Warning",
                "description", "Equipment may reach dangerous temperatures during operation",
                "severity", "high",
                "category", "Thermal Safety",
                "recommended_action", "Ensure proper ventilation and monitor temperature sensors"
            ),
            Map.of(
                "id", "safety-2",
                "title", "Electrical Safety",
                "description", "High voltage components require proper grounding",
                "severity", "critical",
                "category", "Electrical Safety",
                "recommended_action", "Verify grounding connections before operation"
            )
        );
    }

    private RuleCondition convertToRuleCondition(com.iotplatform.dto.RuleConditionRequest dto) {
        RuleCondition condition = new RuleCondition();
        condition.setId(dto.getId() != null ? dto.getId() : UUID.randomUUID().toString());
        condition.setType(RuleCondition.ConditionType.valueOf(dto.getType().toUpperCase()));
        condition.setDeviceId(dto.getDeviceId());
        condition.setMetric(dto.getMetric());
        condition.setOperator(RuleCondition.Operator.valueOf(dto.getOperator().toUpperCase()));
        condition.setValue(dto.getValue());
        if (dto.getLogicOperator() != null) {
            condition.setLogicOperator(RuleCondition.LogicOperator.valueOf(dto.getLogicOperator().toUpperCase()));
        }
        return condition;
    }

    private RuleAction convertToRuleAction(com.iotplatform.dto.RuleActionRequest dto) {
        RuleAction action = new RuleAction();
        action.setId(dto.getId() != null ? dto.getId() : UUID.randomUUID().toString());
        action.setType(RuleAction.ActionType.valueOf(dto.getType().toUpperCase()));
        action.setConfig(dto.getConfig());
        return action;
    }

    public static class RuleStats {
        private long totalRules;
        private long activeRules;
        private long triggeredToday;
        private long triggeredThisWeek;

        public RuleStats(long totalRules, long activeRules, long triggeredToday, long triggeredThisWeek) {
            this.totalRules = totalRules;
            this.activeRules = activeRules;
            this.triggeredToday = triggeredToday;
            this.triggeredThisWeek = triggeredThisWeek;
        }

        // Getters
        public long getTotalRules() { return totalRules; }
        public long getActiveRules() { return activeRules; }
        public long getTriggeredToday() { return triggeredToday; }
        public long getTriggeredThisWeek() { return triggeredThisWeek; }
    }
}