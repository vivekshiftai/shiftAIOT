# Database Fix for Conversation Configs JSONB Issue

## Problem Description

The application was encountering a PostgreSQL error when trying to insert data into the `conversation_configs` table:

```
ERROR: column "credentials" is of type jsonb but expression is of type character varying
Hint: You will need to rewrite or cast the expression.
```

This error occurred because:
1. The `JsonConverter` was converting `Map<String, Object>` to a JSON string
2. PostgreSQL expected a JSONB type, not a string
3. The database table structure needed proper validation

## Solution Implemented

### 1. Fixed JsonConverter
- Changed the converter to return `Object` instead of `String`
- This allows Hibernate to properly handle JSONB conversion
- Added detailed logging for debugging

### 2. Created PlatformType Enum
- Added proper validation for platform types: `slack`, `gmail`, `teams`, `google_chat`, `sms`
- Ensures only valid platform types are accepted
- Added validation methods for credentials based on platform type

### 3. Enhanced Model Validation
- Added `@PrePersist` and `@PreUpdate` validation
- Credentials are validated before saving to database
- Platform-specific credential requirements are enforced

### 4. Database Migration Script
- Updated `migration_conversation_configs.sql` with proper table structure
- Added CHECK constraints for platform types
- Added PostgreSQL trigger for credential validation
- Includes backup and restore procedures

### 5. Database Validation Tools
- Created `DatabaseValidator` utility class
- Added REST endpoints for database validation
- Tests JSONB insertion functionality

## How to Apply the Fix

### Step 1: Run the Migration Script
```sql
-- Connect to your PostgreSQL database and run:
\i backend/src/main/resources/migration_conversation_configs.sql
```

### Step 2: Restart the Application
The updated Java code will now properly handle JSONB conversion.

### Step 3: Validate the Fix
Use the database validation endpoints:

```bash
# Test database connection
GET /api/database/validate/connection

# Validate table structure
GET /api/database/validate/table

# Test JSONB insertion
POST /api/database/test/jsonb

# Run all validations
POST /api/database/validate/all
```

## Database Table Structure

The `conversation_configs` table now has:

```sql
CREATE TABLE conversation_configs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    platform_name VARCHAR(100) NOT NULL,
    platform_type VARCHAR(50) NOT NULL CHECK (platform_type IN ('slack', 'gmail', 'teams', 'google_chat', 'sms')),
    credentials JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## Credential Requirements by Platform

### Slack
- Required fields: `token`, `channel`

### Gmail
- Required fields: `token`, `refresh_token`

### Microsoft Teams & Google Chat
- Required fields: `webhook_url`

### SMS
- Required fields: `api_key`, `phone_number`

## Validation Features

1. **Platform Type Validation**: Only accepts predefined platform types
2. **Credential Structure Validation**: Ensures required fields are present based on platform type
3. **Database-Level Validation**: PostgreSQL triggers validate data before insertion
4. **Application-Level Validation**: Java model validates data before persistence
5. **Comprehensive Logging**: Detailed logs for debugging and monitoring

## Testing

After applying the fix, test with a sample Slack configuration:

```json
{
  "platformName": "My Slack Workspace",
  "platformType": "slack",
  "credentials": {
    "token": "xoxb-your-bot-token",
    "channel": "C1234567890"
  },
  "isActive": true
}
```

## Monitoring

Check the application logs for:
- ✅ Successful JSONB conversions
- 📝 Credential validation details
- 🔍 Database operation status

## Troubleshooting

If issues persist:

1. **Check Database Logs**: Look for PostgreSQL errors
2. **Validate Table Structure**: Use the validation endpoints
3. **Check Application Logs**: Look for conversion errors
4. **Verify JSON Format**: Ensure credentials are valid JSON objects, not strings

## Files Modified

- `backend/src/main/java/com/iotplatform/config/JsonConverter.java`
- `backend/src/main/java/com/iotplatform/model/ConversationConfig.java`
- `backend/src/main/java/com/iotplatform/model/PlatformType.java` (new)
- `backend/src/main/java/com/iotplatform/dto/ConversationConfigRequest.java`
- `backend/src/main/java/com/iotplatform/service/ConversationConfigService.java`
- `backend/src/main/java/com/iotplatform/controller/ConversationConfigController.java`
- `backend/src/main/java/com/iotplatform/util/DatabaseValidator.java` (new)
- `backend/src/main/java/com/iotplatform/controller/DatabaseValidationController.java` (new)
- `backend/src/main/resources/migration_conversation_configs.sql`
