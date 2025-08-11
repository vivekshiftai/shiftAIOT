package com.iotplatform;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class IotPlatformApplication {
    
    private static final Logger logger = LoggerFactory.getLogger(IotPlatformApplication.class);

    public static void main(String[] args) {
        logger.info("Starting shiftAIOT Platform Application with PostgreSQL backend...");
        
        try {
            SpringApplication.run(IotPlatformApplication.class, args);
            logger.info("shiftAIOT Platform Application started successfully!");
            logger.info("Database: PostgreSQL");
            logger.info("API Documentation: http://localhost:8100/swagger-ui.html");
            logger.info("Frontend: http://localhost:5173");
        } catch (Exception e) {
            logger.error("Failed to start shiftAIOT Platform Application: {}", e.getMessage(), e);
            System.exit(1);
        }
    }
}