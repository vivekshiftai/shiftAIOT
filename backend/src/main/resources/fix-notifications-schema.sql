-- Fix Notifications Table Schema
-- This script adds missing columns to the existing notifications table
-- Run this script to fix the "column category does not exist" error

-- Step 1: Add missing columns to notifications table if they don't exist
DO $$ 
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'category') THEN
        ALTER TABLE notifications ADD COLUMN category VARCHAR(50);
        RAISE NOTICE 'Added category column to notifications table';
    ELSE
        RAISE NOTICE 'Category column already exists in notifications table';
    END IF;
    
    -- Add device_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'device_name') THEN
        ALTER TABLE notifications ADD COLUMN device_name VARCHAR(255);
        RAISE NOTICE 'Added device_name column to notifications table';
    ELSE
        RAISE NOTICE 'Device_name column already exists in notifications table';
    END IF;
    
    -- Add device_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'device_type') THEN
        ALTER TABLE notifications ADD COLUMN device_type VARCHAR(100);
        RAISE NOTICE 'Added device_type column to notifications table';
    ELSE
        RAISE NOTICE 'Device_type column already exists in notifications table';
    END IF;
    
    -- Add device_location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'device_location') THEN
        ALTER TABLE notifications ADD COLUMN device_location VARCHAR(255);
        RAISE NOTICE 'Added device_location column to notifications table';
    ELSE
        RAISE NOTICE 'Device_location column already exists in notifications table';
    END IF;
    
    -- Add device_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'device_status') THEN
        ALTER TABLE notifications ADD COLUMN device_status VARCHAR(50);
        RAISE NOTICE 'Added device_status column to notifications table';
    ELSE
        RAISE NOTICE 'Device_status column already exists in notifications table';
    END IF;
    
    -- Add maintenance_rules_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'maintenance_rules_count') THEN
        ALTER TABLE notifications ADD COLUMN maintenance_rules_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added maintenance_rules_count column to notifications table';
    ELSE
        RAISE NOTICE 'Maintenance_rules_count column already exists in notifications table';
    END IF;
    
    -- Add safety_rules_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'safety_rules_count') THEN
        ALTER TABLE notifications ADD COLUMN safety_rules_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added safety_rules_count column to notifications table';
    ELSE
        RAISE NOTICE 'Safety_rules_count column already exists in notifications table';
    END IF;
    
    -- Add total_rules_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'total_rules_count') THEN
        ALTER TABLE notifications ADD COLUMN total_rules_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added total_rules_count column to notifications table';
    ELSE
        RAISE NOTICE 'Total_rules_count column already exists in notifications table';
    END IF;
    
    -- Add device_manufacturer column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'device_manufacturer') THEN
        ALTER TABLE notifications ADD COLUMN device_manufacturer VARCHAR(255);
        RAISE NOTICE 'Added device_manufacturer column to notifications table';
    ELSE
        RAISE NOTICE 'Device_manufacturer column already exists in notifications table';
    END IF;
    
    -- Add device_model column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'notifications' AND column_name = 'device_model') THEN
        ALTER TABLE notifications ADD COLUMN device_model VARCHAR(255);
        RAISE NOTICE 'Added device_model column to notifications table';
    ELSE
        RAISE NOTICE 'Device_model column already exists in notifications table';
    END IF;
    
END $$;

-- Step 2: Update existing notifications with default category values
UPDATE notifications 
SET category = 'DEVICE_ASSIGNMENT' 
WHERE category IS NULL;

-- Step 3: Make category column NOT NULL after setting default values
ALTER TABLE notifications ALTER COLUMN category SET NOT NULL;

-- Step 4: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
CREATE INDEX IF NOT EXISTS idx_notifications_device_info ON notifications(device_id, device_name, device_type);

-- Step 5: Update existing notifications with device information where possible
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

-- Step 6: Update device rules counts for existing notifications
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

-- Step 7: Verify the fix
SELECT 
    'Schema fix completed successfully' as status,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as notifications_with_category,
    COUNT(CASE WHEN device_name IS NOT NULL THEN 1 END) as notifications_with_device_name
FROM notifications;

-- Step 8: Show table structure
\d notifications;
