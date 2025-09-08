package com.iotplatform.controller;

import java.util.ArrayList;
import java.util.HashMap;
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
        
        // Log rule creation with device ID
        System.out.println("Creating rule: " + request.getName() + " for device: " + request.getDeviceId());
        
        Rule rule = new Rule();
        rule.setName(request.getName());
        rule.setDescription(request.getDescription());
        rule.setActive(request.isActive());
        rule.setDeviceId(request.getDeviceId()); // Set device ID from request
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
        
        // Log successful rule creation
        System.out.println("Successfully created rule: " + createdRule.getId() + " for device: " + createdRule.getDeviceId());
        
        return ResponseEntity.ok(createdRule);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<List<Rule>> createBulkRules(@RequestBody List<Map<String, Object>> rulesData, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        List<Rule> createdRules = ruleService.createBulkRules(rulesData, user.getOrganizationId());
        return ResponseEntity.ok(createdRules);
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
            rule.setDeviceId(request.getDeviceId()); // Set device ID from request

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

    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<List<Rule>> getRulesByDevice(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<Rule> rules = ruleService.getRulesByDevice(deviceId, user.getOrganizationId());
        return ResponseEntity.ok(rules);
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
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("error", "PDF filename is required");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            // TODO: Implement actual AI-based rule generation from PDF content
            // This endpoint should integrate with a proper AI service to analyze PDF content
            // and generate meaningful rules based on the device documentation
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pdf_filename", pdfFilename);
            response.put("message", "Rule generation endpoint is under development. Please implement AI integration for actual PDF analysis.");
            response.put("status", "not_implemented");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
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