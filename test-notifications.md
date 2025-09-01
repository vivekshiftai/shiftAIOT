# Notification System Testing Guide

## Issues Fixed

1. **Database Connection**: Updated PostgreSQL configuration with better connection pooling
2. **Notification Creation**: Fixed methods to use `createNotificationWithPreferenceCheck()` instead of direct `createNotification()`
3. **User Preferences**: Added automatic initialization of user preferences when missing
4. **Error Handling**: Improved error handling and logging throughout the notification system

## Testing Steps

### 1. Database Connection Test
First, ensure your PostgreSQL database is running and accessible:

```bash
# Check if PostgreSQL is running
psql -U postgres -d iotplatform -c "SELECT 1;"
```

If you get authentication errors, you may need to:
- Update the password in `application.yml` to match your PostgreSQL password
- Or set environment variables: `DB_USERNAME=your_username` and `DB_PASSWORD=your_password`

### 2. Start the Backend
```bash
cd backend
mvn spring-boot:run
```

### 3. Test Notification Creation
Use the new test endpoint to verify notifications are working:

```bash
# First, get a JWT token by logging in
curl -X POST http://localhost:8100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your_email@example.com","password":"your_password"}'

# Then test notification creation (replace YOUR_JWT_TOKEN with the actual token)
curl -X POST http://localhost:8100/api/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Check User Preferences
Verify that user preferences are properly initialized:

```bash
curl -X GET http://localhost:8100/api/user-preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Test Device Assignment Notification
Create a device and assign it to a user to test the device assignment notification:

```bash
# Create a device with assignment
curl -X POST http://localhost:8100/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Device",
    "type": "SENSOR",
    "location": "Test Location",
    "assignedUserId": "USER_ID_HERE"
  }'
```

### 6. Check Notifications
View all notifications for the current user:

```bash
curl -X GET http://localhost:8100/api/notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Common Issues and Solutions

### Issue: "Notification blocked by user preferences"
**Solution**: Check user preferences and ensure the relevant notification type is enabled:

```bash
# Update user preferences to enable all notifications
curl -X POST http://localhost:8100/api/user-preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceAlerts": true,
    "systemUpdates": true,
    "weeklyReports": true,
    "criticalAlerts": true,
    "performanceAlerts": true,
    "securityAlerts": true,
    "maintenanceAlerts": true,
    "dataBackupAlerts": true,
    "userActivityAlerts": true,
    "ruleTriggerAlerts": true,
    "emailNotifications": true,
    "pushNotifications": true
  }'
```

### Issue: Database connection errors
**Solution**: 
1. Ensure PostgreSQL is running
2. Check database credentials in `application.yml`
3. Verify the database `iotplatform` exists
4. Check if the user has proper permissions

### Issue: No notifications appearing
**Solution**:
1. Check the application logs for errors
2. Verify user preferences are not blocking notifications
3. Ensure the user ID is correct
4. Check if the notification service is properly injected

## Log Monitoring

Monitor the application logs for notification-related messages:

```bash
# Watch the logs in real-time
tail -f backend/logs/iot-platform.log | grep -i notification
```

Look for these log messages:
- ✅ "Created device assignment notification"
- ✅ "Notification created successfully"
- ⚠️ "Notification blocked by user preferences"
- ❌ "Failed to create notification"

## Frontend Testing

In the frontend, you can also test notifications by:

1. Going to the Notifications section
2. Creating a device and assigning it to a user
3. Checking if the notification appears in the UI
4. Verifying that the notification count updates

## Debugging Commands

```bash
# Check if the backend is running
curl http://localhost:8100/actuator/health

# Check database connectivity
curl http://localhost:8100/actuator/health/db

# View all users (to get user IDs for testing)
curl -X GET http://localhost:8100/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
