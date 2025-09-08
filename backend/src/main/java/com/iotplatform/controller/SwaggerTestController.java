package com.iotplatform.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Test controller to verify Swagger/OpenAPI is working correctly.
 * This controller provides simple endpoints to test API functionality.
 */
@Slf4j
@RestController
@RequestMapping("/api/test")
@Tag(name = "API Test", description = "Test endpoints to verify API functionality")
@CrossOrigin(originPatterns = "*", maxAge = 3600)
public class SwaggerTestController {

    /**
     * Simple health check endpoint to test API connectivity.
     */
    @Operation(
        summary = "API Health Check",
        description = "Simple endpoint to verify that the API is working correctly"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "API is healthy and working"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        log.info("Health check endpoint called");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("message", "ShiftAIOT Platform API is working correctly");
        response.put("timestamp", LocalDateTime.now());
        response.put("version", "1.0.0");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Echo endpoint to test request/response functionality.
     */
    @Operation(
        summary = "Echo Test",
        description = "Echo back the provided message to test request/response functionality"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Message echoed successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request")
    })
    @PostMapping("/echo")
    public ResponseEntity<Map<String, Object>> echo(@RequestBody Map<String, String> request) {
        log.info("Echo endpoint called with message: {}", request.get("message"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("echo", request.get("message"));
        response.put("timestamp", LocalDateTime.now());
        response.put("received", true);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get server information.
     */
    @Operation(
        summary = "Server Information",
        description = "Get information about the server and API configuration"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Server information retrieved successfully")
    })
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getServerInfo() {
        log.info("Server info endpoint called");
        
        Map<String, Object> response = new HashMap<>();
        response.put("application", "ShiftAIOT Platform Backend");
        response.put("version", "1.0.0");
        response.put("javaVersion", System.getProperty("java.version"));
        response.put("springBootVersion", org.springframework.boot.SpringBootVersion.getVersion());
        response.put("timestamp", LocalDateTime.now());
        response.put("swaggerEnabled", true);
        response.put("swaggerUrl", "/swagger-ui.html");
        response.put("apiDocsUrl", "/v3/api-docs");
        response.put("swaggerConfigUrl", "/v3/api-docs/swagger-config");
        
        return ResponseEntity.ok(response);
    }

    /**
     * Test OpenAPI configuration.
     */
    @Operation(
        summary = "OpenAPI Configuration Test",
        description = "Test endpoint to verify OpenAPI configuration is working"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "OpenAPI configuration is working")
    })
    @GetMapping("/openapi-test")
    public ResponseEntity<Map<String, Object>> testOpenApiConfig() {
        log.info("OpenAPI test endpoint called");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("message", "OpenAPI configuration is working correctly");
        response.put("timestamp", LocalDateTime.now());
        response.put("endpoints", List.of(
            "/swagger-ui.html",
            "/v3/api-docs",
            "/v3/api-docs/swagger-config"
        ));
        
        return ResponseEntity.ok(response);
    }
}
