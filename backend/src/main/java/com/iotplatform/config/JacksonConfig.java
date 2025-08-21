package com.iotplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fasterxml.jackson.datatype.hibernate6.Hibernate6Module;

@Configuration
public class JacksonConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        
        // Configure Hibernate module to handle lazy loading
        Hibernate6Module hibernateModule = new Hibernate6Module();
        hibernateModule.configure(Hibernate6Module.Feature.FORCE_LAZY_LOADING, false);
        hibernateModule.configure(Hibernate6Module.Feature.SERIALIZE_IDENTIFIER_FOR_LAZY_NOT_LOADED_OBJECTS, true);
        hibernateModule.configure(Hibernate6Module.Feature.USE_TRANSIENT_ANNOTATION, false);
        
        mapper.registerModule(hibernateModule);
        mapper.registerModule(new JavaTimeModule());
        
        // Disable features that might cause issues with Hibernate proxies
        mapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        
        return mapper;
    }
}
