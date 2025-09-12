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
        log.info("🔄 Processing external query from {}: {}", source, query);
        
        try {
            // Step 1: Extract device name from query
            String deviceName = deviceNameExtractionService.extractDeviceName(query);
            log.info("📱 Extracted device name: '{}' from query: '{}'", deviceName, query);
            
            if (deviceName == null) {
                return handleNoDeviceFound(query, source);
            }
            
            // Step 2: Find device PDF
            Optional<UnifiedPDF> devicePDF = findDevicePDF(deviceName);
            if (devicePDF.isEmpty()) {
                return handleDevicePDFNotFound(deviceName, query, source);
            }
            
            // Step 3: Query PDF using external service
            PDFQueryResponse pdfResponse = queryDevicePDF(devicePDF.get(), query);
            
            // Step 4: Return response through MCP server
            return sendResponseThroughMCP(pdfResponse, query, deviceName, source);
            
        } catch (Exception e) {
            log.error("❌ Error processing external query: {}", e.getMessage(), e);
            return handleProcessingError(query, source, e);
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
                                                      String deviceName, String source) {
        try {
            log.info("📤 Sending response through MCP server for device: {}", deviceName);
            
            // Format the response for MCP
            String formattedResponse = formatResponseForMCP(pdfResponse, originalQuery, deviceName);
            
            // Send to MCP server
            Map<String, String> payload = new HashMap<>();
            payload.put("message", "Send a message to Slack channel C092C9RHPKN with the text '" + formattedResponse + "'");
            
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
    private ExternalQueryResult handleNoDeviceFound(String query, String source) {
        String response = "🤖 *Query Response*\n" +
                         "❌ No specific device found in your query: \"" + query + "\"\n" +
                         "Please specify a device name (e.g., 'Rondo s-4000', 'Conveyor Belt System') to get device-specific information.";
        
        log.info("📤 Sending 'no device found' response through MCP server");
        return sendGenericResponseThroughMCP(response);
    }

    /**
     * Handle case when device PDF is not found
     */
    private ExternalQueryResult handleDevicePDFNotFound(String deviceName, String query, String source) {
        String response = "🤖 *Query Response for " + deviceName + "*\n" +
                         "❌ No documentation found for device: " + deviceName + "\n" +
                         "The device documentation may not be uploaded yet. Please contact the administrator.";
        
        log.info("📤 Sending 'device PDF not found' response through MCP server");
        return sendGenericResponseThroughMCP(response);
    }

    /**
     * Handle processing errors
     */
    private ExternalQueryResult handleProcessingError(String query, String source, Exception error) {
        String response = "🤖 *Query Response*\n" +
                         "❌ Error processing your query: \"" + query + "\"\n" +
                         "Please try again or contact support if the issue persists.";
        
        log.info("📤 Sending error response through MCP server");
        return sendGenericResponseThroughMCP(response);
    }

    /**
     * Send generic response through MCP server
     */
    private ExternalQueryResult sendGenericResponseThroughMCP(String response) {
        try {
            Map<String, String> payload = new HashMap<>();
            payload.put("message", "Send a message to Slack channel C092C9RHPKN with the text '" + response + "'");
            
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
