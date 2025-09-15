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
 * Service for polishing prompts using Mistral model via Azure OpenAI before sending to Slack
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@Slf4j
public class LLMPromptService {

    @Value("${azure.openai.endpoint}")
    private String endpoint;

    @Value("${azure.openai.api-key}")
    private String apiKey;

    @Value("${azure.openai.deployment-name}")
    private String deploymentName;

    @Value("${azure.openai.model}")
    private String model;

    @Value("${azure.openai.max-completion-tokens:1000}")
    private int maxCompletionTokens;

    @Value("${azure.openai.temperature:0.7}")
    private double temperature;

    private OpenAIClient openAIClient;
    private final ObjectMapper objectMapper;

    public LLMPromptService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Initialize the OpenAI client
     */
    private void initializeClient() {
        if (openAIClient == null) {
            try {
                // Check if API key is configured
                if (apiKey == null || apiKey.trim().isEmpty()) {
                    log.warn("⚠️ Azure OpenAI API key is not configured. Message polishing will be skipped.");
                    return; // Don't initialize client, but don't throw exception
                }
                
                openAIClient = new OpenAIClientBuilder()
                    .credential(new AzureKeyCredential(apiKey))
                    .endpoint(endpoint)
                    .buildClient();
                log.info("✅ Azure OpenAI client initialized successfully");
            } catch (Exception e) {
                log.error("❌ Failed to initialize Azure OpenAI client", e);
                log.warn("⚠️ Message polishing will be disabled due to Azure OpenAI client initialization failure");
                // Don't throw exception, just log and continue without polishing
            }
        }
    }

    /**
     * Polish a notification message for Slack using Azure OpenAI
     * 
     * @param originalMessage The original notification message
     * @param category The notification category for context
     * @return Polished message optimized for Slack
     */
    public String polishMessageForSlack(String originalMessage, String category) {
        try {
            initializeClient();
            
            // If client is not initialized (due to missing API key), return original message
            if (openAIClient == null) {
                log.info("🤖 Azure OpenAI client not available, returning original message - Category: {}, Original Length: {}", 
                    category, originalMessage.length());
                return originalMessage;
            }

            // Create system message with instructions for polishing
            String systemPrompt = createSystemPrompt(category);
            
            // Create user message with the original notification
            String userPrompt = String.format("Please polish this notification message for Slack: %s", originalMessage);

            List<ChatRequestMessage> chatMessages = Arrays.asList(
                new ChatRequestSystemMessage(systemPrompt),
                new ChatRequestUserMessage(userPrompt)
            );

            ChatCompletionsOptions options = new ChatCompletionsOptions(chatMessages);
            options.setMaxTokens(maxCompletionTokens);
            options.setTemperature(temperature);

            log.info("🤖 Sending prompt to Azure OpenAI for polishing - Category: {}, Original Length: {}, Deployment: {}", 
                category, originalMessage.length(), deploymentName);

            ChatCompletions chatCompletions = openAIClient.getChatCompletions(deploymentName, options);

            if (chatCompletions.getChoices() != null && !chatCompletions.getChoices().isEmpty()) {
                ChatChoice choice = chatCompletions.getChoices().get(0);
                ChatResponseMessage message = choice.getMessage();
                String aiResponse = message.getContent();

                // Try to parse the JSON response and extract the message
                String polishedMessage = extractMessageFromJsonResponse(aiResponse, originalMessage);

                log.info("✅ Message polished successfully by Azure OpenAI - Category: {}, Original Length: {}, Polished Length: {}, Usage: {}", 
                    category, originalMessage.length(), polishedMessage.length(), chatCompletions.getUsage());

                return polishedMessage;
            } else {
                log.warn("⚠️ No response from Azure OpenAI, using original message");
                return originalMessage;
            }

        } catch (Exception e) {
            log.error("❌ Failed to polish message with Azure OpenAI", e);
            // Return original message if polishing fails
            return originalMessage;
        }
    }

    /**
     * Extract message from JSON response or return original message
     */
    private String extractMessageFromJsonResponse(String aiResponse, String originalMessage) {
        try {
            // Try to parse as JSON
            JsonNode jsonNode = objectMapper.readTree(aiResponse);
            
            // Check if it has the expected structure
            if (jsonNode.has("message")) {
                String message = jsonNode.get("message").asText();
                log.info("✅ Successfully extracted message from JSON response");
                return message;
            } else {
                log.warn("⚠️ JSON response doesn't contain 'message' field, using original message");
                return originalMessage;
            }
            
        } catch (Exception e) {
            // If JSON parsing fails, check if the response is already in the correct format
            if (aiResponse.contains("Send a message to Slack channel C092C9RHPKN with the text")) {
                log.info("✅ Response is already in correct format, using as-is");
                return aiResponse;
            } else {
                log.warn("⚠️ Failed to parse JSON response, using original message", e);
                return originalMessage;
            }
        }
    }

    /**
     * Create system prompt based on notification category
     */
    private String createSystemPrompt(String category) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an expert at crafting professional Slack messages for IoT device notifications. ");
        prompt.append("Your task is to format notification messages in the EXACT Slack message structure shown below. ");
        prompt.append("\n\n");
        
