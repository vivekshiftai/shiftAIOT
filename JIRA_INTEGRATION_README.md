# Jira Task Assignment Integration

## Overview
Simple Jira task assignment service that automatically assigns maintenance tasks to users during the device onboarding flow.

## Configuration

### 1. Environment Variables
Set these environment variables or add them to your `application.yml`:

```bash
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=YOUR_PROJECT_KEY
```

### 2. Application Configuration
The service is already configured in `application.yml`:

```yaml
# Jira Configuration
jira:
  base-url: ${JIRA_BASE_URL:}
  username: ${JIRA_USERNAME:}
  api-token: ${JIRA_API_TOKEN:}
  project-key: ${JIRA_PROJECT_KEY:}
```

## How It Works

### Automatic Integration
The service is automatically integrated into the onboarding flow:

1. **Device Onboarding**: When a device is onboarded with maintenance data
2. **Maintenance Processing**: Maintenance tasks are created and stored in the database
3. **Jira Assignment**: For each maintenance task assigned to a user, a Jira task is automatically created
4. **User Assignment**: The task is assigned to the user's email in Jira

### Service Methods

#### `assignMaintenanceTask()`
```java
String issueKey = jiraTaskAssignmentService.assignMaintenanceTask(
    "Clean Air Filter",                    // Task title
    "Clean the air filter monthly",        // Task description
    "user@company.com",                    // User email
    "HVAC Unit 1"                          // Device name
);
```

#### `assignTaskFromOnboarding()`
```java
jiraTaskAssignmentService.assignTaskFromOnboarding(
    "Monthly Maintenance",                  // Maintenance task name
    "user@company.com",                    // User email
    "Device Name"                          // Device name
);
```

## Jira Task Details

### Task Structure
- **Project**: Uses configured project key
- **Issue Type**: Task
- **Priority**: Medium
- **Labels**: maintenance, iot, device
- **Assignee**: User's email address
- **Description**: Formatted with device context and instructions

### Task Description Format
```
Maintenance Task Details

Device: [Device Name]

Description:
[Task Description]

Instructions
1. Review the maintenance requirements
2. Complete the maintenance task
3. Update the task status when completed
4. Add any notes or issues encountered

----
This task was automatically created from the IoT Platform onboarding flow.
```

## Error Handling

- **Configuration Missing**: Service logs warning and skips Jira assignment
- **API Failures**: Logs error but doesn't fail the onboarding process
- **User Not Found**: Logs warning and skips assignment
- **Network Issues**: Logs error and continues with database storage

## Logging

The service provides comprehensive logging:

```
🔧 Assigning Jira task: 'Clean Air Filter' to user: user@company.com for device: HVAC Unit 1
✅ Jira task assigned successfully: PROJ-123
🎯 Jira task assigned for maintenance: Clean Air Filter to user: user@company.com
```

## Usage Example

### During Onboarding
When a device is onboarded with maintenance data, tasks are automatically assigned:

1. Device created with assigned user
2. Maintenance tasks generated from PDF
3. Tasks stored in database
4. Jira tasks created and assigned to user
5. User receives notification in Jira

### Manual Assignment
You can also manually assign tasks:

```java
@Autowired
private JiraTaskAssignmentService jiraTaskAssignmentService;

public void assignCustomTask() {
    String issueKey = jiraTaskAssignmentService.assignMaintenanceTask(
        "Custom Maintenance Task",
        "Perform custom maintenance as required",
        "maintenance@company.com",
        "Custom Device"
    );
    
    if (issueKey != null) {
        log.info("Task assigned: {}", issueKey);
    }
}
```

## Requirements

- Jira Cloud or Server with API access
- Valid Jira API token
- Project with appropriate permissions
- User emails must match Jira user emails

## Security

- API token is stored securely in environment variables
- Basic authentication is used for Jira API
- No sensitive data is logged
- Service gracefully handles authentication failures
