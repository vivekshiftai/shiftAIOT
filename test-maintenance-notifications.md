# Maintenance Notification System - Testing Guide

## Issues Fixed

### 1. **Simplified Notification Logic** ✅
- **Problem**: Complex organization-based filtering was causing issues
- **Fix**: Simplified to search by today's date and fetch ALL maintenance tasks

### 2. **Enhanced Notification System** ✅
- **Problem**: Maintenance notifications were only sent via conversation API
- **Fix**: Added dual notification system:
  - Database notifications (stored in notifications table)
  - Conversation API notifications (external messaging)

### 3. **Manual Testing Endpoint** ✅
- **Problem**: No way to test maintenance notifications manually
- **Fix**: Added `/api/maintenance/trigger-notifications` endpoint for manual testing

### 4. **Improved Error Handling** ✅
- **Problem**: Poor error handling and logging
- **Fix**: Enhanced error handling, better logging, and fallback mechanisms

### 5. **Streamlined Processing** ✅
- **Problem**: Complex organization filtering and processing
- **Fix**: Direct search by today's date, process all tasks, send to assigned users

## How to Test

### 1. **Start the Backend**
```bash
cd backend
mvn spring-boot:run
```

### 2. **Test Manual Trigger (Admin Required)**
```bash
# Get your JWT token first by logging in
curl -X POST http://localhost:8100/api/maintenance/trigger-notifications \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. **Check Logs**
Monitor the logs for maintenance notification activity:
```bash
tail -f backend/logs/iot-platform.log | grep -i maintenance
```

### 4. **Verify Notifications**
- Check the notifications table in your database
- Check the frontend notifications dropdown
- Verify conversation API calls (if configured)

## Configuration

### Scheduler Settings (application.yml)
```yaml
maintenance:
  scheduler:
    enabled: true
    cron: "0 0 6 * * ?"  # Every day at 6:00 AM
    organization-id: "default-org"
  
  status-updater:
    enabled: true
    cron: "0 0 2 * * ?"  # Every day at 2:00 AM
```

### Conversation API Settings
```yaml
conversation:
  api:
    base-url: "http://localhost:8100/api/chat"
    max-retries: 3
    retry-delay: 1000
```

## Expected Behavior

### Daily Scheduler (6:00 AM)
1. **Search by Today's Date**: Query ALL maintenance tasks scheduled for today
2. **Process All Tasks**: For each maintenance task:
   - Extract device and user details
   - Create database notifications for assigned users
   - Send conversation API notifications (if configured)
3. **Log Results**: Report success/failure counts

### Manual Trigger
- Same process as daily scheduler but triggered immediately
- Requires ADMIN role
- Returns detailed response with number of notifications sent

## Troubleshooting

### Common Issues

1. **No Notifications Sent**
   - Check if maintenance tasks exist for today
   - Verify assigned users exist and have valid email addresses
   - Check user notification preferences

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check database credentials in `application.yml`
   - Ensure database exists and is accessible

3. **Conversation API Failures**
   - Check if conversation API endpoint is accessible
   - Verify API configuration in `application.yml`
   - Check network connectivity

### Log Messages to Look For

**Success:**
```
✅ Maintenance notification sent successfully for user: John Doe, device: Sensor-001, task: Calibration
✅ Created maintenance reminder notification for user: John Doe for task: Calibration
```

**Warnings:**
```
⚠️ Maintenance reminder notification blocked by user preferences for user: John Doe
⚠️ Database notification created but conversation notification failed
```

**Errors:**
```
❌ Failed to send maintenance notification for user: John Doe, device: Sensor-001, task: Calibration
❌ Error processing maintenance task: [error details]
```

## Next Steps

1. **Test the system** using the manual trigger endpoint
2. **Verify notifications** appear in the frontend
3. **Check logs** for any errors or warnings
4. **Schedule maintenance tasks** for today to test the daily scheduler
5. **Configure conversation API** if external messaging is needed

The maintenance notification system should now work properly and send daily reminders to assigned users for their maintenance tasks.
