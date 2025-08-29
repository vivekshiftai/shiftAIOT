package com.iotplatform.config;

import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Converter
public class JsonConverter implements AttributeConverter<Map<String, Object>, String> {
    
    private static final Logger logger = LoggerFactory.getLogger(JsonConverter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null) {
            logger.debug("Converting null attribute to database column");
            return null;
        }
        try {
            // Convert to JSON string for PostgreSQL JSONB type
            String jsonString = objectMapper.writeValueAsString(attribute);
            logger.debug("Successfully converted Map to JSON string: {}", jsonString);
            return jsonString;
        } catch (Exception e) {
            logger.error("Error converting map to JSON: {}", e.getMessage(), e);
            throw new RuntimeException("Error converting map to JSON: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            logger.debug("Converting null database data to entity attribute");
            return null;
        }
        try {
            Map<String, Object> result = objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {});
            logger.debug("Successfully converted JSON string to Map: {}", dbData);
            return result;
        } catch (Exception e) {
            logger.error("Error converting JSON to map: {}", e.getMessage(), e);
            throw new RuntimeException("Error converting JSON to map: " + e.getMessage(), e);
        }
    }
}
