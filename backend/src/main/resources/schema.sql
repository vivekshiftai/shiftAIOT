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

-- Add assigned_by column to devices table if it doesn't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);

-- Add new columns to rules table if they don't exist
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric VARCHAR(100);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric_value VARCHAR(100);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS threshold VARCHAR(200);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS consequence TEXT;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- User Permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id VARCHAR(255) NOT NULL,
    permissions VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, permissions),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Devices table - Cleaned up schema with only necessary fields used in onboarding
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'SENSOR',
    status VARCHAR(50) DEFAULT 'OFFLINE',
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
    coap_path VARCHAR(255)
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
    task_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    component_name VARCHAR(255),
    maintenance_type VARCHAR(100), -- 'PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE'
    frequency VARCHAR(100) NOT NULL,
    last_maintenance DATE,
    next_maintenance DATE NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    estimated_cost DECIMAL(10,2),
    estimated_duration VARCHAR(100), -- New field for estimated duration
    required_tools TEXT, -- New field for required tools
    safety_notes TEXT, -- New field for safety notes
    assigned_to VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED', 'OVERDUE'
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Add organization_id column to device_maintenance if it doesn't exist
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- Add new columns to device_maintenance for enhanced maintenance data
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(100);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS required_tools TEXT;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS safety_notes TEXT;

-- Device Safety Precautions table for onboarding flow - Updated to match new model
CREATE TABLE IF NOT EXISTS device_safety_precautions (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'warning', 'procedure', 'caution', 'note'
    category VARCHAR(100) NOT NULL, -- 'thermal_hazard', 'electrical_hazard', 'mechanical_hazard', 'emergency_procedures', 'ppe_requirements'
    severity VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    recommended_action TEXT,
    about_reaction TEXT,
    causes TEXT,
    how_to_avoid TEXT,
    safety_info TEXT,
    is_active BOOLEAN DEFAULT true,
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Add organization_id column to device_safety_precautions if it doesn't exist
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- Add new columns to device_safety_precautions table if they don't exist
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'warning';
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS about_reaction TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS causes TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS how_to_avoid TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS safety_info TEXT;

-- Update any existing records that might have NULL type values
UPDATE device_safety_precautions SET type = 'warning' WHERE type IS NULL;

-- Add new columns to device_documentation table for external PDF processing response
ALTER TABLE device_documentation ADD COLUMN IF NOT EXISTS collection_name VARCHAR(255);
ALTER TABLE device_documentation ADD COLUMN IF NOT EXISTS pdf_name VARCHAR(255);

-- Add new column to pdf_documents table for external PDF processing response
ALTER TABLE pdf_documents ADD COLUMN IF NOT EXISTS pdf_name VARCHAR(255);

-- Fix rule_conditions table column name to avoid reserved keyword
ALTER TABLE rule_conditions RENAME COLUMN IF EXISTS value TO condition_value;

-- Device Tags table
CREATE TABLE IF NOT EXISTS device_tags (
    device_id VARCHAR(255) NOT NULL,
    tag VARCHAR(255) NOT NULL,
    PRIMARY KEY (device_id, tag),
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Device Config table
CREATE TABLE IF NOT EXISTS device_config (
    device_id VARCHAR(255) NOT NULL,
    config_key VARCHAR(255) NOT NULL,
    config_value VARCHAR(255),
    PRIMARY KEY (device_id, config_key),
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    metric VARCHAR(100),
    metric_value VARCHAR(100),
    threshold VARCHAR(200),
    consequence TEXT,
    device_id VARCHAR(255),
    active BOOLEAN DEFAULT true,
    organization_id VARCHAR(255) NOT NULL,
    last_triggered TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
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

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

-- Conversation Configurations table
CREATE TABLE IF NOT EXISTS conversation_configs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    platform_type VARCHAR(50) NOT NULL, -- 'slack', 'gmail', 'teams', 'google_chat', 'sms'
    credentials JSON NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_notification_templates_organization ON notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name_org ON notification_templates(name, organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_documentation_device ON device_documentation(device_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_device ON device_maintenance(device_id);
CREATE INDEX IF NOT EXISTS idx_device_maintenance_organization ON device_maintenance(organization_id);
CREATE INDEX IF NOT EXISTS idx_device_safety_device ON device_safety_precautions(device_id);
CREATE INDEX IF NOT EXISTS idx_device_safety_active ON device_safety_precautions(is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_configs_user ON conversation_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_configs_platform ON conversation_configs(platform_type);
CREATE INDEX IF NOT EXISTS idx_rule_conditions_rule ON rule_conditions(rule_id);
CREATE INDEX IF NOT EXISTS idx_rule_conditions_device ON rule_conditions(device_id);
CREATE INDEX IF NOT EXISTS idx_rule_actions_rule ON rule_actions(rule_id);

-- Insert default admin user if not exists
INSERT INTO users (id, first_name, last_name, email, password, role, organization_id)
SELECT 
    'admin-001',
    'Admin',
    'User',
    'admin@shiftaiot.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'ADMIN',
    'default'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@shiftaiot.com');

-- Insert default permissions for admin user
INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'DEVICE_READ'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'DEVICE_READ');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'DEVICE_WRITE'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'DEVICE_WRITE');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'DEVICE_DELETE'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'DEVICE_DELETE');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'RULE_READ'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'RULE_READ');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'RULE_WRITE'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'RULE_WRITE');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'RULE_DELETE'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'RULE_DELETE');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'USER_READ'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'USER_READ');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'USER_WRITE'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'USER_WRITE');

