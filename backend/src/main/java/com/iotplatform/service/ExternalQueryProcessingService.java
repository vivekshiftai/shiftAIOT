package com.iotplatform.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.dto.PDFQueryRequest;
import com.iotplatform.dto.PDFQueryResponse;
import com.iotplatform.model.UnifiedPDF;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for processing external queries through the complete flow:
 * 1. Receive external query
 * 2. Extract device name from query
 * 3. Find device PDF
 * 4. Query PDF using external service
 * 5. Return response through MCP server
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalQueryProcessingService {

    private final DeviceNameExtractionService deviceNameExtractionService;
    private final UnifiedPDFService unifiedPDFService;
    private final PDFProcessingService pdfProcessingService;
    private final SlackNotificationService slackNotificationService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${slack.mcp.endpoint:http://20.57.36.66:5000/chat}")
    private String mcpEndpoint;

    @Value("${external.query.organization-id:shiftAIOT-org-2024}")
    private String defaultOrganizationId;

    /**
     * Process external query through the complete flow
     * 
     * @param query The external query text
     * @param source The source of the query (e.g., "slack", "webhook", "api")
     * @return Processing result with response
     */
    public ExternalQueryResult processExternalQuery(String query, String source) {
        return processExternalQuery(query, source, null, null);
    }

    /**
     * Process external query through the complete flow with Slack channel and user IDs
     * 
     * @param query The external query text
     * @param source The source of the query (e.g., "slack", "webhook", "api")
     * @param channelId The Slack channel ID (for dynamic channel responses)
     * @param userId The Slack user ID (for user-specific responses)
     * @return Processing result with response
     */
    public ExternalQueryResult processExternalQuery(String query, String source, String channelId, String userId) {
        log.info("🔄 Processing external query from {}: {}", source, query);
        
        try {
            // Step 1: Extract device name from query
            String deviceName = deviceNameExtractionService.extractDeviceName(query);
            log.info("📱 Extracted device name: '{}' from query: '{}'", deviceName, query);
            
            if (deviceName == null) {
                return handleNoDeviceFound(query, source, channelId, userId);
            }
            
            // Step 2: Find device PDF
            Optional<UnifiedPDF> devicePDF = findDevicePDF(deviceName);
            if (devicePDF.isEmpty()) {
                return handleDevicePDFNotFound(deviceName, query, source, channelId, userId);
            }
            
            // Step 3: Query PDF using external service
            PDFQueryResponse pdfResponse = queryDevicePDF(devicePDF.get(), query);
            
            // Step 4: Return response through MCP server with dynamic channel/user IDs
            return sendResponseThroughMCP(pdfResponse, query, deviceName, source, channelId, userId);
            
        } catch (Exception e) {
            log.error("❌ Error processing external query: {}", e.getMessage(), e);
            return handleProcessingError(query, source, e, channelId, userId);
        }
    }

    /**
     * Find PDF for the extracted device name
     */
    private Optional<UnifiedPDF> findDevicePDF(String deviceName) {
        try {
            log.info("🔍 Searching for PDF for device: {}", deviceName);
            
            // Get all PDFs for the organization
            List<UnifiedPDF> allPDFs = unifiedPDFService.getPDFsByOrganization(defaultOrganizationId);
            
            // Try exact match first
            Optional<UnifiedPDF> exactMatch = allPDFs.stream()
                .filter(pdf -> pdf.getDeviceName() != null && 
                              pdf.getDeviceName().equalsIgnoreCase(deviceName))
                .findFirst();
            
            if (exactMatch.isPresent()) {
                log.info("✅ Found exact match for device: {}", deviceName);
                return exactMatch;
            }
            
            // Try partial match
            Optional<UnifiedPDF> partialMatch = allPDFs.stream()
                .filter(pdf -> pdf.getDeviceName() != null && 
                              (pdf.getDeviceName().toLowerCase().contains(deviceName.toLowerCase()) ||
                               deviceName.toLowerCase().contains(pdf.getDeviceName().toLowerCase())))
                .findFirst();
            
            if (partialMatch.isPresent()) {
                log.info("✅ Found partial match for device: {} -> {}", deviceName, partialMatch.get().getDeviceName());
                return partialMatch;
            }
            
            log.warn("⚠️ No PDF found for device: {}", deviceName);
            return Optional.empty();
            
        } catch (Exception e) {
            log.error("❌ Error finding device PDF: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    /**
     * Query the device PDF using the external PDF processing service
     */
    private PDFQueryResponse queryDevicePDF(UnifiedPDF devicePDF, String query) throws Exception {
        log.info("📄 Querying PDF: {} for device: {}", devicePDF.getName(), devicePDF.getDeviceName());
        
        // Create PDF query request
        PDFQueryRequest pdfRequest = new PDFQueryRequest();
        pdfRequest.setPdfName(devicePDF.getName());
        pdfRequest.setQuery(query);
        pdfRequest.setTopK(5);
        pdfRequest.setOrganizationId(defaultOrganizationId);
        
        // Query the PDF using the existing PDF processing service
        PDFQueryResponse response = pdfProcessingService.queryPDF(pdfRequest, "external-query", defaultOrganizationId);
        
        log.info("✅ PDF query completed successfully for device: {}", devicePDF.getDeviceName());
        return response;
    }

    /**
     * Send response through MCP server
     */
    private ExternalQueryResult sendResponseThroughMCP(PDFQueryResponse pdfResponse, String originalQuery, 
                                                      String deviceName, String source, String channelId, String userId) {
        try {
            log.info("📤 Sending response through MCP server for device: {}", deviceName);
            
            // Format the response for MCP
            String formattedResponse = formatResponseForMCP(pdfResponse, originalQuery, deviceName);
            
            // Send to MCP server with priority: User ID first, then Channel ID, then default
            Map<String, String> payload = new HashMap<>();
            String messageText;
            
            if (userId != null && !userId.trim().isEmpty()) {
                // Priority 1: Send direct message to user
                messageText = "Send a direct message to Slack user " + userId + " with the text '" + formattedResponse + "'";
                log.info("📤 Sending direct message to user: {}", userId);
            } else if (channelId != null && !channelId.trim().isEmpty()) {
                // Priority 2: Send to specific channel
                messageText = "Send a message to Slack channel " + channelId + " with the text '" + formattedResponse + "'";
                log.info("📤 Sending message to channel: {}", channelId);
            } else {
                // Priority 3: Fallback to default channel
                messageText = "Send a message to Slack channel C092C9RHPKN with the text '" + formattedResponse + "'";
                log.info("📤 Sending message to default channel: C092C9RHPKN");
            }
            
            payload.put("message", messageText);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(payload, headers);
            
            ResponseEntity<String> response = restTemplate.exchange(
                mcpEndpoint,
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ Response sent successfully through MCP server");
                return ExternalQueryResult.success(formattedResponse, deviceName, pdfResponse);
            } else {
                log.warn("⚠️ MCP server returned non-2xx response: {}", response.getStatusCode());
                return ExternalQueryResult.partialSuccess(formattedResponse, deviceName, pdfResponse, 
                    "MCP server returned: " + response.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to send response through MCP server: {}", e.getMessage(), e);
            return ExternalQueryResult.error("Failed to send response through MCP server: " + e.getMessage());
        }
    }

    /**
     * Format PDF response for MCP/Slack
     */
    private String formatResponseForMCP(PDFQueryResponse pdfResponse, String originalQuery, String deviceName) {
        StringBuilder response = new StringBuilder();
        
        response.append("🤖 *Query Response for ").append(deviceName).append("*\n");
        response.append("📝 *Query:* ").append(originalQuery).append("\n\n");
        
        if (pdfResponse.getResponse() != null && !pdfResponse.getResponse().trim().isEmpty()) {
            response.append("💡 *Answer:*\n").append(pdfResponse.getResponse()).append("\n\n");
        }
        
        if (pdfResponse.getTables() != null && !pdfResponse.getTables().isEmpty()) {
            response.append("📊 *Related Tables:*\n");
            for (int i = 0; i < pdfResponse.getTables().size(); i++) {
                response.append("Table ").append(i + 1).append(": Available\n");
            }
            response.append("\n");
        }
        
        if (pdfResponse.getImages() != null && !pdfResponse.getImages().isEmpty()) {
            response.append("🖼️ *Related Images:* ").append(pdfResponse.getImages().size()).append(" found\n\n");
        }
        
        if (pdfResponse.getProcessingTime() != null) {
            response.append("⏱️ *Processing Time:* ").append(pdfResponse.getProcessingTime());
        }
        
        return response.toString();
    }

    /**
     * Handle case when no device is found in query
     */
    private ExternalQueryResult handleNoDeviceFound(String query, String source, String channelId, String userId) {
        try {
            // Get available device names to help the user
            List<UnifiedPDF> allPDFs = unifiedPDFService.getPDFsByOrganization(defaultOrganizationId);
            Set<String> availableDeviceNames = allPDFs.stream()
                .map(UnifiedPDF::getDeviceName)
                .filter(deviceName -> deviceName != null && !deviceName.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toSet());
            
            StringBuilder response = new StringBuilder();
            response.append("🤖 *Query Response*\n");
            response.append("❌ No specific device found in your query: \"").append(query).append("\"\n\n");
            response.append("📋 *Please specify a device name for better understanding.*\n\n");
            
            if (!availableDeviceNames.isEmpty()) {
                response.append("🔍 *Available devices in the system:*\n");
                for (String deviceName : availableDeviceNames) {
                    response.append("• ").append(deviceName).append("\n");
                }
                response.append("\n");
                response.append("💡 *Example queries:*\n");
                String firstDevice = availableDeviceNames.iterator().next();
                response.append("• \"How do I operate ").append(firstDevice).append("?\"\n");
                response.append("• \"What's the maintenance schedule for ").append(firstDevice).append("?\"\n");
                response.append("• \"Show me safety procedures for ").append(firstDevice).append("\"\n");
            } else {
                response.append("⚠️ No devices are currently available in the system.\n");
                response.append("Please contact the administrator to upload device documentation.");
            }
            
            log.info("📤 Sending 'no device found' response with available devices list through MCP server");
            return sendGenericResponseThroughMCP(response.toString(), channelId, userId);
            
        } catch (Exception e) {
            log.error("❌ Error getting available device names for 'no device found' response: {}", e.getMessage(), e);
            
            // Fallback response without device list
            String fallbackResponse = "🤖 *Query Response*\n" +
                                    "❌ No specific device found in your query: \"" + query + "\"\n\n" +
                                    "📋 *Please specify a device name for better understanding.*\n\n" +
                                    "💡 *Example queries:*\n" +
                                    "• \"How do I operate [device name]?\"\n" +
                                    "• \"What's the maintenance schedule for [device name]?\"\n" +
                                    "• \"Show me safety procedures for [device name]\"\n\n" +
                                    "Please specify the exact device name to get device-specific information.";
            
            log.info("📤 Sending fallback 'no device found' response through MCP server");
            return sendGenericResponseThroughMCP(fallbackResponse, channelId, userId);
        }
    }

    /**
     * Handle case when device PDF is not found
     */
    private ExternalQueryResult handleDevicePDFNotFound(String deviceName, String query, String source, String channelId, String userId) {
        String response = "🤖 *Query Response for " + deviceName + "*\n" +
                         "❌ No documentation found for device: " + deviceName + "\n" +
                         "The device documentation may not be uploaded yet. Please contact the administrator.";
        
        log.info("📤 Sending 'device PDF not found' response through MCP server");
        return sendGenericResponseThroughMCP(response, channelId, userId);
    }

    /**
     * Handle processing errors
     */
    private ExternalQueryResult handleProcessingError(String query, String source, Exception error, String channelId, String userId) {
        String response = "🤖 *Query Response*\n" +
                         "❌ Error processing your query: \"" + query + "\"\n" +
                         "Please try again or contact support if the issue persists.";
        
        log.info("📤 Sending error response through MCP server");
        return sendGenericResponseThroughMCP(response, channelId, userId);
    }

    /**
     * Send generic response through MCP server
     */
    private ExternalQueryResult sendGenericResponseThroughMCP(String response, String channelId, String userId) {
        try {
            Map<String, String> payload = new HashMap<>();
            String messageText;
            
            if (userId != null && !userId.trim().isEmpty()) {
                // Priority 1: Send direct message to user
                messageText = "Send a direct message to Slack user " + userId + " with the text '" + response + "'";
                log.info("📤 Sending generic direct message to user: {}", userId);
            } else if (channelId != null && !channelId.trim().isEmpty()) {
                // Priority 2: Send to specific channel
                messageText = "Send a message to Slack channel " + channelId + " with the text '" + response + "'";
                log.info("📤 Sending generic message to channel: {}", channelId);
            } else {
                // Priority 3: Fallback to default channel
                messageText = "Send a message to Slack channel C092C9RHPKN with the text '" + response + "'";
                log.info("📤 Sending generic message to default channel: C092C9RHPKN");
            }
            
            payload.put("message", messageText);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(payload, headers);
            
            ResponseEntity<String> mcpResponse = restTemplate.exchange(
                mcpEndpoint,
                HttpMethod.POST,
                requestEntity,
                String.class
            );
            
            if (mcpResponse.getStatusCode().is2xxSuccessful()) {
                return ExternalQueryResult.success(response, null, null);
            } else {
                return ExternalQueryResult.error("MCP server error: " + mcpResponse.getStatusCode());
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to send generic response through MCP: {}", e.getMessage(), e);
            return ExternalQueryResult.error("Failed to send response: " + e.getMessage());
        }
    }

    /**
     * Result class for external query processing
     */
    public static class ExternalQueryResult {
        private final boolean success;
        private final String response;
        private final String deviceName;
        private final PDFQueryResponse pdfResponse;
        private final String error;
        private final String warning;

        private ExternalQueryResult(boolean success, String response, String deviceName, 
                                  PDFQueryResponse pdfResponse, String error, String warning) {
            this.success = success;
            this.response = response;
            this.deviceName = deviceName;
            this.pdfResponse = pdfResponse;
            this.error = error;
            this.warning = warning;
        }

        public static ExternalQueryResult success(String response, String deviceName, PDFQueryResponse pdfResponse) {
            return new ExternalQueryResult(true, response, deviceName, pdfResponse, null, null);
        }

        public static ExternalQueryResult partialSuccess(String response, String deviceName, 
                                                        PDFQueryResponse pdfResponse, String warning) {
            return new ExternalQueryResult(true, response, deviceName, pdfResponse, null, warning);
        }

        public static ExternalQueryResult error(String error) {
            return new ExternalQueryResult(false, null, null, null, error, null);
        }

        // Getters
        public boolean isSuccess() { return success; }
        public String getResponse() { return response; }
        public String getDeviceName() { return deviceName; }
        public PDFQueryResponse getPdfResponse() { return pdfResponse; }
        public String getError() { return error; }
        public String getWarning() { return warning; }
    }
}
