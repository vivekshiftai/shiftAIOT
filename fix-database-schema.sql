-- Fix missing organization_id columns in database tables
-- Run this script to add missing columns to existing tables

-- Add organization_id column to device_safety_precautions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_safety_precautions' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE device_safety_precautions ADD COLUMN organization_id VARCHAR(255) NOT NULL DEFAULT 'default';
        RAISE NOTICE 'Added organization_id column to device_safety_precautions';
    ELSE
        RAISE NOTICE 'organization_id column already exists in device_safety_precautions';
    END IF;
END $$;

-- Add organization_id column to device_maintenance if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'device_maintenance' 
        AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE device_maintenance ADD COLUMN organization_id VARCHAR(255) NOT NULL DEFAULT 'default';
        RAISE NOTICE 'Added organization_id column to device_maintenance';
    ELSE
        RAISE NOTICE 'organization_id column already exists in device_maintenance';
    END IF;
END $$;

-- Update existing records to have proper organization_id if they don't have one
UPDATE device_safety_precautions SET organization_id = 'default' WHERE organization_id IS NULL OR organization_id = '';
UPDATE device_maintenance SET organization_id = 'default' WHERE organization_id IS NULL OR organization_id = '';

-- Verify the changes
SELECT 'device_safety_precautions' as table_name, COUNT(*) as total_records, 
       COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as records_with_org_id
FROM device_safety_precautions
UNION ALL
SELECT 'device_maintenance' as table_name, COUNT(*) as total_records,
       COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as records_with_org_id
FROM device_maintenance;
