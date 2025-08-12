package com.iotplatform.service;

import java.util.List;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.Notification;
import com.iotplatform.model.Rule;
import com.iotplatform.repository.NotificationRepository;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getAllNotifications(String organizationId) {
        logger.debug("Getting all notifications for organization: {}", organizationId);
        return notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
    }

    public List<Notification> getUserNotifications(String organizationId, String userId) {
        logger.debug("Getting notifications for user: {} in organization: {}", userId, organizationId);
        List<Notification> notifications = notificationRepository.findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
        logger.debug("Found {} notifications for user: {}", notifications.size(), userId);
        return notifications;
    }

    public Notification createNotification(Notification notification) {
        logger.info("Creating notification: {} for user: {}", notification.getTitle(), notification.getUserId());
        notification.setId(UUID.randomUUID().toString());
        Notification savedNotification = notificationRepository.save(notification);
        logger.info("Notification created with ID: {}", savedNotification.getId());
        return savedNotification;
    }

    public void markAsRead(String notificationId) {
        logger.debug("Marking notification as read: {}", notificationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
            logger.debug("Notification {} marked as read", notificationId);
        });
    }

    public void markAsRead(String notificationId, String organizationId, String userId) {
        logger.debug("User {} marking notification {} as read in organization {}", userId, notificationId, organizationId);
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            // Validate that the notification belongs to the user
            if (notification.getOrganizationId().equals(organizationId) && 
                notification.getUserId().equals(userId)) {
                notification.setRead(true);
                notificationRepository.save(notification);
                logger.debug("Notification {} marked as read by user {}", notificationId, userId);
            } else {
                logger.warn("User {} attempted to mark notification {} as read but doesn't own it", userId, notificationId);
            }
        });
    }

    public void markAllAsRead(String organizationId, String userId) {
        logger.info("User {} marking all notifications as read in organization {}", userId, organizationId);
        List<Notification> notifications = notificationRepository
                .findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
        
        notifications.forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
        
        logger.info("Marked {} notifications as read for user {}", notifications.size(), userId);
    }

    public long getUnreadCount(String organizationId, String userId) {
        logger.debug("Getting unread count for user: {} in organization: {}", userId, organizationId);
        long count = notificationRepository.countUnreadByOrganizationIdAndUserId(organizationId, userId);
        logger.debug("User {} has {} unread notifications", userId, count);
        return count;
    }

    public void createRuleTriggeredNotification(Rule rule, Device device, TelemetryDataRequest telemetryData) {
        logger.info("Creating rule-triggered notification for device: {} and rule: {}", device.getName(), rule.getName());
        Notification notification = new Notification();
        notification.setTitle("Rule Triggered: " + rule.getName());
        notification.setMessage("Device " + device.getName() + " has triggered rule \"" + rule.getName() + "\"");
        notification.setType(Notification.NotificationType.WARNING);
        notification.setDeviceId(device.getId());
        notification.setRuleId(rule.getId());
        notification.setOrganizationId(device.getOrganizationId());
        // Note: userId will be set when the notification is created for a specific user
        // For now, we'll create it as a general notification for the organization
        
        createNotification(notification);
    }
}