INSERT INTO user_permissions (user_id, permissions)
SELECT 
    'admin-001',
    'USER_DELETE'
WHERE NOT EXISTS (SELECT 1 FROM user_permissions WHERE user_id = 'admin-001' AND permissions = 'USER_DELETE');

-- Insert sample devices if not exists
INSERT INTO devices (id, name, type, status, protocol, ip_address, port, location, organization_id, assigned_by)
SELECT 
    'device-001',
    'Temperature Sensor 1',
    'SENSOR',
    'ONLINE',
    'HTTP',
    '192.168.1.100',
    8100,
    'Building A - Floor 1',
    'default',
    'admin-001'
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE id = 'device-001');

INSERT INTO devices (id, name, type, status, protocol, ip_address, port, location, organization_id, assigned_by)
SELECT 
    'device-002',
    'Humidity Sensor 1',
    'SENSOR',
    'ONLINE',
    'HTTP',
    '192.168.1.101',
    8100,
    'Building A - Floor 1',
    'default',
    'admin-001'
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE id = 'device-002');

-- Insert sample rules if not exists
INSERT INTO rules (id, name, description, active, organization_id)
SELECT 
    'rule-001',
    'High Temperature Alert',
    'Alert when temperature exceeds 30°C',
    true,
    'default'
WHERE NOT EXISTS (SELECT 1 FROM rules WHERE id = 'rule-001');

-- Insert sample rule conditions
INSERT INTO rule_conditions (id, rule_id, type, device_id, metric, operator, condition_value)
SELECT 
    'condition-001',
    'rule-001',
    'TELEMETRY_THRESHOLD',
    'device-001',
    'temperature',
    'GREATER_THAN',
    '30'
WHERE NOT EXISTS (SELECT 1 FROM rule_conditions WHERE id = 'condition-001');

-- Insert sample rule actions
INSERT INTO rule_actions (id, rule_id, type, action_data)
SELECT 
    'action-001',
    'rule-001',
    'NOTIFICATION',
    '{"notificationType": "EMAIL", "recipients": ["admin@shiftaiot.com"], "subject": "High Temperature Alert", "message": "Temperature has exceeded 30°C"}'
WHERE NOT EXISTS (SELECT 1 FROM rule_actions WHERE id = 'action-001');

-- Insert sample maintenance data for device-001
INSERT INTO device_maintenance (id, task_name, device_id, device_name, component_name, maintenance_type, frequency, next_maintenance, description, priority, status, organization_id)
SELECT 
    'maintenance-001',
    'Temperature Sensor Calibration',
    'device-001',
    'Temperature Sensor 1',
    'Temperature Sensor',
    'PREVENTIVE',
    'monthly',
    CURRENT_DATE + INTERVAL '1 month',
    'Calibrate temperature sensor to ensure accurate readings',
    'MEDIUM',
    'ACTIVE',
    'default'
WHERE NOT EXISTS (SELECT 1 FROM device_maintenance WHERE id = 'maintenance-001');

-- Insert sample safety precautions for device-001
INSERT INTO device_safety_precautions (id, device_id, title, description, type, severity, category, recommended_action, is_active, organization_id)
SELECT 
    'safety-001',
    'device-001',
    'High Temperature Warning',
    'Device may reach high temperatures during operation',
    'warning',
    'HIGH',
    'thermal_hazard',
    'Ensure proper ventilation and monitor temperature readings',
    true,
    'default'
WHERE NOT EXISTS (SELECT 1 FROM device_safety_precautions WHERE id = 'safety-001');

-- Insert default user account for testing
INSERT INTO users (id, first_name, last_name, email, password, role, organization_id)
SELECT 
    'user-001',
    'Test',
    'User',
    'user@shiftaiot.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: user123
    'USER',
    'default'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'user@shiftaiot.com');
