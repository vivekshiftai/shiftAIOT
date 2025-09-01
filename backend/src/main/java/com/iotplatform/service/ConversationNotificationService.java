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
 */
@Service
@RequiredArgsConstructor
public class ConversationNotificationService {
    
    private static final Logger log = LoggerFactory.getLogger(ConversationNotificationService.class);

    private final RestTemplate restTemplate;

    @Value("${conversation.api.base-url:http://localhost:8100/api/chat}")
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
     * @param maintenanceSchedule The maintenance schedule
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
        String taskName = (String) maintenanceData[1]; // task_name
        String priority = (String) maintenanceData[9]; // priority
        String maintenanceType = (String) maintenanceData[4]; // maintenance_type
        String description = (String) maintenanceData[8]; // description
        
        // Default due time to 9:00 AM if not specified
        LocalTime dueTime = LocalTime.of(9, 0);
        
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
                .build();
    }
}
