# Maintenance Scheduling System Improvements

## Overview
This document outlines the improvements made to the maintenance scheduling system to ensure proper date storage, calculation, and management for IoT device maintenance tasks.

## Issues Identified and Fixed

### 1. **Date Storage Problems** ✅ FIXED
**Issue**: The system wasn't properly calculating and storing maintenance dates based on frequency.

**Solution**: 
- Added comprehensive date calculation logic in `MaintenanceScheduleService`
- Implemented frequency parsing for various formats: "every 30 days", "monthly", "weekly", etc.
- Proper `LocalDate` storage for `lastMaintenance` and `nextMaintenance` fields

### 2. **Missing Date Calculation Logic** ✅ FIXED
**Issue**: When creating maintenance tasks from PDF, the system wasn't calculating `nextMaintenance` dates.

**Solution**:
- Added `calculateNextMaintenanceDate()` method with simple string matching
- Supports basic frequency formats:
  - "daily", "weekly", "monthly", "quarterly", "yearly", "annually"
- Default fallback to monthly if format is unknown

### 3. **No Automatic Date Updates** ✅ FIXED
**Issue**: When maintenance was completed, the system didn't automatically calculate the next maintenance date.

**Solution**:
- Added `completeMaintenanceTask()` method
- Automatically sets `lastMaintenance` to today
- Calculates new `nextMaintenance` date based on frequency
- Updates status to `COMPLETED`

### 4. **Database Query Issues** ✅ FIXED
**Issue**: Queries were using `DATE()` function on already `DATE` type fields.

**Solution**:
- Fixed queries in `MaintenanceScheduleRepository`
- Removed unnecessary `DATE()` wrapper functions
- Proper date comparison in SQL queries

## New Features Added

### 1. **Enhanced Maintenance Schedule Service**
```java
// Calculate next maintenance date based on frequency
public LocalDate calculateNextMaintenanceDate(String frequency)

// Complete maintenance task and calculate next date
public DeviceMaintenance completeMaintenanceTask(String maintenanceId)

// Get overdue maintenance tasks
public List<DeviceMaintenance> getOverdueMaintenance(String deviceId)

// Get upcoming maintenance tasks (next 30 days)
public List<DeviceMaintenance> getUpcomingMaintenance(String deviceId)

// Update overdue maintenance status
public void updateOverdueMaintenance()
```

### 2. **Maintenance Status Update Scheduler**
- Runs daily at 2:00 AM (before notification scheduler)
- Automatically marks overdue maintenance tasks
- Updates task statuses from `ACTIVE` to `OVERDUE`

### 3. **Enhanced Repository Methods**
```java
// Find by device ID, status, and next maintenance before a date
List<DeviceMaintenance> findByDeviceIdAndStatusAndNextMaintenanceBefore(...)

// Find by device ID, status, and next maintenance between dates
List<DeviceMaintenance> findByDeviceIdAndStatusAndNextMaintenanceBetween(...)

// Find by status and next maintenance before a date
List<DeviceMaintenance> findByStatusAndNextMaintenanceBefore(...)
```

### 4. **New Maintenance Controller Endpoints**
```java
// Complete a maintenance task
POST /api/maintenance/{maintenanceId}/complete

// Get device maintenance tasks
GET /api/maintenance/device/{deviceId}

// Get overdue maintenance tasks
GET /api/maintenance/device/{deviceId}/overdue

// Get upcoming maintenance tasks
GET /api/maintenance/device/{deviceId}/upcoming
```

## Configuration

### Application Properties
```yaml
# Maintenance Notification Scheduler Configuration
maintenance:
  scheduler:
    enabled: true
    cron: "0 0 6 * * ?"  # Every day at 6:00 AM
    organization-id: "default-org"
  
  # Maintenance Status Update Scheduler Configuration
  status-updater:
    enabled: true
    cron: "0 0 2 * * ?"  # Every day at 2:00 AM (before notification scheduler)

# Conversation API Configuration
conversation:
  api:
    base-url: "http://localhost:8100/api/chat"
    max-retries: 3
    retry-delay: 1000  # 1 second
```

## Database Schema

