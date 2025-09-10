package com.iotplatform.controller;

import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.StrategyAgentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for Strategy Agent API proxy endpoints.
 * Handles CORS issues by proxying requests to the Strategy Agent service.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/strategy-agent")
@RequiredArgsConstructor
public class StrategyAgentController {

    private final StrategyAgentService strategyAgentService;

    /**
     * Proxy endpoint for generating marketing intelligence recommendations
     */
    @PostMapping("/generate-recommendations")
    public ResponseEntity<?> generateRecommendations(
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            log.error("❌ Authentication failed: userDetails is null or user is null");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            String customerId = (String) request.get("customer_id");
            log.info("🎯 Generating marketing intelligence recommendations for customer: {} by user: {}", 
                    customerId, userDetails.getUser().getEmail());

            // Use the Strategy Agent Service
            Map<String, Object> response = strategyAgentService.generateRecommendations(customerId);
            
            log.info("✅ Strategy Agent recommendations generated successfully for customer: {}", customerId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to generate marketing intelligence recommendations", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to generate recommendations: " + e.getMessage()));
        }
    }

    /**
     * Proxy endpoint for downloading PDF reports
     */
    @GetMapping("/recommendations/{customerId}/download")
    public ResponseEntity<?> downloadPDFReport(
            @PathVariable String customerId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            log.error("❌ Authentication failed: userDetails is null or user is null");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            log.info("📄 Downloading PDF report for customer: {} by user: {}", 
                    customerId, userDetails.getUser().getEmail());

            // Use the Strategy Agent Service
            byte[] pdfData = strategyAgentService.downloadPDFReport(customerId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                    "marketing_intelligence_report_" + customerId + ".pdf");
            
            log.info("✅ PDF report downloaded successfully for customer: {}", customerId);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfData);
            
        } catch (Exception e) {
            log.error("❌ Failed to download PDF report for customer: {}", customerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to download PDF report: " + e.getMessage()));
        }
    }

    /**
     * Health check endpoint for Strategy Agent connectivity
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            // Use the Strategy Agent Service
            Map<String, Object> healthResult = strategyAgentService.healthCheck();
            
            String status = (String) healthResult.get("status");
            if ("healthy".equals(status)) {
                log.info("✅ Strategy Agent health check successful");
                return ResponseEntity.ok(healthResult);
            } else {
                log.warn("⚠️ Strategy Agent health check failed: {}", healthResult.get("error"));
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(healthResult);
            }
            
        } catch (Exception e) {
            log.error("❌ Strategy Agent health check failed", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "status", "unhealthy",
                            "error", "Strategy Agent is not accessible: " + e.getMessage()
                    ));
        }
    }

    /**
     * Get available customers
     */
    @GetMapping("/customers")
    public ResponseEntity<?> getAvailableCustomers(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            log.info("📋 Getting available customers for user: {}", userDetails.getUser().getEmail());
            
            Map<String, Object> customers = strategyAgentService.getAvailableCustomers();
            
            return ResponseEntity.ok(customers);
            
        } catch (Exception e) {
            log.error("❌ Failed to get available customers", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get available customers: " + e.getMessage()));
        }
    }

    /**
     * Get customer details by ID
     */
    @GetMapping("/customers/{customerId}")
    public ResponseEntity<?> getCustomerDetails(@PathVariable String customerId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            log.info("📋 Getting customer details for ID: {} by user: {}", customerId, userDetails.getUser().getEmail());
            
            Map<String, Object> customerDetails = strategyAgentService.getCustomerDetails(customerId);
            
            if (customerDetails != null) {
                return ResponseEntity.ok(customerDetails);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Customer not found: " + customerId));
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to get customer details for ID: {}", customerId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get customer details: " + e.getMessage()));
        }
    }

    /**
     * Get Strategy Agent service information
     */
    @GetMapping("/info")
    public ResponseEntity<?> getServiceInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            log.info("ℹ️ Getting Strategy Agent service info for user: {}", userDetails.getUser().getEmail());
            
            Map<String, Object> serviceInfo = strategyAgentService.getServiceInfo();
            
            return ResponseEntity.ok(serviceInfo);
            
        } catch (Exception e) {
            log.error("❌ Failed to get service info", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get service info: " + e.getMessage()));
        }
    }

    /**
     * Test Strategy Agent connection
     */
    @PostMapping("/test-connection")
    public ResponseEntity<?> testConnection(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            log.info("🧪 Testing Strategy Agent connection for user: {}", userDetails.getUser().getEmail());
            
            boolean isConnected = strategyAgentService.testConnection();
            
            return ResponseEntity.ok(Map.of(
                "connected", isConnected,
                "message", isConnected ? "Connection successful" : "Connection failed",
                "timestamp", System.currentTimeMillis()
            ));
            
        } catch (Exception e) {
            log.error("❌ Failed to test connection", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to test connection: " + e.getMessage()));
        }
    }
}
