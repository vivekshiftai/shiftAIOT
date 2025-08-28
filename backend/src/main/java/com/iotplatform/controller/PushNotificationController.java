package com.iotplatform.controller;

import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.PushNotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST Controller for push notification operations.
 * Handles subscription management and VAPID key retrieval.
 */
@Slf4j
@RestController
@RequestMapping("/api/push-notifications")
@RequiredArgsConstructor
@Tag(name = "Push Notifications", description = "Web push notification management")
public class PushNotificationController {

    private final PushNotificationService pushNotificationService;

    /**
     * Get VAPID public key for client subscription.
     */
    @Operation(
        summary = "Get VAPID Public Key",
        description = "Retrieve the VAPID public key needed for push notification subscription"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "VAPID key retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "VAPID key not configured")
    })
    @GetMapping("/vapid-public-key")
    @PreAuthorize("hasAuthority('PUSH_NOTIFICATION_READ')")
    public ResponseEntity<Map<String, String>> getVapidPublicKey(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        String vapidPublicKey = pushNotificationService.getVapidPublicKey();
        
        if (vapidPublicKey == null || vapidPublicKey.isEmpty()) {
            log.warn("VAPID public key not configured");
            return ResponseEntity.notFound().build();
        }

        Map<String, String> response = new HashMap<>();
        response.put("vapidPublicKey", vapidPublicKey);
        
        log.debug("VAPID public key provided to user: {}", userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    /**
     * Register a push notification subscription.
     */
    @Operation(
        summary = "Register Push Subscription",
        description = "Register a new push notification subscription for the current user"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Subscription registered successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid subscription data"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "403", description = "Push notifications disabled")
    })
    @PostMapping("/subscribe")
    @PreAuthorize("hasAuthority('PUSH_NOTIFICATION_WRITE')")
    public ResponseEntity<Map<String, Object>> subscribe(
            @RequestBody PushSubscriptionRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = userDetails.getUser().getId();
        
        // Check if push notifications are enabled for this user
        if (!pushNotificationService.isPushEnabled(userId)) {
            log.warn("User {} attempted to subscribe to push notifications but they are disabled", userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Push notifications are disabled for your account");
            return ResponseEntity.status(403).body(response);
        }

        try {
            pushNotificationService.registerSubscription(
                userId, 
                request.getEndpoint(), 
                request.getP256dh(), 
                request.getAuth()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Push subscription registered successfully");
            response.put("userId", userId);
            
            log.info("Push subscription registered for user: {}", userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to register push subscription for user: {}", userId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to register push subscription: " + e.getMessage());
            
            return ResponseEntity.status(400).body(response);
        }
    }

    /**
     * Unregister a push notification subscription.
     */
    @Operation(
        summary = "Unregister Push Subscription",
        description = "Remove the push notification subscription for the current user"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Subscription unregistered successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @PostMapping("/unsubscribe")
    @PreAuthorize("hasAuthority('PUSH_NOTIFICATION_WRITE')")
    public ResponseEntity<Map<String, Object>> unsubscribe(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = userDetails.getUser().getId();
        
        try {
            pushNotificationService.unregisterSubscription(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Push subscription unregistered successfully");
            response.put("userId", userId);
            
            log.info("Push subscription unregistered for user: {}", userId);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to unregister push subscription for user: {}", userId, e);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to unregister push subscription: " + e.getMessage());
            
            return ResponseEntity.status(400).body(response);
        }
    }

    /**
     * Get subscription status for the current user.
     */
    @Operation(
        summary = "Get Subscription Status",
        description = "Check if the current user has an active push notification subscription"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status retrieved successfully"),
        @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    @GetMapping("/status")
    @PreAuthorize("hasAuthority('PUSH_NOTIFICATION_READ')")
    public ResponseEntity<Map<String, Object>> getSubscriptionStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }

        String userId = userDetails.getUser().getId();
        
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("pushEnabled", pushNotificationService.isPushEnabled(userId));
        response.put("hasSubscription", pushNotificationService.hasSubscription(userId));
        response.put("vapidConfigured", pushNotificationService.getVapidPublicKey() != null && 
                                       !pushNotificationService.getVapidPublicKey().isEmpty());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Request body for push subscription.
     */
    public static class PushSubscriptionRequest {
        private String endpoint;
        private String p256dh;
        private String auth;

        // Getters and setters
        public String getEndpoint() { return endpoint; }
        public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
        
        public String getP256dh() { return p256dh; }
        public void setP256dh(String p256dh) { this.p256dh = p256dh; }
        
        public String getAuth() { return auth; }
        public void setAuth(String auth) { this.auth = auth; }
    }
}
