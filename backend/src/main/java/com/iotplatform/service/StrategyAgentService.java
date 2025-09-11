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

    @Value("${strategy.agent.base-url:http://20.57.36.66:8002}")
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

            // Get customer details first
            Map<String, Object> customerDetails = getCustomerDetails(customerId);
            
            // Prepare headers for GET request
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            
            // Create request entity (no body needed for GET request)
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Call Strategy Agent API using the new endpoint
            String url = strategyAgentBaseUrl + "/recommendations/" + customerId + "/json";
            log.info("🔍 Calling Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseData = response.getBody();
                
                // Validate response data structure for new format
                if (!responseData.containsKey("Summary") || !responseData.containsKey("CustomerInfo")) {
                    log.warn("⚠️ Strategy Agent API returned incomplete data for customer: {}", customerId);
                    // Add default values for missing fields
                    responseData.putIfAbsent("AcceptedRecommendations", new java.util.ArrayList<>());
                    responseData.putIfAbsent("RejectedRecommendations", new java.util.ArrayList<>());
                    responseData.putIfAbsent("AlreadyPurchasedRecommendations", new java.util.ArrayList<>());
                }
                
                // Remove PerformanceStats if present (as requested)
                if (responseData.containsKey("PerformanceStats")) {
                    responseData.remove("PerformanceStats");
                    log.info("📊 Removed PerformanceStats from response as requested");
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

            // Call Strategy Agent API for PDF download using new endpoint
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
     * Get available customers from external Strategy Agent API
     * 
     * @return Map containing available customers
     */
    public Map<String, Object> getAvailableCustomers() {
        log.info("📋 Getting available customers from external API");
        
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            
            // Create request entity (no body needed for GET request)
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Call external Strategy Agent API
            String url = strategyAgentBaseUrl + "/customers";
            log.info("🔍 Calling external Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("✅ Successfully retrieved customers from external API");
                
                // Handle the new response format from Strategy Agent API
                Object customers = responseBody.get("customers");
                Object totalCustomers = responseBody.get("total_customers");
                Boolean success = (Boolean) responseBody.get("success");
                
                if (success != null && success && customers != null) {
                    log.info("📊 Retrieved {} customers from new endpoint", totalCustomers);
                    
                    // Transform the response to match our expected format
                    return Map.of(
                        "customers", customers,
                        "total", totalCustomers != null ? totalCustomers : 0,
                        "success", true,
                        "timestamp", System.currentTimeMillis(),
                        "source", "external_api_v2"
                    );
                } else {
                    log.warn("⚠️ External API returned unsuccessful response: {}", responseBody);
                    return getFallbackCustomers();
                }
            } else {
                log.warn("⚠️ External API returned non-OK status: {}", response.getStatusCode());
                return getFallbackCustomers();
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to get customers from external API: {}", e.getMessage());
            log.info("🔄 Falling back to static customer list");
            return getFallbackCustomers();
        }
    }
    
    /**
     * Get customer details by ID from external API
     * 
     * @param customerId The customer ID to get details for
     * @return Map containing customer details
     */
    public Map<String, Object> getCustomerDetails(String customerId) {
        log.info("📋 Getting customer details for ID: {}", customerId);
        
        try {
            // First try to get from external API
            Map<String, Object> allCustomers = getAvailableCustomers();
            Object[] customers = (Object[]) allCustomers.get("customers");
            
            // Find the specific customer
            for (Object customerObj : customers) {
                Map<String, Object> customer = (Map<String, Object>) customerObj;
                String id = (String) customer.get("customer_id");
                if (customerId.equals(id)) {
                    log.info("✅ Found customer details for ID: {}", customerId);
                    return customer;
                }
            }
            
            log.warn("⚠️ Customer not found in external API, returning null");
            return null;
            
        } catch (Exception e) {
            log.error("❌ Failed to get customer details for ID {}: {}", customerId, e.getMessage());
            return null;
        }
    }
    
    /**
     * Fallback method to return static customer list when external API fails
     * 
     * @return Map containing static customer list
     */
    private Map<String, Object> getFallbackCustomers() {
        log.warn("🔄 Using fallback customer list - external API not available");
        return Map.of(
            "customers", new Object[]{
                Map.of("customer_id", "C001", "customer_name", "Starbucks", "customer_type", "Licensed", "country", "International", "region", "Middle East", "total_stores", 99),
                Map.of("customer_id", "C002", "customer_name", "McDonald's", "customer_type", "Corporate", "country", "United States", "region", "National", "total_stores", 4),
                Map.of("customer_id", "C003", "customer_name", "Walmart", "customer_type", "Corporate", "country", "United States", "region", "National", "total_stores", 99)
            },
            "total", 3,
            "total_customers", 3,
            "success", true,
            "timestamp", System.currentTimeMillis(),
            "source", "fallback"
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
     * Get recommendations for all customers from external Strategy Agent API
     * 
     * @return Map containing all customer recommendations
     */
    public Map<String, Object> getAllCustomerRecommendations() {
        log.info("📋 Getting recommendations for all customers from external API");
        
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            
            // Create request entity (no body needed for GET request)
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Call external Strategy Agent API
            String url = strategyAgentBaseUrl + "/recommendations/all";
            log.info("🔍 Calling external Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("✅ Successfully retrieved all customer recommendations from external API");
                
                // Handle the new response format from /recommendations/all
                Object recommendations = responseBody.get("recommendations");
                Object totalCustomers = responseBody.get("total_customers");
                Boolean success = (Boolean) responseBody.get("success");
                String message = (String) responseBody.get("message");
                
                if (success != null && success && recommendations != null) {
                    log.info("📊 Retrieved recommendations for {} customers from new endpoint", totalCustomers);
                    
                    // Remove PerformanceStats from each customer's recommendations if present
                    if (recommendations instanceof java.util.List) {
                        java.util.List<?> recommendationsList = (java.util.List<?>) recommendations;
                        for (Object recObj : recommendationsList) {
                            if (recObj instanceof Map) {
                                Map<String, Object> rec = (Map<String, Object>) recObj;
                                if (rec.containsKey("PerformanceStats")) {
                                    rec.remove("PerformanceStats");
                                }
                            }
                        }
                    }
                    
                    // Transform the response to match our expected format
                    return Map.of(
                        "recommendations", recommendations,
                        "total_customers", totalCustomers != null ? totalCustomers : 0,
                        "success", true,
                        "message", message != null ? message : "Successfully loaded customer recommendations",
                        "timestamp", System.currentTimeMillis(),
                        "source", "external_api_all"
                    );
                } else {
                    log.warn("⚠️ External API returned unsuccessful response: {}", responseBody);
                    return getFallbackAllRecommendations();
                }
            } else {
                log.warn("⚠️ External API returned non-OK status: {}", response.getStatusCode());
                return getFallbackAllRecommendations();
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to get all customer recommendations from external API: {}", e.getMessage());
            log.info("🔄 Falling back to static recommendations list");
            return getFallbackAllRecommendations();
        }
    }
    
    /**
     * Fallback method to return static recommendations list when external API fails
     * 
     * @return Map containing static recommendations list
     */
    private Map<String, Object> getFallbackAllRecommendations() {
        log.warn("🔄 Using fallback recommendations list - external API not available");
        return Map.of(
            "recommendations", new Object[]{
                Map.of(
                    "customer_id", "C001",
                    "CustomerInfo", Map.of("CustomerID", "C001", "CustomerName", "Starbucks"),
                    "Summary", Map.of("TotalRecommendations", 0, "TotalCrossSell", 0, "TotalRejected", 0, "TotalAlreadyPurchased", 0),
                    "AcceptedRecommendations", new Object[]{},
                    "RejectedRecommendations", new Object[]{},
                    "AlreadyPurchasedRecommendations", new Object[]{}
                ),
                Map.of(
                    "customer_id", "C002", 
                    "CustomerInfo", Map.of("CustomerID", "C002", "CustomerName", "McDonald's"),
                    "Summary", Map.of("TotalRecommendations", 0, "TotalCrossSell", 0, "TotalRejected", 0, "TotalAlreadyPurchased", 0),
                    "AcceptedRecommendations", new Object[]{},
                    "RejectedRecommendations", new Object[]{},
                    "AlreadyPurchasedRecommendations", new Object[]{}
                ),
                Map.of(
                    "customer_id", "C003",
                    "CustomerInfo", Map.of("CustomerID", "C003", "CustomerName", "Walmart"),
                    "Summary", Map.of("TotalRecommendations", 0, "TotalCrossSell", 0, "TotalRejected", 0, "TotalAlreadyPurchased", 0),
                    "AcceptedRecommendations", new Object[]{},
                    "RejectedRecommendations", new Object[]{},
                    "AlreadyPurchasedRecommendations", new Object[]{}
                )
            },
            "total_customers", 3,
            "success", true,
            "message", "Fallback recommendations loaded",
            "timestamp", System.currentTimeMillis(),
            "source", "fallback"
        );
    }

    /**
     * Download PDF report for all customers from external Strategy Agent API
     * 
     * @return byte array containing PDF data
     */
    public byte[] downloadAllCustomersPDFReport() {
        log.info("📄 Downloading PDF report for all customers from external API");
        
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/pdf");
            
            // Create request entity (no body needed for GET request)
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Call external Strategy Agent API
            String url = strategyAgentBaseUrl + "/recommendations/download/all";
            log.info("🔍 Calling external Strategy Agent API: {}", url);
            
            ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, requestEntity, byte[].class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                log.info("✅ Successfully downloaded PDF report for all customers from external API");
                return response.getBody();
            } else {
                log.warn("⚠️ External API returned non-OK status: {}", response.getStatusCode());
                throw new RuntimeException("Failed to download PDF report for all customers");
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to download PDF report for all customers from external API: {}", e.getMessage());
            throw new RuntimeException("Failed to download PDF report for all customers: " + e.getMessage(), e);
        }
    }

    /**
     * Regenerate recommendations for a specific customer from external Strategy Agent API
     * 
     * @param customerId The customer ID to regenerate recommendations for
     * @param forceRegenerate Whether to force regeneration (default: true)
     * @return Map containing regeneration response
     */
    public Map<String, Object> regenerateCustomerRecommendations(String customerId, boolean forceRegenerate) {
        log.info("🔄 Regenerating recommendations for customer {} from external API (force: {})", customerId, forceRegenerate);
        
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            
            // Prepare request body
            Map<String, Object> requestBody = Map.of(
                "force_regenerate", forceRegenerate
            );
            
            // Create request entity with body
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Call external Strategy Agent API
            String url = strategyAgentBaseUrl + "/regenerate_recommendations/" + customerId;
            log.info("🔍 Calling external Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("✅ Successfully triggered regeneration for customer {} from external API", customerId);
                
                return Map.of(
                    "success", true,
                    "message", "Regeneration process started successfully for customer " + customerId,
                    "customer_id", customerId,
                    "force_regenerate", forceRegenerate,
                    "timestamp", System.currentTimeMillis(),
                    "source", "external_api_regenerate_customer"
                );
            } else {
                log.warn("⚠️ External API returned non-OK status: {}", response.getStatusCode());
                return Map.of(
                    "success", false,
                    "message", "Failed to start regeneration process for customer " + customerId,
                    "customer_id", customerId,
                    "error", "External API returned status: " + response.getStatusCode(),
                    "timestamp", System.currentTimeMillis()
                );
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to regenerate recommendations for customer {} from external API: {}", customerId, e.getMessage());
            return Map.of(
                "success", false,
                "message", "Failed to start regeneration process for customer " + customerId,
                "customer_id", customerId,
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            );
        }
    }

    /**
     * Regenerate recommendations for all customers from external Strategy Agent API
     * 
     * @param forceRegenerate Whether to force regeneration (default: true)
     * @return Map containing regeneration response
     */
    public Map<String, Object> regenerateAllRecommendations(boolean forceRegenerate) {
        log.info("🔄 Regenerating recommendations for all customers from external API (force: {})", forceRegenerate);
        
        try {
            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Accept", "application/json");
            
            // Prepare request body
            Map<String, Object> requestBody = Map.of(
                "force_regenerate", forceRegenerate
            );
            
            // Create request entity with body
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Call external Strategy Agent API
            String url = strategyAgentBaseUrl + "/regenerate_recommendations";
            log.info("🔍 Calling external Strategy Agent API: {}", url);
            
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, requestEntity, Map.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("✅ Successfully triggered regeneration for all customers from external API");
                
                return Map.of(
                    "success", true,
                    "message", "Regeneration process started successfully",
                    "force_regenerate", forceRegenerate,
                    "timestamp", System.currentTimeMillis(),
                    "source", "external_api_regenerate"
                );
            } else {
                log.warn("⚠️ External API returned non-OK status: {}", response.getStatusCode());
                return Map.of(
                    "success", false,
                    "message", "Failed to start regeneration process",
                    "error", "External API returned status: " + response.getStatusCode(),
                    "timestamp", System.currentTimeMillis()
                );
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to regenerate recommendations for all customers from external API: {}", e.getMessage());
            return Map.of(
                "success", false,
                "message", "Failed to start regeneration process",
                "error", e.getMessage(),
                "timestamp", System.currentTimeMillis()
            );
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
