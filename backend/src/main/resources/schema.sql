-- Complete Database Schema for shiftAIOT Platform
-- This script creates all necessary tables with proper existence checks

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'USER',
    organization_id VARCHAR(255) DEFAULT 'default',
    avatar VARCHAR(255),
    enabled BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Integration IDs
    gmail_id VARCHAR(255),
    slack_id VARCHAR(255),
    team_id VARCHAR(255)
);

-- Add missing columns to users table if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS slack_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id VARCHAR(255);

-- Add phone column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Add assigned_user_id column to devices table if it doesn't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_user_id VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);

-- Add new columns to rules table if they don't exist
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric VARCHAR(100);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric_value VARCHAR(100);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS threshold VARCHAR(200);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS consequence TEXT;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- User Permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT true,
    granted_by VARCHAR(255),
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    logo_url VARCHAR(500),
    subscription_plan VARCHAR(50) DEFAULT 'FREE',
    subscription_status VARCHAR(50) DEFAULT 'ACTIVE',
    subscription_expires_at TIMESTAMP,
    max_users INTEGER DEFAULT 5,
    max_devices INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SENSOR',
    status VARCHAR(50) DEFAULT 'ONLINE',
    protocol VARCHAR(50) DEFAULT 'HTTP',
    location VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    assigned_user_id VARCHAR(255),
    assigned_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Basic device info (nullable) - only fields used in onboarding form
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    description TEXT,
    
    -- Connection details (nullable) - only fields used in onboarding form
    ip_address VARCHAR(45),
    port INTEGER,
    
    -- MQTT specific fields (nullable) - only fields used in onboarding form
    mqtt_broker VARCHAR(255),
    mqtt_topic VARCHAR(255),
    mqtt_username VARCHAR(100),
    mqtt_password VARCHAR(255),
    
    -- HTTP specific fields (nullable) - only fields used in onboarding form
    http_endpoint VARCHAR(500),
    http_method VARCHAR(10) DEFAULT 'GET',
    http_headers TEXT, -- JSON string
    
    -- COAP specific fields (nullable) - only fields used in onboarding form
    coap_host VARCHAR(255),
    coap_port INTEGER,
    coap_path VARCHAR(255),
    
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Device Documentation table for onboarding flow
CREATE TABLE IF NOT EXISTS device_documentation (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- 'manual', 'datasheet', 'certificate'
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    processing_summary TEXT,
    total_pages INTEGER,
    processed_chunks INTEGER,
    processing_time VARCHAR(100), -- Changed to VARCHAR to store time as string (e.g., "12.45s")
    collection_name VARCHAR(255), -- Added to store collection name from external service
    pdf_name VARCHAR(255), -- Added to store PDF name from external service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Device Maintenance table for onboarding flow - Updated to match new model
CREATE TABLE IF NOT EXISTS device_maintenance (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    component_name VARCHAR(255),
    maintenance_type VARCHAR(50), -- 'PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'GENERAL'
    frequency VARCHAR(100) NOT NULL,
    last_maintenance DATE,
    next_maintenance DATE NOT NULL,
    priority VARCHAR(50) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE', 'PENDING'
    estimated_cost DECIMAL(10,2),
    estimated_duration VARCHAR(100), -- e.g., "2 hours", "1 day"
    required_tools TEXT,
    safety_notes TEXT,
    category VARCHAR(100),
    assigned_to VARCHAR(255),
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMP,
    completed_by VARCHAR(255),
    completed_at TIMESTAMP,
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Device Safety Precautions table for onboarding flow
CREATE TABLE IF NOT EXISTS device_safety_precautions (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    precaution_type VARCHAR(100) NOT NULL, -- 'electrical', 'mechanical', 'chemical', 'environmental'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    risk_level VARCHAR(50) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    mitigation_steps TEXT,
    required_ppe TEXT, -- Personal Protective Equipment
    emergency_procedures TEXT,
    is_active BOOLEAN DEFAULT true,
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'DEVICE_STATUS', 'TELEMETRY_THRESHOLD', 'TIME_BASED', 'COMPOSITE'
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'INACTIVE', 'DRAFT'
    priority VARCHAR(50) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    organization_id VARCHAR(255) NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Rule Conditions table - Updated to match new model
CREATE TABLE IF NOT EXISTS rule_conditions (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'DEVICE_STATUS', 'TELEMETRY_THRESHOLD', 'TIME_BASED'
    device_id VARCHAR(255),
    metric VARCHAR(100),
    operator VARCHAR(50), -- 'GREATER_THAN', 'LESS_THAN', 'EQUALS', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN_OR_EQUAL'
    condition_value VARCHAR(255), -- Changed from 'value' to 'condition_value' to avoid reserved keyword
    logic_operator VARCHAR(20) DEFAULT 'AND', -- 'AND', 'OR'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Rule Actions table - Updated to match new model
CREATE TABLE IF NOT EXISTS rule_actions (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'NOTIFICATION', 'EMAIL', 'SMS', 'WEBHOOK'
    action_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

-- Notifications table - UPDATED to match entity model
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'DEVICE_ASSIGNMENT', 'DEVICE_CREATION', 'MAINTENANCE_SCHEDULE', etc.
    read BOOLEAN DEFAULT false,
    device_id VARCHAR(255),
    rule_id VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Enhanced device information fields
    device_name VARCHAR(255),
    device_type VARCHAR(50),
    device_location VARCHAR(255),
    device_status VARCHAR(50),
    maintenance_rules_count INTEGER,
    safety_rules_count INTEGER,
    total_rules_count INTEGER,
    device_manufacturer VARCHAR(100),
    device_model VARCHAR(100),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL
);

-- Notification Metadata table - ADDED for storing additional notification data
CREATE TABLE IF NOT EXISTS notification_metadata (
    notification_id VARCHAR(255) NOT NULL,
    metadata_key VARCHAR(255) NOT NULL,
    metadata_value TEXT,
    PRIMARY KEY (notification_id, metadata_key),
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- Notification Templates table
CREATE TABLE IF NOT EXISTS notification_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title_template VARCHAR(200) NOT NULL,
    message_template TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    is_active BOOLEAN DEFAULT true,
    organization_id VARCHAR(255) NOT NULL,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(500)
);

-- Notification Template Variables table - ADDED for storing template variables
CREATE TABLE IF NOT EXISTS notification_template_variables (
    template_id VARCHAR(255) NOT NULL,
    variable_key VARCHAR(255) NOT NULL,
    variable_description TEXT,
    PRIMARY KEY (template_id, variable_key),
    FOREIGN KEY (template_id) REFERENCES notification_templates(id) ON DELETE CASCADE
);

-- Knowledge Documents table - Fixed schema
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    vectorized BOOLEAN DEFAULT false,
    organization_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255),
    device_name VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
);

-- User Preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Notification settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    device_alerts BOOLEAN DEFAULT true,
    system_updates BOOLEAN DEFAULT false,
    weekly_reports BOOLEAN DEFAULT true,
    critical_alerts BOOLEAN DEFAULT true,
    performance_alerts BOOLEAN DEFAULT true,
    security_alerts BOOLEAN DEFAULT true,
    maintenance_alerts BOOLEAN DEFAULT false,
    data_backup_alerts BOOLEAN DEFAULT true,
    user_activity_alerts BOOLEAN DEFAULT false,
    rule_trigger_alerts BOOLEAN DEFAULT true,
    
    -- Dashboard settings
    dashboard_show_real_time_charts BOOLEAN DEFAULT true,
    dashboard_auto_refresh BOOLEAN DEFAULT true,
    dashboard_refresh_interval INTEGER DEFAULT 30,
    dashboard_show_device_status BOOLEAN DEFAULT true,
    dashboard_show_alerts BOOLEAN DEFAULT true,
    dashboard_show_performance_metrics BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Conversation Configurations table
CREATE TABLE IF NOT EXISTS conversation_configs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    platform_type VARCHAR(50) NOT NULL CHECK (platform_type IN ('slack', 'gmail', 'teams', 'google_chat', 'sms')),
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- PDF Documents Table
CREATE TABLE IF NOT EXISTS pdf_documents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    chunks_processed INTEGER,
    processing_time VARCHAR(100),
    collection_name VARCHAR(255),
    pdf_name VARCHAR(255), -- Added to store PDF name from external service
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADING',
    organization_id VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    INDEX idx_pdf_org_id (organization_id),
    INDEX idx_pdf_name_org (name, organization_id),
    INDEX idx_pdf_uploaded_at (uploaded_at),
    INDEX idx_pdf_status (status),
    INDEX idx_pdf_deleted (deleted)
);

-- PDF Queries Table
CREATE TABLE IF NOT EXISTS pdf_queries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pdf_document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    chunks_used TEXT,
    processing_time VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (pdf_document_id) REFERENCES pdf_documents(id),
    INDEX idx_pdf_query_doc_id (pdf_document_id),
    INDEX idx_pdf_query_user_id (user_id),
    INDEX idx_pdf_query_created_at (created_at),
    INDEX idx_pdf_query_status (status),
    INDEX idx_pdf_query_deleted (deleted)
);

-- Create all indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_user ON devices(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_by ON devices(assigned_by);
CREATE INDEX IF NOT EXISTS idx_rules_organization ON rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_device ON notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_notifications_rule ON notifications(rule_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notification_templates_organization ON notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name_org ON notification_templates(name, organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_documentation_device ON device_documentation(device_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_device ON device_maintenance(device_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_organization ON device_maintenance(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_assigned_to ON device_maintenance(assigned_to);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_status ON device_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_next_maintenance ON device_maintenance(next_maintenance);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_priority ON device_maintenance(priority);
CREATE INDEX IF NOT EXISTS idx_device_safety_device ON device_safety_precautions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_safety_active ON device_safety_precautions(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_configs_user ON conversation_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_configs_platform ON conversation_configs(platform_type);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_rule_conditions_rule ON rule_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_conditions_device ON rule_conditions(device_id);
CREATE INDEX IF NOT EXISTS idx_rule_actions_rule ON rule_actions(rule_id);

-- Note: Sample data has been removed. Users should be created through the application's user management system.
