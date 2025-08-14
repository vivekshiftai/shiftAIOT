package com.iotplatform.controller;

import java.util.List;
import java.util.Optional;

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
import com.iotplatform.service.ConversationConfigService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/conversation-configs")
public class ConversationConfigController {

    @Autowired
    private ConversationConfigService conversationConfigService;

    @GetMapping
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<List<ConversationConfig>> getAllConfigs(@AuthenticationPrincipal User user) {
        List<ConversationConfig> configs = conversationConfigService.getAllConfigs(user.getId());
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<ConversationConfig> getConfig(@PathVariable String id, @AuthenticationPrincipal User user) {
        Optional<ConversationConfig> config = conversationConfigService.getConfig(id, user.getId());
        return config.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_WRITE')")
    public ResponseEntity<ConversationConfig> createConfig(@Valid @RequestBody ConversationConfigRequest request, @AuthenticationPrincipal User user) {
        ConversationConfig config = new ConversationConfig();
        config.setPlatformName(request.getPlatformName());
        config.setPlatformType(request.getPlatformType());
        config.setCredentials(request.getCredentials());
        config.setActive(request.isActive());

        ConversationConfig createdConfig = conversationConfigService.createConfig(config, user.getId());
        return ResponseEntity.ok(createdConfig);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_WRITE')")
    public ResponseEntity<ConversationConfig> updateConfig(@PathVariable String id, @Valid @RequestBody ConversationConfigRequest request, @AuthenticationPrincipal User user) {
        try {
            ConversationConfig config = new ConversationConfig();
            config.setPlatformName(request.getPlatformName());
            config.setPlatformType(request.getPlatformType());
            config.setCredentials(request.getCredentials());
            config.setActive(request.isActive());

            ConversationConfig updatedConfig = conversationConfigService.updateConfig(id, config, user.getId());
            return ResponseEntity.ok(updatedConfig);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_DELETE')")
    public ResponseEntity<?> deleteConfig(@PathVariable String id, @AuthenticationPrincipal User user) {
        try {
            conversationConfigService.deleteConfig(id, user.getId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<List<ConversationConfig>> getActiveConfigs(@AuthenticationPrincipal User user) {
        List<ConversationConfig> configs = conversationConfigService.getActiveConfigs(user.getId());
        return ResponseEntity.ok(configs);
    }

    @GetMapping("/platform/{platformType}")
    @PreAuthorize("hasAuthority('CONVERSATION_CONFIG_READ')")
    public ResponseEntity<List<ConversationConfig>> getConfigsByPlatformType(
            @PathVariable String platformType, 
            @AuthenticationPrincipal User user) {
        List<ConversationConfig> configs = conversationConfigService.getConfigsByPlatformType(user.getId(), platformType);
        return ResponseEntity.ok(configs);
    }
}
