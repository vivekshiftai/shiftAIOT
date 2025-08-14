package com.iotplatform.repository;

import com.iotplatform.model.ConversationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationConfigRepository extends JpaRepository<ConversationConfig, String> {
    List<ConversationConfig> findByUserId(String userId);
    List<ConversationConfig> findByUserIdAndIsActive(String userId, boolean isActive);
    Optional<ConversationConfig> findByIdAndUserId(String id, String userId);
    List<ConversationConfig> findByUserIdAndPlatformType(String userId, String platformType);
}
