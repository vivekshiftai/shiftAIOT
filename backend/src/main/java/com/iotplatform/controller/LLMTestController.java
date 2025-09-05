package com.iotplatform.controller;

import com.iotplatform.service.LLMPromptService;
import com.iotplatform.service.SlackNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Test controller for LLM and Slack integration
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/llm")
@RequiredArgsConstructor
@Slf4j
public class LLMTestController {

    private final LLMPromptService llmPromptService;
    private final SlackNotificationService slackNotificationService;

    /**
     * Test Azure OpenAI connection
     */
    @GetMapping("/test-connection")
    public ResponseEntity<Map<String, Object>> testConnection() {
        try {
            boolean isConnected = llmPromptService.testConnection();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", isConnected);
            response.put("message", isConnected ? "Azure OpenAI connection successful" : "Azure OpenAI connection failed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error testing Azure OpenAI connection", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error testing connection: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Test message polishing
     */
    @PostMapping("/polish-message")
    public ResponseEntity<Map<String, Object>> polishMessage(
            @RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            String category = request.getOrDefault("category", "DEFAULT");
            
            if (message == null || message.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Message is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            String polishedMessage = llmPromptService.polishMessageForSlack(message, category);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("originalMessage", message);
            response.put("polishedMessage", polishedMessage);
            response.put("category", category);
            response.put("originalLength", message.length());
            response.put("polishedLength", polishedMessage.length());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error polishing message", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error polishing message: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Test message polishing with example IoT notifications
     */
    @GetMapping("/test-examples")
    public ResponseEntity<Map<String, Object>> testExamples() {
        try {
            Map<String, Object> examples = new HashMap<>();
            
            // Example 1: Device Assignment
            String deviceAssignmentMessage = "Device DEV-001 has been assigned to John Doe for maintenance";
            String polishedDeviceAssignment = llmPromptService.polishMessageForSlack(deviceAssignmentMessage, "DEVICE_ASSIGNMENT");
            
            // Example 2: Safety Alert
            String safetyAlertMessage = "High temperature detected on device DEV-002. Immediate action required.";
            String polishedSafetyAlert = llmPromptService.polishMessageForSlack(safetyAlertMessage, "SAFETY_ALERT");
            
            // Example 3: Maintenance Assignment
            String maintenanceMessage = "Maintenance task 'Replace Filter' is due for device DEV-003";
            String polishedMaintenance = llmPromptService.polishMessageForSlack(maintenanceMessage, "MAINTENANCE_ASSIGNMENT");
            
            examples.put("deviceAssignment", Map.of(
                "original", deviceAssignmentMessage,
                "polished", polishedDeviceAssignment
            ));
            
            examples.put("safetyAlert", Map.of(
                "original", safetyAlertMessage,
                "polished", polishedSafetyAlert
            ));
            
            examples.put("maintenanceAssignment", Map.of(
                "original", maintenanceMessage,
                "polished", polishedMaintenance
            ));
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("examples", examples);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error testing examples", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error testing examples: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Test sending a message to Slack with LLM polishing
     */
    @PostMapping("/test-slack")
    public ResponseEntity<Map<String, Object>> testSlackMessage(
            @RequestBody Map<String, String> request) {
        try {
            String message = request.get("message");
            
            if (message == null || message.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Message is required");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Send message to Slack (this will automatically use LLM polishing)
            slackNotificationService.sendCustomMessageToSlack(message);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Message sent to Slack with LLM polishing");
            response.put("originalMessage", message);
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Error sending test message to Slack", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error sending message to Slack: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Get LLM service configuration info (without sensitive data)
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        try {
            Map<String, Object> config = new HashMap<>();
            config.put("service", "LLMPromptService");
            config.put("provider", "Azure OpenAI");
            config.put("features", new String[]{
                "Message polishing",
                "Category-specific optimization",
                "Slack formatting",
                "Connection testing"
            });
            config.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(config);
            
        } catch (Exception e) {
            log.error("❌ Error getting LLM config", e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Error getting config: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
