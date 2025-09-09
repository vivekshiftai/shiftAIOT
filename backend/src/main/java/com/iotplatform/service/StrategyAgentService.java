package com.iotplatform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service for Strategy Agent API integration
 * Handles all communication with the external Strategy Agent service
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StrategyAgentService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${strategy.agent.base-url:http://20.57.36.66:8001}")
    private String strategyAgentBaseUrl;

    @Value("${strategy.agent.timeout:30000}")
    private int timeout;

    @Value("${strategy.agent.max-retries:3}")
    private int maxRetries;

    @Value("${strategy.agent.retry-delay:1000}")
    private int retryDelay;

    @Value("${strategy.agent.connection-timeout:10000}")
    private int connectionTimeout;

    @Value("${strategy.agent.read-timeout:30000}")
    private int readTimeout;

    /**
     * Generate marketing intelligence recommendations for a customer
     * 
     * @param customerId The customer ID to generate recommendations for
     * @return Map containing the Strategy Agent response
     * @throws RuntimeException if the API call fails
     */
    public Map<String, Object> generateRecommendations(String customerId) {
        try {
            log.info("🎯 Generating marketing intelligence recommendations for customer: {}", customerId);

            // Validate input
            if (customerId == null || customerId.trim().isEmpty()) {
                throw new IllegalArgumentException("Customer ID cannot be null or empty");
            }

            // Prepare request
            Map<String, Object> request = Map.of("customer_id", customerId);
            
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            
            // Create request entity
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(request, headers);
            
            // Call Strategy Agent API
            String url = strategyAgentBaseUrl + "/generate-recommendations";
            log.info("🔍 Calling Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.postForEntity(url, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseData = response.getBody();
                
                // Validate response data structure
                if (!responseData.containsKey("Summary") || !responseData.containsKey("CustomerInfo")) {
                    log.warn("⚠️ Strategy Agent API returned incomplete data for customer: {}", customerId);
                    // Add default values for missing fields
                    responseData.putIfAbsent("AcceptedRecommendations", new java.util.ArrayList<>());
                    responseData.putIfAbsent("RejectedRecommendations", new java.util.ArrayList<>());
                    responseData.putIfAbsent("AlreadyPurchasedRecommendations", new java.util.ArrayList<>());
                }
                
                log.info("✅ Strategy Agent API response received successfully for customer: {}", customerId);
                return responseData;
            } else {
                log.error("❌ Strategy Agent API returned unexpected status: {} for customer: {}", 
                         response.getStatusCode(), customerId);
                throw new RuntimeException("Strategy Agent API returned status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to generate marketing intelligence recommendations for customer: {}", customerId, e);
            throw new RuntimeException("Failed to generate recommendations: " + e.getMessage(), e);
        }
    }

    /**
     * Download PDF report for a customer
     * 
     * @param customerId The customer ID to download report for
     * @return Byte array containing the PDF data
     * @throws RuntimeException if the API call fails
     */
    public byte[] downloadPDFReport(String customerId) {
        try {
            log.info("📄 Downloading PDF report for customer: {}", customerId);

            // Call Strategy Agent API for PDF download
            String url = strategyAgentBaseUrl + "/recommendations/" + customerId + "/download";
            log.info("🔍 Calling Strategy Agent PDF download API: {}", url);
            
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", "application/pdf");
            
            HttpEntity<String> requestEntity = new HttpEntity<>(headers);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                requestEntity, 
                byte[].class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("✅ PDF report downloaded successfully for customer: {}", customerId);
                return response.getBody();
            } else {
                log.error("❌ Failed to download PDF report - Status: {} for customer: {}", 
                         response.getStatusCode(), customerId);
                throw new RuntimeException("PDF report download failed with status: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to download PDF report for customer: {}", customerId, e);
            throw new RuntimeException("Failed to download PDF report: " + e.getMessage(), e);
        }
    }

    /**
     * Check Strategy Agent API health
     * 
     * @return Map containing health status information
     * @throws RuntimeException if the health check fails
     */
    public Map<String, Object> healthCheck() {
        try {
            log.info("🔍 Checking Strategy Agent API health");

            String url = strategyAgentBaseUrl + "/health";
            log.info("🔍 Calling Strategy Agent health check API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK) {
                log.info("✅ Strategy Agent health check successful - Status: {}", response.getStatusCode());
                
                return Map.of(
                    "status", "healthy",
                    "strategy_agent_status", response.getStatusCode().value(),
                    "message", "Strategy Agent is accessible",
                    "timestamp", System.currentTimeMillis()
                );
            } else {
                log.warn("⚠️ Strategy Agent health check returned status: {}", response.getStatusCode());
                return Map.of(
                    "status", "unhealthy",
                    "strategy_agent_status", response.getStatusCode().value(),
                    "message", "Strategy Agent returned non-OK status",
                    "timestamp", System.currentTimeMillis()
                );
            }
            
        } catch (Exception e) {
            log.error("❌ Strategy Agent health check failed", e);
            return Map.of(
                "status", "unhealthy",
                "error", "Strategy Agent is not accessible: " + e.getMessage(),
                "timestamp", System.currentTimeMillis()
            );
        }
    }

    /**
     * Get available customers (static list for now)
     * TODO: This could be made dynamic by adding a backend endpoint
     * 
     * @return Map containing available customers
     */
    public Map<String, Object> getAvailableCustomers() {
        log.info("📋 Getting available customers list");
        
        return Map.of(
            "customers", new Object[]{
                Map.of("id", "C001", "name", "Starbucks"),
                Map.of("id", "C002", "name", "McDonald's"),
                Map.of("id", "C003", "name", "Subway")
            },
            "total", 3,
            "timestamp", System.currentTimeMillis()
        );
    }

    /**
     * Test the Strategy Agent API connection
     * 
     * @return boolean indicating if the connection is successful
     */
    public boolean testConnection() {
        try {
            log.info("🧪 Testing Strategy Agent API connection");
            
            Map<String, Object> healthResult = healthCheck();
            boolean isHealthy = "healthy".equals(healthResult.get("status"));
            
            if (isHealthy) {
                log.info("✅ Strategy Agent API connection test successful");
            } else {
                log.warn("⚠️ Strategy Agent API connection test failed: {}", healthResult.get("error"));
            }
            
            return isHealthy;
            
        } catch (Exception e) {
            log.error("❌ Strategy Agent API connection test failed", e);
            return false;
        }
    }

    /**
     * Get Strategy Agent service configuration
     * 
     * @return Map containing service configuration
     */
    public Map<String, Object> getServiceInfo() {
        return Map.of(
            "baseUrl", strategyAgentBaseUrl,
            "timeout", timeout,
            "maxRetries", maxRetries,
            "retryDelay", retryDelay,
            "connectionTimeout", connectionTimeout,
            "readTimeout", readTimeout,
            "status", "configured",
            "timestamp", System.currentTimeMillis()
        );
    }
}
