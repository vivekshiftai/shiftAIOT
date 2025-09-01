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
            // Convert Map to JSON string for PostgreSQL JSONB storage
            String jsonString = objectMapper.writeValueAsString(attribute);
            logger.debug("Successfully converted Map to JSON string for database: {} keys, JSON length: {}", 
                        attribute.keySet(), jsonString.length());
            logger.debug("Map content (sanitized): {}", attribute.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + (entry.getValue() != null ? entry.getValue().getClass().getSimpleName() : "null"))
                .toArray());
            return jsonString;
        } catch (JsonProcessingException e) {
            logger.error("Error converting map to JSON string for database: {}", e.getMessage(), e);
            throw new RuntimeException("Error converting map to JSON string for database: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            logger.debug("Converting null database data to entity attribute");
            return null;
        }
        try {
            // Convert JSON string from database back to Map
            Map<String, Object> result = objectMapper.readValue(dbData, new TypeReference<Map<String, Object>>() {});
            logger.debug("Successfully converted database JSON string to Map: {} keys", result.keySet());
            logger.debug("Database JSON content (sanitized): {}", result.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + (entry.getValue() != null ? entry.getValue().getClass().getSimpleName() : "null"))
                .toArray());
            return result;
        } catch (JsonProcessingException e) {
            logger.error("Error converting database JSON string to map: {}", e.getMessage(), e);
            throw new RuntimeException("Error converting database JSON string to map: " + e.getMessage(), e);
        }
    }
}
