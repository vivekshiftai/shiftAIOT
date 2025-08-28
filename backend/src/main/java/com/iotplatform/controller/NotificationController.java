package com.iotplatform.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.iotplatform.model.Notification;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.NotificationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    public ResponseEntity<List<Notification>> getAllNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        List<Notification> notifications = notificationService.getUserNotifications(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok(notifications);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<Notification> createNotification(@Valid @RequestBody Notification notification, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (notification == null) {
            return ResponseEntity.badRequest().build();
        }
        
        User user = userDetails.getUser();
        
        // Validate user and organization
        if (user.getId() == null || user.getOrganizationId() == null) {
            return ResponseEntity.status(500).build();
        }
        
        notification.setOrganizationId(user.getOrganizationId());
        notification.setUserId(user.getId());
        
        // Use preference checking - this will automatically check user preferences
        Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(user.getId(), notification);
        
        if (createdNotification.isPresent()) {
            return ResponseEntity.ok(createdNotification.get());
        } else {
            // Notification was blocked due to user preferences
            return ResponseEntity.status(204).build(); // No Content - notification blocked
        }
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> markAsRead(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            notificationService.markAsRead(id, user.getOrganizationId(), user.getId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/read-all")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> markAllAsRead(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        notificationService.markAllAsRead(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> testEndpoint(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok("Notification endpoint is working!");
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    public ResponseEntity<Long> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        Long count = notificationService.getUnreadCount(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok(count);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> deleteNotification(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (id == null || id.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        User user = userDetails.getUser();
        
        // Validate user and organization
        if (user.getId() == null || user.getOrganizationId() == null) {
            return ResponseEntity.status(500).build();
        }
        
        try {
            notificationService.deleteNotification(id, user.getOrganizationId(), user.getId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> deleteAllNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        notificationService.deleteAllNotifications(user.getOrganizationId(), user.getId());
        return ResponseEntity.ok().build();
    }
}