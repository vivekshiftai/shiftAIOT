package com.iotplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Configuration class for REST template beans
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Configuration
public class RestTemplateConfig {

    /**
     * Create a RestTemplate bean for HTTP client operations
     * 
     * @return RestTemplate instance
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}