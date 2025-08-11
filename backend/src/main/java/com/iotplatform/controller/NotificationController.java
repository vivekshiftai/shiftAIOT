package com.iotplatform.controller;

import java.util.List;

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

    @Autowired
    private NotificationService notificationService;

    @PostMapping
    public ResponseEntity<Notification> createNotification(@RequestBody Notification notification) {
        Notification createdNotification = notificationService.createNotification(notification);
        return ResponseEntity.ok(createdNotification);
    }

    @GetMapping
    public ResponseEntity<List<Notification>> getAllNotifications(@AuthenticationPrincipal User user) {
        // Users can only access their own notifications - this is handled by the service layer
        List<Notification> notifications = notificationService.getUserNotifications(
                user.getOrganizationId(), user.getId());
        return ResponseEntity.ok(notifications);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @AuthenticationPrincipal User user) {
        // Users can only mark their own notifications as read - this is handled by the service layer
        notificationService.markAsRead(id, user.getOrganizationId(), user.getId());
        return ResponseEntity.ok().body("Notification marked as read");
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal User user) {
        // Users can only mark their own notifications as read - this is handled by the service layer
        notificationService.markAllAsRead(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok().body("All notifications marked as read");
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal User user) {
        // Users can only get count of their own unread notifications - this is handled by the service layer
        long count = notificationService.getUnreadCount(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok(count);
    }
}