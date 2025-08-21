-- Database Schema Fix Script
-- Run this script to fix the missing organization_id columns

-- Connect to your PostgreSQL database and run these commands:

-- 1. Add organization_id column to device_safety_precautions table
ALTER TABLE device_safety_precautions 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- 2. Add organization_id column to device_maintenance table  
ALTER TABLE device_maintenance 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- 3. Update any existing records that might have NULL organization_id
UPDATE device_safety_precautions 
SET organization_id = 'default' 
WHERE organization_id IS NULL OR organization_id = '';

UPDATE device_maintenance 
SET organization_id = 'default' 
WHERE organization_id IS NULL OR organization_id = '';

-- 4. Verify the changes
SELECT 'device_safety_precautions' as table_name, COUNT(*) as total_records
FROM device_safety_precautions
UNION ALL
SELECT 'device_maintenance' as table_name, COUNT(*) as total_records
FROM device_maintenance;

-- 5. Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('device_safety_precautions', 'device_maintenance') 
AND column_name = 'organization_id';
