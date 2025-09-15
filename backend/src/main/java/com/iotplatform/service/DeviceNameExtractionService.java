package com.iotplatform.service;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.ai.openai.models.*;
import com.azure.core.credential.AzureKeyCredential;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.model.UnifiedPDF;
import com.iotplatform.service.UnifiedPDFService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service for extracting device names from natural language queries using Azure OpenAI
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DeviceNameExtractionService {

    private final UnifiedPDFService unifiedPDFService;

    @Value("${azure.openai.endpoint}")
    private String endpoint;

    @Value("${azure.openai.api-key}")
    private String apiKey;

    @Value("${azure.openai.deployment-name}")
    private String deploymentName;

    @Value("${azure.openai.model}")
    private String model;

    @Value("${azure.openai.max-completion-tokens:500}")
    private int maxCompletionTokens;

    @Value("${azure.openai.temperature:0.1}")
    private double temperature;

    @Value("${external.query.organization-id:shiftAIOT-org-2024}")
    private String defaultOrganizationId;

    private OpenAIClient openAIClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Initialize the OpenAI client
     */
    private void initializeClient() {
        if (openAIClient == null) {
            try {
                openAIClient = new OpenAIClientBuilder()
                    .endpoint(endpoint)
                    .credential(new AzureKeyCredential(apiKey))
                    .buildClient();
                log.info("✅ Azure OpenAI client initialized successfully");
            } catch (Exception e) {
                log.error("❌ Failed to initialize Azure OpenAI client", e);
                throw new RuntimeException("Failed to initialize OpenAI client", e);
            }
        }
    }

    /**
     * Extract device name and plain query from a natural language query
     * 
     * @param query The natural language query
     * @return DeviceExtractionResult containing device name and plain query
     */
    public DeviceExtractionResult extractDeviceName(String query) {
        log.info("🔍 Extracting device name and plain query from: {}", query);
        
        try {
            initializeClient();
            
            // Step 1: Get available device names from PDF table
            Set<String> availableDeviceNames = getAvailableDeviceNames();
            log.info("📋 Found {} available device names in PDF table", availableDeviceNames.size());
            
            // Create system prompt for device name and plain query extraction
            String systemPrompt = createDeviceExtractionPrompt(availableDeviceNames);
            
            // Create user message
            String userMessage = "Query: " + query;
            
            log.debug("🔍 System prompt: {}", systemPrompt);
            log.debug("🔍 User message: {}", userMessage);
            
            // Prepare chat messages
            List<ChatRequestMessage> messages = Arrays.asList(
                new ChatRequestSystemMessage(systemPrompt),
                new ChatRequestUserMessage(userMessage)
            );
            
            // Create chat completion options
            ChatCompletionsOptions options = new ChatCompletionsOptions(messages)
                .setMaxTokens(maxCompletionTokens)
                .setTemperature(temperature);
            
            log.debug("🤖 Calling Azure OpenAI for device name and plain query extraction");
            
            // Call Azure OpenAI
            ChatCompletions chatCompletions = openAIClient.getChatCompletions(deploymentName, options);
            
            if (chatCompletions.getChoices() != null && !chatCompletions.getChoices().isEmpty()) {
                ChatChoice choice = chatCompletions.getChoices().get(0);
                ChatResponseMessage message = choice.getMessage();
                String aiResponse = message.getContent();
                
                log.debug("🔍 Raw AI response: '{}'", aiResponse);
                
                // Check if AI response is null
                if (aiResponse == null) {
                    log.warn("⚠️ AI response content is null - this might indicate an issue with the AI service or prompt");
                    return new DeviceExtractionResult(null, query);
                }
                
                // Extract device name and plain query from response
                DeviceExtractionResult result = extractDeviceNameAndPlainQueryFromResponse(aiResponse, query);
                
                log.info("✅ Device extraction completed - Device: '{}', Plain Query: '{}'", 
                    result.getDeviceName(), result.getPlainQuery());
                return result;
                
            } else {
                log.warn("⚠️ No response from Azure OpenAI for device extraction - choices is null or empty");
                return new DeviceExtractionResult(null, query);
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to extract device name and plain query from query: {}", query, e);
            return new DeviceExtractionResult(null, query);
        }
    }
    
    /**
     * Get available device names from the PDF table
     */
    private Set<String> getAvailableDeviceNames() {
        try {
            log.info("🔍 Fetching available device names from PDF table for organization: {}", defaultOrganizationId);
            
            // Get all PDFs for the organization
            List<UnifiedPDF> allPDFs = unifiedPDFService.getPDFsByOrganization(defaultOrganizationId);
            
            // Extract unique device names (filter out null/empty names)
            Set<String> deviceNames = allPDFs.stream()
                .map(UnifiedPDF::getDeviceName)
                .filter(deviceName -> deviceName != null && !deviceName.trim().isEmpty())
                .map(String::trim)
                .collect(Collectors.toSet());
            
            log.info("✅ Retrieved {} unique device names from PDF table: {}", deviceNames.size(), deviceNames);
            return deviceNames;
            
        } catch (Exception e) {
            log.error("❌ Failed to fetch device names from PDF table: {}", e.getMessage(), e);
            return Set.of(); // Return empty set on error
        }
    }

    /**
     * Create system prompt for device name and plain query extraction with available device names
     */
    private String createDeviceExtractionPrompt(Set<String> availableDeviceNames) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an AI assistant specialized in analyzing natural language queries about IoT devices.\n\n");
        prompt.append("Your task is to:\n");
        prompt.append("1. Identify the specific device name mentioned in the user's query\n");
        prompt.append("2. Extract the plain query (the actual question/request without the device name)\n\n");
        
        // Add available device names if any exist
        if (!availableDeviceNames.isEmpty()) {
            prompt.append("AVAILABLE DEVICE NAMES IN THE SYSTEM:\n");
            for (String deviceName : availableDeviceNames) {
                prompt.append("- ").append(deviceName).append("\n");
            }
            prompt.append("\n");
            prompt.append("IMPORTANT: Only extract device names that are in the above list. If the query mentions a device not in this list, set device_name to 'null'.\n\n");
        } else {
            prompt.append("NOTE: No device names are currently available in the system.\n\n");
        }
        
        prompt.append("Rules:\n");
        prompt.append("1. Look for device names, model numbers, or equipment names\n");
        prompt.append("2. Device names are typically proper nouns or specific model identifiers\n");
        prompt.append("3. If no specific device is mentioned, set device_name to 'null'\n");
        prompt.append("4. If multiple devices are mentioned, use the primary device\n");
        prompt.append("5. The plain_query should be the actual question/request without the device name\n");
        prompt.append("6. Match the device name exactly as it appears in the available list above\n\n");
        
        prompt.append("Examples:\n");
        if (!availableDeviceNames.isEmpty()) {
            String firstDevice = availableDeviceNames.iterator().next();
            prompt.append("- \"What is the maintenance schedule for ").append(firstDevice).append("?\"\n");
            prompt.append("  → device_name: \"").append(firstDevice).append("\", plain_query: \"What is the maintenance schedule?\"\n\n");
        } else {
            prompt.append("- \"What is the maintenance schedule for Rondo s-4000?\"\n");
            prompt.append("  → device_name: \"Rondo s-4000\", plain_query: \"What is the maintenance schedule?\"\n\n");
        }
        prompt.append("- \"How do I operate the conveyor belt?\"\n");
        prompt.append("  → device_name: \"conveyor belt\", plain_query: \"How do I operate?\"\n\n");
        prompt.append("- \"What are the general maintenance tips?\"\n");
        prompt.append("  → device_name: \"null\", plain_query: \"What are the general maintenance tips?\"\n\n");
        prompt.append("- \"Tell me about device status\"\n");
        prompt.append("  → device_name: \"null\", plain_query: \"Tell me about device status\"\n\n");
        
        prompt.append("Respond in JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"device_name\": \"device name or null\",\n");
        prompt.append("  \"plain_query\": \"the plain question/request\"\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }
    
    /**
     * Extract device name from AI response
     */
    private String extractDeviceNameFromResponse(String aiResponse) {
        try {
            // Check if response is null or empty
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                log.warn("⚠️ AI response is null or empty");
                return null;
            }
            
            // Clean the response
            String cleanedResponse = aiResponse.trim();
            
            // Check if response is "null" or indicates no device found
            if (cleanedResponse.equalsIgnoreCase("null") || 
                cleanedResponse.equalsIgnoreCase("none") ||
                cleanedResponse.equalsIgnoreCase("no device") ||
                cleanedResponse.isEmpty()) {
                return null;
            }
            
            // Remove any quotes if present
            if (cleanedResponse.startsWith("\"") && cleanedResponse.endsWith("\"")) {
                cleanedResponse = cleanedResponse.substring(1, cleanedResponse.length() - 1);
            }
            
            // Return the cleaned device name
            return cleanedResponse.trim();
            
        } catch (Exception e) {
            log.warn("⚠️ Failed to parse device name from AI response: {}", aiResponse, e);
            return null;
        }
    }


    /**
     * Extract device name and plain query from AI response
     */
    private DeviceExtractionResult extractDeviceNameAndPlainQueryFromResponse(String aiResponse, String originalQuery) {
        try {
            // Check if response is null or empty
            if (aiResponse == null || aiResponse.trim().isEmpty()) {
                log.warn("⚠️ AI response is null or empty");
                return new DeviceExtractionResult(null, originalQuery);
            }
            
            // Clean the response
            String cleanedResponse = aiResponse.trim();
            
            // Try to parse as JSON
            try {
                JsonNode jsonNode = objectMapper.readTree(cleanedResponse);
                
                String deviceName = null;
                String plainQuery = originalQuery; // Default to original query
                
                if (jsonNode.has("device_name")) {
                    String deviceNameValue = jsonNode.get("device_name").asText();
                    if (!deviceNameValue.equals("null") && !deviceNameValue.trim().isEmpty()) {
                        deviceName = deviceNameValue.trim();
                    }
                }
                
                if (jsonNode.has("plain_query")) {
                    String plainQueryValue = jsonNode.get("plain_query").asText();
                    if (!plainQueryValue.trim().isEmpty()) {
                        plainQuery = plainQueryValue.trim();
                    }
                }
                
                return new DeviceExtractionResult(deviceName, plainQuery);
                
            } catch (Exception jsonException) {
                log.warn("⚠️ Failed to parse JSON response, falling back to simple extraction: {}", jsonException.getMessage());
                
                // Fallback: try to extract device name using the old method
                String deviceName = extractDeviceNameFromResponse(cleanedResponse);
                return new DeviceExtractionResult(deviceName, originalQuery);
            }
            
        } catch (Exception e) {
            log.warn("⚠️ Failed to parse device extraction from AI response: {}", aiResponse, e);
            return new DeviceExtractionResult(null, originalQuery);
        }
    }

    /**
     * Result class for device name and plain query extraction
     */
    public static class DeviceExtractionResult {
        private final String deviceName;
        private final String plainQuery;

        public DeviceExtractionResult(String deviceName, String plainQuery) {
            this.deviceName = deviceName;
            this.plainQuery = plainQuery;
        }

        public String getDeviceName() {
            return deviceName;
        }

        public String getPlainQuery() {
            return plainQuery;
        }

        @Override
        public String toString() {
            return "DeviceExtractionResult{" +
                    "deviceName='" + deviceName + '\'' +
                    ", plainQuery='" + plainQuery + '\'' +
                    '}';
        }
    }
}
