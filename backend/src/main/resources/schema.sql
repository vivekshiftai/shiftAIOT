-- Complete Database Schema for shiftAIOT Platform
-- This script creates all necessary tables with proper existence checks
--
-- NOTIFICATIONS TABLE STRUCTURE:
-- The notifications table includes all required columns for the Java entity:
-- - Basic fields: id, title, message, category, read, device_id, rule_id, user_id, organization_id, created_at
-- - Enhanced device info: device_name, device_type, device_location, device_status, device_manufacturer, device_model
-- - Rules counts: maintenance_rules_count, safety_rules_count, total_rules_count
-- - All fields have proper defaults and constraints
-- - Comprehensive indexing for optimal performance

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

-- Add missing columns to organizations table if they don't exist
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'FREE';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add assigned_user_id column to devices table if it doesn't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_user_id VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);

-- Add missing columns to devices table if they don't exist
ALTER TABLE devices ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS model VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS port INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mqtt_broker VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mqtt_topic VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mqtt_username VARCHAR(100);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS mqtt_password VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS http_endpoint VARCHAR(500);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS http_method VARCHAR(10) DEFAULT 'GET';
ALTER TABLE devices ADD COLUMN IF NOT EXISTS http_headers TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS coap_host VARCHAR(255);
ALTER TABLE devices ADD COLUMN IF NOT EXISTS coap_port INTEGER;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS coap_path VARCHAR(255);

-- Add new columns to rules table if they don't exist
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric VARCHAR(100);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric_value VARCHAR(100);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS threshold VARCHAR(200);
ALTER TABLE rules ADD COLUMN IF NOT EXISTS consequence TEXT;
ALTER TABLE rules ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);

-- Add missing columns to rule_conditions table if they don't exist
ALTER TABLE rule_conditions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE rule_conditions ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);
ALTER TABLE rule_conditions ADD COLUMN IF NOT EXISTS metric VARCHAR(100);
ALTER TABLE rule_conditions ADD COLUMN IF NOT EXISTS operator VARCHAR(50);
ALTER TABLE rule_conditions ADD COLUMN IF NOT EXISTS condition_value VARCHAR(255);
ALTER TABLE rule_conditions ADD COLUMN IF NOT EXISTS logic_operator VARCHAR(20) DEFAULT 'AND';

-- Add missing columns to rule_actions table if they don't exist
ALTER TABLE rule_actions ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE rule_actions ADD COLUMN IF NOT EXISTS action_data JSON;

-- Add missing columns to device_maintenance table if they don't exist
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS component_name VARCHAR(255) DEFAULT 'General';
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(50) DEFAULT 'GENERAL' NOT NULL;
-- Update any existing null maintenance_type values to 'GENERAL'
UPDATE device_maintenance SET maintenance_type = 'GENERAL' WHERE maintenance_type IS NULL;
-- Ensure maintenance_type cannot be null
ALTER TABLE device_maintenance ALTER COLUMN maintenance_type SET NOT NULL;
-- Add constraint to prevent future null values
ALTER TABLE device_maintenance ADD CONSTRAINT chk_maintenance_type_not_null CHECK (maintenance_type IS NOT NULL);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS frequency VARCHAR(100);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS last_maintenance DATE;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS next_maintenance DATE;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS priority VARCHAR(50) DEFAULT 'MEDIUM';
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE';
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10,2);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(100);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS required_tools TEXT;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS safety_notes TEXT;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(255);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(255);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS completed_by VARCHAR(255);
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Add missing columns to device_safety_precautions table if they don't exist
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS precaution_type VARCHAR(100);
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50) DEFAULT 'MEDIUM';
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS mitigation_steps TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS required_ppe TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS emergency_procedures TEXT;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);

-- Old ALTER TABLE statements removed - tables no longer exist
-- All PDF storage now uses the unified_pdfs table

-- Add missing columns to conversation_configs table if they don't exist
ALTER TABLE conversation_configs ADD COLUMN IF NOT EXISTS platform_name VARCHAR(100);
ALTER TABLE conversation_configs ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50);
ALTER TABLE conversation_configs ADD COLUMN IF NOT EXISTS credentials JSONB;
ALTER TABLE conversation_configs ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE conversation_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Old pdf_documents table columns removed - now using unified_pdfs table

