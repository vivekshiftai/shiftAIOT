package com.iotplatform.repository;

import com.iotplatform.model.RuleAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleActionRepository extends JpaRepository<RuleAction, String> {
    List<RuleAction> findByRuleId(String ruleId);
    List<RuleAction> findByType(RuleAction.ActionType type);
}
