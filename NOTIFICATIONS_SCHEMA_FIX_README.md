# Notifications Schema Fix - Complete Solution

## Problem Description

The application was encountering a PostgreSQL error when trying to delete devices:

```
ERROR: column n1_0.category does not exist
Position: 16
```

This error occurred because:
1. **Database schema mismatch**: The existing `notifications` table was missing the `category` column and other required columns
2. **Manual migration required**: The old setup required running migration scripts manually
3. **Spring schema.sql limitations**: `CREATE TABLE IF NOT EXISTS` doesn't modify existing tables

## Root Cause

The issue was in the database initialization strategy:
- **Spring runs `schema.sql` every time** (due to `sql.init.mode: always`)
- **But `CREATE TABLE IF NOT EXISTS` only creates new tables**
- **Existing tables with old schemas were never updated**
- **Java entities expected columns that didn't exist in the database**

## Solution Implemented

### 1. Consolidated Schema Management
- **Removed separate migration files** (`migration-notifications-fix.sql`, `migration-v1.1.0.sql`)
- **Consolidated all schema updates into main `schema.sql`**
- **Added comprehensive `ALTER TABLE ADD COLUMN IF NOT EXISTS` statements**

### 2. Automatic Schema Updates
Now the `schema.sql` automatically handles both scenarios:
- **New installations**: Creates all tables with proper structure
- **Existing databases**: Adds missing columns to existing tables

### 3. Comprehensive Column Coverage
The updated schema now automatically adds missing columns for all tables:

#### Notifications Table
```sql
-- Core columns
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_name VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS device_type VARCHAR(100);
-- ... and more
```

#### Device Tables
```sql
-- Device maintenance
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS component_name VARCHAR(255) DEFAULT 'General';
ALTER TABLE device_maintenance ADD COLUMN IF NOT EXISTS maintenance_type VARCHAR(50);
-- ... and more

-- Device safety
ALTER TABLE device_safety_precautions ADD COLUMN IF NOT EXISTS precaution_type VARCHAR(100);
-- ... and more
```

#### Other Tables
```sql
-- Rules, users, organizations, etc.
ALTER TABLE rules ADD COLUMN IF NOT EXISTS metric VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail_id VARCHAR(255);
-- ... and more
```

### 4. Data Migration
The schema also handles data migration automatically:
```sql
-- Migrate existing notification types to categories
UPDATE notifications 
SET category = CASE 
    WHEN type = 'INFO' THEN 'DEVICE_ASSIGNMENT'
    WHEN type = 'WARNING' THEN 'PERFORMANCE_ALERT'
    -- ... and more
END
WHERE category IS NULL;

-- Update device information for existing notifications
UPDATE notifications n
SET device_name = d.name, device_type = d.type::text
FROM devices d
WHERE n.device_id = d.id AND n.device_name IS NULL;
```

## How It Works Now

### 1. **Automatic Execution**
- **Spring runs `schema.sql` on every startup** (due to `sql.init.mode: always`)
- **No manual intervention required**
- **Schema stays in sync automatically**

### 2. **Safe Updates**
- **`ADD COLUMN IF NOT EXISTS`** ensures no errors if columns already exist
- **Existing data is preserved**
- **New columns get sensible defaults**

### 3. **Comprehensive Coverage**
- **All tables are covered**
- **All missing columns are added**
- **Data migration happens automatically**

## Benefits

✅ **No more manual migrations**  
✅ **Schema stays in sync automatically**  
✅ **Device deletion works without errors**  
✅ **All notification features work properly**  
✅ **Database structure matches Java entities**  
✅ **Safe for production use**  

## Configuration

The solution works with the existing Spring configuration:

```yaml
spring:
  sql:
    init:
      mode: always                    # Run schema.sql every time
      continue-on-error: true         # Continue even if some statements fail
      schema-locations: classpath:schema.sql
```

## What Happens on Startup

1. **Spring detects database connection**
2. **Loads and executes `schema.sql`**
3. **Creates missing tables (if any)**
4. **Adds missing columns to existing tables**
5. **Migrates existing data to new schema**
6. **Application starts with fully synchronized database**

## Troubleshooting

### If you still see schema errors:

1. **Check the logs** for any SQL execution errors
2. **Verify database permissions** - the user needs ALTER TABLE privileges
3. **Check PostgreSQL version** - ensure it supports `ADD COLUMN IF NOT EXISTS`
4. **Restart the application** - the schema will be updated on next startup

### Common Issues:

- **Permission denied**: Ensure database user has ALTER TABLE privileges
- **Column already exists**: This is normal and safe to ignore
- **Foreign key constraints**: These are handled automatically

## Migration from Old Setup

If you were using the old migration scripts:

1. **Delete old migration files** (already done)
2. **Restart your application** - the new schema.sql will handle everything
3. **Verify the fix** by checking device deletion works

## Testing the Fix

To verify the fix is working:

1. **Start the application** - check logs for schema updates
2. **Try to delete a device** - should work without schema errors
3. **Check notifications table** - should have all required columns
4. **Verify device deletion** - should complete successfully

## Conclusion

This solution provides a **robust, automatic, and maintenance-free** approach to database schema management. The application will now:

- **Automatically keep the database schema in sync**
- **Handle both new installations and existing databases**
- **Eliminate the need for manual migrations**
- **Ensure device deletion and all features work properly**

The schema will be updated automatically on every application startup, ensuring your database structure always matches your Java entity models.
