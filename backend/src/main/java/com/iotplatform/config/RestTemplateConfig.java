package com.iotplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * Configuration for RestTemplate beans used for HTTP client operations.
 */
@Configuration
public class RestTemplateConfig {

    /**
     * RestTemplate bean for general HTTP operations.
     * Configured with reasonable timeouts for external API calls.
     */
    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // Set connection timeout (30 seconds)
        factory.setConnectTimeout(30000);
        
        // Set read timeout (60 seconds)
        factory.setReadTimeout(60000);
        
        return new RestTemplate(factory);
    }
}
