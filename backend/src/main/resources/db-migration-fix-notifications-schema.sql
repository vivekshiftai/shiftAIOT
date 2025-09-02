-- Database Migration Script to Fix Notifications Table Schema
-- This script adds missing columns to the notifications table to match the Java entity

-- Check if the category column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'category'
    ) THEN
        ALTER TABLE notifications ADD COLUMN category VARCHAR(50);
        RAISE NOTICE 'Added category column to notifications table';
    ELSE
        RAISE NOTICE 'Category column already exists in notifications table';
    END IF;
END $$;

-- Check if other missing columns exist, if not add them
DO $$
BEGIN
    -- Add device_location column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'device_location'
    ) THEN
        ALTER TABLE notifications ADD COLUMN device_location VARCHAR(255);
        RAISE NOTICE 'Added device_location column to notifications table';
    END IF;
    
    -- Add device_manufacturer column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'device_manufacturer'
    ) THEN
        ALTER TABLE notifications ADD COLUMN device_manufacturer VARCHAR(255);
        RAISE NOTICE 'Added device_manufacturer column to notifications table';
    END IF;
    
    -- Add device_model column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'device_model'
    ) THEN
        ALTER TABLE notifications ADD COLUMN device_model VARCHAR(255);
        RAISE NOTICE 'Added device_model column to notifications table';
    END IF;
    
    -- Add device_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'device_name'
    ) THEN
        ALTER TABLE notifications ADD COLUMN device_name VARCHAR(255);
        RAISE NOTICE 'Added device_name column to notifications table';
    END IF;
    
    -- Add device_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'device_status'
    ) THEN
        ALTER TABLE notifications ADD COLUMN device_status VARCHAR(50);
        RAISE NOTICE 'Added device_status column to notifications table';
    END IF;
    
    -- Add device_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'device_type'
    ) THEN
        ALTER TABLE notifications ADD COLUMN device_type VARCHAR(100);
        RAISE NOTICE 'Added device_type column to notifications table';
    END IF;
    
    -- Add maintenance_rules_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'maintenance_rules_count'
    ) THEN
        ALTER TABLE notifications ADD COLUMN maintenance_rules_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added maintenance_rules_count column to notifications table';
    END IF;
    
    -- Add safety_rules_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'safety_rules_count'
    ) THEN
        ALTER TABLE notifications ADD COLUMN safety_rules_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added safety_rules_count column to notifications table';
    END IF;
    
    -- Add total_rules_count column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'total_rules_count'
    ) THEN
        ALTER TABLE notifications ADD COLUMN total_rules_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_rules_count column to notifications table';
    END IF;
    
    -- Add rule_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notifications' AND column_name = 'rule_id'
    ) THEN
        ALTER TABLE notifications ADD COLUMN rule_id VARCHAR(255);
        RAISE NOTICE 'Added rule_id column to notifications table';
    END IF;
END $$;

-- Update existing records to have default values for new columns
UPDATE notifications 
SET 
    category = COALESCE(category, 'SYSTEM'),
    device_location = COALESCE(device_location, 'Unknown'),
    device_manufacturer = COALESCE(device_manufacturer, 'Unknown'),
    device_model = COALESCE(device_model, 'Unknown'),
    device_name = COALESCE(device_name, 'Unknown'),
    device_status = COALESCE(device_status, 'UNKNOWN'),
    device_type = COALESCE(device_type, 'UNKNOWN'),
    maintenance_rules_count = COALESCE(maintenance_rules_count, 0),
    safety_rules_count = COALESCE(safety_rules_count, 0),
    total_rules_count = COALESCE(total_rules_count, 0)
WHERE 
    category IS NULL 
    OR device_location IS NULL 
    OR device_manufacturer IS NULL 
    OR device_model IS NULL 
    OR device_name IS NULL 
    OR device_status IS NULL 
    OR device_type IS NULL 
    OR maintenance_rules_count IS NULL 
    OR safety_rules_count IS NULL 
    OR total_rules_count IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_device_id ON notifications(device_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Verify the schema
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Show the final table structure
\d notifications;
