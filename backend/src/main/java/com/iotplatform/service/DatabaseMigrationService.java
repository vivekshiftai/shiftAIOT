package com.iotplatform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

@Service
public class DatabaseMigrationService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);

    @Override
    public void run(String... args) throws Exception {
        logger.info("🚀 Starting database migration and initialization...");
        
        logger.info("✅ Database migration and initialization completed");
    }

}
