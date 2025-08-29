package com.iotplatform.controller;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.dto.ConversationConfigRequest;
import com.iotplatform.model.ConversationConfig;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.ConversationConfigService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/conversation-configs")
public class ConversationConfigController {

    private static final Logger logger = LoggerFactory.getLogger(ConversationConfigController.class);

    @Autowired
    private ConversationConfigService conversationConfigService;

    @GetMapping
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<List<ConversationConfig>> getAllConfigs(@AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 GET /api/conversation-configs - Fetching all configs");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ Authentication failed - no user details");
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        logger.info("👤 User {} requesting conversation configs", user.getEmail());
        
        List<ConversationConfig> configs = conversationConfigService.getAllConfigs(user.getId());
        logger.info("✅ Returning {} conversation configs for user: {}", configs.size(), user.getEmail());
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<ConversationConfig> getConfig(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        Optional<ConversationConfig> config = conversationConfigService.getConfig(id, user.getId());
        return config.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_WRITE')")
    public ResponseEntity<?> createConfig(@Valid @RequestBody ConversationConfigRequest request, @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🆕 POST /api/conversation-configs - Creating new config");
        logger.info("📝 Request details - Platform: {}, Type: {}, Active: {}", 
                   request.getPlatformName(), request.getPlatformType(), request.isActive());
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ Authentication failed - no user details");
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        logger.info("👤 User {} creating conversation config", user.getEmail());
        
        try {
            // Validate credentials using the DTO validation method
            request.validateCredentials();
            
            logger.info("📝 Validating credentials structure: {} keys", request.getCredentials().keySet());
            
            ConversationConfig config = new ConversationConfig();
            config.setPlatformName(request.getPlatformName());
            config.setPlatformType(request.getPlatformType());
            config.setCredentials(request.getCredentials());
            config.setActive(request.isActive());

            ConversationConfig createdConfig = conversationConfigService.createConfig(config, user.getId());
            logger.info("✅ Conversation config created successfully with ID: {}", createdConfig.getId());
            return ResponseEntity.ok(createdConfig);
        } catch (IllegalArgumentException e) {
            logger.error("❌ Validation error for conversation config: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            logger.error("❌ Failed to create conversation config for user: {}", user.getEmail(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_WRITE')")
    public ResponseEntity<?> updateConfig(@PathVariable String id, @Valid @RequestBody ConversationConfigRequest request, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            // Validate credentials using the DTO validation method
            request.validateCredentials();
            
            logger.info("📝 Validating credentials structure for update: {} keys", request.getCredentials().keySet());
            
            ConversationConfig config = new ConversationConfig();
            config.setPlatformName(request.getPlatformName());
            config.setPlatformType(request.getPlatformType());
            config.setCredentials(request.getCredentials());
            config.setActive(request.isActive());

            ConversationConfig updatedConfig = conversationConfigService.updateConfig(id, config, user.getId());
            return ResponseEntity.ok(updatedConfig);
        } catch (IllegalArgumentException e) {
            logger.error("❌ Validation error for conversation config update: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_DELETE')")
    public ResponseEntity<?> deleteConfig(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            conversationConfigService.deleteConfig(id, user.getId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<List<ConversationConfig>> getActiveConfigs(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<ConversationConfig> configs = conversationConfigService.getActiveConfigs(user.getId());
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/platform/{platformType}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<List<ConversationConfig>> getConfigsByPlatformType(
            @PathVariable String platformType, 
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<ConversationConfig> configs = conversationConfigService.getConfigsByPlatformType(platformType, user.getId());
        return ResponseEntity.ok(configs);
    }
}
