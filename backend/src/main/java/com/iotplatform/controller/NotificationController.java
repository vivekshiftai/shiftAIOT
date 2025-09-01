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
import com.iotplatform.service.ConsolidatedNotificationService;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    private final NotificationService notificationService;
    private final ConsolidatedNotificationService consolidatedNotificationService;

    public NotificationController(NotificationService notificationService, ConsolidatedNotificationService consolidatedNotificationService) {
        this.notificationService = notificationService;
        this.consolidatedNotificationService = consolidatedNotificationService;
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

    @PostMapping("/test")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> createTestNotification(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            // Create a test notification
            Notification testNotification = new Notification();
            testNotification.setTitle("Test Notification");
            testNotification.setMessage("This is a test notification to verify the notification system is working.");
            testNotification.setType(Notification.NotificationType.INFO);
            testNotification.setUserId(user.getId());
            testNotification.setOrganizationId(user.getOrganizationId());
            testNotification.setRead(false);
            
            // Use preference checking
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(user.getId(), testNotification);
            
            if (createdNotification.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Test notification created successfully",
                    "notification", createdNotification.get()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Test notification blocked by user preferences",
                    "userId", user.getId()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to create test notification: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/test-device-assignment")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> createDeviceAssignmentTestNotification(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            // Create a test device assignment notification
            Notification testNotification = new Notification();
            testNotification.setTitle("Test Device Assignment");
            testNotification.setMessage("This is a test device assignment notification to verify the device assignment flow is working.");
            testNotification.setType(Notification.NotificationType.INFO);
            testNotification.setUserId(user.getId());
            testNotification.setOrganizationId(user.getOrganizationId());
            testNotification.setDeviceId("test-device-123");
            testNotification.setRead(false);
            
            // Use preference checking - this will automatically check user preferences
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(user.getId(), testNotification);
            
            if (createdNotification.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Device assignment test notification created successfully",
                    "notification", createdNotification.get()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Device assignment test notification blocked by user preferences",
                    "userId", user.getId()
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to create device assignment test notification: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/test-direct")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> createDirectTestNotification(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            // Create a test notification directly without preference checking
            Notification testNotification = new Notification();
            testNotification.setTitle("Direct Test Notification");
            testNotification.setMessage("This is a direct test notification to verify the basic notification system is working.");
            testNotification.setType(Notification.NotificationType.INFO);
            testNotification.setUserId(user.getId());
            testNotification.setOrganizationId(user.getOrganizationId());
            testNotification.setRead(false);
            
            // Create notification directly without preference check
            Notification createdNotification = notificationService.createNotification(testNotification);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Direct test notification created successfully",
                "notification", createdNotification
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to create direct test notification: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/test-onboarding-notification")
    @PreAuthorize("hasAuthority('NOTIFICATION_WRITE')")
    public ResponseEntity<?> createOnboardingTestNotification(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        User user = userDetails.getUser();
        
        try {
            // Simulate onboarding notification flow
            log.info("🧪 Testing onboarding notification flow for user: {}", user.getEmail());
            
            // Create a test device assignment notification similar to what happens after onboarding
            Notification testNotification = new Notification();
            testNotification.setTitle("🎯 Device Onboarding Complete - Test Device");
            testNotification.setMessage(
                "Device 'Test Device' has been successfully onboarded with AI-generated configurations:\n" +
                "• 5 monitoring rules created\n" +
                "• 3 maintenance tasks scheduled\n" +
                "• 2 safety protocols established\n" +
                "• PDF documentation processed and stored\n\n" +
                "The device is now ready for monitoring and management."
            );
            testNotification.setType(Notification.NotificationType.INFO);
            testNotification.setUserId(user.getId());
            testNotification.setOrganizationId(user.getOrganizationId());
            testNotification.setDeviceId("test-device-onboarding-123");
            testNotification.setRead(false);
            
            // Add metadata similar to consolidated notifications
            Map<String, String> metadata = new HashMap<>();
            metadata.put("deviceId", "test-device-onboarding-123");
            metadata.put("deviceName", "Test Device");
            metadata.put("assignedUserId", user.getId());
            metadata.put("creatorName", "System");
            metadata.put("totalRules", "5");
            metadata.put("totalMaintenanceTasks", "3");
            metadata.put("totalSafetyPrecautions", "2");
            testNotification.setMetadata(metadata);
            
            // Use preference checking - this will automatically check user preferences
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(user.getId(), testNotification);
            
            if (createdNotification.isPresent()) {
                log.info("✅ Onboarding test notification created successfully for user: {}", user.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Onboarding test notification created successfully",
                    "notification", createdNotification.get()
                ));
            } else {
                log.warn("⚠️ Onboarding test notification blocked by user preferences for user: {}", user.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "Onboarding test notification blocked by user preferences",
                    "userId", user.getId()
                ));
            }
        } catch (Exception e) {
            log.error("❌ Failed to create onboarding test notification: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to create onboarding test notification: " + e.getMessage()
            ));
        }
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

    @GetMapping("/{id}/details")
    @PreAuthorize("hasAuthority('NOTIFICATION_READ')")
    public ResponseEntity<?> getNotificationDetails(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            java.util.Map<String, Object> details = consolidatedNotificationService.getNotificationDetails(id);
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(java.util.Map.of("error", "Failed to load notification details"));
        }
    }
}