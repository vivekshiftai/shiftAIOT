# Jira Integration Test Guide

## Overview
This guide helps you test and troubleshoot the Jira bulk issue creation integration.

## Prerequisites

### 1. Environment Variables
Set these environment variables before starting the application:

```bash
# Windows (PowerShell)
$env:JIRA_BASE_URL="https://your-domain.atlassian.net"
$env:JIRA_USERNAME="your-email@domain.com"
$env:JIRA_API_TOKEN="your-api-token"
$env:JIRA_PROJECT_KEY="YOUR_PROJECT_KEY"

# Linux/Mac
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_USERNAME="your-email@domain.com"
export JIRA_API_TOKEN="your-api-token"
export JIRA_PROJECT_KEY="YOUR_PROJECT_KEY"
```

### 2. Get Jira API Token
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Give it a name (e.g., "IoT Platform Integration")
4. Copy the generated token

## Testing Steps

### Step 1: Test Configuration
First, verify that Jira is properly configured:

```bash
curl -X GET http://localhost:8100/api/jira/bulk/test
```

**Expected Response (if configured):**
```json
{
  "configured": true,
  "status": "ready",
  "message": "Jira is properly configured"
}
```

**Expected Response (if not configured):**
```json
{
  "configured": false,
  "status": "not_configured",
  "message": "Jira configuration is missing",
  "required_variables": [
    "JIRA_BASE_URL",
    "JIRA_USERNAME",
    "JIRA_API_TOKEN",
    "JIRA_PROJECT_KEY"
  ]
}
```

### Step 2: Test Simple Bulk Creation
Create simple tasks in bulk:

```bash
curl -X POST http://localhost:8100/api/jira/bulk/simple \
  -H "Content-Type: application/json" \
  -d '{
    "taskNames": ["Test Task 1", "Test Task 2"],
    "description": "Test maintenance tasks",
    "frequency": "weekly",
    "priority": "medium"
  }'
```

### Step 3: Test Detailed Bulk Creation
Create detailed maintenance tasks:

```bash
curl -X POST http://localhost:8100/api/jira/bulk/create \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "task": "Inspect device sensors",
        "taskName": "Sensor Inspection",
        "description": "Check all sensor readings and calibrate if needed",
        "frequency": "daily",
        "priority": "high",
        "estimatedDuration": "30 minutes",
        "requiredTools": "Multimeter, calibration kit",
        "category": "maintenance",
        "safetyNotes": "Ensure device is powered off before inspection"
      }
    ]
  }'
```

### Step 4: Test Onboarding Integration
Test bulk creation from onboarding:

```bash
curl -X POST http://localhost:8100/api/jira/bulk/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {
        "task": "Initial device setup",
        "taskName": "Device Setup",
        "description": "Complete initial device configuration",
        "frequency": "once",
        "priority": "high",
        "estimatedDuration": "2 hours",
        "requiredTools": "Configuration manual, network cables",
        "category": "setup",
        "safetyNotes": "Follow manufacturer guidelines"
      }
    ],
    "userEmail": "user@example.com",
    "deviceName": "Test Device 001"
  }'
```

## Troubleshooting

### Common Issues

1. **"Jira not configured" Error**
   - Check environment variables are set correctly
   - Verify the configuration test endpoint response

2. **Authentication Errors (401/403)**
   - Verify Jira username and API token
   - Check if the user has permission to create issues in the project

3. **Project Not Found (404)**
   - Verify the project key exists in your Jira instance
   - Check if the user has access to the project

4. **Network/Connection Errors**
   - Verify Jira base URL is correct and accessible
   - Check firewall/network settings

### Debug Information

Check the application logs for detailed error information:

```bash
# View recent logs
tail -f backend/logs/iot-platform.log

# Search for Jira-related logs
grep -i "jira" backend/logs/iot-platform.log
```

### Manual Jira API Test

Test the Jira API directly to verify credentials:

```bash
curl -X GET \
  -H "Authorization: Basic $(echo -n 'your-email@domain.com:your-api-token' | base64)" \
  -H "Content-Type: application/json" \
  "https://your-domain.atlassian.net/rest/api/3/myself"
```

## Expected Results

### Successful Response
```json
{
  "success": true,
  "message": "Tasks created successfully",
  "issueKeys": ["PROJ-123", "PROJ-124"],
  "createdCount": 2,
  "requestedCount": 2
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error creating bulk tasks: [specific error message]",
  "issueKeys": [],
  "createdCount": 0,
  "requestedCount": 2
}
```

## Next Steps

1. **If tests pass**: The Jira integration is working correctly
2. **If tests fail**: Check the specific error messages and follow the troubleshooting steps
3. **For production**: Ensure all environment variables are properly set in your deployment environment

## Support

If you continue to have issues:
1. Check the application logs for detailed error messages
2. Verify your Jira instance settings and permissions
3. Test the Jira API directly using curl commands
4. Ensure your Jira project has the required issue types and fields
