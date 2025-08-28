package com.iotplatform.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.ConversationConfig;
import com.iotplatform.repository.ConversationConfigRepository;

@Service
public class ConversationConfigService {

    private static final Logger logger = LoggerFactory.getLogger(ConversationConfigService.class);

    @Autowired
    private ConversationConfigRepository conversationConfigRepository;

    public List<ConversationConfig> getAllConfigs(String userId) {
        logger.info("🔍 Fetching all conversation configs for user: {}", userId);
        List<ConversationConfig> configs = conversationConfigRepository.findByUserId(userId);
        logger.info("✅ Found {} conversation configs for user: {}", configs.size(), userId);
        return configs;
    }

    public Optional<ConversationConfig> getConfig(String id, String userId) {
        logger.info("🔍 Fetching conversation config: {} for user: {}", id, userId);
        Optional<ConversationConfig> config = conversationConfigRepository.findByIdAndUserId(id, userId);
        logger.info("✅ Conversation config found: {}", config.isPresent());
        return config;
    }

    public ConversationConfig createConfig(ConversationConfig config, String userId) {
        logger.info("🆕 Creating new conversation config for user: {}", userId);
        logger.info("📝 Config details - Platform: {}, Type: {}, Active: {}", 
                   config.getPlatformName(), config.getPlatformType(), config.isActive());
        
        config.setId(UUID.randomUUID().toString());
        config.setUserId(userId);
        
        ConversationConfig savedConfig = conversationConfigRepository.save(config);
        logger.info("✅ Conversation config created successfully with ID: {}", savedConfig.getId());
        return savedConfig;
    }

    public ConversationConfig updateConfig(String id, ConversationConfig configDetails, String userId) {
        logger.info("🔄 Updating conversation config: {} for user: {}", id, userId);
        
        ConversationConfig config = conversationConfigRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation config not found"));

        config.setPlatformName(configDetails.getPlatformName());
        config.setPlatformType(configDetails.getPlatformType());
        config.setCredentials(configDetails.getCredentials());
        config.setActive(configDetails.isActive());

        ConversationConfig updatedConfig = conversationConfigRepository.save(config);
        logger.info("✅ Conversation config updated successfully: {}", updatedConfig.getId());
        return updatedConfig;
    }

    public void deleteConfig(String id, String userId) {
        logger.info("🗑️ Deleting conversation config: {} for user: {}", id, userId);
        
        ConversationConfig config = conversationConfigRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation config not found"));
        
        conversationConfigRepository.delete(config);
        logger.info("✅ Conversation config deleted successfully: {}", id);
    }

    public List<ConversationConfig> getActiveConfigs(String userId) {
        return conversationConfigRepository.findByUserIdAndIsActive(userId, true);
    }

    public List<ConversationConfig> getConfigsByPlatformType(String userId, String platformType) {
        return conversationConfigRepository.findByUserIdAndPlatformType(userId, platformType);
    }
}
