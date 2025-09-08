package com.iotplatform.controller;

import com.iotplatform.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

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

    private final RestTemplate restTemplate;
    private static final String STRATEGY_AGENT_BASE_URL = "http://20.57.36.66:8001";

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

            // Prepare request headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // Create request entity
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(request, headers);
            
            // Call Strategy Agent API
            String url = STRATEGY_AGENT_BASE_URL + "/generate-recommendations";
            log.info("🔍 Calling Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            
            log.info("✅ Strategy Agent API response received - Status: {}", response.getStatusCode());
            
            return ResponseEntity.ok(response.getBody());
            
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

            // Call Strategy Agent API for PDF download
            String url = STRATEGY_AGENT_BASE_URL + "/recommendations/" + customerId + "/download";
            log.info("🔍 Calling Strategy Agent PDF download API: {}", url);
            
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_PDF);
                headers.setContentDispositionFormData("attachment", 
                        "marketing_intelligence_report_" + customerId + ".pdf");
                
                log.info("✅ PDF report downloaded successfully for customer: {}", customerId);
                
                return ResponseEntity.ok()
                        .headers(headers)
                        .body(response.getBody());
            } else {
                log.error("❌ Failed to download PDF report - Status: {}", response.getStatusCode());
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "PDF report not found"));
            }
            
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
            String url = STRATEGY_AGENT_BASE_URL + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            log.info("✅ Strategy Agent health check successful - Status: {}", response.getStatusCode());
            
            return ResponseEntity.ok(Map.of(
                    "status", "healthy",
                    "strategy_agent_status", response.getStatusCode().value(),
                    "message", "Strategy Agent is accessible"
            ));
            
        } catch (Exception e) {
            log.error("❌ Strategy Agent health check failed", e);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "status", "unhealthy",
                            "error", "Strategy Agent is not accessible: " + e.getMessage()
                    ));
        }
    }
}
