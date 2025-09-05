package com.iotplatform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Service to route queries between PDF documents and database using NLP-to-SQL
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UnifiedQueryService {

    private final NLPSQLQueryService nlpSQLQueryService;
    private final PDFProcessingService pdfProcessingService;
    private final DatabaseSchemaService schemaService;
    private final LLMPromptService llmPromptService;

    /**
     * Process unified query - use LLM to decide routing
     */
    public UnifiedQueryResult processQuery(String query, String organizationId, String userId) {
        try {
            log.info("🔍 Processing unified query: {}", query);

            // Use LLM to analyze query intent and decide routing
            QueryDecision decision = analyzeQueryWithLLM(query);
            
            UnifiedQueryResult result = UnifiedQueryResult.builder()
                .originalQuery(query)
                .organizationId(organizationId)
                .userId(userId)
                .build();

            switch (decision.getAction()) {
                case DATABASE_QUERY:
                    return processDatabaseQuery(query, organizationId, result);
                    
                case PDF_QUERY:
                    return processPDFQuery(query, organizationId, userId, result);
                    
                case LLM_ANSWER:
                    return processLLMAnswer(query, decision, result);
                    
                case MIXED_QUERY:
                    return processMixedQuery(query, organizationId, userId, result);
                    
                case UNKNOWN:
                default:
                    return processUnknownQuery(query, organizationId, userId, result);
            }

        } catch (Exception e) {
            log.error("❌ Failed to process unified query", e);
            return UnifiedQueryResult.builder()
                .originalQuery(query)
                .success(false)
                .error("Failed to process query: " + e.getMessage())
                .build();
        }
    }

    /**
     * Use LLM to analyze query and decide routing
     */
    private QueryDecision analyzeQueryWithLLM(String query) {
        try {
            log.info("🤖 Using LLM to analyze query intent: {}", query);
            
            // Create system prompt for query analysis
            String systemPrompt = createQueryAnalysisPrompt();
            
            // Create user prompt with the query
            String userPrompt = String.format("Analyze this query and decide how to handle it: %s", query);
            
            // Get LLM response
            String llmResponse = llmPromptService.polishMessageForSlack(userPrompt, "QUERY_ANALYSIS");
            
            // Parse LLM response to get decision
            return parseQueryDecision(llmResponse, query);
            
        } catch (Exception e) {
            log.error("❌ Failed to analyze query with LLM", e);
            // Fallback to simple keyword-based analysis
            return analyzeQueryWithKeywords(query);
        }
    }
    
    /**
     * Fallback query analysis using keywords when LLM is not available
     */
    private QueryDecision analyzeQueryWithKeywords(String query) {
        String lowerQuery = query.toLowerCase();
        
        // Database-related keywords
        if (lowerQuery.contains("device") || lowerQuery.contains("user") || lowerQuery.contains("maintenance") || 
            lowerQuery.contains("status") || lowerQuery.contains("location") || lowerQuery.contains("assigned") ||
            lowerQuery.contains("count") || lowerQuery.contains("list") || lowerQuery.contains("show") ||
            lowerQuery.contains("find") || lowerQuery.contains("get") || lowerQuery.contains("how many")) {
            return QueryDecision.builder()
                .action(QueryAction.DATABASE_QUERY)
                .confidence(0.8)
                .reasoning("Keyword analysis suggests database query")
                .build();
        }
        
        // PDF-related keywords
        if (lowerQuery.contains("document") || lowerQuery.contains("pdf") || lowerQuery.contains("manual") ||
            lowerQuery.contains("guide") || lowerQuery.contains("instruction") || lowerQuery.contains("procedure")) {
            return QueryDecision.builder()
                .action(QueryAction.PDF_QUERY)
                .confidence(0.8)
                .reasoning("Keyword analysis suggests PDF query")
                .build();
        }
        
        // Default to database query
        return QueryDecision.builder()
            .action(QueryAction.DATABASE_QUERY)
            .confidence(0.5)
            .reasoning("Default fallback to database query")
            .build();
    }

    /**
     * Create system prompt for query analysis
     */
    private String createQueryAnalysisPrompt() {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an intelligent query analyzer for an IoT platform. ");
        prompt.append("Your task is to analyze user queries and decide the best way to handle them.\n\n");
        
        prompt.append("Available actions:\n");
        prompt.append("1. DATABASE_QUERY - Query requires database information (devices, users, maintenance, etc.)\n");
        prompt.append("2. PDF_QUERY - Query requires PDF document information (manuals, guides, procedures)\n");
        prompt.append("3. LLM_ANSWER - Query can be answered directly by AI without database/PDF lookup\n");
        prompt.append("4. MIXED_QUERY - Query requires both database and PDF information\n");
        prompt.append("5. UNKNOWN - Query is unclear or cannot be handled\n\n");
        
        prompt.append("Database information includes:\n");
        prompt.append("- Device status, location, type, assignments\n");
        prompt.append("- User information, roles, assignments\n");
        prompt.append("- Maintenance tasks, schedules, priorities\n");
        prompt.append("- Rules, notifications, safety precautions\n");
        prompt.append("- System statistics and counts\n\n");
        
        prompt.append("PDF information includes:\n");
        prompt.append("- Device setup and installation guides\n");
        prompt.append("- Troubleshooting procedures\n");
        prompt.append("- Maintenance instructions\n");
        prompt.append("- Safety procedures and precautions\n");
        prompt.append("- Technical specifications\n\n");
        
        prompt.append("LLM can answer directly:\n");
        prompt.append("- General IoT concepts and explanations\n");
        prompt.append("- How-to questions about IoT principles\n");
        prompt.append("- Definitions and explanations\n");
        prompt.append("- General advice and recommendations\n\n");
        
        prompt.append("Response format (JSON only):\n");
        prompt.append("{\n");
        prompt.append("  \"action\": \"DATABASE_QUERY|PDF_QUERY|LLM_ANSWER|MIXED_QUERY|UNKNOWN\",\n");
        prompt.append("  \"confidence\": 0.0-1.0,\n");
        prompt.append("  \"reasoning\": \"Brief explanation of decision\",\n");
        prompt.append("  \"answer\": \"Direct answer if action is LLM_ANSWER, null otherwise\"\n");
        prompt.append("}\n");
        
        return prompt.toString();
    }

    /**
     * Parse LLM response to get query decision
     */
    private QueryDecision parseQueryDecision(String llmResponse, String originalQuery) {
        try {
            // Try to extract JSON from response
            String jsonResponse = extractJsonFromResponse(llmResponse);
            
            // Parse JSON response
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            java.util.Map<String, Object> decisionMap = mapper.readValue(jsonResponse, java.util.Map.class);
            
            String actionStr = (String) decisionMap.get("action");
            Double confidence = (Double) decisionMap.get("confidence");
            String reasoning = (String) decisionMap.get("reasoning");
            String answer = (String) decisionMap.get("answer");
            
            QueryAction action = QueryAction.valueOf(actionStr.toUpperCase());
            
            return QueryDecision.builder()
                .action(action)
                .confidence(confidence != null ? confidence : 0.8)
                .reasoning(reasoning != null ? reasoning : "LLM analysis")
                .directAnswer(answer)
                .build();
                
        } catch (Exception e) {
            log.warn("⚠️ Failed to parse LLM decision, defaulting to database query", e);
            return QueryDecision.builder()
                .action(QueryAction.DATABASE_QUERY)
                .confidence(0.5)
                .reasoning("Failed to parse LLM response, defaulting to database query")
                .build();
        }
    }

    /**
     * Extract JSON from LLM response
     */
    private String extractJsonFromResponse(String response) {
        // Look for JSON block
        if (response.contains("```json")) {
            int start = response.indexOf("```json") + 7;
            int end = response.indexOf("```", start);
            if (end > start) {
                return response.substring(start, end).trim();
            }
        }
        
        // Look for JSON object
        int start = response.indexOf("{");
        int end = response.lastIndexOf("}");
        if (start >= 0 && end > start) {
            return response.substring(start, end + 1);
        }
        
        return response.trim();
    }

    /**
     * Process LLM direct answer
     */
    private UnifiedQueryResult processLLMAnswer(String query, QueryDecision decision, UnifiedQueryResult result) {
        try {
            log.info("🤖 Processing LLM direct answer");
            
            String answer = decision.getDirectAnswer();
            if (answer == null || answer.trim().isEmpty()) {
                // If no direct answer provided, generate one
                answer = generateLLMAnswer(query);
            }
            
            result.setSuccess(true);
            result.setQueryType(QueryType.LLM_ANSWER);
            result.setResponse(answer);
            result.setProcessingTime(System.currentTimeMillis());
            
            log.info("✅ LLM direct answer processed successfully");
            
        } catch (Exception e) {
            log.error("❌ Failed to process LLM answer", e);
            result.setSuccess(false);
            result.setError("LLM answer processing failed: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Generate LLM answer for general queries
     */
    private String generateLLMAnswer(String query) {
        try {
            String systemPrompt = "You are a helpful IoT platform assistant. Answer the user's question directly and helpfully. " +
                                "Provide clear, concise, and accurate information about IoT concepts, device management, " +
                                "maintenance procedures, and general platform usage.";
            
            String userPrompt = String.format("Answer this question: %s", query);
            
            return llmPromptService.polishMessageForSlack(userPrompt, "GENERAL_ANSWER");
            
        } catch (Exception e) {
            log.error("❌ Failed to generate LLM answer", e);
            return "I apologize, but I'm having trouble generating a response right now. Please try rephrasing your question or ask about specific devices, maintenance tasks, or platform features.";
        }
    }

    /**
     * Process database query using NLP-to-SQL
     */
    private UnifiedQueryResult processDatabaseQuery(String query, String organizationId, UnifiedQueryResult result) {
        try {
            log.info("📊 Processing database query using NLP-to-SQL");
            
            // Use NLP-to-SQL service
            NLPSQLQueryService.NLPSQLWorkflowResult sqlResult = nlpSQLQueryService.processQuery(query, organizationId);
            
            if (sqlResult.isSuccess()) {
                result.setSuccess(true);
                result.setQueryType(QueryType.DATABASE);
                result.setDatabaseResults(sqlResult.getResults());
                result.setResponse(sqlResult.getNaturalLanguageResponse());
                result.setSqlQuery(sqlResult.getSqlQuery());
                result.setRowCount(sqlResult.getRowCount());
                result.setProcessingTime(System.currentTimeMillis());
                
                log.info("✅ Database query processed successfully - {} rows returned", sqlResult.getRowCount());
            } else {
                result.setSuccess(false);
                result.setError("Database query failed: " + sqlResult.getError());
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to process database query", e);
            result.setSuccess(false);
            result.setError("Database query processing failed: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Process PDF query using existing PDF service
     */
    private UnifiedQueryResult processPDFQuery(String query, String organizationId, String userId, UnifiedQueryResult result) {
        try {
            log.info("📄 Processing PDF query");
            
            // For PDF queries, we need to determine which PDF to query
            // This is a simplified approach - in practice, you might want to:
            // 1. Let user select PDF
            // 2. Use context from previous queries
            // 3. Use AI to determine most relevant PDF
            
            // For now, we'll return a response indicating PDF query capability
            result.setSuccess(true);
            result.setQueryType(QueryType.PDF);
            result.setResponse("I can help you search through PDF documents and manuals. " +
                             "Please select a specific document from the knowledge section, or ask me to " +
                             "search for information about device setup, maintenance procedures, troubleshooting, " +
                             "or any other documentation-related questions.");
            result.setProcessingTime(System.currentTimeMillis());
            
            log.info("✅ PDF query processed successfully");
            
        } catch (Exception e) {
            log.error("❌ Failed to process PDF query", e);
            result.setSuccess(false);
            result.setError("PDF query processing failed: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Process mixed query - try both approaches
     */
    private UnifiedQueryResult processMixedQuery(String query, String organizationId, String userId, UnifiedQueryResult result) {
        try {
            log.info("🔄 Processing mixed query - trying both database and PDF approaches");
            
            // Try database query first
            NLPSQLQueryService.NLPSQLWorkflowResult sqlResult = nlpSQLQueryService.processQuery(query, organizationId);
            
            StringBuilder response = new StringBuilder();
            boolean hasResults = false;
            
            if (sqlResult.isSuccess() && sqlResult.getRowCount() > 0) {
                response.append("📊 **Database Results:**\n");
                response.append(sqlResult.getNaturalLanguageResponse()).append("\n\n");
                result.setDatabaseResults(sqlResult.getResults());
                result.setSqlQuery(sqlResult.getSqlQuery());
                result.setRowCount(sqlResult.getRowCount());
                hasResults = true;
            }
            
            // Add PDF query suggestion
            response.append("📄 **Document Search:**\n");
            response.append("I can also search through PDF documents and manuals for additional information. ");
            response.append("Please select a specific document from the knowledge section for detailed documentation search.");
            
            result.setSuccess(true);
            result.setQueryType(QueryType.MIXED);
            result.setResponse(response.toString());
            result.setProcessingTime(System.currentTimeMillis());
            
            log.info("✅ Mixed query processed successfully");
            
        } catch (Exception e) {
            log.error("❌ Failed to process mixed query", e);
            result.setSuccess(false);
            result.setError("Mixed query processing failed: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Process unknown query - provide suggestions
     */
    private UnifiedQueryResult processUnknownQuery(String query, String organizationId, String userId, UnifiedQueryResult result) {
        try {
            log.info("❓ Processing unknown query - providing suggestions");
            
            // Get example queries
            List<String> examples = schemaService.getQueryExamples();
            List<String> pdfExamples = Arrays.asList(
                "How to setup this device?",
                "Troubleshooting guide for this machine",
                "Maintenance procedures",
                "Installation instructions",
                "Safety precautions"
            );
            
            StringBuilder response = new StringBuilder();
            response.append("I can help you with two types of queries:\n\n");
            
            response.append("📊 **Database Queries** - Ask about platform data:\n");
            for (int i = 0; i < Math.min(5, examples.size()); i++) {
                response.append("• ").append(examples.get(i)).append("\n");
            }
            
            response.append("\n📄 **Document Queries** - Ask about PDFs and manuals:\n");
            for (String example : pdfExamples) {
                response.append("• ").append(example).append("\n");
            }
            
            response.append("\nPlease rephrase your question to be more specific about what you're looking for.");
            
            result.setSuccess(true);
            result.setQueryType(QueryType.UNKNOWN);
            result.setResponse(response.toString());
            result.setProcessingTime(System.currentTimeMillis());
            
            log.info("✅ Unknown query processed with suggestions");
            
        } catch (Exception e) {
            log.error("❌ Failed to process unknown query", e);
            result.setSuccess(false);
            result.setError("Query processing failed: " + e.getMessage());
        }
        
        return result;
    }

    /**
     * Get query suggestions based on context
     */
    public List<String> getQuerySuggestions(String context) {
        List<String> suggestions = new ArrayList<>();
        
        // Database suggestions
        suggestions.addAll(Arrays.asList(
            "Show me all offline devices",
            "List maintenance tasks due this week",
            "Find devices assigned to me",
            "Show high priority maintenance tasks",
            "List devices by location"
        ));
        
        // PDF suggestions
        suggestions.addAll(Arrays.asList(
            "How to setup this device?",
            "Troubleshooting guide",
            "Maintenance procedures",
            "Safety precautions",
            "Installation instructions"
        ));
        
        return suggestions;
    }

    // Enums and classes
    public enum QueryType {
        DATABASE, PDF, MIXED, LLM_ANSWER, UNKNOWN
    }

    public enum QueryAction {
        DATABASE_QUERY, PDF_QUERY, LLM_ANSWER, MIXED_QUERY, UNKNOWN
    }

    @lombok.Data
    @lombok.Builder
    public static class QueryDecision {
        private QueryAction action;
        private double confidence;
        private String reasoning;
        private String directAnswer;
    }

    @lombok.Data
    @lombok.Builder
    public static class UnifiedQueryResult {
        private boolean success;
        private String originalQuery;
        private QueryType queryType;
        private String organizationId;
        private String userId;
        private String response;
        private String sqlQuery;
        private List<Map<String, Object>> databaseResults;
        private int rowCount;
        private long processingTime;
        private String error;
    }
}
