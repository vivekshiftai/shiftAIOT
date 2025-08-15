-- Database Verification Script
-- Run this script to verify all tables are created properly

-- Check if all required tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN (
            'users', 'user_permissions', 'devices', 'device_documentation',
            'device_maintenance', 'device_safety_precautions', 'device_tags',
            'device_config', 'rules', 'rule_conditions', 'rule_actions',
            'notifications', 'knowledge_documents', 'conversation_configs'
        ) THEN 'REQUIRED'
        ELSE 'OPTIONAL'
    END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check table row counts
SELECT 
    'users' as table_name,
    COUNT(*) as row_count
FROM users
UNION ALL
SELECT 
    'devices' as table_name,
    COUNT(*) as row_count
FROM devices
UNION ALL
SELECT 
    'device_maintenance' as table_name,
    COUNT(*) as row_count
FROM device_maintenance
UNION ALL
SELECT 
    'device_safety_precautions' as table_name,
    COUNT(*) as row_count
FROM device_safety_precautions
UNION ALL
SELECT 
    'rules' as table_name,
    COUNT(*) as row_count
FROM rules
UNION ALL
SELECT 
    'rule_conditions' as table_name,
    COUNT(*) as row_count
FROM rule_conditions
UNION ALL
SELECT 
    'rule_actions' as table_name,
    COUNT(*) as row_count
FROM rule_actions
UNION ALL
SELECT 
    'knowledge_documents' as table_name,
    COUNT(*) as row_count
FROM knowledge_documents;

-- Check indexes
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'devices', 'device_maintenance', 'device_safety_precautions',
    'rules', 'rule_conditions', 'rule_actions', 'knowledge_documents'
)
ORDER BY tablename, indexname;

-- Verify foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
