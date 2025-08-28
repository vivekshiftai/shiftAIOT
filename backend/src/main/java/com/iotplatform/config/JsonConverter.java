package com.iotplatform.config;

import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class JsonConverter implements AttributeConverter<Map<String, Object>, Object> {
    
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public Object convertToDatabaseColumn(Map<String, Object> attribute) {
        if (attribute == null) {
            return null;
        }
        try {
            // Return as JsonNode for PostgreSQL JSON type
            return objectMapper.valueToTree(attribute);
        } catch (Exception e) {
            throw new RuntimeException("Error converting map to JSON", e);
        }
    }

    @Override
    public Map<String, Object> convertToEntityAttribute(Object dbData) {
        if (dbData == null) {
            return null;
        }
        try {
            if (dbData instanceof String) {
                return objectMapper.readValue((String) dbData, new TypeReference<Map<String, Object>>() {});
            } else if (dbData instanceof JsonNode) {
                return objectMapper.convertValue(dbData, new TypeReference<Map<String, Object>>() {});
            } else {
                // Handle other cases by converting to string first
                String jsonString = objectMapper.writeValueAsString(dbData);
                return objectMapper.readValue(jsonString, new TypeReference<Map<String, Object>>() {});
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Error converting JSON to map", e);
        }
    }
}
