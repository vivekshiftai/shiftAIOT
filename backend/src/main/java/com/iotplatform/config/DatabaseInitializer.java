package com.iotplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

@Component
public class DatabaseInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting database initialization...");
        
        // Check if tables exist
        List<String> existingTables = getExistingTables();
        logger.info("Existing tables: {}", existingTables);
        
        // Verify required tables
        List<String> requiredTables = List.of(
            "users", "user_permissions", "devices", "unified_pdfs",
            "device_maintenance", "device_safety_precautions", "device_tags",
            "device_config", "rules", "rule_conditions", "rule_actions",
            "notifications", "conversation_configs"
        );
        
        List<String> missingTables = new ArrayList<>();
        for (String table : requiredTables) {
            if (!existingTables.contains(table)) {
                missingTables.add(table);
            }
        }
        
        if (!missingTables.isEmpty()) {
            logger.warn("Missing tables: {}", missingTables);
            logger.info("Running schema initialization...");
            
            try {
                // Load and execute schema.sql
                ClassPathResource resource = new ClassPathResource("schema.sql");
                String schema = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
                
                // Split by semicolon and execute each statement
                String[] statements = schema.split(";");
                for (String statement : statements) {
                    statement = statement.trim();
                    if (!statement.isEmpty() && !statement.startsWith("--")) {
                        try {
                            jdbcTemplate.execute(statement);
                            logger.debug("Executed: {}", statement.substring(0, Math.min(50, statement.length())) + "...");
                        } catch (Exception e) {
                            logger.warn("Failed to execute statement: {}", e.getMessage());
                        }
                    }
                }
                
                logger.info("Schema initialization completed");
                
            } catch (Exception e) {
                logger.error("Failed to initialize database schema: {}", e.getMessage(), e);
            }
        } else {
            logger.info("All required tables exist. Database initialization skipped.");
        }
        
        // Verify final state
        List<String> finalTables = getExistingTables();
        logger.info("Final table count: {}", finalTables.size());
        logger.info("Database initialization completed successfully");
    }
    
    private List<String> getExistingTables() throws Exception {
        List<String> tables = new ArrayList<>();
        
        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            ResultSet resultSet = metaData.getTables(null, null, "%", new String[]{"TABLE"});
            
            while (resultSet.next()) {
                String tableName = resultSet.getString("TABLE_NAME");
                tables.add(tableName);
            }
        }
        
        return tables;
    }
}
