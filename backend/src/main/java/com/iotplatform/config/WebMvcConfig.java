package com.iotplatform.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.AsyncSupportConfigurer;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC Configuration for SSE support
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    
    private static final Logger logger = LoggerFactory.getLogger(WebMvcConfig.class);

    @Override
    public void configureAsyncSupport(AsyncSupportConfigurer configurer) {
        logger.info("Configuring async support for SSE");
        // Configure async request timeout for SSE (5 minutes)
        configurer.setDefaultTimeout(300000L);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        logger.info("Configuring CORS mappings for SSE support");
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .exposedHeaders(
                    "Access-Control-Allow-Origin",
                    "Access-Control-Allow-Credentials",
                    "Content-Type",
                    "Cache-Control",
                    "Connection",
                    "Transfer-Encoding"
                )
                .allowCredentials(false)
                .maxAge(3600L);
    }
}
