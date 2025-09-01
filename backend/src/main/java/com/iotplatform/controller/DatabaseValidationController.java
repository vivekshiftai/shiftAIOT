package com.iotplatform.controller;

import com.iotplatform.util.DatabaseValidator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for database validation endpoints
 */
@RestController
@RequestMapping("/api/database")
public class DatabaseValidationController {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseValidationController.class);
    
    @Autowired
    private DatabaseValidator databaseValidator;
    
    /**
     * Validate database connection
     */
    @GetMapping("/validate/connection")
    public ResponseEntity<Map<String, Object>> validateConnection() {
        logger.info("🔍 Validating database connection...");
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isValid = databaseValidator.validateConnection();
            response.put("success", isValid);
            response.put("message", isValid ? "Database connection successful" : "Database connection failed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error validating database connection: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error validating database connection: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Validate conversation_configs table structure
     */
    @GetMapping("/validate/table")
    public ResponseEntity<Map<String, Object>> validateTable() {
        logger.info("🔍 Validating conversation_configs table structure...");
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isValid = databaseValidator.validateConversationConfigsTable();
            response.put("success", isValid);
            response.put("message", isValid ? "Table structure validation successful" : "Table structure validation failed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error validating table structure: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error validating table structure: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Test JSONB insertion
     */
    @PostMapping("/test/jsonb")
    public ResponseEntity<Map<String, Object>> testJsonbInsertion() {
        logger.info("🔍 Testing JSONB insertion...");
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isValid = databaseValidator.testJsonbInsertion();
            response.put("success", isValid);
            response.put("message", isValid ? "JSONB insertion test successful" : "JSONB insertion test failed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error testing JSONB insertion: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error testing JSONB insertion: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Run all validations
     */
    @PostMapping("/validate/all")
    public ResponseEntity<Map<String, Object>> runAllValidations() {
        logger.info("🔍 Running all database validations...");
        
        Map<String, Object> response = new HashMap<>();
        try {
            databaseValidator.runAllValidations();
            response.put("success", true);
            response.put("message", "All database validations completed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error running database validations: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error running database validations: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