        prompt.append("CRITICAL: You must format the response as a JSON object with this EXACT structure:\n");
        prompt.append("{\n");
        prompt.append("  \"message\": \"Send a message to Slack channel C092C9RHPKN with the text '[YOUR_MESSAGE_HERE]'\"\n");
        prompt.append("}\n\n");
        
        prompt.append("The message text should follow this format:\n");
        prompt.append("'[EMOJI] [Category] Alert: [Brief description]. [Action required]. Please review the details below and take appropriate action.'\n\n");
        
        prompt.append("Then include detailed blocks structure:\n");
        prompt.append("1. Header block: '[EMOJI] [Alert Title]'\n");
        prompt.append("2. Section block with fields:\n");
        prompt.append("   - Device ID: [device_id]\n");
        prompt.append("   - Severity: [High/Medium/Low] [emoji]\n");
        prompt.append("   - Category: [category]\n");
        prompt.append("   - Status: [status]\n");
        prompt.append("   - Assigned To: [user_name]\n");
        prompt.append("   - Timestamp: [timestamp]\n");
        prompt.append("3. Section block with description\n");
        prompt.append("4. Divider block\n");
        prompt.append("5. Actions block with relevant buttons\n\n");
        
        // Add category-specific instructions
        switch (category.toUpperCase()) {
            case "DEVICE_ASSIGNMENT":
                prompt.append("For DEVICE_ASSIGNMENT:\n");
                prompt.append("- Use 📱 emoji\n");
                prompt.append("- Buttons: 'Accept Assignment' (primary), 'Request Change' (default), 'View Details' (default)\n");
                prompt.append("- Emphasize new responsibility and device details\n");
                break;
            case "MAINTENANCE_ASSIGNMENT":
                prompt.append("For MAINTENANCE_ASSIGNMENT:\n");
                prompt.append("- Use 🔧 emoji\n");
                prompt.append("- Buttons: 'Start Maintenance' (primary), 'Reschedule' (default), 'Mark Complete' (default)\n");
                prompt.append("- Highlight urgency, due dates, and safety considerations\n");
                break;
            case "RULE_TRIGGERED":
                prompt.append("For RULE_TRIGGERED:\n");
                prompt.append("- Use 📋 emoji\n");
                prompt.append("- Buttons: 'Acknowledge' (primary), 'Investigate' (default), 'Resolve' (default)\n");
                prompt.append("- Explain what happened and what action is needed\n");
                break;
            case "SAFETY_ALERT":
                prompt.append("For SAFETY_ALERT:\n");
                prompt.append("- Use ⚠️ emoji\n");
                prompt.append("- Buttons: 'Acknowledge' (primary), 'Escalate' (danger), 'Mark Safe' (default)\n");
                prompt.append("- Use urgent tone and emphasize immediate action required\n");
                break;
            case "SYSTEM_UPDATE":
                prompt.append("For SYSTEM_UPDATE:\n");
                prompt.append("- Use 🚨 emoji\n");
                prompt.append("- Buttons: 'Apply Update' (primary), 'Schedule Later' (default), 'View Details' (default)\n");
                prompt.append("- Explain benefits and any required actions\n");
                break;
            case "DEVICE_OFFLINE":
                prompt.append("For DEVICE_OFFLINE:\n");
                prompt.append("- Use 📊 emoji\n");
                prompt.append("- Buttons: 'Investigate' (primary), 'Restart Device' (default), 'Escalate' (danger)\n");
                prompt.append("- Indicate urgency and troubleshooting steps\n");
                break;
            default:
                prompt.append("For DEFAULT:\n");
                prompt.append("- Use 🔔 emoji\n");
                prompt.append("- Buttons: 'Acknowledge' (primary), 'View Details' (default), 'Assign to Me' (default)\n");
                prompt.append("- Ensure clarity and appropriate urgency level\n");
                break;
        }
        
        prompt.append("\nIMPORTANT: Return ONLY the JSON object with the exact structure shown above. ");
        prompt.append("Do not include any additional text, explanations, or formatting outside the JSON structure.");
        
        return prompt.toString();
    }

    /**
     * Test the Azure OpenAI connection
     */
    public boolean testConnection() {
        try {
            initializeClient();
            
            List<ChatRequestMessage> testMessages = Arrays.asList(
                new ChatRequestSystemMessage("You are a helpful assistant."),
                new ChatRequestUserMessage("Hello, please respond with 'Connection successful' to test the API.")
            );

            ChatCompletionsOptions options = new ChatCompletionsOptions(testMessages);
            options.setMaxTokens(50);

            ChatCompletions response = openAIClient.getChatCompletions(deploymentName, options);
            
            if (response.getChoices() != null && !response.getChoices().isEmpty()) {
                log.info("✅ Azure OpenAI connection test successful");
                return true;
            } else {
                log.warn("⚠️ Azure OpenAI connection test failed - no response");
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ Azure OpenAI connection test failed", e);
            return false;
        }
    }
}
