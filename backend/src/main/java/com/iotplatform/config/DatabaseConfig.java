package com.iotplatform.config;

import java.sql.Connection;
import java.sql.SQLException;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration
@EnableJpaAuditing
@EnableJpaRepositories(basePackages = "com.iotplatform.repository")
@EnableTransactionManagement
public class DatabaseConfig {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url}")
    private String databaseUrl;

    @Value("${spring.datasource.username}")
    private String databaseUsername;

    @Bean
    public String logDatabaseConnection(DataSource dataSource) {
        try (Connection connection = dataSource.getConnection()) {
            logger.info("✅ Successfully connected to PostgreSQL database");
            logger.info("Database URL: {}", databaseUrl);
            logger.info("Database User: {}", databaseUsername);
            logger.info("Database Product: {}", connection.getMetaData().getDatabaseProductName());
            logger.info("Database Version: {}", connection.getMetaData().getDatabaseProductVersion());
            return "Database connection successful";
        } catch (SQLException e) {
            logger.error("❌ Failed to connect to PostgreSQL database: {}", e.getMessage());
            throw new RuntimeException("Database connection failed", e);
        }
    }
}
