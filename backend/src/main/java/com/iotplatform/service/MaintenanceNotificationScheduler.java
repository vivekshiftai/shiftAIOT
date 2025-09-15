package com.iotplatform.service;

import com.iotplatform.dto.MaintenanceNotificationRequest;
import com.iotplatform.model.Notification;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import com.iotplatform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
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
    private final NotificationRepository notificationRepository;
    private final ConversationNotificationService conversationNotificationService;
    private final NotificationService notificationService;
    private final MaintenanceScheduleService maintenanceScheduleService;
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);

    @Value("${maintenance.scheduler.enabled:true}")
    private boolean schedulerEnabled;

    @Value("${maintenance.scheduler.organization-id:}")
    private String defaultOrganizationId;

    /**
     * Update overdue maintenance tasks status.
     * Runs every day at 2:00 AM to mark overdue tasks before sending notifications.
     */
    @Scheduled(cron = "${maintenance.overdue.cron:0 0 2 * * ?}")
    public void updateOverdueMaintenanceTasks() {
        if (!schedulerEnabled) {
            log.info("Maintenance scheduler is disabled, skipping overdue update");
            return;
        }

        log.info("Starting overdue maintenance tasks update for date: {}", LocalDate.now());

        try {
            // Get all overdue tasks (past due date but still ACTIVE)
            List<Object[]> overdueTasks = maintenanceScheduleRepository
                .findAllTodaysMaintenanceTasksWithDetails();

            int overdueCount = 0;
            for (Object[] taskData : overdueTasks) {
                try {
                    String taskId = (String) taskData[0];
                    String nextMaintenance = taskData[8] != null ? taskData[8].toString() : null;
                    String status = (String) taskData[10];
                    
                    // Check if task is overdue (past due date and still ACTIVE)
                    if (nextMaintenance != null && status != null && 
                        LocalDate.parse(nextMaintenance).isBefore(LocalDate.now()) && 
                        "ACTIVE".equals(status)) {
                        
                        // Update status to OVERDUE
                        maintenanceScheduleRepository.updateMaintenanceStatus(taskId, "OVERDUE");
                        overdueCount++;
                        log.info("✅ Marked maintenance task as overdue: {}", taskData[1]);
                    }
                } catch (Exception e) {
                    log.error("Error updating overdue status for task: {}", e.getMessage(), e);
                }
            }

            log.info("Overdue maintenance tasks update completed. Updated {} tasks to OVERDUE status", overdueCount);

        } catch (Exception e) {
            log.error("Error in overdue maintenance tasks update: {}", e.getMessage(), e);
        }
    }

    /**
     * Auto-update overdue maintenance tasks to next maintenance date.
     * Runs every day at 3:00 AM to automatically reschedule overdue tasks.
     */
    @Scheduled(cron = "${maintenance.auto-update.cron:0 0 3 * * ?}")
    public void autoUpdateOverdueMaintenanceTasks() {
        if (!schedulerEnabled) {
            log.info("Maintenance scheduler is disabled, skipping auto-update");
            return;
        }

        log.info("Starting automatic overdue maintenance tasks update for date: {}", LocalDate.now());

        try {
            // Get all overdue tasks
            List<Object[]> overdueTasks = maintenanceScheduleRepository
                .findAllTodaysMaintenanceTasksWithDetails();

            int updatedCount = 0;
            for (Object[] taskData : overdueTasks) {
                try {
                    String taskId = (String) taskData[0];
                    String taskName = (String) taskData[2];
                    String nextMaintenance = taskData[8] != null ? taskData[8].toString() : null;
                    String status = (String) taskData[10];
                    String frequency = (String) taskData[6];
                    
                    // Check if task is overdue (past due date and OVERDUE status)
                    if (nextMaintenance != null && status != null && frequency != null &&
                        LocalDate.parse(nextMaintenance).isBefore(LocalDate.now()) && 
                        "OVERDUE".equals(status)) {
                        
                        // Calculate next maintenance date based on frequency from the overdue date
                        LocalDate newNextMaintenance = maintenanceScheduleService.calculateNextMaintenanceDate(frequency, LocalDate.parse(nextMaintenance));
                        
                        // Update the task with new next maintenance date and reset to ACTIVE
                        maintenanceScheduleRepository.updateMaintenanceTaskSchedule(taskId, newNextMaintenance, "ACTIVE");
                        updatedCount++;
                        
                        log.info("✅ Auto-updated overdue maintenance task '{}' to next date: {} (frequency: {})", 
                                taskName, newNextMaintenance, frequency);
                    }
                } catch (Exception e) {
                    log.error("Error auto-updating overdue task: {}", e.getMessage(), e);
                }
            }

            log.info("Automatic overdue maintenance tasks update completed. Updated {} tasks to next maintenance date", updatedCount);

        } catch (Exception e) {
            log.error("Error in automatic overdue maintenance tasks update: {}", e.getMessage(), e);
        }
    }

    /**
     * Maintenance reminder scheduler.
     * Runs every 2 hours to send maintenance reminders for overdue and due tasks.
     * Sends up to 3 reminders per task per day.
     */
    @Scheduled(cron = "${maintenance.reminder.cron:0 0 */2 * * ?}")
    public void sendMaintenanceReminders() {
        if (!schedulerEnabled) {
            log.info("Maintenance reminder scheduler is disabled");
            return;
        }

        log.info("Starting maintenance reminder process for date: {} at hour: {}", 
                LocalDate.now(), LocalDateTime.now().getHour());

        try {
            // Get maintenance tasks that need reminders (due today or overdue)
            List<Object[]> reminderTasks = maintenanceScheduleRepository
                .findMaintenanceTasksNeedingReminders();

            if (reminderTasks.isEmpty()) {
                log.info("No maintenance tasks need reminders at this time");
                return;
            }

            log.info("Found {} maintenance tasks needing reminders", reminderTasks.size());

            int totalRemindersSent = 0;
            int totalRemindersFailed = 0;

            // Process each maintenance task
            for (Object[] taskData : reminderTasks) {
                try {
                    boolean sent = processMaintenanceReminder(taskData);
                    if (sent) {
                        totalRemindersSent++;
                    } else {
                        totalRemindersFailed++;
                    }
                } catch (Exception e) {
                    log.error("Error processing maintenance reminder: {}", e.getMessage(), e);
                    totalRemindersFailed++;
                }
            }

            log.info("Maintenance reminder process completed. " +
                    "Sent: {}, Failed: {}, Total: {}", 
                    totalRemindersSent, totalRemindersFailed, 
                    totalRemindersSent + totalRemindersFailed);

        } catch (Exception e) {
            log.error("Error in maintenance reminder scheduler: {}", e.getMessage(), e);
        }
    }

    /**
     * Daily maintenance notification scheduler.
     * Runs every day at 4:00 AM to send notifications for today's maintenance tasks.
     * This runs at 4:00 AM to send daily maintenance notifications.
     */
    @Scheduled(cron = "${maintenance.scheduler.cron:0 0 4 * * ?}")
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
     * Process a single maintenance reminder and send notification.
     * Checks if the task has already received 3 reminders today.
     * 
     * @param taskData The maintenance task data from database
     * @return true if notification was sent successfully, false otherwise
     */
    private boolean processMaintenanceReminder(Object[] taskData) {
        try {
            // Extract data from the Object array
            String taskId = (String) taskData[0]; // id
            String taskName = (String) taskData[2]; // task_name
            String deviceId = (String) taskData[1]; // device_id
            String organizationId = (String) taskData[21]; // organization_id
            String assignedUserId = (String) taskData[25]; // assigned_user_id from devices table
            String deviceName = (String) taskData[24]; // device_name from devices table
            String firstName = (String) taskData[26]; // first_name from users table
            String lastName = (String) taskData[27]; // last_name from users table
            String email = (String) taskData[28]; // email from users table

            // Debug logging to see what's in the array
            log.debug("DEBUG: taskData array length: {}", taskData.length);
            log.debug("DEBUG: assignedUserId at position 25: '{}'", assignedUserId);
            log.debug("DEBUG: deviceName at position 24: '{}'", deviceName);
            log.debug("DEBUG: firstName at position 26: '{}'", firstName);
            log.debug("DEBUG: lastName at position 27: '{}'", lastName);
            log.debug("DEBUG: email at position 28: '{}'", email);
            
            // Skip if no assigned user
            if (assignedUserId == null || assignedUserId.trim().isEmpty()) {
                log.warn("Skipping maintenance reminder - no assigned user for device: {}", deviceName);
                return false;
            }

            // Skip if user details are missing
            if (firstName == null || lastName == null || email == null) {
                log.warn("Skipping maintenance reminder - missing user details for user: {}", assignedUserId);
                return false;
            }

            String assignedUserName = firstName + " " + lastName;

            // Check if this task has already received 3 reminders today
            long reminderCountToday = notificationRepository.countMaintenanceRemindersToday(taskId, LocalDate.now());
            if (reminderCountToday >= 3) {
                log.info("Task {} has already received 3 reminders today, skipping", taskName);
                return false;
            }

            // Create and send reminder notification
            boolean notificationSent = createAndSendReminderNotification(taskData, assignedUserId, assignedUserName, 
                    deviceName, organizationId, taskName, deviceId, reminderCountToday + 1);
            
            if (notificationSent) {
                log.info("✅ Maintenance reminder #{} sent successfully for user: {}, device: {}, task: {}", 
                        reminderCountToday + 1, assignedUserName, deviceName, taskName);
                return true;
            } else {
                log.error("❌ Failed to send maintenance reminder for user: {}, device: {}, task: {}", 
                        assignedUserName, deviceName, taskName);
                return false;
            }

        } catch (Exception e) {
            log.error("Error processing maintenance reminder: {}", e.getMessage(), e);
            return false;
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
            String taskName = (String) taskData[2]; // task_name
            String deviceId = (String) taskData[1]; // device_id
            String organizationId = (String) taskData[21]; // organization_id
            String maintenanceType = (String) taskData[5]; // maintenance_type
            String nextMaintenance = taskData[8] != null ? taskData[8].toString() : null; // next_maintenance
            String status = (String) taskData[10]; // status
            String priority = (String) taskData[9]; // priority
            String description = (String) taskData[3]; // description
            String assignedUserId = (String) taskData[16]; // assigned_to from maintenance table
            String deviceName = (String) taskData[24]; // device_name from devices table
            String firstName = (String) taskData[25]; // first_name from users table
            String lastName = (String) taskData[26]; // last_name from users table
            String email = (String) taskData[27]; // email from users table

            // Debug logging to see what's in the array
            log.info("🔍 Processing maintenance task: '{}' for device: '{}'", taskName, deviceName);
            log.info("🔍 Array length: {}", taskData.length);
            log.info("🔍 Assigned user ID (pos 16): '{}'", assignedUserId);
            log.info("🔍 User details - FirstName (pos 25): '{}', LastName (pos 26): '{}', Email (pos 27): '{}'", firstName, lastName, email);
            log.info("🔍 Task status: {}, Next maintenance: {}", status, nextMaintenance);
            
            // Skip if no assigned user
            if (assignedUserId == null || assignedUserId.trim().isEmpty()) {
                log.warn("⚠️ Skipping maintenance task - no assigned user for device: {}", deviceName);
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
     * Create and send reminder notification for maintenance task.
     * 
     * @param taskData The maintenance task data
     * @param assignedUserId The assigned user ID
     * @param assignedUserName The assigned user name
     * @param deviceName The device name
     * @param organizationId The organization ID
     * @param taskName The task name
     * @param deviceId The device ID
     * @param reminderNumber The reminder number (1, 2, or 3)
     * @return true if notification was created and sent successfully
     */
    private boolean createAndSendReminderNotification(Object[] taskData, String assignedUserId, String assignedUserName, 
                                                    String deviceName, String organizationId, String taskName, 
                                                    String deviceId, long reminderNumber) {
        try {
            // Extract additional data from taskData
            String priority = (String) taskData[9]; // priority
            String description = (String) taskData[3]; // description
            String maintenanceType = (String) taskData[5]; // maintenance_type
            String nextMaintenance = taskData[8] != null ? taskData[8].toString() : null; // next_maintenance

            // Create maintenance reminder notification
            Notification notification = new Notification();
            notification.setId(java.util.UUID.randomUUID().toString());
            notification.setUserId(assignedUserId);
            notification.setTitle(String.format("🔔 Maintenance Reminder #%d - %s", reminderNumber, deviceName));
            notification.setMessage(String.format(
                "This is reminder #%d for your maintenance task:\n\n" +
                "📱 Device: %s\n" +
                "🔧 Task: %s\n" +
                "📅 Due Date: %s\n" +
                "🎯 Priority: %s\n" +
                "📝 Description: %s\n" +
                "🔧 Type: %s\n\n" +
                "Please complete the maintenance task as soon as possible.\n" +
                "You will receive up to 3 reminders every 2 hours until completed.",
                reminderNumber,
                deviceName,
                taskName,
                java.time.LocalDate.now().toString(),
                priority != null ? priority.toUpperCase() : "MEDIUM",
                description != null ? description : "No description provided",
                maintenanceType != null ? maintenanceType : "General Maintenance"
            ));
            notification.setCategory(Notification.NotificationCategory.MAINTENANCE_REMINDER);
            notification.setOrganizationId(organizationId);
            notification.setDeviceId(deviceId);
            notification.setRead(false);
            notification.setCreatedAt(java.time.LocalDateTime.now());
            
            // Add metadata to track reminder number
            Map<String, String> metadata = new HashMap<>();
            metadata.put("reminderNumber", String.valueOf(reminderNumber));
            metadata.put("taskId", (String) taskData[0]);
            metadata.put("reminderType", "MAINTENANCE_REMINDER");
            notification.setMetadata(metadata);
            
            // Create notification with preference check
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(
                assignedUserId, notification);
            
            if (createdNotification.isPresent()) {
                log.info("✅ Created maintenance reminder #{} notification for user: {} for task: {}", 
                       reminderNumber, assignedUserName, taskName);
                
                // Also try to send conversation notification if configured
                try {
                    MaintenanceNotificationRequest conversationNotification = conversationNotificationService
                        .createReminderNotificationRequest(taskData, deviceName, assignedUserId, assignedUserName, organizationId, (int)reminderNumber);
                    conversationNotificationService.sendMaintenanceReminderNotification(conversationNotification, (int)reminderNumber);
                    log.info("✅ Conversation reminder notification sent for user: {} for task: {}", assignedUserName, taskName);
                } catch (Exception e) {
                    log.warn("⚠️ Conversation reminder notification failed for user: {} for task: {} - {}", 
                           assignedUserName, taskName, e.getMessage());
                }
                
                return true;
            } else {
                log.warn("⚠️ Maintenance reminder notification blocked by user preferences for user: {}", 
                       assignedUserName);
                return false;
            }
            
        } catch (Exception e) {
            log.error("Error creating and sending reminder notification for maintenance task: {}", e.getMessage(), e);
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
        log.info("📢 Manual trigger of maintenance notifications for today's tasks");
        log.info("📅 Current date: {}", LocalDate.now());
        
        try {
            // Search by today's date and fetch ALL maintenance tasks for today
            List<Object[]> todaysTasks = maintenanceScheduleRepository
                .findAllTodaysMaintenanceTasksWithDetails();

            if (todaysTasks.isEmpty()) {
                log.info("ℹ️ No maintenance tasks found for today - no notifications to send");
                return 0;
            }

            log.info("📋 Found {} maintenance tasks for today", todaysTasks.size());
            
            // Debug: Log details of each task found
            for (int i = 0; i < todaysTasks.size(); i++) {
                Object[] taskData = todaysTasks.get(i);
                log.info("🔍 Task {}: Array length={}", i+1, taskData.length);
                log.info("🔍 Task {}: ID={}, Device={}, AssignedTo={}, NextMaintenance={}, Status={}", 
                    i+1, taskData[0], taskData[24], taskData[16], taskData[8], taskData[10]);
                // Log the last few positions to see where user data is
                log.info("🔍 Task {}: Position 16={}, 24={}, 25={}, 26={}, 27={}", 
                    i+1, taskData[16], taskData[24], taskData[25], taskData[26], taskData[27]);
            }

            int notificationsSent = 0;
            int notificationsFailed = 0;
            
            for (Object[] taskData : todaysTasks) {
                try {
                    if (processMaintenanceTask(taskData)) {
                        notificationsSent++;
                    } else {
                        notificationsFailed++;
                    }
                } catch (Exception e) {
                    log.error("❌ Error processing maintenance task for notification: {}", e.getMessage(), e);
                    notificationsFailed++;
                }
            }

            log.info("✅ Manual maintenance notification trigger completed");
            log.info("📊 Summary: {} notifications sent, {} failed", notificationsSent, notificationsFailed);
            
            return notificationsSent;
            
        } catch (Exception e) {
            log.error("❌ Error during manual maintenance notification trigger: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to trigger maintenance notifications: " + e.getMessage(), e);
        }
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
                        i+1, task[0], task[2], task[1], task[10], task[8]);
                    
                    // Debug the array structure
                    log.info("🔍 DEBUG: Array length: {}", task.length);
                    if (task.length > 24) {
                        log.info("🔍 DEBUG: Device name (pos 24): '{}'", task[24]);
                    }
                    if (task.length > 25) {
                        log.info("🔍 DEBUG: Assigned user ID (pos 25): '{}'", task[25]);
                    }
                    if (task.length > 26) {
                        log.info("🔍 DEBUG: First name (pos 26): '{}'", task[26]);
                    }
                    if (task.length > 27) {
                        log.info("🔍 DEBUG: Last name (pos 27): '{}'", task[27]);
                    }
                    if (task.length > 28) {
                        log.info("🔍 DEBUG: Email (pos 28): '{}'", task[28]);
                    }
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
