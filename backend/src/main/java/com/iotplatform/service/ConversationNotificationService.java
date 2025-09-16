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

    @Value("${conversation.api.base-url:http://20.57.36.66:5000/chat}")
    private String conversationApiBaseUrl;

    @Value("${conversation.api.max-retries:3}")
    private int maxRetries;

    @Value("${conversation.api.retry-delay:1000}")
    private long retryDelay;

    /**
     * Send a maintenance notification to the conversation flow endpoint.
     * Uses a structured prompt format similar to the security alert template.
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
     * Send a custom message to the conversation channel.
     * 
     * @param message The custom message to send
     * @return true if sent successfully, false otherwise
     */
    public boolean sendCustomMessageToConversationChannel(String message) {
        log.info("Sending custom message to conversation channel");
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> response = sendCustomMessageWithRetry(message, attempt);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Custom message sent successfully on attempt {} to conversation channel", attempt);
                    return true;
                } else {
                    log.warn("Custom message failed on attempt {} with status: {}", attempt, response.getStatusCode());
                }
                
            } catch (Exception e) {
                log.error("Error sending custom message on attempt {}: {}", attempt, e.getMessage(), e);
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

        log.error("Failed to send custom message after {} attempts", maxRetries);
        return false;
    }
    
    /**
     * Send custom message with retry logic using conversation API.
     * 
     * @param message The custom message to send
     * @param attempt Current attempt number
     * @return ResponseEntity from the API call
     */
    private ResponseEntity<String> sendCustomMessageWithRetry(String message, int attempt) {
        String url = conversationApiBaseUrl;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Send the custom message directly as the message content
        String requestPayload = String.format(
            "{\"message\": \"%s\"}",
            message.replace("\"", "\\\"").replace("\n", "\\n")
        );
        
        HttpEntity<String> request = new HttpEntity<>(requestPayload, headers);
        
        log.debug("Sending custom message attempt {} to URL: {} with message: {}", attempt, url, message);
        
        return restTemplate.postForEntity(url, request, String.class);
    }
    
    /**
     * Send a maintenance reminder notification using structured prompt.
     * 
     * @param notification The maintenance notification request
     * @param reminderNumber The reminder number (1, 2, or 3)
     * @return true if sent successfully, false otherwise
     */
    public boolean sendMaintenanceReminderNotification(MaintenanceNotificationRequest notification, int reminderNumber) {
        log.info("Sending maintenance reminder notification #{} for user: {}, device: {}, task: {}", 
                reminderNumber, notification.getUserId(), notification.getDeviceName(), notification.getTask());

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                ResponseEntity<String> response = sendReminderNotificationWithRetry(notification, reminderNumber, attempt);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Maintenance reminder notification #{} sent successfully on attempt {} for user: {}", 
                            reminderNumber, attempt, notification.getUserId());
                    return true;
                } else {
                    log.warn("Maintenance reminder notification #{} failed on attempt {} with status: {} for user: {}", 
                            reminderNumber, attempt, response.getStatusCode(), notification.getUserId());
                }
                
            } catch (HttpClientErrorException e) {
                log.error("Client error sending maintenance reminder notification #{} on attempt {} for user: {} - {}", 
                        reminderNumber, attempt, notification.getUserId(), e.getMessage());
                if (e.getStatusCode() == HttpStatus.NOT_FOUND || e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                    // Don't retry on client errors
                    break;
                }
            } catch (HttpServerErrorException e) {
                log.error("Server error sending maintenance reminder notification #{} on attempt {} for user: {} - {}", 
                        reminderNumber, attempt, notification.getUserId(), e.getMessage());
            } catch (ResourceAccessException e) {
                log.error("Connection error sending maintenance reminder notification #{} on attempt {} for user: {} - {}", 
                        reminderNumber, attempt, notification.getUserId(), e.getMessage());
            } catch (Exception e) {
                log.error("Unexpected error sending maintenance reminder notification #{} on attempt {} for user: {} - {}", 
                        reminderNumber, attempt, notification.getUserId(), e.getMessage(), e);
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

        log.error("Failed to send maintenance reminder notification #{} after {} attempts for user: {}", 
                reminderNumber, maxRetries, notification.getUserId());
        return false;
    }
    
    /**
     * Send reminder notification with retry logic using conversation API with structured prompt.
     * 
     * @param notification The notification to send
     * @param reminderNumber The reminder number
     * @param attempt Current attempt number
     * @return ResponseEntity from the API call
     */
    private ResponseEntity<String> sendReminderNotificationWithRetry(MaintenanceNotificationRequest notification, int reminderNumber, int attempt) {
        String url = conversationApiBaseUrl;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Create structured prompt for reminder
        String structuredPrompt = createStructuredReminderPrompt(notification, reminderNumber);
        
        // Send the structured prompt directly as the message content
        String requestPayload = String.format(
            "{\"message\": \"%s\"}",
            structuredPrompt.replace("\"", "\\\"").replace("\n", "\\n")
        );
        
        HttpEntity<String> request = new HttpEntity<>(requestPayload, headers);
        
        log.debug("Sending maintenance reminder notification #{} attempt {} to URL: {} with prompt: {}", 
                reminderNumber, attempt, url, structuredPrompt);
        
        return restTemplate.postForEntity(url, request, String.class);
    }

    /**
     * Send notification with retry logic using conversation API with structured prompt.
     * 
     * @param notification The notification to send
     * @param attempt Current attempt number
     * @return ResponseEntity from the API call
     */
    private ResponseEntity<String> sendNotificationWithRetry(MaintenanceNotificationRequest notification, int attempt) {
        String url = conversationApiBaseUrl;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        // Create structured prompt for conversation API
        String structuredPrompt = createStructuredMaintenancePrompt(notification);
        
        // Send the structured prompt directly as the message content
        String requestPayload = String.format(
            "{\"message\": \"%s\"}",
            structuredPrompt.replace("\"", "\\\"").replace("\n", "\\n")
        );
        
        HttpEntity<String> request = new HttpEntity<>(requestPayload, headers);
        
        log.debug("Sending maintenance notification attempt {} to URL: {} with prompt: {}", attempt, url, structuredPrompt);
        
        return restTemplate.postForEntity(url, request, String.class);
    }

    /**
     * Create a structured prompt for maintenance notifications using the conversation API.
     * This follows the exact same format as the security alert template you provided.
     * 
     * @param notification The maintenance notification request
     * @return Structured prompt string
     */
    private String createStructuredMaintenancePrompt(MaintenanceNotificationRequest notification) {
        // Get priority emoji
        String priorityEmoji = getPriorityEmoji(notification.getPriority());
        
        // Generate task ID from device name and task
        String taskId = generateTaskId(notification.getDeviceName(), notification.getTask());
        
        // Format the structured prompt using the security alert template format
        return String.format(
            "Post a Slack message to channel_id=C092C9RHPKN.\n\n" +
            "Important: Do not forget to include both plain text and blocks in the same message.\n\n" +
            "Text: '🔧 Maintenance Alert: %s requires scheduled maintenance. A new maintenance task has been assigned for completion.'\n\n" +
            "Blocks:\n" +
            "1. Header block: '🔧 Maintenance Task Assigned'\n\n" +
            "2. Section block with fields summarizing the issue:\n" +
            "   - Task ID: %s\n" +
            "   - Priority: %s %s\n" +
            "   - Category: Device Maintenance\n" +
            "   - Status: Pending Assignment\n" +
            "   - Target Device: %s\n" +
            "   - Assigned To: %s\n" +
            "   - Due Date: Today\n" +
            "   - Timestamp: %s\n\n" +
            "3. Section block with plain text: 'Description: Scheduled maintenance task for %s. Task: %s. Please complete the maintenance task as soon as possible to ensure optimal device performance and prevent potential issues.'\n\n" +
            "4. Divider block\n\n" +
            "5. Actions block with three buttons:\n" +
            "   - 'Mark as Completed' (primary style)\n" +
            "   - 'Reschedule Task' (default style)\n" +
            "   - 'View Details' (default style)\n\n" +
            "Ensure that the final Slack message contains BOTH the plain text and the blocks together.",
            notification.getDeviceName(),
            taskId,
            priorityEmoji,
            notification.getPriority(),
            notification.getDeviceName(),
            notification.getAssignedTo(),
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a z")),
            notification.getDeviceName(),
            notification.getTask()
        );
    }
    
    /**
     * Create a structured prompt for maintenance reminder notifications.
     * 
     * @param notification The maintenance notification request
     * @param reminderNumber The reminder number
     * @return Structured prompt string
     */
    private String createStructuredReminderPrompt(MaintenanceNotificationRequest notification, int reminderNumber) {
        // Get priority emoji
        String priorityEmoji = getPriorityEmoji(notification.getPriority());
        
        // Generate task ID from device name and task
        String taskId = generateTaskId(notification.getDeviceName(), notification.getTask());
        
        // Format the structured prompt using the security alert template format for reminders
        return String.format(
            "Post a Slack message to channel_id=C092C9RHPKN.\n\n" +
            "Important: Do not forget to include both plain text and blocks in the same message.\n\n" +
            "Text: '⚠️ Maintenance Reminder #%d: %s requires urgent maintenance. This is reminder #%d of 3. Please complete the maintenance task immediately.'\n\n" +
            "Blocks:\n" +
            "1. Header block: '⚠️ Maintenance Reminder #%d - Overdue Task'\n\n" +
            "2. Section block with fields summarizing the issue:\n" +
            "   - Task ID: %s\n" +
            "   - Priority: %s %s\n" +
            "   - Category: Device Maintenance\n" +
            "   - Status: Overdue - Reminder #%d of 3\n" +
            "   - Target Device: %s\n" +
            "   - Assigned To: %s\n" +
            "   - Due Date: Today (Overdue)\n" +
            "   - Timestamp: %s\n\n" +
            "3. Section block with plain text: 'Description: This is reminder #%d for the maintenance task on %s. Task: %s. The task is now overdue and requires immediate attention to prevent potential device failures or performance issues.'\n\n" +
            "4. Divider block\n\n" +
            "5. Actions block with three buttons:\n" +
            "   - 'Mark as Completed' (primary style)\n" +
            "   - 'Reschedule Task' (default style)\n" +
            "   - 'Escalate to Manager' (danger style)\n\n" +
            "Ensure that the final Slack message contains BOTH the plain text and the blocks together.",
            reminderNumber,
            notification.getDeviceName(),
            reminderNumber,
            reminderNumber,
            taskId,
            priorityEmoji,
            notification.getPriority(),
            reminderNumber,
            notification.getDeviceName(),
            notification.getAssignedTo(),
            java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a z")),
            reminderNumber,
            notification.getDeviceName(),
            notification.getTask()
        );
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
        
        log.info("📝 Creating maintenance notification request for device: {}, task: {}, user: {}", 
                deviceName, taskName, assignedUserName);
        
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
                .formattedMessage(null) // No longer needed - we use structured prompts
                .build();
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
        
        log.info("📝 Creating maintenance reminder notification request #{} for device: {}, task: {}, user: {}", 
                reminderNumber, deviceName, taskName, assignedUserName);
        
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
                .formattedMessage(null) // No longer needed - we use structured prompts
                .build();
    }
    
    
    /**
     * Generate a task ID from device name and task.
     * 
     * @param deviceName The device name
     * @param task The task name
     * @return Generated task ID
     */
    private String generateTaskId(String deviceName, String task) {
        if (deviceName == null || task == null) {
            return "MT-" + System.currentTimeMillis();
        }
        
        // Create a short ID from device name and task
        String deviceShort = deviceName.replaceAll("[^A-Za-z0-9]", "").substring(0, Math.min(4, deviceName.length()));
        String taskShort = task.replaceAll("[^A-Za-z0-9]", "").substring(0, Math.min(4, task.length()));
        
        return "MT-" + deviceShort.toUpperCase() + "-" + taskShort.toUpperCase() + "-" + 
               java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MMdd"));
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
    
}
