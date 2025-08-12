package com.iotplatform.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.model.Notification;
import com.iotplatform.model.User;
import com.iotplatform.service.NotificationService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/notifications")
public class NotificationController {

    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        logger.info("Creating new notification: {}", notification.getTitle());
        Notification createdNotification = notificationService.createNotification(notification);
        return ResponseEntity.ok(createdNotification);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(@AuthenticationPrincipal User user) {
        if (user == null) {
            logger.warn("User is null in getAllNotifications - authentication issue");
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} requesting notifications for organization: {}", 
                   user.getEmail(), user.getOrganizationId());
        
        // Users can only access their own notifications - this is handled by the service layer
        List<Notification> notifications = notificationService.getUserNotifications(
                user.getOrganizationId(), user.getId());
        
        logger.info("Returning {} notifications for user: {}", notifications.size(), user.getEmail());
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @AuthenticationPrincipal User user) {
        if (user == null) {
            logger.warn("User is null in markAsRead - authentication issue");
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} marking notification {} as read", user.getEmail(), id);
        
        // Users can only mark their own notifications as read - this is handled by the service layer
        notificationService.markAsRead(id, user.getOrganizationId(), user.getId());
        return ResponseEntity.ok().body("Notification marked as read");
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal User user) {
        if (user == null) {
            logger.warn("User is null in markAllAsRead - authentication issue");
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} marking all notifications as read", user.getEmail());
        
        // Users can only mark their own notifications as read - this is handled by the service layer
        notificationService.markAllAsRead(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok().body("All notifications marked as read");
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint(@AuthenticationPrincipal User user) {
        logger.info("Test endpoint called by user: {}", user != null ? user.getEmail() : "null");
        return ResponseEntity.ok("Test endpoint working for user: " + (user != null ? user.getEmail() : "null"));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal User user) {
        if (user == null) {
            logger.warn("User is null in getUnreadCount - authentication issue");
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} requesting unread notification count", user.getEmail());
        
        // Users can only get count of their own unread notifications - this is handled by the service layer
        long count = notificationService.getUnreadCount(user.getOrganizationId(), user.getId());
        
        logger.info("User {} has {} unread notifications", user.getEmail(), count);
        return ResponseEntity.ok(count);
    }
}