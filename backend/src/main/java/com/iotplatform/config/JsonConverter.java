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
public class JsonConverter implements AttributeConverter<Map<String, Object>, Object> {
    
    private static final Logger logger = LoggerFactory.getLogger(JsonConverter.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Object convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null) {
            logger.debug("Converting null attribute to database column");
            return null;
        }
        try {
            // For JSONB, we return the Map directly as Hibernate will handle the conversion
            // This avoids the string conversion issue that was causing the error
            logger.debug("Successfully converted Map to database column: {} keys", attribute.keySet());
            logger.debug("Map content (sanitized): {}", attribute.entrySet().stream()
                .map(entry -> entry.getKey() + "=" + (entry.getValue() != null ? entry.getValue().getClass().getSimpleName() : "null"))
                .toArray());
            return attribute;
        } catch (Exception e) {
            logger.error("Error converting map to database column: {}", e.getMessage(), e);
            throw new RuntimeException("Error converting map to database column: " + e.getMessage(), e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(Object dbData) {
        if (dbData == null) {
            logger.debug("Converting null database data to entity attribute");
            return null;
        }
        try {
            // Handle different types of database data
            if (dbData instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = (Map<String, Object>) dbData;
                logger.debug("Successfully converted database Map to entity attribute: {} keys", result.keySet());
                logger.debug("Database Map content (sanitized): {}", result.entrySet().stream()
                    .map(entry -> entry.getKey() + "=" + (entry.getValue() != null ? entry.getValue().getClass().getSimpleName() : "null"))
                    .toArray());
                return result;
            } else if (dbData instanceof String) {
                // Fallback for string data (shouldn't happen with JSONB but just in case)
                logger.warn("Received string data instead of Map for JSONB column: {}", dbData);
                Map<String, Object> result = objectMapper.readValue((String) dbData, new TypeReference<Map<String, Object>>() {});
                logger.debug("Successfully converted JSON string to Map: {} keys", result.keySet());
                return result;
            } else {
                logger.warn("Unexpected database data type: {} - value: {}", dbData.getClass().getName(), dbData);
                return null;
            }
        } catch (Exception e) {
            logger.error("Error converting database data to map: {}", e.getMessage(), e);
            throw new RuntimeException("Error converting database data to map: " + e.getMessage(), e);
        }
    }
}
