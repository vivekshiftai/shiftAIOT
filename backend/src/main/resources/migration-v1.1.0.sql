-- Migration script for notification system update v1.1.0
-- This script updates the notifications table to use categories instead of types
-- and adds enhanced device information fields

-- Step 1: Add new columns to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS device_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS device_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS device_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS maintenance_rules_count INTEGER,
ADD COLUMN IF NOT EXISTS safety_rules_count INTEGER,
ADD COLUMN IF NOT EXISTS total_rules_count INTEGER,
ADD COLUMN IF NOT EXISTS device_manufacturer VARCHAR(100),
ADD COLUMN IF NOT EXISTS device_model VARCHAR(100);

-- Step 2: Migrate existing notification types to categories
UPDATE notifications 
SET category = CASE 
    WHEN type = 'INFO' THEN 'DEVICE_ASSIGNMENT'
    WHEN type = 'WARNING' THEN 'PERFORMANCE_ALERT'
    WHEN type = 'ERROR' THEN 'SECURITY_ALERT'
    WHEN type = 'SUCCESS' THEN 'DEVICE_CREATION'
    ELSE 'CUSTOM'
END
WHERE category IS NULL;

-- Step 3: Make category column NOT NULL after migration
ALTER TABLE notifications ALTER COLUMN category SET NOT NULL;

-- Step 4: Drop the old type column (optional - can be kept for backward compatibility)
-- ALTER TABLE notifications DROP COLUMN type;

-- Step 5: Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);

-- Step 6: Create index on device information fields
CREATE INDEX IF NOT EXISTS idx_notifications_device_info ON notifications(device_id, device_name, device_type);

-- Step 7: Update existing notifications with device information where possible
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

-- Step 8: Update device rules counts for existing notifications
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

-- Step 9: Add comments to document the new schema
COMMENT ON COLUMN notifications.category IS 'Notification category for better classification and filtering';
COMMENT ON COLUMN notifications.device_name IS 'Device name for enhanced notification display';
COMMENT ON COLUMN notifications.device_type IS 'Device type for enhanced notification display';
COMMENT ON COLUMN notifications.device_location IS 'Device location for enhanced notification display';
COMMENT ON COLUMN notifications.device_status IS 'Device status for enhanced notification display';
COMMENT ON COLUMN notifications.maintenance_rules_count IS 'Number of active maintenance tasks for the device';
COMMENT ON COLUMN notifications.safety_rules_count IS 'Number of active safety precautions for the device';
COMMENT ON COLUMN notifications.total_rules_count IS 'Total number of rules configured for the device';
COMMENT ON COLUMN notifications.device_manufacturer IS 'Device manufacturer for enhanced notification display';
COMMENT ON COLUMN notifications.device_model IS 'Device model for enhanced notification display';

-- Migration completed successfully
SELECT 'Notification system migration v1.1.0 completed successfully' as migration_status;
