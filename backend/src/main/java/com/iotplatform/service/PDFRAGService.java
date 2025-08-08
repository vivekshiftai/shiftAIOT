package com.iotplatform.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class PDFRAGService {
    
    private static final Logger logger = LoggerFactory.getLogger(PDFRAGService.class);
    
    @Autowired
    private RestTemplate restTemplate;
    
    private final String RAG_SERVICE_URL = "http://localhost:8000";
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    /**
     * Upload PDF to RAG system
     */
    public Map<String, Object> uploadPDF(MultipartFile file, String deviceId) {
        try {
            String url = RAG_SERVICE_URL + "/upload-pdf";
            
            // Create headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            // Create body
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());
            if (deviceId != null) {
                body.add("device_id", deviceId);
            }
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, requestEntity, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode responseBody = response.getBody();
                Map<String, Object> result = new HashMap<>();
                result.put("success", responseBody.get("success").asBoolean());
                result.put("message", responseBody.get("message").asText());
                result.put("document_id", responseBody.has("document_id") ? responseBody.get("document_id").asText() : null);
                result.put("extracted_text_length", responseBody.has("extracted_text_length") ? responseBody.get("extracted_text_length").asInt() : 0);
                return result;
            } else {
                logger.error("Failed to upload PDF to RAG system");
                return createErrorResponse("Failed to upload PDF to RAG system");
            }
            
        } catch (Exception e) {
            logger.error("Error uploading PDF to RAG system", e);
            return createErrorResponse("Error uploading PDF: " + e.getMessage());
        }
    }
    
    /**
     * Query the RAG system
     */
    public Map<String, Object> queryRAG(String query, String deviceId, String context) {
        try {
            String url = RAG_SERVICE_URL + "/query";
            
            // Create request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("query", query);
            if (deviceId != null) {
                requestBody.put("device_id", deviceId);
            }
            if (context != null) {
                requestBody.put("context", context);
            }
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, requestEntity, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode responseBody = response.getBody();
                Map<String, Object> result = new HashMap<>();
                result.put("answer", responseBody.get("answer").asText());
                result.put("confidence", responseBody.get("confidence").asDouble());
                result.put("processing_time", responseBody.get("processing_time").asDouble());
                
                // Extract sources
                List<String> sources = new ArrayList<>();
                if (responseBody.has("sources")) {
                    JsonNode sourcesNode = responseBody.get("sources");
                    for (JsonNode source : sourcesNode) {
                        sources.add(source.asText());
                    }
                }
                result.put("sources", sources);
                
                return result;
            } else {
                logger.error("Failed to query RAG system");
                return createErrorResponse("Failed to query RAG system");
            }
            
        } catch (Exception e) {
            logger.error("Error querying RAG system", e);
            return createErrorResponse("Error querying RAG system: " + e.getMessage());
        }
    }
    
    /**
     * Get documents from RAG system
     */
    public List<Map<String, Object>> getDocuments() {
        try {
            String url = RAG_SERVICE_URL + "/documents";
            
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode responseBody = response.getBody();
                List<Map<String, Object>> documents = new ArrayList<>();
                
                if (responseBody.has("documents")) {
                    JsonNode documentsNode = responseBody.get("documents");
                    for (JsonNode doc : documentsNode) {
                        Map<String, Object> document = new HashMap<>();
                        document.put("id", doc.get("id").asText());
                        document.put("created_at", doc.get("created_at").asText());
                        document.put("text_length", doc.get("text_length").asInt());
                        
                        // Extract metadata
                        if (doc.has("metadata")) {
                            JsonNode metadata = doc.get("metadata");
                            Map<String, Object> metadataMap = new HashMap<>();
                            metadata.fields().forEachRemaining(entry -> 
                                metadataMap.put(entry.getKey(), entry.getValue().asText()));
                            document.put("metadata", metadataMap);
                        }
                        
                        documents.add(document);
                    }
                }
                
                return documents;
            } else {
                logger.error("Failed to get documents from RAG system");
                return new ArrayList<>();
            }
            
        } catch (Exception e) {
            logger.error("Error getting documents from RAG system", e);
            return new ArrayList<>();
        }
    }
    
    /**
     * Delete document from RAG system
     */
    public boolean deleteDocument(String documentId) {
        try {
            String url = RAG_SERVICE_URL + "/documents/" + documentId;
            
            restTemplate.delete(url);
            return true;
            
        } catch (Exception e) {
            logger.error("Error deleting document from RAG system", e);
            return false;
        }
    }
    
    /**
     * Check if RAG system is healthy
     */
    public boolean isHealthy() {
        try {
            String url = RAG_SERVICE_URL + "/health";
            
            ResponseEntity<JsonNode> response = restTemplate.getForEntity(url, JsonNode.class);
            
            return response.getStatusCode().is2xxSuccessful() && 
                   response.getBody() != null && 
                   "healthy".equals(response.getBody().get("status").asText());
            
        } catch (Exception e) {
            logger.error("Error checking RAG system health", e);
            return false;
        }
    }
    
    /**
     * Generate maintenance rules from PDF
     */
    public Map<String, Object> generateMaintenanceRules(String deviceId, String context) {
        try {
            String query = "What are the maintenance requirements and schedule for this device?";
            Map<String, Object> response = queryRAG(query, deviceId, context);
            
            if (response.containsKey("success") && !(Boolean) response.get("success")) {
                return response;
            }
            
            // Extract maintenance information
            String answer = (String) response.get("answer");
            Map<String, Object> rules = new HashMap<>();
            rules.put("maintenance_schedule", extractMaintenanceSchedule(answer));
            rules.put("maintenance_requirements", extractMaintenanceRequirements(answer));
            rules.put("confidence", response.get("confidence"));
            rules.put("sources", response.get("sources"));
            
            return rules;
            
        } catch (Exception e) {
            logger.error("Error generating maintenance rules", e);
            return createErrorResponse("Error generating maintenance rules: " + e.getMessage());
        }
    }
    
    /**
     * Generate device specifications from PDF
     */
    public Map<String, Object> generateDeviceSpecifications(String deviceId, String context) {
        try {
            String query = "What are the technical specifications and parameters of this device?";
            Map<String, Object> response = queryRAG(query, deviceId, context);
            
            if (response.containsKey("success") && !(Boolean) response.get("success")) {
                return response;
            }
            
            // Extract specifications
            String answer = (String) response.get("answer");
            Map<String, Object> specs = new HashMap<>();
            specs.put("technical_specifications", extractTechnicalSpecifications(answer));
            specs.put("parameters", extractParameters(answer));
            specs.put("confidence", response.get("confidence"));
            specs.put("sources", response.get("sources"));
            
            return specs;
            
        } catch (Exception e) {
            logger.error("Error generating device specifications", e);
            return createErrorResponse("Error generating device specifications: " + e.getMessage());
        }
    }
    
    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
    
    private String extractMaintenanceSchedule(String answer) {
        // Simple extraction - in production, use more sophisticated NLP
        if (answer.contains("maintenance")) {
            return answer;
        }
        return "No specific maintenance schedule found in documentation.";
    }
    
    private String extractMaintenanceRequirements(String answer) {
        // Simple extraction - in production, use more sophisticated NLP
        if (answer.contains("requirement") || answer.contains("need")) {
            return answer;
        }
        return "No specific maintenance requirements found in documentation.";
    }
    
    private String extractTechnicalSpecifications(String answer) {
        // Simple extraction - in production, use more sophisticated NLP
        if (answer.contains("specification") || answer.contains("spec")) {
            return answer;
        }
        return "No technical specifications found in documentation.";
    }
    
    private String extractParameters(String answer) {
        // Simple extraction - in production, use more sophisticated NLP
        if (answer.contains("parameter") || answer.contains("dimension")) {
            return answer;
        }
        return "No parameters found in documentation.";
    }
}