### Device Maintenance Table
```sql
CREATE TABLE IF NOT EXISTS device_maintenance (
    id VARCHAR(255) PRIMARY KEY,
    task_name VARCHAR(255) NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    device_name VARCHAR(255),
    component_name VARCHAR(255),
    maintenance_type VARCHAR(100),
    frequency VARCHAR(100) NOT NULL,
    last_maintenance DATE,           -- When last maintenance was performed
    next_maintenance DATE NOT NULL,  -- When next maintenance is due
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    estimated_cost DECIMAL(10,2),
    estimated_duration VARCHAR(100),
    required_tools TEXT,
    safety_notes TEXT,
    assigned_to VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    organization_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
);
```

## Maintenance Flow

### 1. **Creating Maintenance Tasks**
```java
// When creating from PDF or manually
MaintenanceSchedule schedule = new MaintenanceSchedule();
schedule.setFrequency("monthly");
schedule.setNextMaintenance(calculateNextMaintenanceDate("monthly"));
maintenanceScheduleService.createSchedule(schedule);
```

### 2. **Daily Status Updates** (2:00 AM)
```java
// Automatic process
maintenanceScheduleService.updateOverdueMaintenance();
// Marks tasks past their due date as OVERDUE
```

### 3. **Daily Notifications** (6:00 AM)
```java
// Automatic process
maintenanceNotificationScheduler.sendDailyMaintenanceNotifications();
// Sends notifications for today's maintenance tasks
```

### 4. **Completing Maintenance Tasks**
```java
// Manual process via API
DeviceMaintenance completed = maintenanceScheduleService.completeMaintenanceTask(maintenanceId);
// Sets lastMaintenance = today
// Calculates nextMaintenance based on frequency
// Updates status to COMPLETED
```

## Frequency Parsing Examples

The system supports basic frequency string formats:

| Input | Calculated Next Date |
|-------|---------------------|
| "daily" | Today + 1 day |
| "weekly" | Today + 1 week |
| "monthly" | Today + 1 month |
| "quarterly" | Today + 3 months |
| "yearly" | Today + 1 year |
| "annually" | Today + 1 year |
| Unknown format | Today + 1 month (default) |

## Error Handling

- **Unknown frequency format**: Defaults to monthly with warning log
- **Null/empty frequency**: Defaults to monthly
- **Missing dates**: Calculates based on frequency
- **Database errors**: Logged with proper error messages
- **API failures**: Retry logic with exponential backoff

## Testing

### Unit Tests
- `MaintenanceNotificationSchedulerTest` - Tests scheduler logic
- `ConversationNotificationServiceTest` - Tests notification service
- Date calculation tests for various frequency formats

### Manual Testing
- Use `/api/maintenance-notifications/trigger` to test notifications
- Use `/api/maintenance/{id}/complete` to test task completion
- Use `/api/maintenance/device/{deviceId}` to view maintenance tasks

## Monitoring and Logging

### Key Log Messages
```
INFO  - Creating maintenance task: Replace Filter with next maintenance date: 2024-02-15
INFO  - Completed maintenance task: Replace Filter with next maintenance date: 2024-03-15
INFO  - Marked maintenance task as overdue: Replace Filter
INFO  - Maintenance notification sent successfully for user: John Doe, device: Cooling System 1
```

### Metrics to Monitor
- Number of overdue maintenance tasks
- Number of notifications sent/failed
- Maintenance task completion rates
- Date calculation accuracy

## Future Enhancements

1. **Advanced Scheduling**: Support for complex schedules (e.g., "every Monday", "first day of month")
2. **Maintenance History**: Track all completed maintenance with timestamps
3. **Predictive Maintenance**: Use device telemetry to predict maintenance needs
4. **Escalation Notifications**: Send notifications to supervisors for overdue tasks
5. **Maintenance Templates**: Predefined maintenance schedules for common device types

## Conclusion

The improved maintenance scheduling system now properly:
- ✅ Stores and calculates maintenance dates based on frequency
- ✅ Automatically updates task statuses (overdue, completed)
- ✅ Sends daily notifications for due maintenance tasks
- ✅ Provides comprehensive API endpoints for maintenance management
- ✅ Handles various frequency formats with proper error handling
- ✅ Includes proper logging and monitoring capabilities

This ensures that IoT device maintenance is properly scheduled, tracked, and communicated to assigned users, improving device reliability and operational efficiency.
