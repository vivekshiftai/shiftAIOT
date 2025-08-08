package com.iotplatform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class DatabaseMigrationService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting database migration service...");
        fixInvalidUserRoles();
        logger.info("Database migration completed.");
    }

    private void fixInvalidUserRoles() {
        try {
            logger.info("Checking for invalid user roles...");
            
            // Count users with invalid roles
            Integer invalidRoleCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE role NOT IN ('ADMIN', 'USER')", 
                Integer.class
            );
            
            if (invalidRoleCount != null && invalidRoleCount > 0) {
                logger.warn("Found {} users with invalid roles. Fixing...", invalidRoleCount);
                
                // Fix specific invalid roles
                int viewerCount = jdbcTemplate.update(
                    "UPDATE users SET role = 'USER' WHERE role = 'VIEWER'"
                );
                if (viewerCount > 0) {
                    logger.info("Fixed {} users with 'VIEWER' role", viewerCount);
                }
                
                int orgAdminCount = jdbcTemplate.update(
                    "UPDATE users SET role = 'ADMIN' WHERE role = 'ORG_ADMIN'"
                );
                if (orgAdminCount > 0) {
                    logger.info("Fixed {} users with 'ORG_ADMIN' role", orgAdminCount);
                }
                
                // Fix any other invalid roles
                int otherInvalidCount = jdbcTemplate.update(
                    "UPDATE users SET role = 'USER' WHERE role NOT IN ('ADMIN', 'USER')"
                );
                if (otherInvalidCount > 0) {
                    logger.info("Fixed {} users with other invalid roles", otherInvalidCount);
                }
                
                logger.info("User role migration completed successfully.");
            } else {
                logger.info("No invalid user roles found.");
            }
            
        } catch (Exception e) {
            logger.error("Error during user role migration: {}", e.getMessage(), e);
        }
    }
}
