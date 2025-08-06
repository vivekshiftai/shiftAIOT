package com.iotplatform.service;

import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.Notification;
import com.iotplatform.model.Rule;
import com.iotplatform.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Notification> getAllNotifications(String organizationId) {
        return notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(organizationId);
    }

    public List<Notification> getUserNotifications(String organizationId, String userId) {
        return notificationRepository.findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
    }

    public Notification createNotification(Notification notification) {
        notification.setId(UUID.randomUUID().toString());
        return notificationRepository.save(notification);
    }

    public void markAsRead(String notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(String organizationId, String userId) {
        List<Notification> notifications = notificationRepository
                .findByOrganizationIdAndUserIdOrderByCreatedAtDesc(organizationId, userId);
        
        notifications.forEach(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public long getUnreadCount(String organizationId, String userId) {
        return notificationRepository.countUnreadByOrganizationIdAndUserId(organizationId, userId);
    }

    public void createRuleTriggeredNotification(Rule rule, Device device, TelemetryDataRequest telemetryData) {
        Notification notification = new Notification();
        notification.setTitle("Rule Triggered: " + rule.getName());
        notification.setMessage("Device " + device.getName() + " has triggered rule \"" + rule.getName() + "\"");
        notification.setType(Notification.NotificationType.WARNING);
        notification.setDeviceId(device.getId());
        notification.setRuleId(rule.getId());
        notification.setOrganizationId(device.getOrganizationId());
        
        createNotification(notification);
    }
}