-- Database Schema Initialization Script
-- This script creates all necessary tables for the shiftAIOT Platform
-- Using existing iotplatform database

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'USER',
    organization_id VARCHAR(255) DEFAULT 'default',
    avatar VARCHAR(255),
    enabled BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id VARCHAR(255) NOT NULL,
    permissions VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, permissions),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'OFFLINE',
    protocol VARCHAR(50) DEFAULT 'HTTP',
    location VARCHAR(255) NOT NULL,
    firmware VARCHAR(50),
    ip_address VARCHAR(45),
    port INTEGER,
    organization_id VARCHAR(255) NOT NULL,
    last_seen TIMESTAMP,
    battery_level INTEGER,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Additional device fields
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    mac_address VARCHAR(17),
    manual_url VARCHAR(500),
    datasheet_url VARCHAR(500),
    certificate_url VARCHAR(500),
    description VARCHAR(1000),
    installation_notes VARCHAR(2000),
    maintenance_schedule VARCHAR(500),
    warranty_info VARCHAR(500),
    wifi_ssid VARCHAR(100),
    mqtt_broker VARCHAR(100),
    mqtt_topic VARCHAR(100),
    power_source VARCHAR(50),
    power_consumption DOUBLE PRECISION,
    operating_temperature_min DOUBLE PRECISION,
    operating_temperature_max DOUBLE PRECISION,
    operating_humidity_min DOUBLE PRECISION,
    operating_humidity_max DOUBLE PRECISION
);

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
    active BOOLEAN DEFAULT true,
    organization_id VARCHAR(255) NOT NULL,
    last_triggered TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rule Conditions table
CREATE TABLE IF NOT EXISTS rule_conditions (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    metric VARCHAR(100),
    operator VARCHAR(50),
    value VARCHAR(255),
    logic_operator VARCHAR(20) DEFAULT 'AND',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rule_id) REFERENCES rules(id) ON DELETE CASCADE
);

-- Rule Actions table
CREATE TABLE IF NOT EXISTS rule_actions (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
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

-- User Permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id VARCHAR(255) NOT NULL,
    permissions VARCHAR(100) NOT NULL,
    PRIMARY KEY (user_id, permissions),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Knowledge Documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    document_type VARCHAR(50) NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'PENDING',
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_organization ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_devices_organization ON devices(organization_id);
CREATE INDEX IF NOT EXISTS idx_rules_organization ON rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_documents(organization_id);

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
INSERT INTO devices (id, name, type, status, protocol, ip_address, port, location, organization_id)
SELECT 
    'device-001',
    'Temperature Sensor 1',
    'SENSOR',
    'ONLINE',
    'HTTP',
    '192.168.1.100',
    8100,
    'Building A - Floor 1',
    'default'
WHERE NOT EXISTS (SELECT 1 FROM devices WHERE id = 'device-001');

INSERT INTO devices (id, name, type, status, protocol, ip_address, port, location, organization_id)
SELECT 
    'device-002',
    'Humidity Sensor 1',
    'SENSOR',
    'ONLINE',
    'HTTP',
    '192.168.1.101',
    8100,
    'Building A - Floor 1',
    'default'
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
INSERT INTO rule_conditions (id, rule_id, type, metric, operator, value)
SELECT 
    'condition-001',
    'rule-001',
    'TELEMETRY_THRESHOLD',
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
