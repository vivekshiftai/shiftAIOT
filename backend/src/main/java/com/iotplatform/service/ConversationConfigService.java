package com.iotplatform.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.ConversationConfig;
import com.iotplatform.model.PlatformType;
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
        
        // Validate credentials before saving
        if (config.getCredentials() == null || config.getCredentials().isEmpty()) {
            throw new IllegalArgumentException("Credentials cannot be null or empty");
        }
        
        // Log credentials structure for debugging (without sensitive data)
        logger.info("📝 Credentials structure: {} keys", config.getCredentials().keySet());
        
        config.setId(UUID.randomUUID().toString());
        config.setUserId(userId);
        
        try {
            ConversationConfig savedConfig = conversationConfigRepository.save(config);
            logger.info("✅ Conversation config created successfully with ID: {}", savedConfig.getId());
            return savedConfig;
        } catch (Exception e) {
            logger.error("❌ Failed to save conversation config: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save conversation config: " + e.getMessage(), e);
        }
    }

    public ConversationConfig updateConfig(String id, ConversationConfig configDetails, String userId) {
        logger.info("🔄 Updating conversation config: {} for user: {}", id, userId);
        
        ConversationConfig config = conversationConfigRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new RuntimeException("Conversation config not found"));

        // Validate credentials before updating
        if (configDetails.getCredentials() == null || configDetails.getCredentials().isEmpty()) {
            throw new IllegalArgumentException("Credentials cannot be null or empty");
        }
        
        // Log credentials structure for debugging (without sensitive data)
        logger.info("📝 Credentials structure: {} keys", configDetails.getCredentials().keySet());

        config.setPlatformName(configDetails.getPlatformName());
        config.setPlatformType(configDetails.getPlatformType());
        config.setCredentials(configDetails.getCredentials());
        config.setActive(configDetails.isActive());

        try {
            ConversationConfig updatedConfig = conversationConfigRepository.save(config);
            logger.info("✅ Conversation config updated successfully: {}", updatedConfig.getId());
            return updatedConfig;
        } catch (Exception e) {
            logger.error("❌ Failed to update conversation config: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update conversation config: " + e.getMessage(), e);
        }
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
