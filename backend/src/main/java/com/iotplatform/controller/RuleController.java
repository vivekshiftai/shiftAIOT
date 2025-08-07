package com.iotplatform.controller;

import com.iotplatform.dto.RuleCreateRequest;
import com.iotplatform.model.Rule;
import com.iotplatform.model.RuleCondition;
import com.iotplatform.model.RuleAction;
import com.iotplatform.model.User;
import com.iotplatform.service.RuleService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rules")
public class RuleController {

    @Autowired
    private RuleService ruleService;

    @GetMapping
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<List<Rule>> getAllRules(@AuthenticationPrincipal User user) {
        List<Rule> rules = ruleService.getAllRules(user.getOrganizationId());
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<Rule> getRule(@PathVariable String id, @AuthenticationPrincipal User user) {
        Optional<Rule> rule = ruleService.getRule(id, user.getOrganizationId());
        return rule.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<Rule> createRule(@Valid @RequestBody RuleCreateRequest request, @AuthenticationPrincipal User user) {
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
    public ResponseEntity<Rule> updateRule(@PathVariable String id, @Valid @RequestBody RuleCreateRequest request, @AuthenticationPrincipal User user) {
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
    public ResponseEntity<?> deleteRule(@PathVariable String id, @AuthenticationPrincipal User user) {
        try {
            ruleService.deleteRule(id, user.getOrganizationId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<Rule> toggleRule(@PathVariable String id, @AuthenticationPrincipal User user) {
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
    public ResponseEntity<List<Rule>> getActiveRules(@AuthenticationPrincipal User user) {
        List<Rule> activeRules = ruleService.getActiveRules(user.getOrganizationId());
        return ResponseEntity.ok(activeRules);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('RULE_READ')")
    public ResponseEntity<RuleStats> getRuleStats(@AuthenticationPrincipal User user) {
        RuleStats stats = ruleService.getRuleStats(user.getOrganizationId());
        return ResponseEntity.ok(stats);
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