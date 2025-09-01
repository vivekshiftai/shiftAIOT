package com.iotplatform.service;

import com.iotplatform.dto.MaintenanceNotificationRequest;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Scheduled service for sending daily maintenance notifications.
 * Runs every day at 6 AM to fetch today's maintenance tasks and send notifications
 * to assigned users via the conversation flow endpoint.
 */
@Service
@RequiredArgsConstructor
public class MaintenanceNotificationScheduler {
    
    private static final Logger log = LoggerFactory.getLogger(MaintenanceNotificationScheduler.class);
    private final MaintenanceScheduleRepository maintenanceScheduleRepository;
    private final ConversationNotificationService conversationNotificationService;
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);

    @Value("${maintenance.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    @Value("${maintenance.scheduler.organization-id:}")
    private String defaultOrganizationId;

    /**
     * Daily maintenance notification scheduler.
     * Runs every day at 6:00 AM to send notifications for today's maintenance tasks.
     */
    @Scheduled(cron = "${maintenance.scheduler.cron:0 0 6 * * ?}")
    public void sendDailyMaintenanceNotifications() {
        if (!schedulerEnabled) {
            log.info("Maintenance notification scheduler is disabled");
            return;
        }

        log.info("Starting daily maintenance notification process for date: {}", LocalDate.now());

        try {
            // Get all organizations that have maintenance tasks for today
            List<String> organizations = getOrganizationsWithTodaysTasks();
            
            if (organizations.isEmpty()) {
                log.info("No organizations found with maintenance tasks for today");
                return;
            }

            int totalNotificationsSent = 0;
            int totalNotificationsFailed = 0;

            for (String organizationId : organizations) {
                log.info("Processing maintenance notifications for organization: {}", organizationId);
                
                List<Object[]> todaysTasks = maintenanceScheduleRepository
                    .findTodaysMaintenanceTasksWithDetails(organizationId);

                if (todaysTasks.isEmpty()) {
                    log.info("No maintenance tasks found for today in organization: {}", organizationId);
                    continue;
                }

                log.info("Found {} maintenance tasks for today in organization: {}", 
                        todaysTasks.size(), organizationId);

                // Process each maintenance task
                for (Object[] taskData : todaysTasks) {
                    try {
                        boolean sent = processMaintenanceTask(taskData, organizationId);
                        if (sent) {
                            totalNotificationsSent++;
                        } else {
                            totalNotificationsFailed++;
                        }
                    } catch (Exception e) {
                        log.error("Error processing maintenance task for organization {}: {}", 
                                organizationId, e.getMessage(), e);
                        totalNotificationsFailed++;
                    }
                }
            }

            log.info("Daily maintenance notification process completed. " +
                    "Sent: {}, Failed: {}, Total: {}", 
                    totalNotificationsSent, totalNotificationsFailed, 
                    totalNotificationsSent + totalNotificationsFailed);

        } catch (Exception e) {
            log.error("Error in daily maintenance notification scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Process a single maintenance task and send notification.
     * 
     * @param taskData The maintenance task data from database
     * @param organizationId The organization ID
     * @return true if notification was sent successfully, false otherwise
     */
    private boolean processMaintenanceTask(Object[] taskData, String organizationId) {
        try {
            // Extract data from the Object array
            String assignedUserId = (String) taskData[12]; // assigned_user_id from devices table
            String deviceName = (String) taskData[13]; // device_name from devices table
            String firstName = (String) taskData[14]; // first_name from users table
            String lastName = (String) taskData[15]; // last_name from users table
            String email = (String) taskData[16]; // email from users table

            // Skip if no assigned user
            if (assignedUserId == null || assignedUserId.trim().isEmpty()) {
                log.warn("Skipping maintenance task - no assigned user for device: {}", deviceName);
                return false;
            }

            // Skip if user details are missing
            if (firstName == null || lastName == null || email == null) {
                log.warn("Skipping maintenance task - missing user details for user: {}", assignedUserId);
                return false;
            }

            String assignedUserName = firstName + " " + lastName;

            // Create notification request
            MaintenanceNotificationRequest notification = conversationNotificationService
                .createNotificationRequest(taskData, deviceName, assignedUserId, assignedUserName, organizationId);

            // Send notification
            boolean sent = conversationNotificationService.sendMaintenanceNotification(notification);
            
            if (sent) {
                log.info("Maintenance notification sent successfully for user: {}, device: {}, task: {}", 
                        assignedUserName, deviceName, notification.getTask());
            } else {
                log.error("Failed to send maintenance notification for user: {}, device: {}, task: {}", 
                        assignedUserName, deviceName, notification.getTask());
            }

            return sent;

        } catch (Exception e) {
            log.error("Error processing maintenance task: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Get all organizations that have maintenance tasks scheduled for today.
     * 
     * @return List of organization IDs
     */
    private List<String> getOrganizationsWithTodaysTasks() {
        // For now, we'll use a simple approach - if default organization is set, use it
        // In a more complex scenario, you might want to query all organizations with today's tasks
        if (defaultOrganizationId != null && !defaultOrganizationId.trim().isEmpty()) {
            return List.of(defaultOrganizationId);
        }
        
        // If no default organization, return empty list
        // You could implement a more sophisticated query here if needed
        log.warn("No default organization ID configured for maintenance notifications");
        return List.of();
    }

    /**
     * Manual trigger for maintenance notifications (for testing purposes).
     * 
     * @param organizationId The organization ID to process
     * @return Number of notifications sent
     */
    public int triggerMaintenanceNotifications(String organizationId) {
        log.info("Manual trigger of maintenance notifications for organization: {}", organizationId);
        
        List<Object[]> todaysTasks = maintenanceScheduleRepository
            .findTodaysMaintenanceTasksWithDetails(organizationId);

        if (todaysTasks.isEmpty()) {
            log.info("No maintenance tasks found for today in organization: {}", organizationId);
            return 0;
        }

        int notificationsSent = 0;
        for (Object[] taskData : todaysTasks) {
            if (processMaintenanceTask(taskData, organizationId)) {
                notificationsSent++;
            }
        }

        log.info("Manual maintenance notification trigger completed. Sent: {} notifications", notificationsSent);
        return notificationsSent;
    }

    /**
     * Shutdown the executor service when the application stops.
     */
    public void shutdown() {
        executorService.shutdown();
    }
}
