package com.iotplatform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.ArrayList;
import com.iotplatform.dto.MaintenanceGenerationResponse.MaintenanceTask;

/**
 * Simple Jira task assignment service
 * Assigns maintenance tasks to users during onboarding flow
 */
@Service
public class JiraTaskAssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(JiraTaskAssignmentService.class);

    @Value("${jira.base-url:}")
    private String jiraBaseUrl;

    @Value("${jira.username:}")
    private String jiraUsername;

    @Value("${jira.api-token:}")
    private String jiraApiToken;

    @Value("${jira.project-key:}")
    private String jiraProjectKey;

    private final RestTemplate restTemplate;
    
    public JiraTaskAssignmentService() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Assigns a maintenance task to a user in Jira
     * 
     * @param taskTitle Task title
     * @param taskDescription Task description
     * @param assigneeEmail User's email to assign the task to
     * @param deviceName Device name for context
     * @return Jira issue key if successful, null if failed
     */
    public String assignMaintenanceTask(String taskTitle, String taskDescription, String assigneeEmail, String deviceName) {
        try {
            logger.info("🔧 Assigning Jira task: '{}' to user: {} for device: {}", taskTitle, assigneeEmail, deviceName);

            // Validate required configuration
            if (!isJiraConfigured()) {
                logger.warn("⚠️ Jira not configured, skipping task assignment");
                return null;
            }

            // Create Jira issue
            String issueKey = createJiraIssue(taskTitle, taskDescription, assigneeEmail, deviceName);
            
            if (issueKey != null) {
                logger.info("✅ Jira task assigned successfully: {}", issueKey);
            } else {
                logger.error("❌ Failed to assign Jira task");
            }

            return issueKey;

        } catch (Exception e) {
            logger.error("❌ Error assigning Jira task: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Assigns multiple maintenance tasks to users in Jira using bulk creation
     * 
     * @param tasks List of maintenance tasks to create
     * @return List of created Jira issue keys
     */
    public List<String> assignBulkMaintenanceTasks(List<MaintenanceTask> tasks) {
        try {
            logger.info("🔧 Assigning {} Jira tasks in bulk", tasks.size());

            // Validate required configuration
            if (!isJiraConfigured()) {
                logger.warn("⚠️ Jira not configured, skipping bulk task assignment");
                return new ArrayList<>();
            }

            // Create bulk Jira issues
            List<String> issueKeys = createBulkJiraIssues(tasks);
            
            if (!issueKeys.isEmpty()) {
                logger.info("✅ {} Jira tasks assigned successfully in bulk", issueKeys.size());
            } else {
                logger.error("❌ Failed to assign bulk Jira tasks");
            }

            return issueKeys;

        } catch (Exception e) {
            logger.error("❌ Error assigning bulk Jira tasks: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Creates multiple Jira issues in bulk using the bulk API endpoint
     * Based on Atlassian Forge bulk issue creation pattern
     * 
     * @param tasks List of maintenance tasks to create
     * @return List of created Jira issue keys
     */
    private List<String> createBulkJiraIssues(List<MaintenanceTask> tasks) {
        try {
            String url = jiraBaseUrl + "/rest/api/3/issue/bulk";

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + getBasicAuth());

            // Prepare bulk issue data
            Map<String, Object> bulkData = new HashMap<>();
            List<Map<String, Object>> issueUpdates = new ArrayList<>();

            for (MaintenanceTask task : tasks) {
                Map<String, Object> issueUpdate = new HashMap<>();
                
                // Create fields for this issue
                Map<String, Object> fields = createBulkIssueFields(task);
                issueUpdate.put("fields", fields);
                
                // Add empty update object (can be used for worklog, comments, etc.)
                issueUpdate.put("update", new HashMap<>());
                
                issueUpdates.add(issueUpdate);
            }

            bulkData.put("issueUpdates", issueUpdates);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(bulkData, headers);

            // Make bulk API call
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                return processBulkResponse(response.getBody());
            } else {
                logger.error("❌ Jira bulk API returned status: {}", response.getStatusCode());
                return new ArrayList<>();
            }

        } catch (Exception e) {
            logger.error("❌ Error creating bulk Jira issues: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Creates issue fields for bulk Jira creation
     */
    private Map<String, Object> createBulkIssueFields(MaintenanceTask task) {
        Map<String, Object> fields = new HashMap<>();
        
        // Basic issue fields
        fields.put("project", Map.of("key", jiraProjectKey));
        fields.put("summary", task.getTaskName() != null ? task.getTaskName() : task.getTask());
        fields.put("description", createBulkDescription(task));
        fields.put("issuetype", Map.of("name", "Task"));
        
        // Set priority based on task priority
        String priority = mapPriority(task.getPriority());
        fields.put("priority", Map.of("name", priority));
        
        // Add labels
        List<String> labels = new ArrayList<>();
        labels.add("maintenance");
        labels.add("iot");
        labels.add("device");
        if (task.getCategory() != null) {
            labels.add(task.getCategory().toLowerCase().replace(" ", "-"));
        }
        fields.put("labels", labels);
        
        // Add due date if frequency is specified
        if (task.getFrequency() != null) {
            String dueDate = calculateDueDate(task.getFrequency());
            if (dueDate != null) {
                fields.put("duedate", dueDate);
            }
        }
        
        // Add time tracking if estimated duration is provided
        if (task.getEstimatedDuration() != null) {
            Map<String, String> timeTracking = new HashMap<>();
            timeTracking.put("originalEstimate", task.getEstimatedDuration());
            timeTracking.put("remainingEstimate", task.getEstimatedDuration());
            fields.put("timetracking", timeTracking);
        }
        
        return fields;
    }

    /**
     * Creates formatted description for bulk Jira issue
     */
    private String createBulkDescription(MaintenanceTask task) {
        StringBuilder desc = new StringBuilder();
        desc.append("h3. Maintenance Task Details\n\n");
        
        if (task.getDescription() != null) {
            desc.append("*Description:*\n").append(task.getDescription()).append("\n\n");
        }
        
        if (task.getFrequency() != null) {
            desc.append("*Frequency:* ").append(task.getFrequency()).append("\n\n");
        }
        
        if (task.getEstimatedDuration() != null) {
            desc.append("*Estimated Duration:* ").append(task.getEstimatedDuration()).append("\n\n");
        }
        
        if (task.getRequiredTools() != null) {
            desc.append("*Required Tools:* ").append(task.getRequiredTools()).append("\n\n");
        }
        
        if (task.getCategory() != null) {
            desc.append("*Category:* ").append(task.getCategory()).append("\n\n");
        }
        
        if (task.getSafetyNotes() != null) {
            desc.append("h3. Safety Notes\n");
            desc.append(task.getSafetyNotes()).append("\n\n");
        }
        
        desc.append("h3. Instructions\n");
        desc.append("# Review the maintenance requirements\n");
        desc.append("# Complete the maintenance task\n");
        desc.append("# Update the task status when completed\n");
        desc.append("# Add any notes or issues encountered\n\n");
        desc.append("----\n");
        desc.append("_This task was automatically created from the IoT Platform bulk maintenance system._");
        
        return desc.toString();
    }

    /**
     * Maps task priority to Jira priority
     */
    private String mapPriority(String taskPriority) {
        if (taskPriority == null) return "Medium";
        
        String priority = taskPriority.toLowerCase();
        if (priority.contains("high") || priority.contains("critical")) {
            return "High";
        } else if (priority.contains("low")) {
            return "Low";
        } else {
            return "Medium";
        }
    }

    /**
     * Calculates due date based on frequency
     */
    private String calculateDueDate(String frequency) {
        if (frequency == null) return null;
        
        // Simple calculation - can be enhanced based on business requirements
        java.time.LocalDate dueDate = java.time.LocalDate.now();
        
        String freq = frequency.toLowerCase();
        if (freq.contains("daily")) {
            dueDate = dueDate.plusDays(1);
        } else if (freq.contains("weekly")) {
            dueDate = dueDate.plusWeeks(1);
        } else if (freq.contains("monthly")) {
            dueDate = dueDate.plusMonths(1);
        } else if (freq.contains("quarterly")) {
            dueDate = dueDate.plusMonths(3);
        } else if (freq.contains("yearly") || freq.contains("annual")) {
            dueDate = dueDate.plusYears(1);
        } else {
            // Default to 1 week
            dueDate = dueDate.plusWeeks(1);
        }
        
        return dueDate.toString();
    }

    /**
     * Processes bulk response and extracts issue keys
     */
    private List<String> processBulkResponse(Map<String, Object> responseBody) {
        List<String> issueKeys = new ArrayList<>();
        
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> issues = (List<Map<String, Object>>) responseBody.get("issues");
            
            if (issues != null) {
                for (Map<String, Object> issue : issues) {
                    String key = (String) issue.get("key");
                    if (key != null) {
                        issueKeys.add(key);
                        logger.info("✅ Created Jira issue: {}", key);
                    }
                }
            }
            
            // Check for errors
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> errors = (List<Map<String, Object>>) responseBody.get("errors");
            if (errors != null && !errors.isEmpty()) {
                logger.warn("⚠️ Some issues failed to create: {}", errors.size());
                for (Map<String, Object> error : errors) {
                    logger.error("❌ Bulk creation error: {}", error);
                }
            }
            
        } catch (Exception e) {
            logger.error("❌ Error processing bulk response: {}", e.getMessage(), e);
        }
        
        return issueKeys;
    }

    /**
     * Creates a Jira issue for maintenance task
     */
    private String createJiraIssue(String title, String description, String assigneeEmail, String deviceName) {
        try {
            String url = jiraBaseUrl + "/rest/api/3/issue";

            // Prepare headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Basic " + getBasicAuth());

            // Prepare issue data
            Map<String, Object> issueData = new HashMap<>();
            issueData.put("fields", createIssueFields(title, description, assigneeEmail, deviceName));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(issueData, headers);

            // Make API call
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.CREATED && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                return (String) responseBody.get("key");
            } else {
                logger.error("❌ Jira API returned status: {}", response.getStatusCode());
                return null;
            }

        } catch (Exception e) {
            logger.error("❌ Error creating Jira issue: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * Creates issue fields for Jira
     */
    private Map<String, Object> createIssueFields(String title, String description, String assigneeEmail, String deviceName) {
        Map<String, Object> fields = new HashMap<>();
        
        // Basic issue fields
        fields.put("project", Map.of("key", jiraProjectKey));
        fields.put("summary", title);
        fields.put("description", createDescription(description, deviceName));
        fields.put("issuetype", Map.of("name", "Task"));
        
        // Assign to user if email provided
        if (assigneeEmail != null && !assigneeEmail.trim().isEmpty()) {
            fields.put("assignee", Map.of("emailAddress", assigneeEmail));
        }
        
        // Set priority to Medium for maintenance tasks
        fields.put("priority", Map.of("name", "Medium"));
        
        // Add labels
        fields.put("labels", new String[]{"maintenance", "iot", "device"});
        
        return fields;
    }

    /**
     * Creates formatted description for Jira issue
     */
    private String createDescription(String description, String deviceName) {
        StringBuilder desc = new StringBuilder();
        desc.append("h3. Maintenance Task Details\n\n");
        desc.append("*Device:* ").append(deviceName != null ? deviceName : "N/A").append("\n\n");
        desc.append("*Description:*\n").append(description != null ? description : "Maintenance task created from IoT platform");
        desc.append("\n\n");
        desc.append("h3. Instructions\n");
        desc.append("# Review the maintenance requirements\n");
        desc.append("# Complete the maintenance task\n");
        desc.append("# Update the task status when completed\n");
        desc.append("# Add any notes or issues encountered\n\n");
        desc.append("----\n");
        desc.append("_This task was automatically created from the IoT Platform onboarding flow._");
        
        return desc.toString();
    }

    /**
     * Creates Basic Auth header for Jira API
     */
    private String getBasicAuth() {
        String credentials = jiraUsername + ":" + jiraApiToken;
        return Base64.getEncoder().encodeToString(credentials.getBytes());
    }

    /**
     * Checks if Jira is properly configured
     */
    public boolean isJiraConfigured() {
        return jiraBaseUrl != null && !jiraBaseUrl.trim().isEmpty() &&
               jiraUsername != null && !jiraUsername.trim().isEmpty() &&
               jiraApiToken != null && !jiraApiToken.trim().isEmpty() &&
               jiraProjectKey != null && !jiraProjectKey.trim().isEmpty();
    }

    /**
     * Simple method to assign task during onboarding
     * Can be called from maintenance data storage in onboarding flow
     */
    public void assignTaskFromOnboarding(String maintenanceTask, String userEmail, String deviceName) {
        logger.info("🚀 Assigning onboarding maintenance task to Jira");
        
        String taskTitle = "Maintenance: " + maintenanceTask;
        String taskDescription = "Maintenance task created during device onboarding process";
        
        String issueKey = assignMaintenanceTask(taskTitle, taskDescription, userEmail, deviceName);
        
        if (issueKey != null) {
            logger.info("✅ Onboarding task assigned to Jira: {}", issueKey);
        } else {
            logger.warn("⚠️ Failed to assign onboarding task to Jira");
        }
    }

    /**
     * Assigns bulk maintenance tasks from onboarding process
     * 
     * @param maintenanceTasks List of maintenance tasks from onboarding
     * @param userEmail User email to assign tasks to
     * @param deviceName Device name for context
     * @return List of created Jira issue keys
     */
    public List<String> assignBulkTasksFromOnboarding(List<MaintenanceTask> maintenanceTasks, String userEmail, String deviceName) {
        logger.info("🚀 Assigning {} onboarding maintenance tasks to Jira in bulk", maintenanceTasks.size());
        
        // Enhance tasks with device context
        List<MaintenanceTask> enhancedTasks = new ArrayList<>();
        for (MaintenanceTask task : maintenanceTasks) {
            // Create enhanced task with device context
            MaintenanceTask enhancedTask = MaintenanceTask.builder()
                .task(task.getTask())
                .taskName(task.getTaskName() != null ? task.getTaskName() : "Maintenance: " + task.getTask())
                .description(enhanceDescriptionWithDevice(task.getDescription(), deviceName))
                .frequency(task.getFrequency())
                .priority(task.getPriority())
                .estimatedDuration(task.getEstimatedDuration())
                .requiredTools(task.getRequiredTools())
                .category(task.getCategory())
                .safetyNotes(task.getSafetyNotes())
                .build();
            
            enhancedTasks.add(enhancedTask);
        }
        
        List<String> issueKeys = assignBulkMaintenanceTasks(enhancedTasks);
        
        if (!issueKeys.isEmpty()) {
            logger.info("✅ {} onboarding tasks assigned to Jira in bulk", issueKeys.size());
        } else {
            logger.warn("⚠️ Failed to assign bulk onboarding tasks to Jira");
        }
        
        return issueKeys;
    }

    /**
     * Enhances task description with device context
     */
    private String enhanceDescriptionWithDevice(String originalDescription, String deviceName) {
        if (originalDescription == null) {
            originalDescription = "Maintenance task created during device onboarding process";
        }
        
        return originalDescription + "\n\n*Device Context:* " + (deviceName != null ? deviceName : "N/A");
    }

    /**
     * Creates a simple maintenance task for bulk operations
     * 
     * @param taskName Task name
     * @param description Task description
     * @param frequency Task frequency
     * @param priority Task priority
     * @return MaintenanceTask object
     */
    public static MaintenanceTask createSimpleTask(String taskName, String description, String frequency, String priority) {
        return MaintenanceTask.builder()
            .task(taskName)
            .taskName(taskName)
            .description(description)
            .frequency(frequency)
            .priority(priority)
            .build();
    }
}
