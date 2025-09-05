package com.iotplatform.service;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.ai.openai.models.*;
import com.azure.core.credential.AzureKeyCredential;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

/**
 * Service for converting natural language queries to SQL using Azure OpenAI
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NLPSQLQueryService {

    private final DatabaseSchemaService schemaService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${azure.openai.endpoint}")
    private String endpoint;

    @Value("${azure.openai.api-key}")
    private String apiKey;

    @Value("${azure.openai.deployment-name}")
    private String deploymentName;

    @Value("${azure.openai.model}")
    private String model;

    @Value("${azure.openai.max-completion-tokens:2000}")
    private int maxCompletionTokens;

    @Value("${azure.openai.temperature:0.1}")
    private double temperature;

    private OpenAIClient openAIClient;

    // SQL injection prevention patterns
    private static final Pattern DANGEROUS_PATTERNS = Pattern.compile(
        "(?i)(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE|UNION|SCRIPT)"
    );

    /**
     * Initialize the OpenAI client
     */
    private void initializeClient() {
        if (openAIClient == null) {
            try {
                openAIClient = new OpenAIClientBuilder()
                    .credential(new AzureKeyCredential(apiKey))
                    .endpoint(endpoint)
                    .buildClient();
                log.info("✅ Azure OpenAI client initialized for NLP-to-SQL");
            } catch (Exception e) {
                log.error("❌ Failed to initialize Azure OpenAI client for NLP-to-SQL", e);
                throw new RuntimeException("Failed to initialize Azure OpenAI client", e);
            }
        }
    }

    /**
     * Convert natural language query to SQL
     */
    public NLPSQLResponse convertToSQL(String naturalLanguageQuery, String organizationId) {
        try {
            initializeClient();

            // Get database schema
            String schema = schemaService.getDatabaseSchema();
            Map<String, String> tableSchemas = schemaService.getTableSchemas();
            List<String> examples = schemaService.getQueryExamples();
            Map<String, List<String>> fieldMappings = schemaService.getFieldMappings();

            // Create system prompt for SQL generation
            String systemPrompt = createSQLSystemPrompt(schema, tableSchemas, examples, fieldMappings, organizationId);
            
            // Create user prompt with the natural language query
            String userPrompt = String.format("Convert this natural language query to SQL: %s", naturalLanguageQuery);

            List<ChatRequestMessage> chatMessages = Arrays.asList(
                new ChatRequestSystemMessage(systemPrompt),
                new ChatRequestUserMessage(userPrompt)
            );

            ChatCompletionsOptions options = new ChatCompletionsOptions(chatMessages);
            options.setMaxTokens(maxCompletionTokens);
            options.setTemperature(temperature);

            log.info("🤖 Converting natural language to SQL - Query: {}", naturalLanguageQuery);

            ChatCompletions chatCompletions = openAIClient.getChatCompletions(deploymentName, options);

            if (chatCompletions.getChoices() != null && !chatCompletions.getChoices().isEmpty()) {
                ChatChoice choice = chatCompletions.getChoices().get(0);
                ChatResponseMessage message = choice.getMessage();
                String aiResponse = message.getContent();

                // Extract SQL from response
                String sqlQuery = extractSQLFromResponse(aiResponse);
                
                // Validate SQL query
                if (isValidSQL(sqlQuery)) {
                    log.info("✅ Successfully converted natural language to SQL");
                    return NLPSQLResponse.builder()
                        .success(true)
                        .originalQuery(naturalLanguageQuery)
                        .sqlQuery(sqlQuery)
                        .explanation(extractExplanationFromResponse(aiResponse))
                        .build();
                } else {
                    log.warn("⚠️ Generated SQL query failed validation");
                    return NLPSQLResponse.builder()
                        .success(false)
                        .originalQuery(naturalLanguageQuery)
                        .error("Generated SQL query failed validation")
                        .build();
                }
            } else {
                log.warn("⚠️ No response from Azure OpenAI for SQL conversion");
                return NLPSQLResponse.builder()
                    .success(false)
                    .originalQuery(naturalLanguageQuery)
                    .error("No response from AI service")
                    .build();
            }

        } catch (Exception e) {
            log.error("❌ Failed to convert natural language to SQL", e);
            return NLPSQLResponse.builder()
                .success(false)
                .originalQuery(naturalLanguageQuery)
                .error("Failed to convert query: " + e.getMessage())
                .build();
        }
    }

    /**
     * Execute SQL query and return results
     */
    public NLPSQLExecutionResult executeSQL(String sqlQuery, String organizationId) {
        try {
            // Additional security check
            if (!isValidSQL(sqlQuery)) {
                throw new SecurityException("Invalid or potentially dangerous SQL query");
            }

            // Add organization filter to ensure data isolation
            String securedQuery = addOrganizationFilter(sqlQuery, organizationId);

            log.info("🔍 Executing SQL query: {}", securedQuery);

            // Execute query
            List<Map<String, Object>> results = jdbcTemplate.queryForList(securedQuery);

            log.info("✅ SQL query executed successfully - {} rows returned", results.size());

            return NLPSQLExecutionResult.builder()
                .success(true)
                .sqlQuery(securedQuery)
                .results(results)
                .rowCount(results.size())
                .build();

        } catch (Exception e) {
            log.error("❌ Failed to execute SQL query", e);
            return NLPSQLExecutionResult.builder()
                .success(false)
                .sqlQuery(sqlQuery)
                .error("Failed to execute query: " + e.getMessage())
                .build();
        }
    }

    /**
     * Complete NLP-to-SQL workflow
     */
    public NLPSQLWorkflowResult processQuery(String naturalLanguageQuery, String organizationId) {
        try {
            // Step 1: Convert natural language to SQL
            NLPSQLResponse sqlResponse = convertToSQL(naturalLanguageQuery, organizationId);
            
            if (!sqlResponse.isSuccess()) {
                return NLPSQLWorkflowResult.builder()
                    .success(false)
                    .originalQuery(naturalLanguageQuery)
                    .error(sqlResponse.getError())
                    .build();
            }

            // Step 2: Execute SQL query
            NLPSQLExecutionResult executionResult = executeSQL(sqlResponse.getSqlQuery(), organizationId);
            
            if (!executionResult.isSuccess()) {
                return NLPSQLWorkflowResult.builder()
                    .success(false)
                    .originalQuery(naturalLanguageQuery)
                    .sqlQuery(sqlResponse.getSqlQuery())
                    .error(executionResult.getError())
                    .build();
            }

            // Step 3: Format results for natural language response
            String naturalLanguageResponse = formatResultsAsNaturalLanguage(
                naturalLanguageQuery, 
                executionResult.getResults(),
                sqlResponse.getExplanation()
            );

            return NLPSQLWorkflowResult.builder()
                .success(true)
                .originalQuery(naturalLanguageQuery)
                .sqlQuery(sqlResponse.getSqlQuery())
                .explanation(sqlResponse.getExplanation())
                .results(executionResult.getResults())
                .rowCount(executionResult.getRowCount())
                .naturalLanguageResponse(naturalLanguageResponse)
                .build();

        } catch (Exception e) {
            log.error("❌ Failed to process NLP-to-SQL query", e);
            return NLPSQLWorkflowResult.builder()
                .success(false)
                .originalQuery(naturalLanguageQuery)
                .error("Failed to process query: " + e.getMessage())
                .build();
        }
    }

    /**
     * Create system prompt for SQL generation
     */
    private String createSQLSystemPrompt(String schema, Map<String, String> tableSchemas, 
                                       List<String> examples, Map<String, List<String>> fieldMappings, 
                                       String organizationId) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("You are an expert SQL query generator for an IoT platform database. ");
        prompt.append("Your task is to convert natural language queries into safe, efficient SQL queries.\n\n");
        
        prompt.append("DATABASE SCHEMA:\n");
        prompt.append(schema);
        prompt.append("\n\n");
        
        prompt.append("TABLE DESCRIPTIONS:\n");
        for (Map.Entry<String, String> entry : tableSchemas.entrySet()) {
            prompt.append("- ").append(entry.getKey()).append(": ").append(entry.getValue()).append("\n");
        }
        prompt.append("\n");
        
        prompt.append("QUERY EXAMPLES:\n");
        for (int i = 0; i < Math.min(examples.size(), 10); i++) {
            prompt.append((i + 1)).append(". ").append(examples.get(i)).append("\n");
        }
        prompt.append("\n");
        
        prompt.append("FIELD MAPPINGS (natural language to database fields):\n");
        for (Map.Entry<String, List<String>> entry : fieldMappings.entrySet()) {
            prompt.append("- ").append(entry.getKey()).append(": ").append(String.join(", ", entry.getValue())).append("\n");
        }
        prompt.append("\n");
        
        prompt.append("IMPORTANT RULES:\n");
        prompt.append("1. ALWAYS use SELECT queries only - NO INSERT, UPDATE, DELETE, DROP, etc.\n");
        prompt.append("2. ALWAYS filter by organization_id = '").append(organizationId).append("' for data isolation\n");
        prompt.append("3. Use proper JOINs when querying related tables\n");
        prompt.append("4. Include relevant fields in SELECT clause\n");
        prompt.append("5. Use appropriate WHERE clauses for filtering\n");
        prompt.append("6. Use ORDER BY for sorting when relevant\n");
        prompt.append("7. Use LIMIT for large result sets (max 100 rows)\n");
        prompt.append("8. Handle date/time queries properly\n");
        prompt.append("9. Use LIKE for text searches\n");
        prompt.append("10. Return only the SQL query, no explanations\n\n");
        
        prompt.append("RESPONSE FORMAT:\n");
        prompt.append("Return ONLY the SQL query in this format:\n");
        prompt.append("```sql\n");
        prompt.append("SELECT ... FROM ... WHERE ...\n");
        prompt.append("```\n");
        
        return prompt.toString();
    }

    /**
     * Extract SQL query from AI response
     */
    private String extractSQLFromResponse(String response) {
        // Look for SQL code blocks
        if (response.contains("```sql")) {
            int start = response.indexOf("```sql") + 6;
            int end = response.indexOf("```", start);
            if (end > start) {
                return response.substring(start, end).trim();
            }
        }
        
        // Look for SQL code blocks without language specification
        if (response.contains("```")) {
            int start = response.indexOf("```") + 3;
            int end = response.indexOf("```", start);
            if (end > start) {
                String sql = response.substring(start, end).trim();
                if (sql.toUpperCase().startsWith("SELECT")) {
                    return sql;
                }
            }
        }
        
        // Look for direct SQL query
        String[] lines = response.split("\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.toUpperCase().startsWith("SELECT")) {
                return trimmed;
            }
        }
        
        return response.trim();
    }

    /**
     * Extract explanation from AI response
     */
    private String extractExplanationFromResponse(String response) {
        // Simple extraction - look for text before SQL blocks
        if (response.contains("```")) {
            int end = response.indexOf("```");
            return response.substring(0, end).trim();
        }
        return "Query converted from natural language to SQL";
    }

    /**
     * Validate SQL query for security
     */
    private boolean isValidSQL(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            return false;
        }
        
        String upperSQL = sql.toUpperCase().trim();
        
        // Must start with SELECT
        if (!upperSQL.startsWith("SELECT")) {
            return false;
        }
        
        // Check for dangerous patterns
        if (DANGEROUS_PATTERNS.matcher(upperSQL).find()) {
            return false;
        }
        
        return true;
    }

    /**
     * Add organization filter to SQL query
     */
    private String addOrganizationFilter(String sql, String organizationId) {
        String upperSQL = sql.toUpperCase();
        
        // If query already has WHERE clause, add organization filter
        if (upperSQL.contains("WHERE")) {
            // Find the WHERE clause and add organization filter
            int whereIndex = upperSQL.indexOf("WHERE");
            String beforeWhere = sql.substring(0, whereIndex + 5);
            String afterWhere = sql.substring(whereIndex + 5);
            
            return beforeWhere + " organization_id = '" + organizationId + "' AND (" + afterWhere + ")";
        } else {
            // Add WHERE clause with organization filter
            return sql + " WHERE organization_id = '" + organizationId + "'";
        }
    }

    /**
     * Format query results as natural language response
     */
    private String formatResultsAsNaturalLanguage(String originalQuery, List<Map<String, Object>> results, String explanation) {
        if (results.isEmpty()) {
            return "No results found for your query: \"" + originalQuery + "\"";
        }
        
        StringBuilder response = new StringBuilder();
        response.append("Here are the results for your query: \"").append(originalQuery).append("\"\n\n");
        
        if (results.size() == 1) {
            response.append("Found 1 result:\n");
        } else {
            response.append("Found ").append(results.size()).append(" results:\n");
        }
        
        // Format first few results
        int maxResults = Math.min(results.size(), 5);
        for (int i = 0; i < maxResults; i++) {
            Map<String, Object> row = results.get(i);
            response.append("\n").append(i + 1).append(". ");
            
            // Format key-value pairs
            List<String> keyValues = new ArrayList<>();
            for (Map.Entry<String, Object> entry : row.entrySet()) {
                if (entry.getValue() != null) {
                    keyValues.add(entry.getKey() + ": " + entry.getValue());
                }
            }
            response.append(String.join(", ", keyValues));
        }
        
        if (results.size() > 5) {
            response.append("\n\n... and ").append(results.size() - 5).append(" more results.");
        }
        
        return response.toString();
    }

    // Response classes
    @lombok.Data
    @lombok.Builder
    public static class NLPSQLResponse {
        private boolean success;
        private String originalQuery;
        private String sqlQuery;
        private String explanation;
        private String error;
    }

    @lombok.Data
    @lombok.Builder
    public static class NLPSQLExecutionResult {
        private boolean success;
        private String sqlQuery;
        private List<Map<String, Object>> results;
        private int rowCount;
        private String error;
    }

    @lombok.Data
    @lombok.Builder
    public static class NLPSQLWorkflowResult {
        private boolean success;
        private String originalQuery;
        private String sqlQuery;
        private String explanation;
        private List<Map<String, Object>> results;
        private int rowCount;
        private String naturalLanguageResponse;
        private String error;
    }
}
