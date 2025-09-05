package com.iotplatform.config;

import com.iotplatform.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Database initializer to ensure required data exists on application startup
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseInitializer implements CommandLineRunner {

    private final OrganizationService organizationService;

    @Override
    public void run(String... args) throws Exception {
        log.info("🚀 Starting database initialization...");
        
        try {
            // Ensure the default organization exists
            String defaultOrganizationId = "shiftAIOT-org-2024";
            organizationService.ensureOrganizationExists(defaultOrganizationId);
            log.info("✅ Database initialization completed successfully");
            
        } catch (Exception e) {
            log.error("❌ Database initialization failed: {}", e.getMessage(), e);
            // Don't fail the application startup if initialization fails
        }
    }
}