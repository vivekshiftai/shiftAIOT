package com.iotplatform.controller;

import com.iotplatform.service.ExternalQueryProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "External Query Processing", description = "APIs for processing external queries through device PDFs and MCP server")
public class ExternalQueryController {

    private final ExternalQueryProcessingService externalQueryProcessingService;

    /**
     * Process external query from Slack or other MCP sources
     * 
     * @param request The query request containing the query text and source
     * @return Processing result
     */
    @Operation(
        summary = "Process External Query",
        description = "Process external queries through the complete flow: device extraction -> PDF query -> MCP response. No authentication required."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Query processed successfully",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = Map.class),
                examples = @ExampleObject(
                    name = "Success Response",
                    value = """
                    {
                      "success": true,
                      "query": "What is the maintenance schedule for Rondo s-4000?",
                      "source": "slack",
                      "deviceName": "Rondo s-4000",
                      "response": "🤖 Query Response for Rondo s-4000...",
                      "error": "",
                      "warning": ""
                    }
                    """
                )
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Bad request - missing query text",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error Response",
                    value = """
                    {
                      "success": false,
                      "error": "Query text is required"
                    }
                    """
                )
            )
        ),
        @ApiResponse(
            responseCode = "500",
            description = "Internal server error",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error Response",
                    value = """
                    {
                      "success": false,
                      "error": "Internal server error: [error message]"
                    }
                    """
                )
            )
        )
    })
    @PostMapping("/process")
    public ResponseEntity<Map<String, Object>> processExternalQuery(
        @Parameter(description = "External query request", required = true)
        @RequestBody ExternalQueryRequest request) {
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
            
            // Process the query through the complete flow with dynamic channel/user IDs
            ExternalQueryProcessingService.ExternalQueryResult result = 
                externalQueryProcessingService.processExternalQuery(
                    request.getQuery().trim(), 
                    source, 
                    request.getChannelId(),  // Use channel ID from request
                    request.getUserId()      // Use user ID from request
                );
            
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
    @Operation(
        summary = "Process Slack Webhook Query",
        description = "Simplified endpoint for processing queries from Slack webhooks. No authentication required."
    )
    @ApiResponses(value = {
        @ApiResponse(
            responseCode = "200",
            description = "Slack query processed successfully",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Success Response",
                    value = """
                    {
                      "success": true,
                      "message": "Query processed successfully",
                      "deviceName": "Rondo s-4000"
                    }
                    """
                )
            )
        ),
        @ApiResponse(
            responseCode = "400",
            description = "Bad request - no query text provided",
            content = @Content(
                mediaType = "application/json",
                examples = @ExampleObject(
                    name = "Error Response",
                    value = """
                    {
                      "success": false,
                      "error": "No query text provided"
                    }
                    """
                )
            )
        )
    })
    @PostMapping("/slack")
    public ResponseEntity<Map<String, Object>> processSlackQuery(
        @Parameter(description = "Slack webhook request", required = true)
        @RequestBody SlackWebhookRequest request) {
        log.info("📱 Received Slack webhook query: {}", request);
        
        try {
            String query = request.getText();
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "No query text provided"
                ));
            }
            
            // Process the query with dynamic channel and user IDs from Slack webhook
            ExternalQueryProcessingService.ExternalQueryResult result = 
                externalQueryProcessingService.processExternalQuery(
                    query.trim(), 
                    "slack", 
                    request.getChannelId(),  // Use actual channel ID from Slack
                    request.getUserId()      // Use actual user ID from Slack
                );
            
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
    @Operation(
        summary = "Health Check",
        description = "Check the health status of the external query processing service. No authentication required."
    )
    @ApiResponse(
        responseCode = "200",
        description = "Service is healthy",
        content = @Content(
            mediaType = "application/json",
            examples = @ExampleObject(
                name = "Health Response",
                value = """
                {
                  "status": "healthy",
                  "service": "External Query Processing",
                  "timestamp": 1694512345678
                }
                """
            )
        )
    )
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
    @Schema(description = "External query request payload")
    public static class ExternalQueryRequest {
        @Schema(description = "The query text to process", example = "What is the maintenance schedule for Rondo s-4000?", required = true)
        private String query;
        
        @Schema(description = "Source of the query", example = "slack", required = false)
        private String source;
        
        @Schema(description = "Slack channel ID for dynamic responses", example = "C092C9RHPKN", required = false)
        private String channelId;
        
        @Schema(description = "Slack user ID for direct messages", example = "U123456", required = false)
        private String userId;
        
        @Schema(description = "Additional metadata", required = false)
        private Map<String, Object> metadata;

        // Getters and setters
        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        
        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }
        
        public String getChannelId() { return channelId; }
        public void setChannelId(String channelId) { this.channelId = channelId; }
        
        public String getUserId() { return userId; }
        public void setUserId(String userId) { this.userId = userId; }
        
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    /**
     * Request DTO for Slack webhooks
     */
    @Schema(description = "Slack webhook request payload")
    public static class SlackWebhookRequest {
        @Schema(description = "The query text from Slack", example = "How do I operate the conveyor belt?", required = true)
        private String text;
        
        @Schema(description = "Slack user ID", example = "U123456", required = false)
        private String user;
        
        @Schema(description = "Slack channel ID", example = "C092C9RHPKN", required = false)
        private String channel;
        
        @Schema(description = "Message timestamp", example = "1694512345.123456", required = false)
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
        
        // Additional getters for compatibility with ExternalQueryProcessingService
        public String getUserId() { return user; }
        public String getChannelId() { return channel; }
    }
}
