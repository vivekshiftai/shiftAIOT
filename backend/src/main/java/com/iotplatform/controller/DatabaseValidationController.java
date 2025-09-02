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
    
    @PostMapping("/validate/connection")
    public ResponseEntity<Map<String, Object>> validateDatabaseConnection() {
        logger.info("🔍 Database connection validation request received");
        
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

    @PostMapping("/validate/schema")
    public ResponseEntity<Map<String, Object>> validateDatabaseSchema() {
        logger.info("🔍 Database schema validation request received");
        
        Map<String, Object> response = new HashMap<>();
        try {
            boolean isValid = databaseValidator.validateConversationConfigsTable();
            response.put("success", isValid);
            response.put("message", isValid ? "Database schema validation successful" : "Database schema validation failed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error validating database schema: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error validating database schema: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/validate/all")
    public ResponseEntity<Map<String, Object>> runAllValidations() {
        logger.info("🔍 Running all database validations");
        
        Map<String, Object> response = new HashMap<>();
        try {
            databaseValidator.runAllValidations();
            response.put("success", true);
            response.put("message", "All validations completed");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Error running all validations: {}", e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Error running all validations: " + e.getMessage());
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.internalServerError().body(response);
        }
    }
}
