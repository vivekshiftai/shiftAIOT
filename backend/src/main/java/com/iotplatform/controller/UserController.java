package com.iotplatform.controller;

import java.util.Date;
import java.util.HashMap;
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
import org.springframework.web.bind.annotation.RequestParam;
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
        logger.info("🔍 User list request received");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ No authenticated user found for user list request");
            return ResponseEntity.status(401).build();
        }
        
        User currentUser = userDetails.getUser();
        logger.info("👤 User {} (Role: {}) requesting all users for organization: {}", 
                   currentUser.getEmail(), currentUser.getRole(), currentUser.getOrganizationId());
        
        try {
            // Fetch all users from the same organization
            List<User> users = userRepository.findByOrganizationId(currentUser.getOrganizationId());
            
            // Remove sensitive information (passwords) from all users
            users.forEach(user -> {
                user.setPassword(null);
                // Remove sensitive fields
            });
            
            logger.info("✅ Successfully fetched {} users for organization: {} by user: {}", 
                       users.size(), currentUser.getOrganizationId(), currentUser.getEmail());
            
            return ResponseEntity.ok(users);
            
        } catch (Exception e) {
            logger.error("❌ Error fetching users for organization: {} by user: {}", 
                        currentUser.getOrganizationId(), currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 User details request for ID: {}", id);
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ No authenticated user found for user details request");
            return ResponseEntity.status(401).build();
        }
        
        User currentUser = userDetails.getUser();
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("❌ Invalid user ID provided: {}", id);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            return userRepository.findById(id)
                .map(user -> {
                    // Check if user belongs to the same organization
                    if (!user.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        logger.warn("❌ Forbidden access attempt - user {} trying to access user {} from different organization: {} vs {}", 
                                  currentUser.getEmail(), user.getEmail(), 
                                  currentUser.getOrganizationId(), user.getOrganizationId());
                        return ResponseEntity.status(403).<User>build();
                    }
                    
                    // Remove sensitive information
                    user.setPassword(null);
                    
                    logger.info("✅ User details retrieved for: {} by user: {}", user.getEmail(), currentUser.getEmail());
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("❌ Error fetching user with ID: {} by user: {}", id, currentUser.getEmail(), e);
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
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("firstName", user.getFirstName());
        profile.put("lastName", user.getLastName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        profile.put("organizationId", user.getOrganizationId());
        profile.put("enabled", user.isEnabled());
        profile.put("createdAt", user.getCreatedAt());
        profile.put("updatedAt", user.getUpdatedAt());
        profile.put("lastLogin", user.getLastLogin());
        profile.put("gmailId", user.getGmailId());
        profile.put("slackId", user.getSlackId());
        profile.put("teamId", user.getTeamId());
        
        return ResponseEntity.ok(profile);
    }

    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 User search request - name: {}, email: {}, role: {}", name, email, role);
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ No authenticated user found for user search request");
            return ResponseEntity.status(401).build();
        }
        
        User currentUser = userDetails.getUser();
        
        try {
            List<User> allUsers = userRepository.findByOrganizationId(currentUser.getOrganizationId());
            
            // Filter users based on search criteria
            List<User> filteredUsers = allUsers.stream()
                .filter(user -> {
                    boolean matches = true;
                    
                    // Filter by name (first name or last name)
                    if (name != null && !name.trim().isEmpty()) {
                        String searchName = name.toLowerCase();
                        String fullName = (user.getFirstName() + " " + user.getLastName()).toLowerCase();
                        matches = matches && fullName.contains(searchName);
                    }
                    
                    // Filter by email
                    if (email != null && !email.trim().isEmpty()) {
                        String searchEmail = email.toLowerCase();
                        matches = matches && user.getEmail().toLowerCase().contains(searchEmail);
                    }
                    
                    // Filter by role
                    if (role != null && !role.trim().isEmpty()) {
                        matches = matches && user.getRole().name().equalsIgnoreCase(role);
                    }
                    
                    return matches;
                })
                .peek(user -> {
                    // Remove sensitive information
                    user.setPassword(null);
                })
                .toList();
            
            logger.info("✅ User search completed for organization: {} by user: {} - Found {} users", 
                       currentUser.getOrganizationId(), currentUser.getEmail(), filteredUsers.size());
            
            return ResponseEntity.ok(filteredUsers);
            
        } catch (Exception e) {
            logger.error("❌ Error searching users for organization: {} by user: {}", 
                        currentUser.getOrganizationId(), currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getUserStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("📊 User stats request received");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ No authenticated user found for user stats request");
            return ResponseEntity.status(401).build();
        }
        
        User currentUser = userDetails.getUser();
        
        try {
            List<User> allUsers = userRepository.findByOrganizationId(currentUser.getOrganizationId());
            
            long totalUsers = allUsers.size();
            long activeUsers = allUsers.stream().filter(User::isEnabled).count();
            long adminUsers = allUsers.stream().filter(user -> User.Role.ADMIN.equals(user.getRole())).count();
            long regularUsers = allUsers.stream().filter(user -> User.Role.USER.equals(user.getRole())).count();
            
            Map<String, Object> stats = Map.of(
                "totalUsers", totalUsers,
                "activeUsers", activeUsers,
                "inactiveUsers", totalUsers - activeUsers,
                "adminUsers", adminUsers,
                "regularUsers", regularUsers,
                "organizationId", currentUser.getOrganizationId()
            );
            
            logger.info("✅ User stats retrieved for organization: {} by user: {} - Total: {}, Active: {}, Admins: {}", 
                       currentUser.getOrganizationId(), currentUser.getEmail(), totalUsers, activeUsers, adminUsers);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            logger.error("❌ Error fetching user stats for organization: {} by user: {}", 
                        currentUser.getOrganizationId(), currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().build();
        }
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

    @PostMapping("/update-integration-ids")
    public ResponseEntity<?> updateIntegrationIds(@AuthenticationPrincipal CustomUserDetails userDetails,
                                                 @RequestBody Map<String, String> integrationIds) {
        logger.info("🔧 Integration IDs update request from user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ Unauthorized integration IDs update attempt - no user details");
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        
        User currentUser = userDetails.getUser();
        
        try {
            boolean hasChanges = false;
            
            // Update Gmail ID
            if (integrationIds.containsKey("gmailId")) {
                String gmailId = integrationIds.get("gmailId");
                if (gmailId != null && !gmailId.trim().isEmpty()) {
                    currentUser.setGmailId(gmailId.trim());
                    hasChanges = true;
                    logger.info("✅ Updated Gmail ID for user: {}", currentUser.getEmail());
                } else {
                    currentUser.setGmailId(null);
                    hasChanges = true;
                    logger.info("✅ Cleared Gmail ID for user: {}", currentUser.getEmail());
                }
            }
            
            // Update Slack ID
            if (integrationIds.containsKey("slackId")) {
                String slackId = integrationIds.get("slackId");
                if (slackId != null && !slackId.trim().isEmpty()) {
                    currentUser.setSlackId(slackId.trim());
                    hasChanges = true;
                    logger.info("✅ Updated Slack ID for user: {}", currentUser.getEmail());
                } else {
                    currentUser.setSlackId(null);
                    hasChanges = true;
                    logger.info("✅ Cleared Slack ID for user: {}", currentUser.getEmail());
                }
            }
            
            // Update Team ID
            if (integrationIds.containsKey("teamId")) {
                String teamId = integrationIds.get("teamId");
                if (teamId != null && !teamId.trim().isEmpty()) {
                    currentUser.setTeamId(teamId.trim());
                    hasChanges = true;
                    logger.info("✅ Updated Team ID for user: {}", currentUser.getEmail());
                } else {
                    currentUser.setTeamId(null);
                    hasChanges = true;
                    logger.info("✅ Cleared Team ID for user: {}", currentUser.getEmail());
                }
            }
            
            if (hasChanges) {
                User savedUser = userRepository.save(currentUser);
                logger.info("✅ Integration IDs updated successfully for user: {}", savedUser.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Integration IDs updated successfully",
                    "gmailId", savedUser.getGmailId(),
                    "slackId", savedUser.getSlackId(),
                    "teamId", savedUser.getTeamId()
                ));
            } else {
                logger.info("ℹ️ No changes detected for integration IDs update for user: {}", currentUser.getEmail());
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "No changes detected",
                    "gmailId", currentUser.getGmailId(),
                    "slackId", currentUser.getSlackId(),
                    "teamId", currentUser.getTeamId()
                ));
            }
            
        } catch (Exception e) {
            logger.error("❌ Error updating integration IDs for user: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to update integration IDs"));
        }
    }
}

