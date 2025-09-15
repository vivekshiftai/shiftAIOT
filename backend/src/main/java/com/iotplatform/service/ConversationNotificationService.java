package com.iotplatform.service;

import com.iotplatform.dto.MaintenanceNotificationRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalTime;
import java.util.concurrent.CompletableFuture;

/**
 * Service for sending maintenance notifications to the conversation flow endpoint.
 * Handles retry logic, error handling, and async processing.
 * 
 * IMPORTANT: This service now uses fixed templates instead of LLM-generated messages
 * to ensure consistent formatting in Slack notifications. The formattedMessage field
 * contains the pre-formatted Slack message that replaces the inconsistent LLM output.
 */
@Service
@RequiredArgsConstructor
public class ConversationNotificationService {
    
    private static final Logger log = LoggerFactory.getLogger(ConversationNotificationService.class);

    private final RestTemplate restTemplate;

    @Value("${conversation.api.base-url:http://20.57.36.66:8100/api/chat}")
    private String conversationApiBaseUrl;

    @Value("${conversation.api.max-retries:3}")
    private int maxRetries;

    @Value("${conversation.api.retry-delay:1000}")
    private long retryDelay;

    /**
     * Send a maintenance notification to the conversation flow endpoint.
     * 
     * @param notification The maintenance notification request
     * @return true if sent successfully, false otherwise
     */
    public boolean sendMaintenanceNotification(MaintenanceNotificationRequest notification) {
        log.info("Sending maintenance notification for user: {}, device: {}, task: {}", 
                notification.getUserId(), notification.getDeviceName(), notification.getTask());

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> response = sendNotificationWithRetry(notification, attempt);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Maintenance notification sent successfully on attempt {} for user: {}", 
                            attempt, notification.getUserId());
                    return true;
                } else {
                    log.warn("Maintenance notification failed on attempt {} with status: {} for user: {}", 
                            attempt, response.getStatusCode(), notification.getUserId());
                }
                
            } catch (HttpClientErrorException e) {
                log.error("Client error sending maintenance notification on attempt {} for user: {} - {}", 
                        attempt, notification.getUserId(), e.getMessage());
                if (e.getStatusCode() == HttpStatus.NOT_FOUND || e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                    // Don't retry on client errors
                    break;
                }
            } catch (HttpServerErrorException e) {
                log.error("Server error sending maintenance notification on attempt {} for user: {} - {}", 
                        attempt, notification.getUserId(), e.getMessage());
            } catch (ResourceAccessException e) {
                log.error("Connection error sending maintenance notification on attempt {} for user: {} - {}", 
                        attempt, notification.getUserId(), e.getMessage());
            } catch (Exception e) {
                log.error("Unexpected error sending maintenance notification on attempt {} for user: {} - {}", 
                        attempt, notification.getUserId(), e.getMessage(), e);
            }

            // Wait before retry (except on last attempt)
            if (attempt < maxRetries) {
                try {
                    Thread.sleep(retryDelay);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("Interrupted while waiting for retry");
                    break;
                }
            }
        }

        log.error("Failed to send maintenance notification after {} attempts for user: {}", 
                maxRetries, notification.getUserId());
        return false;
    }

    /**
     * Send maintenance notification asynchronously.
     * 
     * @param notification The maintenance notification request
     * @return CompletableFuture with the result
     */
    public CompletableFuture<Boolean> sendMaintenanceNotificationAsync(MaintenanceNotificationRequest notification) {
        return CompletableFuture.supplyAsync(() -> sendMaintenanceNotification(notification));
    }

    /**
     * Send notification with retry logic.
     * 
     * @param notification The notification to send
     * @param attempt Current attempt number
     * @return ResponseEntity from the API call
     */
    private ResponseEntity<String> sendNotificationWithRetry(MaintenanceNotificationRequest notification, int attempt) {
        String url = conversationApiBaseUrl + "/maintenance-notification";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<MaintenanceNotificationRequest> request = new HttpEntity<>(notification, headers);
        
        log.debug("Sending maintenance notification attempt {} to URL: {}", attempt, url);
        
        return restTemplate.postForEntity(url, request, String.class);
    }

    /**
     * Create a maintenance notification request from maintenance schedule data.
     * 
     * @param maintenanceData The maintenance data array
     * @param deviceName The device name
     * @param assignedUserId The assigned user ID
     * @param assignedUserName The assigned user name
     * @param organizationId The organization ID
     * @return MaintenanceNotificationRequest
     */
    public MaintenanceNotificationRequest createNotificationRequest(
            Object[] maintenanceData, 
            String deviceName, 
            String assignedUserId, 
            String assignedUserName,
            String organizationId) {
        
        // Extract data from the Object array (based on the query result)
        String taskName = (String) maintenanceData[2]; // task_name
        String priority = (String) maintenanceData[9]; // priority
        String maintenanceType = (String) maintenanceData[5]; // maintenance_type
        String description = (String) maintenanceData[3]; // description
        String taskId = (String) maintenanceData[0]; // id
        String nextMaintenance = maintenanceData[8] != null ? maintenanceData[8].toString() : null; // next_maintenance
        
        // Default due time to 9:00 AM if not specified
        LocalTime dueTime = LocalTime.of(9, 0);
        
        // Create fixed template message for Slack
        String formattedMessage = createFixedSlackMessage(deviceName, taskName, priority, assignedUserName, taskId, nextMaintenance);
        
        log.info("📝 Created fixed template message for Slack: {}", formattedMessage);
        
        return MaintenanceNotificationRequest.builder()
                .userId(assignedUserId)
                .deviceName(deviceName != null ? deviceName : "Unknown Device")
                .task(taskName)
                .dueTime(dueTime)
                .priority(priority != null ? priority.toUpperCase() : "MEDIUM")
                .maintenanceType(maintenanceType)
                .description(description)
                .assignedTo(assignedUserName)
                .organizationId(organizationId)
                .formattedMessage(formattedMessage)
                .build();
    }
    
    /**
     * Create a fixed template message for Slack notifications with blocks.
     * This replaces the LLM-generated messages with a consistent format.
     * 
     * @param deviceName The device name
     * @param taskName The maintenance task name
     * @param priority The priority level
     * @param assignedUserName The assigned user name
     * @return Formatted Slack message with blocks
     */
    private String createFixedSlackMessage(String deviceName, String taskName, String priority, String assignedUserName, String taskId, String nextMaintenance) {
        // Clean up device name for display
        String displayDeviceName = deviceName != null ? deviceName : "Unknown Device";
        String displayTaskName = taskName != null ? taskName : "Maintenance Task";
        String displayPriority = priority != null ? priority.toUpperCase() : "MEDIUM";
        String displayUserName = assignedUserName != null ? assignedUserName : "Assigned User";
        String displayTaskId = taskId != null ? taskId.substring(0, Math.min(8, taskId.length())) : "N/A";
        String displayDueDate = nextMaintenance != null ? nextMaintenance : "Today";
        
        // Get priority emoji
        String priorityEmoji = getPriorityEmoji(displayPriority);
        
        // Create plain text message
        String plainText = String.format(
            "🔔 Maintenance Alert: %s requires maintenance. Action required. Please review the details below and take appropriate action.",
            displayDeviceName
        );
        
        // Create blocks JSON structure
        String blocks = String.format(
            "[" +
            "{" +
            "  \"type\": \"header\"," +
            "  \"text\": {" +
            "    \"type\": \"plain_text\"," +
            "    \"text\": \"🔔 Maintenance Alert: %s\"" +
            "  }" +
            "}," +
            "{" +
            "  \"type\": \"section\"," +
            "  \"fields\": [" +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Device:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Task:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Assigned To:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Priority:*\\n%s %s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Due Date:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Task ID:*\\n%s\"" +
            "    }" +
            "  ]" +
            "}," +
            "{" +
            "  \"type\": \"section\"," +
            "  \"text\": {" +
            "    \"type\": \"mrkdwn\"," +
            "    \"text\": \"*Description:* Maintenance task scheduled for today. Please complete the maintenance task as soon as possible to ensure optimal device performance.\"" +
            "  }" +
            "}," +
            "{" +
            "  \"type\": \"divider\"" +
            "}," +
            "{" +
            "  \"type\": \"actions\"," +
            "  \"elements\": [" +
            "    {" +
            "      \"type\": \"button\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"Mark as Completed\"" +
            "      }," +
            "      \"style\": \"primary\"," +
            "      \"action_id\": \"mark_completed\"" +
            "    }," +
            "    {" +
            "      \"type\": \"button\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"Reschedule\"" +
            "      }," +
            "      \"action_id\": \"reschedule\"" +
            "    }," +
            "    {" +
            "      \"type\": \"button\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"View Details\"" +
            "      }," +
            "      \"action_id\": \"view_details\"" +
            "    }" +
            "  ]" +
            "}" +
            "]",
            displayDeviceName,
            displayDeviceName,
            displayTaskName,
            displayUserName,
            priorityEmoji,
            displayPriority,
            displayDueDate,
            displayTaskId
        );
        
        // Return both plain text and blocks
        return String.format("TEXT: %s\n\nBLOCKS: %s", plainText, blocks);
    }
    
    /**
     * Create a maintenance notification request for reminders with a different template.
     * 
     * @param maintenanceData The maintenance data array
     * @param deviceName The device name
     * @param assignedUserId The assigned user ID
     * @param assignedUserName The assigned user name
     * @param organizationId The organization ID
     * @param reminderNumber The reminder number (1, 2, or 3)
     * @return MaintenanceNotificationRequest
     */
    public MaintenanceNotificationRequest createReminderNotificationRequest(
            Object[] maintenanceData, 
            String deviceName, 
            String assignedUserId, 
            String assignedUserName,
            String organizationId,
            int reminderNumber) {
        
        // Extract data from the Object array (based on the query result)
        String taskName = (String) maintenanceData[2]; // task_name
        String priority = (String) maintenanceData[9]; // priority
        String maintenanceType = (String) maintenanceData[5]; // maintenance_type
        String description = (String) maintenanceData[3]; // description
        
        // Default due time to 9:00 AM if not specified
        LocalTime dueTime = LocalTime.of(9, 0);
        
        // Create fixed template message for Slack reminders
        String formattedMessage = createFixedReminderSlackMessage(deviceName, taskName, priority, assignedUserName, reminderNumber);
        
        log.info("📝 Created fixed reminder template message for Slack: {}", formattedMessage);
        
        return MaintenanceNotificationRequest.builder()
                .userId(assignedUserId)
                .deviceName(deviceName != null ? deviceName : "Unknown Device")
                .task(taskName)
                .dueTime(dueTime)
                .priority(priority != null ? priority.toUpperCase() : "MEDIUM")
                .maintenanceType(maintenanceType)
                .description(description)
                .assignedTo(assignedUserName)
                .organizationId(organizationId)
                .formattedMessage(formattedMessage)
                .build();
    }
    
    /**
     * Create a fixed template message for Slack reminder notifications with blocks.
     * 
     * @param deviceName The device name
     * @param taskName The maintenance task name
     * @param priority The priority level
     * @param assignedUserName The assigned user name
     * @param reminderNumber The reminder number
     * @return Formatted Slack reminder message with blocks
     */
    private String createFixedReminderSlackMessage(String deviceName, String taskName, String priority, String assignedUserName, int reminderNumber) {
        // Clean up device name for display
        String displayDeviceName = deviceName != null ? deviceName : "Unknown Device";
        String displayTaskName = taskName != null ? taskName : "Maintenance Task";
        String displayPriority = priority != null ? priority.toUpperCase() : "MEDIUM";
        String displayUserName = assignedUserName != null ? assignedUserName : "Assigned User";
        
        // Get priority emoji
        String priorityEmoji = getPriorityEmoji(displayPriority);
        
        // Create plain text message
        String plainText = String.format(
            "🔔 Maintenance Reminder #%d: %s requires maintenance. This is reminder #%d. Please complete the maintenance task as soon as possible.",
            reminderNumber, displayDeviceName, reminderNumber
        );
        
        // Create blocks JSON structure for reminder
        String blocks = String.format(
            "[" +
            "{" +
            "  \"type\": \"header\"," +
            "  \"text\": {" +
            "    \"type\": \"plain_text\"," +
            "    \"text\": \"🔔 Maintenance Reminder #%d: %s\"" +
            "  }" +
            "}," +
            "{" +
            "  \"type\": \"section\"," +
            "  \"fields\": [" +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Device:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Task:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Assigned To:*\\n%s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Priority:*\\n%s %s\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Due Date:*\\nToday (Overdue)\"" +
            "    }," +
            "    {" +
            "      \"type\": \"mrkdwn\"," +
            "      \"text\": \"*Reminder:*\\n#%d of 3\"" +
            "    }" +
            "  ]" +
            "}," +
            "{" +
            "  \"type\": \"section\"," +
            "  \"text\": {" +
            "    \"type\": \"mrkdwn\"," +
            "    \"text\": \"*Description:* This is reminder #%d for the maintenance task. The task is now overdue and requires immediate attention. Please complete the maintenance task as soon as possible.\"" +
            "  }" +
            "}," +
            "{" +
            "  \"type\": \"divider\"" +
            "}," +
            "{" +
            "  \"type\": \"actions\"," +
            "  \"elements\": [" +
            "    {" +
            "      \"type\": \"button\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"Mark as Completed\"" +
            "      }," +
            "      \"style\": \"primary\"," +
            "      \"action_id\": \"mark_completed\"" +
            "    }," +
            "    {" +
            "      \"type\": \"button\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"Reschedule\"" +
            "      }," +
            "      \"action_id\": \"reschedule\"" +
            "    }," +
            "    {" +
            "      \"type\": \"button\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"Escalate\"" +
            "      }," +
            "      \"style\": \"danger\"," +
            "      \"action_id\": \"escalate\"" +
            "    }" +
            "  ]" +
            "}" +
            "]",
            reminderNumber, displayDeviceName,
            displayDeviceName,
            displayTaskName,
            displayUserName,
            priorityEmoji,
            displayPriority,
            reminderNumber,
            reminderNumber
        );
        
        // Return both plain text and blocks
        return String.format("TEXT: %s\n\nBLOCKS: %s", plainText, blocks);
    }
    
    /**
     * Get priority emoji based on priority level.
     * 
     * @param priority The priority level
     * @return Emoji string for the priority
     */
    private String getPriorityEmoji(String priority) {
        if (priority == null) return "🟡";
        
        switch (priority.toUpperCase()) {
            case "CRITICAL":
            case "HIGH":
                return "🔴";
            case "MEDIUM":
                return "🟡";
            case "LOW":
                return "🟢";
            default:
                return "🟡";
        }
    }
    
    /**
     * Create a JSON-formatted Slack message payload for direct API integration.
     * This method creates a proper JSON structure that can be sent directly to Slack API.
     * 
     * @param deviceName The device name
     * @param taskName The maintenance task name
     * @param priority The priority level
     * @param assignedUserName The assigned user name
     * @param taskId The task ID
     * @param nextMaintenance The next maintenance date
     * @return JSON-formatted Slack message payload
     */
    public String createSlackMessagePayload(String deviceName, String taskName, String priority, String assignedUserName, String taskId, String nextMaintenance) {
        // Clean up device name for display
        String displayDeviceName = deviceName != null ? deviceName : "Unknown Device";
        String displayTaskName = taskName != null ? taskName : "Maintenance Task";
        String displayPriority = priority != null ? priority.toUpperCase() : "MEDIUM";
        String displayUserName = assignedUserName != null ? assignedUserName : "Assigned User";
        String displayTaskId = taskId != null ? taskId.substring(0, Math.min(8, taskId.length())) : "N/A";
        String displayDueDate = nextMaintenance != null ? nextMaintenance : "Today";
        
        // Get priority emoji
        String priorityEmoji = getPriorityEmoji(displayPriority);
        
        // Create plain text message
        String plainText = String.format(
            "🔔 Maintenance Alert: %s requires maintenance. Action required. Please review the details below and take appropriate action.",
            displayDeviceName
        );
        
        // Create JSON payload
        return String.format(
            "{" +
            "  \"text\": \"%s\"," +
            "  \"blocks\": [" +
            "    {" +
            "      \"type\": \"header\"," +
            "      \"text\": {" +
            "        \"type\": \"plain_text\"," +
            "        \"text\": \"🔔 Maintenance Alert: %s\"" +
            "      }" +
            "    }," +
            "    {" +
            "      \"type\": \"section\"," +
            "      \"fields\": [" +
            "        {" +
            "          \"type\": \"mrkdwn\"," +
            "          \"text\": \"*Device:*\\n%s\"" +
            "        }," +
            "        {" +
            "          \"type\": \"mrkdwn\"," +
            "          \"text\": \"*Task:*\\n%s\"" +
            "        }," +
            "        {" +
            "          \"type\": \"mrkdwn\"," +
            "          \"text\": \"*Assigned To:*\\n%s\"" +
            "        }," +
            "        {" +
            "          \"type\": \"mrkdwn\"," +
            "          \"text\": \"*Priority:*\\n%s %s\"" +
            "        }," +
            "        {" +
            "          \"type\": \"mrkdwn\"," +
            "          \"text\": \"*Due Date:*\\n%s\"" +
            "        }," +
            "        {" +
            "          \"type\": \"mrkdwn\"," +
            "          \"text\": \"*Task ID:*\\n%s\"" +
            "        }" +
            "      ]" +
            "    }," +
            "    {" +
            "      \"type\": \"section\"," +
            "      \"text\": {" +
            "        \"type\": \"mrkdwn\"," +
            "        \"text\": \"*Description:* Maintenance task scheduled for today. Please complete the maintenance task as soon as possible to ensure optimal device performance.\"" +
            "      }" +
            "    }," +
            "    {" +
            "      \"type\": \"divider\"" +
            "    }," +
            "    {" +
            "      \"type\": \"actions\"," +
            "      \"elements\": [" +
            "        {" +
            "          \"type\": \"button\"," +
            "          \"text\": {" +
            "            \"type\": \"plain_text\"," +
            "            \"text\": \"Mark as Completed\"" +
            "          }," +
            "          \"style\": \"primary\"," +
            "          \"action_id\": \"mark_completed\"" +
            "        }," +
            "        {" +
            "          \"type\": \"button\"," +
            "          \"text\": {" +
            "            \"type\": \"plain_text\"," +
            "            \"text\": \"Reschedule\"" +
            "          }," +
            "          \"action_id\": \"reschedule\"" +
            "        }," +
            "        {" +
            "          \"type\": \"button\"," +
            "          \"text\": {" +
            "            \"type\": \"plain_text\"," +
            "            \"text\": \"View Details\"" +
            "          }," +
            "          \"action_id\": \"view_details\"" +
            "        }" +
            "      ]" +
            "    }" +
            "  ]" +
            "}",
            plainText.replace("\"", "\\\""), // Escape quotes in plain text
            displayDeviceName,
            displayDeviceName,
            displayTaskName,
            displayUserName,
            priorityEmoji,
            displayPriority,
            displayDueDate,
            displayTaskId
        );
    }
}