-- Add missing columns to pdf_queries table if they don't exist
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS user_query TEXT;
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS ai_response TEXT;
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS chunks_used TEXT;
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS processing_time VARCHAR(100);
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Add missing columns to user_preferences table if they don't exist
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS device_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS system_updates BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS weekly_reports BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS critical_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS performance_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS security_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS maintenance_alerts BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS data_backup_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS user_activity_alerts BOOLEAN DEFAULT false;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS rule_trigger_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS dashboard_show_real_time_charts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS dashboard_auto_refresh BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS dashboard_refresh_interval INTEGER DEFAULT 30;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS dashboard_show_device_status BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS dashboard_show_alerts BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS dashboard_show_performance_metrics BOOLEAN DEFAULT true;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add missing columns to notification_templates table if they don't exist
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS title_template VARCHAR(200);
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS message_template TEXT;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'INFO';
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS description VARCHAR(500);

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

-- Device Maintenance table for onboarding flow - Updated to match new model
CREATE TABLE IF NOT EXISTS device_maintenance (
    id VARCHAR(255) PRIMARY KEY,
    device_id VARCHAR(255) NOT NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    component_name VARCHAR(255) DEFAULT 'General',
    maintenance_type VARCHAR(50) DEFAULT 'GENERAL' NOT NULL, -- 'PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'GENERAL'
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

-- Remove old deprecated tables completely
DROP TABLE IF EXISTS device_documentation CASCADE;
DROP TABLE IF EXISTS knowledge_documents CASCADE;
DROP TABLE IF EXISTS pdf_documents CASCADE;

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
    device_type VARCHAR(100),
    device_location VARCHAR(255),
    device_status VARCHAR(50),
    maintenance_rules_count INTEGER DEFAULT 0,
    safety_rules_count INTEGER DEFAULT 0,
    total_rules_count INTEGER DEFAULT 0,
    device_manufacturer VARCHAR(255),
    device_model VARCHAR(255),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE SET NULL
);

-- Add missing columns to existing notifications table if they don't exist
-- This ensures the table structure matches the Java entity model
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_type VARCHAR(100);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_location VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_status VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS maintenance_rules_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS safety_rules_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS total_rules_count INTEGER DEFAULT 0;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_manufacturer VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_model VARCHAR(255);

-- Set default category for existing notifications if category is NULL
UPDATE notifications SET category = 'DEVICE_ASSIGNMENT' WHERE category IS NULL;

-- Make category column NOT NULL after setting defaults
ALTER TABLE notifications ALTER COLUMN category SET NOT NULL;

-- Migrate existing notification types to categories if type column exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        UPDATE notifications 
        SET category = CASE 
            WHEN type = 'INFO' THEN 'DEVICE_ASSIGNMENT'
            WHEN type = 'WARNING' THEN 'PERFORMANCE_ALERT'
            WHEN type = 'ERROR' THEN 'SECURITY_ALERT'
            WHEN type = 'SUCCESS' THEN 'DEVICE_CREATION'
            ELSE 'CUSTOM'
        END
        WHERE category IS NULL;
    END IF;
END $$;

-- Update existing notifications with device information where possible
UPDATE notifications n
SET 
    device_name = d.name,
    device_type = d.type::text,
    device_location = d.location,
    device_status = d.status::text,
    device_manufacturer = d.manufacturer,
    device_model = d.model
FROM devices d
WHERE n.device_id = d.id 
  AND n.device_name IS NULL;

-- Update device rules counts for existing notifications
UPDATE notifications n
SET 
    total_rules_count = COALESCE(rule_counts.total_rules, 0),
    maintenance_rules_count = COALESCE(maintenance_counts.maintenance_count, 0),
    safety_rules_count = COALESCE(safety_counts.safety_count, 0)
