package com.iotplatform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.model.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Service for sending notifications to Slack via MCP service
 * 
 * This service automatically sends a message to Slack whenever a notification
 * is created in the system, providing real-time updates to the team.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class SlackNotificationService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(SlackNotificationService.class);
    
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final LLMPromptService llmPromptService;

    @Value("${slack.mcp.endpoint:http://20.57.36.66:5000/chat}")
    private String slackMcpEndpoint;

    /**
     * Send notification to Slack via MCP service
     * This method is called automatically after every notification creation
     * 
     * @param notification The notification that was created
     */
    public void sendNotificationToSlack(Notification notification) {
        try {
            // Build the initial Slack message content
            String initialMessage = buildSlackMessage(notification);
            
            // Polish the message using Azure OpenAI LLM service
            String category = notification.getCategory() != null ? notification.getCategory().name() : "DEFAULT";
            String polishedMessage = llmPromptService.polishMessageForSlack(initialMessage, category);
            
            log.info("🤖 Message polished by Azure OpenAI - Category: {}, Original Length: {}, Polished Length: {}", 
                category, initialMessage.length(), polishedMessage.length());
            
            // Send to Slack asynchronously to avoid blocking the main flow
            CompletableFuture.runAsync(() -> {
                try {
                    sendSlackMessage(polishedMessage);
                } catch (Exception e) {
                    log.error("❌ Failed to send notification to Slack: {}", e.getMessage(), e);
                }
            });
            
        } catch (Exception e) {
            log.error("❌ Error preparing Slack notification: {}", e.getMessage(), e);
        }
    }

    /**
     * Build the Slack message content from the notification
     * 
     * @param notification The notification to convert
     * @return Formatted message for Slack
     */
    private String buildSlackMessage(Notification notification) {
        StringBuilder message = new StringBuilder();
        
        // Add notification header - minimal emoji
        String emoji = getCategoryEmoji(notification.getCategory());
        message.append(emoji).append(" *").append(notification.getTitle()).append("*\n");
        
        // Add notification message - no extra emoji
        message.append(notification.getMessage()).append("\n");
        
        // For device assignment notifications, the message already contains all needed info
        // No need to add redundant device information since it's already in the message
        
        return message.toString();
    }

    /**
     * Get appropriate emoji for notification category
     * 
     * @param category The notification category
     * @return Emoji string
     */
    private String getCategoryEmoji(Notification.NotificationCategory category) {
        if (category == null) {
            return "🔔";
        }
        
        switch (category) {
            case DEVICE_ASSIGNMENT:
            case DEVICE_CREATION:
            case DEVICE_UPDATE:
                return "📱";
            case MAINTENANCE_ASSIGNMENT:
            case MAINTENANCE_SCHEDULE:
            case MAINTENANCE_REMINDER:
                return "🔧";
            case RULE_TRIGGERED:
            case RULE_CREATED:
                return "📋";
            case SAFETY_ALERT:
                return "⚠️";
            case SYSTEM_UPDATE:
            case SECURITY_ALERT:
            case PERFORMANCE_ALERT:
                return "🚨";
            case DEVICE_OFFLINE:
            case DEVICE_ONLINE:
            case TEMPERATURE_ALERT:
            case BATTERY_LOW:
                return "📊";
            default:
                return "🔔";
        }
    }

    /**
     * Send the actual message to Slack via MCP service
     * 
     * @param message The message to send
     */
    private void sendSlackMessage(String message) {
        try {
            // Prepare the request payload - exact format as specified
            Map<String, String> payload = new HashMap<>();
            payload.put("message", "Send a message to Slack channel C092C9RHPKN with the text '" + message + "'");
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create request entity
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(payload, headers);
            
            // Send request to MCP service
            ResponseEntity<String> response = restTemplate.exchange(
                slackMcpEndpoint,
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Successfully sent notification to Slack via MCP service");
            } else {
                log.warn("⚠️ Slack notification sent but received non-2xx response: {}", response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to send message to Slack via MCP service: {}", e.getMessage(), e);
        }
    }

    /**
     * Send a custom message to Slack (for testing or manual use)
     * 
     * @param customMessage The custom message to send
     */
    public void sendCustomMessageToSlack(String customMessage) {
        try {
            // Polish the custom message using Azure OpenAI LLM service
            String polishedMessage = llmPromptService.polishMessageForSlack(customMessage, "CUSTOM");
            
            log.info("🤖 Custom message polished by Azure OpenAI - Original Length: {}, Polished Length: {}", 
                customMessage.length(), polishedMessage.length());
            
            sendSlackMessage(polishedMessage);
            log.info("✅ Custom message sent to Slack: {}", polishedMessage);
        } catch (Exception e) {
            log.error("❌ Failed to send custom message to Slack: {}", e.getMessage(), e);
        }
    }
}
