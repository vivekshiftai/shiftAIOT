package com.iotplatform.config;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.Executor;
import org.springframework.beans.factory.annotation.Value;

/**
 * Configuration for PDF processing service integration.
 * Manages external service connection, timeouts, and async processing.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Slf4j
@Data
@Configuration
@EnableAsync
@ConfigurationProperties(prefix = "pdf.processing")
public class PDFProcessingConfig {

    /**
     * Base URL for the external PDF processing service
     */
    @Value("${pdf.processing.base-url:http://20.57.36.66:8000}")
    private String baseUrl = "http://20.57.36.66:8000";
    
    // Explicit getter method in case Lombok fails
    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * API key for authentication with external service
     */
    private String apiKey;

    /**
     * Maximum file size for PDF uploads (in bytes)
     */
    private long maxFileSize = 50 * 1024 * 1024; // 50MB default

    /**
     * Connection timeout for HTTP requests (in milliseconds)
     * Set to 0 for no timeout
     */
    private int connectionTimeout = 30000; // 30 seconds

    /**
     * Read timeout for HTTP requests (in milliseconds)
     * Set to 0 for no timeout
     */
    private int readTimeout = 300000; // 5 minutes

    /**
     * Maximum number of retries for failed requests
     */
    private int maxRetries = 3;

    /**
     * Retry delay between attempts (in milliseconds)
     */
    private long retryDelay = 1000; // 1 second

    /**
     * Async executor configuration
     */
    private AsyncConfig async = new AsyncConfig();

    @Data
    public static class AsyncConfig {
        /**
         * Core pool size for async processing
         */
        private int corePoolSize = 5;

        /**
         * Maximum pool size for async processing
         */
        private int maxPoolSize = 10;

        /**
         * Queue capacity for async tasks
         */
        private int queueCapacity = 25;

        /**
         * Thread name prefix for async processing
         */
        private String threadNamePrefix = "pdf-processing-";

        /**
         * Keep alive time for idle threads (in seconds)
         */
        private int keepAliveSeconds = 60;
    }

    @PostConstruct
    public void validateConfiguration() {
        log.info("Initializing PDF Processing Configuration");
        log.info("Base URL: {}", baseUrl);
        log.info("Max File Size: {} bytes ({} MB)", maxFileSize, maxFileSize / (1024 * 1024));
        if (connectionTimeout == 0) {
            log.info("Connection Timeout: No timeout (infinite)");
        } else {
            log.info("Connection Timeout: {} ms", connectionTimeout);
        }
        if (readTimeout == 0) {
            log.info("Read Timeout: No timeout (infinite)");
        } else {
            log.info("Read Timeout: {} ms", readTimeout);
        }
        log.info("Max Retries: {}", maxRetries);
        log.info("Async Core Pool Size: {}", async.getCorePoolSize());
        log.info("Async Max Pool Size: {}", async.getMaxPoolSize());
        
        // Log authentication status
        if (apiKey == null || apiKey.trim().isEmpty()) {
            log.info("No API key configured - using unauthenticated access");
        } else {
            log.info("API key configured - using authenticated access");
        }

        // Validate configuration
        if (baseUrl == null || baseUrl.trim().isEmpty()) {
            throw new IllegalStateException("PDF processing base URL is required");
        }

        if (maxFileSize <= 0) {
            throw new IllegalStateException("Max file size must be positive");
        }

        if (connectionTimeout < 0) {
            throw new IllegalStateException("Connection timeout cannot be negative");
        }

        if (readTimeout < 0) {
            throw new IllegalStateException("Read timeout cannot be negative");
        }

        if (maxRetries < 0) {
            throw new IllegalStateException("Max retries cannot be negative");
        }

        log.info("PDF Processing Configuration validated successfully");
    }

    /**
     * Creates a RestTemplate bean configured for PDF processing service calls.
     * Includes proper timeouts and error handling.
     * 
     * @return Configured RestTemplate instance
     */
    @Bean("pdfProcessingRestTemplate")
    public RestTemplate pdfProcessingRestTemplate() {
        if (connectionTimeout == 0 && readTimeout == 0) {
            log.info("Creating PDF Processing RestTemplate with no timeouts (infinite wait)");
        } else {
            log.info("Creating PDF Processing RestTemplate with timeouts - Connect: {}ms, Read: {}ms", 
                connectionTimeout, readTimeout);
        }

        ClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // Set timeouts only if they are greater than 0
        if (connectionTimeout > 0) {
            ((SimpleClientHttpRequestFactory) factory).setConnectTimeout(connectionTimeout);
        }
        if (readTimeout > 0) {
            ((SimpleClientHttpRequestFactory) factory).setReadTimeout(readTimeout);
        }

        RestTemplate restTemplate = new RestTemplate(factory);
        
        // Add request/response logging interceptor for debugging
        restTemplate.getInterceptors().add(new LoggingInterceptor());
        
        return restTemplate;
    }

    /**
     * Creates an async executor for PDF processing operations.
     * Handles long-running tasks like rule generation and maintenance scheduling.
     * 
     * @return Configured async executor
     */
    @Bean("pdfProcessingExecutor")
    public Executor pdfProcessingExecutor() {
        log.info("Creating PDF Processing Async Executor - Core: {}, Max: {}, Queue: {}", 
            async.getCorePoolSize(), async.getMaxPoolSize(), async.getQueueCapacity());

        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(async.getCorePoolSize());
        executor.setMaxPoolSize(async.getMaxPoolSize());
        executor.setQueueCapacity(async.getQueueCapacity());
        executor.setThreadNamePrefix(async.getThreadNamePrefix());
        executor.setKeepAliveSeconds(async.getKeepAliveSeconds());
        
        // Configure rejection policy
        executor.setRejectedExecutionHandler(new java.util.concurrent.ThreadPoolExecutor.CallerRunsPolicy());
        
        // Configure shutdown behavior
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        
        executor.initialize();
        
        log.info("PDF Processing Async Executor initialized successfully");
        return executor;
    }

    /**
     * Logging interceptor for RestTemplate to debug HTTP requests/responses.
     */
    private static class LoggingInterceptor implements org.springframework.http.client.ClientHttpRequestInterceptor {
        
        @Override
        public org.springframework.http.client.ClientHttpResponse intercept(
            org.springframework.http.HttpRequest request, 
            byte[] body, 
            org.springframework.http.client.ClientHttpRequestExecution execution) throws java.io.IOException {
            
            if (log.isDebugEnabled()) {
                log.debug("HTTP Request: {} {}", request.getMethod(), request.getURI());
                log.debug("HTTP Headers: {}", request.getHeaders());
                if (body != null && body.length > 0) {
                    log.debug("HTTP Body: {}", new String(body));
                }
            }
            
            org.springframework.http.client.ClientHttpResponse response = execution.execute(request, body);
            
            if (log.isDebugEnabled()) {
                log.debug("HTTP Response: {} {}", response.getStatusCode(), response.getStatusText());
                log.debug("Response Headers: {}", response.getHeaders());
            }
            
            return response;
        }
    }
}
