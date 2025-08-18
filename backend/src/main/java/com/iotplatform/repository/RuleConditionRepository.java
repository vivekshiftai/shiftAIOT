package com.iotplatform.repository;

import com.iotplatform.model.RuleCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RuleConditionRepository extends JpaRepository<RuleCondition, String> {
    List<RuleCondition> findByRuleId(String ruleId);
    List<RuleCondition> findByDeviceId(String deviceId);
}
