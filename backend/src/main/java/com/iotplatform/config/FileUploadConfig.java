package com.iotplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class FileUploadConfig implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(FileUploadConfig.class);
    
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    
    @Bean
    public MultipartResolver multipartResolver() {
        return new StandardServletMultipartResolver();
    }
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Initializing file upload configuration...");
        
        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            try {
                Files.createDirectories(uploadPath);
                logger.info("Created upload directory: {}", uploadPath.toAbsolutePath());
            } catch (Exception e) {
                logger.error("Failed to create upload directory: {}", e.getMessage(), e);
            }
        } else {
            logger.info("Upload directory already exists: {}", uploadPath.toAbsolutePath());
        }
        
        // Verify directory is writable
        File uploadFile = uploadPath.toFile();
        if (!uploadFile.canWrite()) {
            logger.warn("Upload directory is not writable: {}", uploadPath.toAbsolutePath());
        } else {
            logger.info("Upload directory is writable: {}", uploadPath.toAbsolutePath());
        }
        
        logger.info("File upload configuration completed");
    }
}
