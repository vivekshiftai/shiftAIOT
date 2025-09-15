package com.iotplatform.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for handling external queries from various sources
 * Implements the complete flow: query -> device extraction -> PDF query -> MCP response
 * 
 * Provides a single generic endpoint that can handle queries from any external source
 * including Slack, webhooks, APIs, and other integrations.
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
    private final ObjectMapper objectMapper;

    /**
     * Process external query from any source (Slack, webhooks, APIs, etc.)
     * 
     * @param request The query request containing the query text and source
     * @return Processing result
     */
    @Operation(
        summary = "Process External Query",
        description = "Process external queries through the complete flow: device extraction -> PDF query -> MCP response. Handles queries from any external source including Slack, webhooks, APIs, and other integrations. No authentication required."
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
                      "response": "The maintenance schedule for Rondo s-4000 includes...",
                      "images": [
                        {
                          "filename": "diagram_1.png",
                          "data": "base64_encoded_image_data",
                          "mime_type": "image/png",
                          "size": 245760
                        },
                        {
                          "filename": "chart_2.jpg",
                          "data": "base64_encoded_image_data",
                          "mime_type": "image/jpeg",
                          "size": 189432
                        }
                      ],
                      "source": "slack",
                      "user_id": "U123456"
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
                      "response": "Query text is required",
                      "source": "slack",
                      "user_id": "U123456"
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
                      "response": "Internal server error: [error message]",
                      "source": "slack",
                      "user_id": "U123456"
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
            
            // Parse the JSON response from the service
            Map<String, Object> responseData;
            try {
                if (result.isSuccess() && result.getResponse() != null) {
                    // Parse the JSON response from the service
                    responseData = objectMapper.readValue(result.getResponse(), Map.class);
                } else {
                    // Create error response structure
                    responseData = new HashMap<>();
                    responseData.put("response", result.getError() != null ? result.getError() : "Unknown error occurred");
                    responseData.put("source", source);
                    if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
                        responseData.put("user_id", request.getUserId());
                    } else if (request.getChannelId() != null && !request.getChannelId().trim().isEmpty()) {
                        responseData.put("channel_id", request.getChannelId());
                    }
                }
            } catch (Exception e) {
                log.error("❌ Failed to parse response JSON: {}", e.getMessage(), e);
                // Fallback response structure
                responseData = new HashMap<>();
                responseData.put("response", result.getResponse() != null ? result.getResponse() : "Response parsing failed");
                responseData.put("source", source);
                if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
                    responseData.put("user_id", request.getUserId());
                } else if (request.getChannelId() != null && !request.getChannelId().trim().isEmpty()) {
                    responseData.put("channel_id", request.getChannelId());
                }
            }
            
            if (result.isSuccess()) {
                log.info("✅ External query processed successfully for device: {}", result.getDeviceName());
                return ResponseEntity.ok(responseData);
            } else {
                log.warn("⚠️ External query processing failed: {}", result.getError());
                return ResponseEntity.status(500).body(responseData);
            }
            
        } catch (Exception e) {
            log.error("❌ Error processing external query: {}", e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("response", "Internal server error: " + e.getMessage());
            errorResponse.put("source", request.getSource() != null ? request.getSource() : "unknown");
            if (request.getUserId() != null && !request.getUserId().trim().isEmpty()) {
                errorResponse.put("user_id", request.getUserId());
            } else if (request.getChannelId() != null && !request.getChannelId().trim().isEmpty()) {
                errorResponse.put("channel_id", request.getChannelId());
            }
            return ResponseEntity.status(500).body(errorResponse);
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

}
