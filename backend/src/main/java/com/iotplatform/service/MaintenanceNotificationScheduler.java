package com.iotplatform.service;

import com.iotplatform.dto.MaintenanceNotificationRequest;
import com.iotplatform.model.Notification;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
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
    private final NotificationService notificationService;
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);

    @Value("${maintenance.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    @Value("${maintenance.scheduler.organization-id:}")
    private String defaultOrganizationId;

    /**
     * Daily maintenance notification scheduler.
     * Runs every day at 5:55 AM to send notifications for today's maintenance tasks.
     * This runs 5 minutes before the MaintenanceSchedulerService to ensure tasks are still due today.
     */
    @Scheduled(cron = "${maintenance.scheduler.cron:0 55 5 * * ?}")
    public void sendDailyMaintenanceNotifications() {
        if (!schedulerEnabled) {
            log.info("Maintenance notification scheduler is disabled");
            return;
        }

        log.info("Starting daily maintenance notification process for date: {}", LocalDate.now());

        try {
            // Search by today's date and fetch ALL maintenance tasks for today (including overdue)
            List<Object[]> todaysTasks = maintenanceScheduleRepository
                .findAllTodaysMaintenanceTasksWithDetails();

            if (todaysTasks.isEmpty()) {
                log.warn("No maintenance tasks found for today or overdue. This could indicate:");
                log.warn("1. No tasks scheduled for today or earlier");
                log.warn("2. All tasks have status = 'COMPLETED' or other excluded statuses");
                log.warn("3. No devices have assigned users");
                log.warn("4. Database connection issues");
                return;
            }

            log.info("Found {} maintenance tasks for today", todaysTasks.size());

            int totalNotificationsSent = 0;
            int totalNotificationsFailed = 0;

            // Process each maintenance task
            for (Object[] taskData : todaysTasks) {
                try {
                    boolean sent = processMaintenanceTask(taskData);
                    if (sent) {
                        totalNotificationsSent++;
                    } else {
                        totalNotificationsFailed++;
                    }
                } catch (Exception e) {
                    log.error("Error processing maintenance task: {}", e.getMessage(), e);
                    totalNotificationsFailed++;
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
     * @return true if notification was sent successfully, false otherwise
     */
    private boolean processMaintenanceTask(Object[] taskData) {
        try {
            // Extract data from the Object array
            String taskId = (String) taskData[0]; // id
            String taskName = (String) taskData[1]; // task_name
            String deviceId = (String) taskData[2]; // device_id
            String organizationId = (String) taskData[3]; // organization_id
            String maintenanceType = (String) taskData[4]; // maintenance_type
            String nextMaintenance = taskData[5] != null ? taskData[5].toString() : null; // next_maintenance
            String status = (String) taskData[6]; // status
            String priority = (String) taskData[9]; // priority
            String description = (String) taskData[8]; // description
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

            // Create and send notification to the assigned user
            boolean notificationSent = createAndSendNotification(taskData, assignedUserId, assignedUserName, 
                    deviceName, organizationId, taskName, priority, description, deviceId);
            
            if (notificationSent) {
                log.info("✅ Maintenance notification sent successfully for user: {}, device: {}, task: {}", 
                        assignedUserName, deviceName, taskName);
                return true;
            } else {
                log.error("❌ Failed to send maintenance notification for user: {}, device: {}, task: {}", 
                        assignedUserName, deviceName, taskName);
                return false;
            }

        } catch (Exception e) {
            log.error("Error processing maintenance task: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Create and send notification for maintenance reminder.
     * 
     * @param taskData The maintenance task data
     * @param assignedUserId The assigned user ID
     * @param assignedUserName The assigned user name
     * @param deviceName The device name
     * @param organizationId The organization ID
     * @param taskName The task name
     * @param priority The priority
     * @param description The description
     * @param deviceId The device ID
     * @return true if notification was created and sent successfully
     */
    private boolean createAndSendNotification(Object[] taskData, String assignedUserId, String assignedUserName, 
                                            String deviceName, String organizationId, String taskName, 
                                            String priority, String description, String deviceId) {
        try {
            // Create maintenance reminder notification
            Notification notification = new Notification();
            notification.setId(java.util.UUID.randomUUID().toString());
            notification.setUserId(assignedUserId);
            notification.setTitle("🔔 Maintenance Reminder - " + deviceName);
            notification.setMessage(String.format(
                "Your device requires maintenance:\n\n" +
                "📱 Device: %s\n" +
                "🔧 Task: %s\n" +
                "📅 Due Date: %s\n" +
                "🎯 Priority: %s\n" +
                "📝 Description: %s\n\n" +
                "Please complete the maintenance task as soon as possible.",
                deviceName,
                taskName,
                java.time.LocalDate.now().toString(),
                priority != null ? priority.toUpperCase() : "MEDIUM",
                description != null ? description : "No description provided"
            ));
            notification.setCategory(Notification.NotificationCategory.MAINTENANCE_REMINDER);
            notification.setOrganizationId(organizationId);
            notification.setDeviceId(deviceId);
            notification.setRead(false);
            notification.setCreatedAt(java.time.LocalDateTime.now());
            
            // Create notification with preference check
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(
                assignedUserId, notification);
            
            if (createdNotification.isPresent()) {
                log.info("✅ Created maintenance reminder notification for user: {} for task: {}", 
                       assignedUserName, taskName);
                
                // Also try to send conversation notification if configured
                try {
                    MaintenanceNotificationRequest conversationNotification = conversationNotificationService
                        .createNotificationRequest(taskData, deviceName, assignedUserId, assignedUserName, organizationId);
                    conversationNotificationService.sendMaintenanceNotification(conversationNotification);
                    log.info("✅ Conversation notification sent for user: {} for task: {}", assignedUserName, taskName);
                } catch (Exception e) {
                    log.warn("⚠️ Conversation notification failed for user: {} for task: {} - {}", 
                           assignedUserName, taskName, e.getMessage());
                }
                
                return true;
            } else {
                log.warn("⚠️ Maintenance reminder notification blocked by user preferences for user: {}", 
                       assignedUserName);
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error creating and sending notification for maintenance task: {}", e.getMessage(), e);
            return false;
        }
    }

    /**
     * Manual trigger for maintenance notifications (for testing purposes).
     * 
     * @return Number of notifications sent
     */
    public int triggerMaintenanceNotifications() {
        log.info("Manual trigger of maintenance notifications for today's tasks");
        
        // Search by today's date and fetch ALL maintenance tasks for today
        List<Object[]> todaysTasks = maintenanceScheduleRepository
            .findAllTodaysMaintenanceTasksWithDetails();

        if (todaysTasks.isEmpty()) {
            log.info("No maintenance tasks found for today");
            return 0;
        }

        log.info("Found {} maintenance tasks for today", todaysTasks.size());

        int notificationsSent = 0;
        for (Object[] taskData : todaysTasks) {
            if (processMaintenanceTask(taskData)) {
                notificationsSent++;
            }
        }

        log.info("Manual maintenance notification trigger completed. Sent: {} notifications", notificationsSent);
        return notificationsSent;
    }

    /**
     * Debug method to check maintenance task data without sending notifications.
     * This helps troubleshoot why no tasks are found.
     */
    public void debugMaintenanceTasks() {
        log.info("🔍 DEBUG: Checking maintenance task data...");
        
        try {
            // Check total maintenance tasks in database
            List<Object[]> allTasks = maintenanceScheduleRepository.findAllTodaysMaintenanceTasksWithDetails();
            log.info("📊 Total maintenance tasks found: {}", allTasks.size());
            
            if (allTasks.isEmpty()) {
                log.warn("❌ No maintenance tasks found. Checking possible causes:");
                
                // Let's check what's in the database
                log.info("🔍 Checking database for maintenance tasks...");
                // This would require additional repository methods to debug further
                log.warn("💡 Suggestion: Check if maintenance tasks exist in device_maintenance table");
                log.warn("💡 Suggestion: Verify next_maintenance dates are set correctly");
                log.warn("💡 Suggestion: Check if devices have assigned_user_id values");
                log.warn("💡 Suggestion: Verify maintenance task statuses are ACTIVE, PENDING, or OVERDUE");
            } else {
                log.info("✅ Found {} maintenance tasks for notification processing", allTasks.size());
                
                // Log details of first few tasks for debugging
                int count = Math.min(allTasks.size(), 3);
                for (int i = 0; i < count; i++) {
                    Object[] task = allTasks.get(i);
                    log.info("📋 Task {}: ID={}, Name={}, Device={}, Status={}, NextMaintenance={}", 
                        i+1, task[0], task[1], task[2], task[6], task[5]);
                }
            }
            
        } catch (Exception e) {
            log.error("❌ Error during maintenance task debug: {}", e.getMessage(), e);
        }
    }

    /**
     * Shutdown the executor service when the application stops.
     */
    public void shutdown() {
        executorService.shutdown();
    }
}
