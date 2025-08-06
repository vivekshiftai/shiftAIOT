package com.iotplatform.controller;

import com.iotplatform.model.Rule;
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

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/rules")
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
    public ResponseEntity<Rule> createRule(@Valid @RequestBody Rule rule, @AuthenticationPrincipal User user) {
        Rule createdRule = ruleService.createRule(rule, user.getOrganizationId());
        return ResponseEntity.ok(createdRule);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('RULE_WRITE')")
    public ResponseEntity<Rule> updateRule(@PathVariable String id, @Valid @RequestBody Rule ruleDetails, @AuthenticationPrincipal User user) {
        try {
            Rule updatedRule = ruleService.updateRule(id, ruleDetails, user.getOrganizationId());
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
}