FROM (
    SELECT device_id, COUNT(*) as total_rules
    FROM rules
    GROUP BY device_id
) rule_counts
LEFT JOIN (
    SELECT device_id, COUNT(*) as maintenance_count
    FROM device_maintenance
    WHERE status = 'ACTIVE'
    GROUP BY device_id
) maintenance_counts ON rule_counts.device_id = maintenance_counts.device_id
LEFT JOIN (
    SELECT device_id, COUNT(*) as safety_count
    FROM device_safety_precautions
    WHERE is_active = true
    GROUP BY device_id
) safety_counts ON rule_counts.device_id = safety_counts.device_id
WHERE n.device_id = rule_counts.device_id
  AND n.total_rules_count IS NULL;

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

-- Knowledge Documents table removed - now using unified_pdfs table

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

-- Old PDF-related tables have been removed and replaced with unified_pdfs table

-- Unified PDF Documents Table - Single source of truth for all PDFs
CREATE TABLE IF NOT EXISTS unified_pdfs (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- PDF name from external service
    original_filename VARCHAR(255) NOT NULL, -- Original uploaded filename
    title VARCHAR(255), -- Document title/description
    document_type VARCHAR(50) NOT NULL, -- 'manual', 'datasheet', 'certificate', 'general'
    file_size BIGINT NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Path to stored file or 'external_service'
    
    -- Processing and AI Integration
    processing_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    processing_summary TEXT,
    total_pages INTEGER,
    processed_chunks INTEGER,
    processing_time VARCHAR(100), -- Processing time as string (e.g., "12.45s")
    collection_name VARCHAR(255), -- Vector database collection name
    vectorized BOOLEAN DEFAULT false,
    
    -- Device Association (nullable for general documents)
    device_id VARCHAR(255),
    device_name VARCHAR(255), -- Stored device name for display
    
    -- Organization and User Context
    organization_id VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(255), -- User who uploaded the PDF
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Soft delete
    deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_unified_pdfs_org_id (organization_id),
    INDEX idx_unified_pdfs_device_id (device_id),
    INDEX idx_unified_pdfs_name_org (name, organization_id),
    INDEX idx_unified_pdfs_uploaded_at (uploaded_at),
    INDEX idx_unified_pdfs_status (processing_status),
    INDEX idx_unified_pdfs_deleted (deleted),
    INDEX idx_unified_pdfs_type (document_type)
);

-- Update PDF Queries Table to reference unified_pdfs
CREATE TABLE IF NOT EXISTS pdf_queries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pdf_document_id VARCHAR(255) NOT NULL, -- Reference to unified_pdfs.id
    user_id VARCHAR(255) NOT NULL,
    device_id VARCHAR(255), -- Device context for the query
    organization_id VARCHAR(255) NOT NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    chunks_used TEXT,
    processing_time VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (pdf_document_id) REFERENCES unified_pdfs(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    
    INDEX idx_pdf_query_doc_id (pdf_document_id),
    INDEX idx_pdf_query_user_id (user_id),
    INDEX idx_pdf_query_device_id (device_id),
    INDEX idx_pdf_query_org_id (organization_id),
    INDEX idx_pdf_query_created_at (created_at),
    INDEX idx_pdf_query_status (status),
    INDEX idx_pdf_query_deleted (deleted)
);

-- Migration: Add device_id and device_name columns to existing pdf_queries if they don't exist
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS device_id VARCHAR(255);
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- Add foreign key constraints if they don't exist
ALTER TABLE pdf_queries ADD CONSTRAINT IF NOT EXISTS fk_pdf_queries_device 
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL;
ALTER TABLE pdf_queries ADD CONSTRAINT IF NOT EXISTS fk_pdf_queries_org 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_pdf_query_device_id ON pdf_queries(device_id);
CREATE INDEX IF NOT EXISTS idx_pdf_query_org_id ON pdf_queries(organization_id);

-- Create all indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_user ON devices(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_devices_assigned_by ON devices(assigned_by);
CREATE INDEX IF NOT EXISTS idx_rules_organization ON rules(organization_id);

-- Comprehensive notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_device_id ON notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_notifications_rule_id ON notifications(rule_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

CREATE INDEX IF NOT EXISTS idx_notification_templates_organization ON notification_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_templates_name_org ON notification_templates(name, organization_id);
-- Old table indexes removed - now using unified_pdfs table indexes
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
