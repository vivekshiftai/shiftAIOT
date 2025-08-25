-- Fix for device_safety_precautions table
-- Run this in your PostgreSQL database

-- First, check if the table exists
SELECT 'Table exists: ' || EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'device_safety_precautions'
);

-- If table exists, update null type values
UPDATE device_safety_precautions 
SET type = 'warning' 
WHERE type IS NULL;

-- Check how many records were updated
SELECT 'Records with null type after update: ' || COUNT(*) 
FROM device_safety_precautions 
WHERE type IS NULL;

-- Show sample records
SELECT id, device_id, title, type, category 
FROM device_safety_precautions 
LIMIT 5;
