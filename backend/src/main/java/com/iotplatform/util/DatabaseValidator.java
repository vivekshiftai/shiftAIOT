package com.iotplatform.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

/**
 * Utility class to validate database connection and table structure
 */
@Component
public class DatabaseValidator {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseValidator.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Validate database connection
     */
    public boolean validateConnection() {
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            logger.info("✅ Database connection successful");
            logger.info("📊 Database: {} {}", metaData.getDatabaseProductName(), metaData.getDatabaseProductVersion());
            logger.info("🔌 Driver: {} {}", metaData.getDriverName(), metaData.getDriverVersion());
            return true;
        } catch (SQLException e) {
            logger.error("❌ Database connection failed: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Validate conversation_configs table structure
     */
    public boolean validateConversationConfigsTable() {
        try {
            // Check if table exists
            String tableExists = "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversation_configs')";
            boolean tableExistsResult = jdbcTemplate.queryForObject(tableExists, Boolean.class);
            
            if (!tableExistsResult) {
                logger.error("❌ Table 'conversation_configs' does not exist");
                return false;
            }
            
            logger.info("✅ Table 'conversation_configs' exists");
            
            // Check table structure
            String tableStructure = """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'conversation_configs'
                ORDER BY ordinal_position
                """;
            
            List<String> columns = new ArrayList<>();
            jdbcTemplate.query(tableStructure, (rs, rowNum) -> {
                String columnName = rs.getString("column_name");
                String dataType = rs.getString("data_type");
                String isNullable = rs.getString("is_nullable");
                String columnDefault = rs.getString("column_default");
                
                columns.add(String.format("%s (%s, nullable: %s, default: %s)", 
                    columnName, dataType, isNullable, columnDefault != null ? columnDefault : "none"));
                
                // Validate credentials column type
                if ("credentials".equals(columnName)) {
                    if (!"jsonb".equalsIgnoreCase(dataType)) {
                        logger.error("❌ Column 'credentials' has wrong type: {} (expected: jsonb)", dataType);
                        return false;
                    }
                    logger.info("✅ Column 'credentials' has correct type: {}", dataType);
                }
                
                // Validate platform_type column
                if ("platform_type".equals(columnName)) {
                    if (!"character varying".equalsIgnoreCase(dataType)) {
                        logger.error("❌ Column 'platform_type' has wrong type: {} (expected: character varying)", dataType);
                        return false;
                    }
                    logger.info("✅ Column 'platform_type' has correct type: {}", dataType);
                }
                
                return true;
            });
            
            logger.info("📋 Table structure: {}", String.join(", ", columns));
            
            // Check constraints
            String constraints = """
                SELECT conname, contype, pg_get_constraintdef(oid) as definition
                FROM pg_constraint 
                WHERE conrelid = 'conversation_configs'::regclass
                """;
            
            try {
                jdbcTemplate.query(constraints, (rs, rowNum) -> {
                    String constraintName = rs.getString("conname");
                    String constraintType = rs.getString("contype");
                    String definition = rs.getString("definition");
                    logger.info("🔒 Constraint: {} ({}) - {}", constraintName, constraintType, definition);
                    return null;
                });
            } catch (Exception e) {
                logger.warn("⚠️ Could not retrieve constraints: {}", e.getMessage());
            }
            
            return true;
            
        } catch (Exception e) {
            logger.error("❌ Error validating conversation_configs table: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Test JSONB insertion
     */
    public boolean testJsonbInsertion() {
        try {
            // Test with a simple JSON object
            String testSql = """
                INSERT INTO conversation_configs (id, user_id, platform_name, platform_type, credentials, is_active)
                VALUES (?, ?, ?, ?, ?::jsonb, ?)
                """;
            
            String testId = "test-" + System.currentTimeMillis();
            String testUserId = "test-user";
            String testPlatformName = "Test Platform";
            String testPlatformType = "slack";
            String testCredentials = "{\"token\":\"test-token\",\"channel\":\"test-channel\"}";
            boolean testActive = true;
            
            jdbcTemplate.update(testSql, testId, testUserId, testPlatformName, testPlatformType, testCredentials, testActive);
            logger.info("✅ JSONB insertion test successful");
            
            // Clean up test data
            jdbcTemplate.update("DELETE FROM conversation_configs WHERE id = ?", testId);
            logger.info("🧹 Test data cleaned up");
            
            return true;
            
        } catch (Exception e) {
            logger.error("❌ JSONB insertion test failed: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Run all validations
     */
    public void runAllValidations() {
        logger.info("🔍 Starting database validation...");
        
        boolean connectionValid = validateConnection();
        if (!connectionValid) {
            logger.error("❌ Database validation failed: connection issue");
            return;
        }
        
        boolean tableValid = validateConversationConfigsTable();
        if (!tableValid) {
            logger.error("❌ Database validation failed: table structure issue");
            return;
        }
        
        boolean jsonbValid = testJsonbInsertion();
        if (!jsonbValid) {
            logger.error("❌ Database validation failed: JSONB insertion issue");
            return;
        }
        
        logger.info("✅ All database validations passed successfully!");
    }
}
