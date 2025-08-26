package com.iotplatform.controller;

import java.util.Date;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.dto.ChangePasswordRequest;
import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;
import com.iotplatform.security.CustomUserDetails;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        User currentUser = userDetails.getUser();
        logger.info("User {} requesting all users for organization: {}", 
                   currentUser.getEmail(), currentUser.getOrganizationId());
        try {
            List<User> users = userRepository.findByOrganizationId(currentUser.getOrganizationId());
            users.forEach(user -> user.setPassword(null));
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users for organization: {}", currentUser.getOrganizationId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = userDetails.getUser();
        if (id == null || id.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return userRepository.findById(id)
                .map(user -> {
                    if (!user.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        return ResponseEntity.status(403).<User>build();
                    }
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, 
                                         @RequestBody User updatedUser, 
                                         @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔧 User update request for ID: {} from user: {}", id, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ Unauthorized user update attempt - no user details");
            return ResponseEntity.status(401).build();
        }
        User currentUser = userDetails.getUser();
        if (id == null || id.trim().isEmpty()) {
            logger.warn("❌ Invalid user update request - empty ID");
            return ResponseEntity.badRequest().build();
        }
        try {
            return userRepository.findById(id)
                .map(existingUser -> {
                    if (!existingUser.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        logger.warn("❌ Forbidden user update - organization mismatch: {} vs {}", 
                                  existingUser.getOrganizationId(), currentUser.getOrganizationId());
                        return ResponseEntity.status(403).<User>build();
                    }
                    if (!currentUser.getRole().equals(User.Role.ADMIN) && 
                        updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
                        logger.warn("❌ Forbidden user update - role change attempt by non-admin: {}", currentUser.getEmail());
                        return ResponseEntity.status(403).<User>build();
                    }
                    
                    // Update user fields
                    boolean hasChanges = false;
                    if (updatedUser.getFirstName() != null && !updatedUser.getFirstName().equals(existingUser.getFirstName())) {
                        existingUser.setFirstName(updatedUser.getFirstName());
                        hasChanges = true;
                    }
                    if (updatedUser.getLastName() != null && !updatedUser.getLastName().equals(existingUser.getLastName())) {
                        existingUser.setLastName(updatedUser.getLastName());
                        hasChanges = true;
                    }
                    if (updatedUser.getEmail() != null && !updatedUser.getEmail().equals(existingUser.getEmail())) {
                        existingUser.setEmail(updatedUser.getEmail());
                        hasChanges = true;
                    }
                    if (updatedUser.getPhone() != null && !updatedUser.getPhone().equals(existingUser.getPhone())) {
                        existingUser.setPhone(updatedUser.getPhone());
                        hasChanges = true;
                    }
                    if (updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
                        existingUser.setRole(updatedUser.getRole());
                        hasChanges = true;
                    }
                    if (updatedUser.isEnabled() != existingUser.isEnabled()) {
                        existingUser.setEnabled(updatedUser.isEnabled());
                        hasChanges = true;
                    }
                    
                    if (hasChanges) {
                        User savedUser = userRepository.save(existingUser);
                        savedUser.setPassword(null);
                        logger.info("✅ User updated successfully: {} by user: {}", savedUser.getEmail(), currentUser.getEmail());
                        return ResponseEntity.ok(savedUser);
                    } else {
                        logger.info("ℹ️ No changes detected for user: {}", existingUser.getEmail());
                        existingUser.setPassword(null);
                        return ResponseEntity.ok(existingUser);
                    }
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = userDetails.getUser();
        if (id == null || id.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return userRepository.findById(id)
                .map(user -> {
                    if (!user.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        return ResponseEntity.status(403).build();
                    }
                    if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                        return ResponseEntity.status(403).build();
                    }
                    if (user.getId().equals(currentUser.getId())) {
                        return ResponseEntity.badRequest().build();
                    }
                    userRepository.delete(user);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get current user profile (for token validation)
     */
    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 User profile endpoint called");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ No user details found in profile request");
            return ResponseEntity.status(401).body(Map.of(
                "error", "User not authenticated",
                "timestamp", new Date()
            ));
        }
        
        User user = userDetails.getUser();
        logger.info("✅ User profile retrieved for: {}", user.getEmail());
        
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "firstName", user.getFirstName(),
            "lastName", user.getLastName(),
            "email", user.getEmail(),
            "role", user.getRole(),
            "organizationId", user.getOrganizationId(),
            "enabled", user.isEnabled(),
            "createdAt", user.getCreatedAt(),
            "updatedAt", user.getUpdatedAt(),
            "lastLogin", user.getLastLogin()
        ));
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal CustomUserDetails userDetails,
                                            @RequestBody ChangePasswordRequest body) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User currentUser = userDetails.getUser();
        if (body.getNewPassword() == null || body.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "New password must be at least 6 characters"));
        }
        if (!body.getNewPassword().equals(body.getConfirmPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Passwords do not match"));
        }
        if (body.getCurrentPassword() == null || !passwordEncoder.matches(body.getCurrentPassword(), currentUser.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Current password is incorrect"));
        }
        try {
            currentUser.setPassword(passwordEncoder.encode(body.getNewPassword()));
            userRepository.save(currentUser);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

