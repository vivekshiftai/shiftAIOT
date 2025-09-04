# Jira Bulk Issue Creation Integration

## Overview
This integration implements bulk Jira issue creation using the Atlassian Forge bulk API pattern. It allows creating multiple maintenance tasks in Jira with a single API call, significantly improving performance and reducing API rate limiting issues.

## Features

### ✅ Bulk Issue Creation
- Create multiple Jira issues in a single API call
- Support for complex maintenance task data
- Automatic priority mapping and due date calculation
- Comprehensive error handling and response processing

### ✅ Multiple Integration Points
- **Direct Bulk Creation**: Create tasks from maintenance data
- **Onboarding Integration**: Bulk create tasks during device onboarding
- **Simple Task Creation**: Create tasks with minimal data

### ✅ Enhanced Task Information
- Automatic due date calculation based on frequency
- Priority mapping from task priority to Jira priority
- Rich descriptions with device context
- Time tracking with estimated duration
- Category-based labeling

## API Endpoints

### 1. Bulk Task Creation
**POST** `/api/jira/bulk/create`

Creates multiple Jira issues from detailed maintenance task data.

**Request Body:**
```json
{
  "tasks": [
    {
      "task": "Filter Replacement",
      "taskName": "HVAC Filter Replacement",
      "description": "Replace the air filter in the HVAC unit",
      "frequency": "monthly",
      "priority": "high",
      "estimatedDuration": "30m",
      "requiredTools": "Screwdriver, New Filter",
      "category": "Preventive Maintenance",
      "safetyNotes": "Turn off power before starting"
    },
    {
      "task": "Calibration Check",
      "taskName": "Sensor Calibration",
      "description": "Calibrate temperature sensors",
      "frequency": "quarterly",
      "priority": "medium",
      "estimatedDuration": "45m",
      "requiredTools": "Calibration Kit",
      "category": "Calibration",
      "safetyNotes": "Follow calibration procedures"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tasks created successfully",
  "issueKeys": ["PROJ-123", "PROJ-124"],
  "createdCount": 2,
  "requestedCount": 2
}
```

### 2. Onboarding Bulk Creation
**POST** `/api/jira/bulk/onboarding`

Creates bulk tasks during device onboarding process with device context.

**Request Body:**
```json
{
  "tasks": [
    {
      "task": "Initial Setup",
      "taskName": "Device Initial Setup",
      "description": "Complete initial device configuration",
      "frequency": "one-time",
      "priority": "high"
    }
  ],
  "userEmail": "technician@company.com",
  "deviceName": "HVAC Unit 1"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding tasks created successfully",
  "issueKeys": ["PROJ-125"],
  "createdCount": 1,
  "requestedCount": 1,
  "deviceName": "HVAC Unit 1",
  "userEmail": "technician@company.com"
}
```

### 3. Simple Bulk Creation
**POST** `/api/jira/bulk/simple`

Creates multiple tasks with minimal data for quick task creation.

**Request Body:**
```json
{
  "taskNames": [
    "Clean Air Filter",
    "Check Temperature Sensors",
    "Inspect Wiring"
  ],
  "description": "Routine maintenance tasks",
  "frequency": "monthly",
  "priority": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Simple tasks created successfully",
  "issueKeys": ["PROJ-126", "PROJ-127", "PROJ-128"],
  "createdCount": 3,
  "requestedCount": 3
}
```

## Service Integration

### Using JiraTaskAssignmentService Directly

```java
@Autowired
private JiraTaskAssignmentService jiraTaskAssignmentService;

// Create bulk tasks
List<MaintenanceTask> tasks = Arrays.asList(
    JiraTaskAssignmentService.createSimpleTask(
        "Filter Check", 
        "Check air filter condition", 
        "monthly", 
        "medium"
    ),
    JiraTaskAssignmentService.createSimpleTask(
        "Sensor Test", 
        "Test sensor functionality", 
        "weekly", 
        "high"
    )
);

List<String> issueKeys = jiraTaskAssignmentService.assignBulkMaintenanceTasks(tasks);
```

### Integration with Onboarding Process

```java
// During device onboarding
List<MaintenanceTask> maintenanceTasks = generateMaintenanceTasks(deviceData);
List<String> issueKeys = jiraTaskAssignmentService.assignBulkTasksFromOnboarding(
    maintenanceTasks, 
    userEmail, 
    deviceName
);
```

## Configuration

### Environment Variables
```bash
# Jira Configuration
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@company.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_PROJECT_KEY=YOUR_PROJECT_KEY
```

### Application Configuration
```yaml
# application.yml
jira:
  base-url: ${JIRA_BASE_URL:}
  username: ${JIRA_USERNAME:}
  api-token: ${JIRA_API_TOKEN:}
  project-key: ${JIRA_PROJECT_KEY:}
```

## Task Field Mapping

### Automatic Field Population
- **Project**: Uses configured project key
- **Issue Type**: Set to "Task"
- **Priority**: Mapped from task priority (high/medium/low)
- **Labels**: Automatically added (maintenance, iot, device, category)
- **Due Date**: Calculated from frequency
- **Time Tracking**: Set from estimated duration
- **Description**: Rich format with all task details

