# Database Schema Fix Instructions

## Problem
The application is failing with the error:
```
ERROR: column dsp1_0.organization_id does not exist
```

This happens because the database tables `device_safety_precautions` and `device_maintenance` are missing the `organization_id` column that the JPA entities expect.

## Root Cause
The database schema was updated to include `organization_id` columns, but the existing database tables were created before this change and don't have these columns.

## Solution

### Step 1: Run the Database Migration Script

Connect to your PostgreSQL database and run the following SQL commands:

```sql
-- Add organization_id column to device_safety_precautions table
ALTER TABLE device_safety_precautions 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- Add organization_id column to device_maintenance table  
ALTER TABLE device_maintenance 
ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255) NOT NULL DEFAULT 'default';

-- Update any existing records that might have NULL organization_id
UPDATE device_safety_precautions 
SET organization_id = 'default' 
WHERE organization_id IS NULL OR organization_id = '';

UPDATE device_maintenance 
SET organization_id = 'default' 
WHERE organization_id IS NULL OR organization_id = '';
```

### Step 2: Verify the Changes

Run these queries to verify the columns were added successfully:

```sql
-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('device_safety_precautions', 'device_maintenance') 
AND column_name = 'organization_id';

-- Check record counts
SELECT 'device_safety_precautions' as table_name, COUNT(*) as total_records
FROM device_safety_precautions
UNION ALL
SELECT 'device_maintenance' as table_name, COUNT(*) as total_records
FROM device_maintenance;
```

### Step 3: Restart the Application

After running the migration script:

1. Stop the backend server
2. Restart the backend server
3. The device details should now properly display:
   - Safety precautions
   - Maintenance information
   - Rules

## Expected Results

After fixing the database schema:

1. **Device Details Page** will show:
   - Real maintenance data from the database
   - Safety precautions from the database
   - Rules associated with the device

2. **No More Errors**:
   - The `organization_id does not exist` error will be resolved
   - All device-related API endpoints will work correctly

## Files Modified

1. **`backend/src/main/resources/schema.sql`** - Added ALTER TABLE statements
2. **`run-database-fix.sql`** - Created migration script
3. **`fix-database-schema.sql`** - Alternative migration script

## Testing

After applying the fix, test the following:

1. **Device Details**: Navigate to any device and check the maintenance and safety tabs
2. **API Endpoints**: 
   - `GET /api/devices/{id}/maintenance`
   - `GET /api/devices/{id}/safety-precautions`
   - `GET /api/devices/{id}/rules`

3. **Onboarding Flow**: Create a new device and verify that maintenance and safety data are properly saved

## Troubleshooting

If you still see errors:

1. **Check Database Connection**: Ensure you're connected to the correct database
2. **Verify Column Addition**: Run the verification queries above
3. **Check Application Logs**: Look for any remaining database-related errors
4. **Restart Application**: Make sure to restart the backend after schema changes

## Alternative Solution

If you prefer to recreate the database from scratch:

1. Drop the existing tables:
```sql
DROP TABLE IF EXISTS device_safety_precautions CASCADE;
DROP TABLE IF EXISTS device_maintenance CASCADE;
```

2. Restart the application - it will recreate the tables with the correct schema
3. Note: This will lose existing maintenance and safety data
