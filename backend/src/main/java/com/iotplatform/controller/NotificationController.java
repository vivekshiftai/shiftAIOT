package com.iotplatform.controller;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.iotplatform.model.Notification;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.NotificationService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(originPatterns = "*")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    public ResponseEntity<List<Notification>> getNotifications(@AuthenticationPrincipal CustomUserDetails userDetails) {
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

    @GetMapping("/unread-count")
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            long unreadCount = notificationService.getUnreadCount(user.getOrganizationId(), user.getId());
            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (Exception e) {
            log.error("Error getting unread count for user: {}", user.getEmail(), e);
            return ResponseEntity.status(500).build();
        }
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

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    public ResponseEntity<?> getNotificationDetails(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            // Get notification details using the existing NotificationService
            Optional<Notification> notification = notificationService.getNotificationById(id, user.getOrganizationId(), user.getId());
            if (notification.isPresent()) {
                java.util.Map<String, Object> details = new HashMap<>();
                details.put("id", notification.get().getId());
                details.put("title", notification.get().getTitle());
                details.put("message", notification.get().getMessage());
                details.put("type", notification.get().getType());
                details.put("isRead", notification.get().isRead());
                details.put("createdAt", notification.get().getCreatedAt());
                details.put("updatedAt", notification.get().getUpdatedAt());
                return ResponseEntity.ok(details);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error getting notification details for ID: {}", id, e);
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to load notification details"));
        }
    }
}