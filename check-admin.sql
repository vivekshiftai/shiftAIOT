-- Check if admin user exists
SELECT id, email, role, enabled FROM users WHERE email = 'admin@shiftaiot.com';

-- Check user permissions
SELECT up.user_id, up.permissions 
FROM user_permissions up 
JOIN users u ON up.user_id = u.id 
WHERE u.email = 'admin@shiftaiot.com';
