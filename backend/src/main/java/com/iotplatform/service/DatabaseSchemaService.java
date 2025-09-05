package com.iotplatform.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Arrays;

/**
 * Service to provide database schema information for NLP-to-SQL queries
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseSchemaService {

    /**
     * Get complete database schema for NLP-to-SQL processing
     */
    public String getDatabaseSchema() {
        StringBuilder schema = new StringBuilder();
        
        schema.append("-- IoT Platform Database Schema\n");
        schema.append("-- This schema is used for natural language to SQL conversion\n\n");
        
        // Devices table
        schema.append("CREATE TABLE devices (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    name VARCHAR(100) NOT NULL,\n");
        schema.append("    type VARCHAR(20) NOT NULL, -- SENSOR, ACTUATOR, GATEWAY, CONTROLLER, MACHINE\n");
        schema.append("    status VARCHAR(20), -- ONLINE, OFFLINE, WARNING, ERROR\n");
        schema.append("    location VARCHAR(200) NOT NULL,\n");
        schema.append("    protocol VARCHAR(10) NOT NULL, -- MQTT, HTTP, COAP\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    assigned_user_id VARCHAR(36),\n");
        schema.append("    assigned_by VARCHAR(36),\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL,\n");
        schema.append("    manufacturer VARCHAR(100),\n");
        schema.append("    model VARCHAR(100),\n");
        schema.append("    description TEXT,\n");
        schema.append("    ip_address VARCHAR(45),\n");
        schema.append("    port INTEGER,\n");
        schema.append("    mqtt_broker VARCHAR(255),\n");
        schema.append("    mqtt_topic VARCHAR(255),\n");
        schema.append("    mqtt_username VARCHAR(100),\n");
        schema.append("    mqtt_password VARCHAR(255),\n");
        schema.append("    http_endpoint VARCHAR(500),\n");
        schema.append("    http_method VARCHAR(10),\n");
        schema.append("    http_headers TEXT,\n");
        schema.append("    coap_host VARCHAR(255),\n");
        schema.append("    coap_port INTEGER,\n");
        schema.append("    coap_path VARCHAR(255)\n");
        schema.append(");\n\n");
        
        // Users table
        schema.append("CREATE TABLE users (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    first_name VARCHAR(50) NOT NULL,\n");
        schema.append("    last_name VARCHAR(50) NOT NULL,\n");
        schema.append("    email VARCHAR(100) NOT NULL UNIQUE,\n");
        schema.append("    password VARCHAR(120) NOT NULL,\n");
        schema.append("    phone VARCHAR(20),\n");
        schema.append("    role VARCHAR(20) NOT NULL, -- ADMIN, USER, VIEWER\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    is_active BOOLEAN DEFAULT true,\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL\n");
        schema.append(");\n\n");
        
        // Device Maintenance table
        schema.append("CREATE TABLE device_maintenance (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    task_name VARCHAR(255) NOT NULL,\n");
        schema.append("    device_id VARCHAR(36) NOT NULL,\n");
        schema.append("    device_name VARCHAR(255),\n");
        schema.append("    component_name VARCHAR(255),\n");
        schema.append("    category VARCHAR(50), -- GENERAL, MECHANICAL, ELECTRICAL, SAFETY, CLEANING, INSPECTION\n");
        schema.append("    frequency VARCHAR(20), -- daily, weekly, monthly, quarterly, yearly, as-needed\n");
        schema.append("    next_maintenance DATE,\n");
        schema.append("    description TEXT,\n");
        schema.append("    priority VARCHAR(10), -- LOW, MEDIUM, HIGH, CRITICAL\n");
        schema.append("    assigned_to VARCHAR(36),\n");
        schema.append("    status VARCHAR(20), -- PENDING, IN_PROGRESS, COMPLETED, OVERDUE, CANCELLED\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL,\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    estimated_duration VARCHAR(50),\n");
        schema.append("    required_tools TEXT,\n");
        schema.append("    safety_notes TEXT,\n");
        schema.append("    FOREIGN KEY (device_id) REFERENCES devices(id)\n");
        schema.append(");\n\n");
        
        // Rules table
        schema.append("CREATE TABLE rules (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    name VARCHAR(255) NOT NULL,\n");
        schema.append("    description TEXT,\n");
        schema.append("    device_id VARCHAR(36) NOT NULL,\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    is_active BOOLEAN DEFAULT true,\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL,\n");
        schema.append("    FOREIGN KEY (device_id) REFERENCES devices(id)\n");
        schema.append(");\n\n");
        
        // Device Safety Precautions table
        schema.append("CREATE TABLE device_safety_precautions (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    title VARCHAR(255) NOT NULL,\n");
        schema.append("    description TEXT,\n");
        schema.append("    device_id VARCHAR(36) NOT NULL,\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL,\n");
        schema.append("    FOREIGN KEY (device_id) REFERENCES devices(id)\n");
        schema.append(");\n\n");
        
        // Notifications table
        schema.append("CREATE TABLE notifications (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    title VARCHAR(255) NOT NULL,\n");
        schema.append("    message TEXT NOT NULL,\n");
        schema.append("    category VARCHAR(50), -- DEVICE_ASSIGNMENT, MAINTENANCE_ASSIGNMENT, RULE_TRIGGERED, SAFETY_ALERT, SYSTEM_UPDATE, DEVICE_OFFLINE\n");
        schema.append("    device_id VARCHAR(36),\n");
        schema.append("    user_id VARCHAR(36),\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    is_read BOOLEAN DEFAULT false,\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    FOREIGN KEY (device_id) REFERENCES devices(id),\n");
        schema.append("    FOREIGN KEY (user_id) REFERENCES users(id)\n");
        schema.append(");\n\n");
        
        // Unified PDF table
        schema.append("CREATE TABLE unified_pdf (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    name VARCHAR(255) NOT NULL,\n");
        schema.append("    original_filename VARCHAR(255),\n");
        schema.append("    file_path VARCHAR(500),\n");
        schema.append("    file_size BIGINT,\n");
        schema.append("    device_id VARCHAR(36),\n");
        schema.append("    organization_id VARCHAR(255) NOT NULL,\n");
        schema.append("    uploaded_by VARCHAR(36),\n");
        schema.append("    processing_status VARCHAR(20), -- PENDING, PROCESSING, COMPLETED, FAILED\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL,\n");
        schema.append("    FOREIGN KEY (device_id) REFERENCES devices(id),\n");
        schema.append("    FOREIGN KEY (uploaded_by) REFERENCES users(id)\n");
        schema.append(");\n\n");
        
        // Organizations table
        schema.append("CREATE TABLE organizations (\n");
        schema.append("    id VARCHAR(36) PRIMARY KEY,\n");
        schema.append("    name VARCHAR(255) NOT NULL,\n");
        schema.append("    description TEXT,\n");
        schema.append("    created_at TIMESTAMP NOT NULL,\n");
        schema.append("    updated_at TIMESTAMP NOT NULL\n");
        schema.append(");\n\n");
        
        // Add sample data descriptions
        schema.append("-- Sample Data Descriptions:\n");
        schema.append("-- Devices: Industrial machines, sensors, controllers with various statuses\n");
        schema.append("-- Users: Platform users with different roles (ADMIN, USER, VIEWER)\n");
        schema.append("-- Device Maintenance: Scheduled maintenance tasks with priorities and assignments\n");
        schema.append("-- Rules: Business rules for device operations and alerts\n");
        schema.append("-- Safety Precautions: Safety guidelines for device operations\n");
        schema.append("-- Notifications: System alerts and user notifications\n");
        schema.append("-- PDFs: Device documentation and manuals\n");
        schema.append("-- Organizations: Multi-tenant organization structure\n");
        
        return schema.toString();
    }

    /**
     * Get table-specific schema information
     */
    public Map<String, String> getTableSchemas() {
        Map<String, String> schemas = new HashMap<>();
        
        schemas.put("devices", "Device information including name, type, status, location, protocol, and technical details");
        schemas.put("users", "User accounts with roles, contact information, and organization membership");
        schemas.put("device_maintenance", "Maintenance tasks, schedules, assignments, and completion status");
        schemas.put("rules", "Business rules and conditions for device operations");
        schemas.put("device_safety_precautions", "Safety guidelines and precautions for device operations");
        schemas.put("notifications", "System notifications, alerts, and user messages");
        schemas.put("unified_pdf", "PDF documents, manuals, and device documentation");
        schemas.put("organizations", "Organization information for multi-tenant structure");
        
        return schemas;
    }

    /**
     * Get common query patterns and examples
     */
    public List<String> getQueryExamples() {
        return Arrays.asList(
            "Show me all devices that are offline",
            "List maintenance tasks due this week",
            "Find all users in the organization",
            "Show devices assigned to a specific user",
            "List high priority maintenance tasks",
            "Find devices by location",
            "Show maintenance history for a device",
            "List all safety precautions for a device",
            "Find notifications for a specific user",
            "Show devices by type and status",
            "List overdue maintenance tasks",
            "Find devices by manufacturer",
            "Show maintenance tasks by category",
            "List users by role",
            "Find devices with specific protocols"
        );
    }

    /**
     * Get field mappings for natural language processing
     */
    public Map<String, List<String>> getFieldMappings() {
        Map<String, List<String>> mappings = new HashMap<>();
        
        // Device fields
        mappings.put("device_name", Arrays.asList("name", "device name", "device", "machine", "equipment"));
        mappings.put("device_status", Arrays.asList("status", "state", "condition", "online", "offline"));
        mappings.put("device_type", Arrays.asList("type", "kind", "category", "sensor", "actuator", "machine"));
        mappings.put("device_location", Arrays.asList("location", "place", "area", "site", "floor", "building"));
        
        // Maintenance fields
        mappings.put("maintenance_task", Arrays.asList("task", "maintenance", "service", "repair", "inspection"));
        mappings.put("maintenance_priority", Arrays.asList("priority", "urgent", "important", "critical", "high", "medium", "low"));
        mappings.put("maintenance_status", Arrays.asList("status", "completed", "pending", "overdue", "in progress"));
        mappings.put("maintenance_due", Arrays.asList("due", "scheduled", "next", "upcoming", "deadline"));
        
        // User fields
        mappings.put("user_name", Arrays.asList("name", "user", "person", "employee", "staff"));
        mappings.put("user_role", Arrays.asList("role", "permission", "admin", "user", "viewer"));
        mappings.put("user_email", Arrays.asList("email", "contact", "address"));
        
        return mappings;
    }
}