### Priority Mapping
- `high`, `critical` → Jira "High" priority
- `low` → Jira "Low" priority
- `medium` (default) → Jira "Medium" priority

### Due Date Calculation
- `daily` → +1 day
- `weekly` → +1 week
- `monthly` → +1 month
- `quarterly` → +3 months
- `yearly`, `annual` → +1 year
- Default → +1 week

## Error Handling

### Bulk Response Processing
The system processes bulk responses and handles partial failures:

```java
// Example response processing
{
  "issues": [
    {"key": "PROJ-123", "id": "10001"},
    {"key": "PROJ-124", "id": "10002"}
  ],
  "errors": [
    {
      "elementErrors": {
        "errorMessages": ["Invalid assignee email"],
        "errors": {}
      }
    }
  ]
}
```

### Error Scenarios
- **Configuration Issues**: Missing Jira credentials
- **API Errors**: Invalid project key, missing fields
- **Partial Failures**: Some tasks created, others failed
- **Network Issues**: Connection timeouts, rate limiting

## Performance Benefits

### Before (Individual API Calls)
- 10 tasks = 10 API calls
- Higher latency
- More rate limiting issues
- Individual error handling

### After (Bulk API Calls)
- 10 tasks = 1 API call
- Reduced latency
- Better rate limit utilization
- Batch error handling

## Usage Examples

### Frontend Integration
```javascript
// Create bulk tasks from frontend
const bulkTaskRequest = {
  tasks: maintenanceTasks.map(task => ({
    task: task.name,
    taskName: task.displayName,
    description: task.description,
    frequency: task.frequency,
    priority: task.priority,
    estimatedDuration: task.duration,
    requiredTools: task.tools,
    category: task.category,
    safetyNotes: task.safetyNotes
  }))
};

const response = await fetch('/api/jira/bulk/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(bulkTaskRequest)
});

const result = await response.json();
console.log(`Created ${result.createdCount} Jira tasks`);
```

### Backend Service Integration
```java
@Service
public class MaintenanceService {
    
    @Autowired
    private JiraTaskAssignmentService jiraService;
    
    public void processMaintenanceSchedule(List<MaintenanceTask> tasks) {
        // Create Jira tasks in bulk
        List<String> issueKeys = jiraService.assignBulkMaintenanceTasks(tasks);
        
        // Log results
        logger.info("Created {} Jira tasks: {}", issueKeys.size(), issueKeys);
        
        // Update local records with Jira keys
        updateMaintenanceRecordsWithJiraKeys(tasks, issueKeys);
    }
}
```

## Testing

### Unit Tests
```java
@Test
public void testBulkTaskCreation() {
    List<MaintenanceTask> tasks = createTestTasks();
    List<String> issueKeys = jiraService.assignBulkMaintenanceTasks(tasks);
    
    assertThat(issueKeys).hasSize(2);
    assertThat(issueKeys).allMatch(key -> key.startsWith("PROJ-"));
}
```

### Integration Tests
```java
@Test
public void testBulkTaskCreationEndpoint() {
    BulkTaskRequest request = new BulkTaskRequest();
    request.setTasks(createTestTasks());
    
    ResponseEntity<Map<String, Object>> response = 
        restTemplate.postForEntity("/api/jira/bulk/create", request, Map.class);
    
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    assertThat(response.getBody().get("success")).isEqualTo(true);
}
```

## Monitoring and Logging

### Log Messages
- `🔧 Assigning X Jira tasks in bulk` - Bulk operation start
- `✅ X Jira tasks assigned successfully in bulk` - Success
- `❌ Failed to assign bulk Jira tasks` - Failure
- `⚠️ Some issues failed to create: X` - Partial failure

### Metrics to Monitor
- Bulk operation success rate
- Average response time
- Number of tasks per bulk operation
- Error rates by error type

## Migration from Individual Calls

### Before
```java
// Old way - individual calls
for (MaintenanceTask task : tasks) {
    String issueKey = jiraService.assignMaintenanceTask(
        task.getTaskName(),
        task.getDescription(),
        userEmail,
        deviceName
    );
    issueKeys.add(issueKey);
}
```

### After
```java
// New way - bulk call
List<String> issueKeys = jiraService.assignBulkMaintenanceTasks(tasks);
```

## Best Practices

1. **Batch Size**: Keep bulk operations under 50 tasks for optimal performance
2. **Error Handling**: Always check for partial failures in responses
3. **Rate Limiting**: Monitor API usage and implement backoff strategies
4. **Data Validation**: Validate task data before sending to Jira
5. **Logging**: Log all bulk operations for debugging and monitoring

## Troubleshooting

### Common Issues
1. **Authentication Errors**: Check Jira credentials and API token
2. **Project Key Issues**: Verify project key exists and is accessible
3. **Field Validation**: Ensure required fields are provided
4. **Rate Limiting**: Implement exponential backoff for retries

### Debug Steps
1. Check application logs for detailed error messages
2. Verify Jira configuration in application.yml
3. Test with a single task first
4. Check Jira API documentation for field requirements
