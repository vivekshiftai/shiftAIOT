package com.iotplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

/**
 * Configuration class to ensure the application uses the correct timezone
 */
@Configuration
public class TimezoneConfig {

    private static final Logger logger = LoggerFactory.getLogger(TimezoneConfig.class);

    @Value("${spring.jackson.time-zone:Asia/Kolkata}")
    private String timezone;

    @PostConstruct
    public void init() {
        try {
            // Set the default timezone for the JVM
            TimeZone.setDefault(TimeZone.getTimeZone(timezone));
            
            // Log the current timezone information
            TimeZone currentTZ = TimeZone.getDefault();
            logger.info("🌍 Timezone configured successfully:");
            logger.info("   - Requested timezone: {}", timezone);
            logger.info("   - Current JVM timezone: {}", currentTZ.getID());
            logger.info("   - Timezone display name: {}", currentTZ.getDisplayName());
            logger.info("   - Current offset: {} minutes", currentTZ.getRawOffset() / 60000);
            logger.info("   - Current time: {}", java.time.LocalDateTime.now());
            
            // Additional detailed logging for debugging
            logger.debug("Timezone configuration details:");
            logger.debug("   - Timezone raw offset: {} ms", currentTZ.getRawOffset());
            logger.debug("   - Uses daylight saving: {}", currentTZ.useDaylightTime());
            logger.debug("   - Timezone class: {}", currentTZ.getClass().getSimpleName());
            
        } catch (Exception e) {
            logger.error("❌ Failed to set timezone: {}", timezone, e);
            logger.warn("⚠️ Using system default timezone: {}", TimeZone.getDefault().getID());
            
            // Log additional error context
            logger.error("Timezone configuration error details:", e);
            logger.error("   - Requested timezone: {}", timezone);
            logger.error("   - System default timezone: {}", TimeZone.getDefault().getID());
            logger.error("   - Available timezones count: {}", TimeZone.getAvailableIDs().length);
        }
    }

    /**
     * Bean to ensure Jackson uses the correct timezone
     */
    @Bean
    @Primary
    public TimeZone applicationTimeZone() {
        TimeZone tz = TimeZone.getDefault();
        logger.debug("Creating application timezone bean: {}", tz.getID());
        return tz;
    }
}
