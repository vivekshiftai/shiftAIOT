-- Fix invalid user roles in the database
-- This script updates any users with invalid roles to have valid ones

-- Update any users with 'VIEWER' role to 'USER' role
UPDATE users 
SET role = 'USER' 
WHERE role = 'VIEWER';

-- Update any users with 'ORG_ADMIN' role to 'ADMIN' role
UPDATE users 
SET role = 'ADMIN' 
WHERE role = 'ORG_ADMIN';

-- Update any users with invalid roles to 'USER' role
UPDATE users 
SET role = 'USER' 
WHERE role NOT IN ('ADMIN', 'USER');

-- Verify the fix
SELECT id, first_name, last_name, email, role 
FROM users 
ORDER BY created_at;
