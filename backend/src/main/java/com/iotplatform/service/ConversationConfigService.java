package com.iotplatform.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.ConversationConfig;
import com.iotplatform.repository.ConversationConfigRepository;

@Service
public class ConversationConfigService {

    @Autowired
    private ConversationConfigRepository conversationConfigRepository;

    public List<ConversationConfig> getAllConfigs(String userId) {
        return conversationConfigRepository.findByUserId(userId);
    }

    public Optional<ConversationConfig> getConfig(String id, String userId) {
        return conversationConfigRepository.findByIdAndUserId(id, userId);
    }

    public ConversationConfig createConfig(ConversationConfig config, String userId) {
        config.setId(UUID.randomUUID().toString());
        config.setUserId(userId);
        return conversationConfigRepository.save(config);
    }

    public ConversationConfig updateConfig(String id, ConversationConfig configDetails, String userId) {
        ConversationConfig config = conversationConfigRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation config not found"));

        config.setPlatformName(configDetails.getPlatformName());
        config.setPlatformType(configDetails.getPlatformType());
        config.setCredentials(configDetails.getCredentials());
        config.setActive(configDetails.isActive());

        return conversationConfigRepository.save(config);
    }

    public void deleteConfig(String id, String userId) {
        ConversationConfig config = conversationConfigRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation config not found"));
        conversationConfigRepository.delete(config);
    }

    public List<ConversationConfig> getActiveConfigs(String userId) {
        return conversationConfigRepository.findByUserIdAndIsActive(userId, true);
    }

    public List<ConversationConfig> getConfigsByPlatformType(String userId, String platformType) {
        return conversationConfigRepository.findByUserIdAndPlatformType(userId, platformType);
    }
}
