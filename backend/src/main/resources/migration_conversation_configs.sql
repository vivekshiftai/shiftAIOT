-- Migration script to update conversation_configs table
-- Run this script to fix the JSON storage issue

-- First, backup existing data (if any)
CREATE TABLE IF NOT EXISTS conversation_configs_backup AS 
SELECT * FROM conversation_configs;

-- Drop the existing table
DROP TABLE IF EXISTS conversation_configs;

-- Recreate the table with JSONB column
CREATE TABLE conversation_configs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    platform_type VARCHAR(50) NOT NULL, -- 'slack', 'gmail', 'teams', 'google_chat', 'sms'
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_conversation_configs_user ON conversation_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_configs_platform ON conversation_configs(platform_type);

-- Restore data from backup (if any data existed)
-- Note: This will only work if the backup table has data and the JSON is valid
-- INSERT INTO conversation_configs SELECT * FROM conversation_configs_backup;

-- Drop the backup table
-- DROP TABLE conversation_configs_backup;

-- Note: The backup table is kept for safety. You can drop it manually after verifying the migration worked.
