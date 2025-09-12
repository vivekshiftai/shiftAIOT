package com.iotplatform.controller;

import com.iotplatform.service.ExternalQueryProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for handling external queries from various sources
 * Implements the complete flow: query -> device extraction -> PDF query -> MCP response
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/external-query")
@RequiredArgsConstructor
@Slf4j
public class ExternalQueryController {

    private final ExternalQueryProcessingService externalQueryProcessingService;

    /**
     * Process external query from Slack or other MCP sources
     * 
     * @param request The query request containing the query text and source
     * @return Processing result
     */
    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processExternalQuery(@RequestBody ExternalQueryRequest request) {
        log.info("🔄 Received external query request: {}", request);
        
        try {
            // Validate request
            if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Query text is required"
                ));
            }
            
            String source = request.getSource() != null ? request.getSource() : "unknown";
            
            // Process the query through the complete flow
            ExternalQueryProcessingService.ExternalQueryResult result = 
                externalQueryProcessingService.processExternalQuery(request.getQuery().trim(), source);
            
            // Return the result
            Map<String, Object> response = Map.of(
                "success", result.isSuccess(),
                "query", request.getQuery(),
                "source", source,
                "deviceName", result.getDeviceName(),
                "response", result.getResponse(),
                "error", result.getError() != null ? result.getError() : "",
                "warning", result.getWarning() != null ? result.getWarning() : ""
            );
            
            if (result.isSuccess()) {
                log.info("✅ External query processed successfully for device: {}", result.getDeviceName());
                return ResponseEntity.ok(response);
            } else {
                log.warn("⚠️ External query processing failed: {}", result.getError());
                return ResponseEntity.status(500).body(response);
            }
            
        } catch (Exception e) {
            log.error("❌ Error processing external query: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error: " + e.getMessage()
            ));
        }
    }

    /**
     * Process query from Slack webhook (simplified endpoint)
     * 
     * @param request The Slack webhook request
     * @return Processing result
     */
    @PostMapping("/slack")
    public ResponseEntity<Map<String, Object>> processSlackQuery(@RequestBody SlackWebhookRequest request) {
        log.info("📱 Received Slack webhook query: {}", request);
        
        try {
            String query = request.getText();
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "No query text provided"
                ));
            }
            
            // Process the query
            ExternalQueryProcessingService.ExternalQueryResult result = 
                externalQueryProcessingService.processExternalQuery(query.trim(), "slack");
            
            // Return simple response for Slack webhook
            return ResponseEntity.ok(Map.of(
                "success", result.isSuccess(),
                "message", result.isSuccess() ? "Query processed successfully" : "Query processing failed",
                "deviceName", result.getDeviceName() != null ? result.getDeviceName() : "none"
            ));
            
        } catch (Exception e) {
            log.error("❌ Error processing Slack query: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Internal server error"
            ));
        }
    }

    /**
     * Health check endpoint for external query service
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "service", "External Query Processing",
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Request DTO for external queries
     */
    public static class ExternalQueryRequest {
        private String query;
        private String source;
        private Map<String, Object> metadata;

        // Getters and setters
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    /**
     * Request DTO for Slack webhooks
     */
    public static class SlackWebhookRequest {
        private String text;
        private String user;
        private String channel;
        private String timestamp;

        // Getters and setters
        public String getText() { return text; }
        public void setText(String text) { this.text = text; }
        
        public String getUser() { return user; }
        public void setUser(String user) { this.user = user; }
        
        public String getChannel() { return channel; }
        public void setChannel(String channel) { this.channel = channel; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}
