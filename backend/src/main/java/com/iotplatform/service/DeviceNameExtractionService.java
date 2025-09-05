package com.iotplatform.service;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.ai.openai.models.*;
import com.azure.core.credential.AzureKeyCredential;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;

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
                    .serviceVersion(OpenAIServiceVersion.V2024_12_01_PREVIEW)
                    .buildClient();
                log.info("✅ Azure OpenAI client initialized successfully with API version 2024-12-01-preview");
            } catch (Exception e) {
                log.error("❌ Failed to initialize Azure OpenAI client", e);
                throw new RuntimeException("Failed to initialize OpenAI client", e);
            }
        }
    }

    /**
     * Extract device name from a natural language query
     * 
     * @param query The natural language query
     * @return The extracted device name or null if not found
     */
    public String extractDeviceName(String query) {
        log.info("🔍 Extracting device name from query: {}", query);
        
        try {
            initializeClient();
            
            // Create system prompt for device name extraction
            String systemPrompt = createDeviceExtractionPrompt();
            
            // Create user message
            String userMessage = "Query: " + query;
            
            // Prepare chat messages
            List<ChatRequestMessage> messages = Arrays.asList(
                new ChatRequestSystemMessage(systemPrompt),
                new ChatRequestUserMessage(userMessage)
            );
            
            // Create chat completion options
            ChatCompletionsOptions options = new ChatCompletionsOptions(messages)
                .setMaxTokens(maxCompletionTokens)
                .setTemperature(temperature);
            
            log.debug("🤖 Calling Azure OpenAI for device name extraction");
            
            // Call Azure OpenAI
            ChatCompletions chatCompletions = openAIClient.getChatCompletions(deploymentName, options);
            
            if (chatCompletions.getChoices() != null && !chatCompletions.getChoices().isEmpty()) {
                ChatChoice choice = chatCompletions.getChoices().get(0);
                ChatResponseMessage message = choice.getMessage();
                String aiResponse = message.getContent();
                
                // Extract device name from response
                String deviceName = extractDeviceNameFromResponse(aiResponse);
                
                log.info("✅ Device name extracted successfully: '{}' from query: '{}'", deviceName, query);
                return deviceName;
                
            } else {
                log.warn("⚠️ No response from Azure OpenAI for device name extraction");
                return null;
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to extract device name from query: {}", query, e);
            return null;
        }
    }
    
    /**
     * Create system prompt for device name extraction
     */
    private String createDeviceExtractionPrompt() {
        return """
            You are an AI assistant specialized in extracting device names from natural language queries about IoT devices.
            
            Your task is to identify the specific device name mentioned in the user's query.
            
            Rules:
            1. Look for device names, model numbers, or equipment names
            2. Device names are typically proper nouns or specific model identifiers
            3. Common patterns: "Rondo s-40", "Conveyor Belt System", "Temperature Sensor 1", "Pump Station A"
            4. If no specific device is mentioned, return "null"
            5. If multiple devices are mentioned, return the primary device
            6. Return only the device name, nothing else
            
            Examples:
            - "What is the maintenance schedule for Rondo s-40?" → "Rondo s-40"
            - "How do I operate the conveyor belt?" → "conveyor belt"
            - "Show me safety procedures for Temperature Sensor 1" → "Temperature Sensor 1"
            - "What are the general maintenance tips?" → "null"
            - "Tell me about device status" → "null"
            
            Respond with only the device name or "null" if no device is specified.
            """;
    }
    
    /**
     * Extract device name from AI response
     */
    private String extractDeviceNameFromResponse(String aiResponse) {
        try {
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
}
