package com.iotplatform.controller;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            logger.error("No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} requesting all users for organization: {}", 
                   currentUser.getEmail(), currentUser.getOrganizationId());
        
        try {
            // Get all users in the same organization
            List<User> users = userRepository.findByOrganizationId(currentUser.getOrganizationId());
            
            // Remove sensitive information (passwords) before sending
            users.forEach(user -> user.setPassword(null));
            
            logger.info("Returning {} users for organization: {}", users.size(), currentUser.getOrganizationId());
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            logger.error("Error fetching users for organization: {}", currentUser.getOrganizationId(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id, @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            logger.error("No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        
        if (id == null || id.trim().isEmpty()) {
            logger.error("Invalid user ID provided: {}", id);
            return ResponseEntity.badRequest().build();
        }
        
        logger.info("User {} requesting user details for ID: {}", currentUser.getEmail(), id);
        
        try {
            return userRepository.findById(id)
                .map(user -> {
                    // Check if user is in the same organization
                    if (!user.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        logger.warn("User {} attempted to access user {} from different organization", 
                                  currentUser.getEmail(), id);
                        return ResponseEntity.status(403).<User>build();
                    }
                    
                    // Remove sensitive information
                    user.setPassword(null);
                    return ResponseEntity.ok(user);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching user with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable String id, 
                                         @RequestBody User updatedUser, 
                                         @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            logger.error("No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        
        if (id == null || id.trim().isEmpty()) {
            logger.error("Invalid user ID provided: {}", id);
            return ResponseEntity.badRequest().build();
        }
        
        if (updatedUser == null) {
            logger.error("No user data provided for update");
            return ResponseEntity.badRequest().build();
        }
        
        logger.info("User {} updating user with ID: {}", currentUser.getEmail(), id);
        
        try {
            return userRepository.findById(id)
                .map(existingUser -> {
                    // Check if user is in the same organization
                    if (!existingUser.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        logger.warn("User {} attempted to update user {} from different organization", 
                                  currentUser.getEmail(), id);
                        return ResponseEntity.status(403).<User>build();
                    }
                    
                    // Only allow admins to update user roles
                    if (!currentUser.getRole().equals(User.Role.ADMIN) && 
                        !updatedUser.getRole().equals(existingUser.getRole())) {
                        logger.warn("Non-admin user {} attempted to change role for user {}", 
                                  currentUser.getEmail(), id);
                        return ResponseEntity.status(403).<User>build();
                    }
                    
                    // Update fields (excluding sensitive ones)
                    if (updatedUser.getFirstName() != null) {
                        existingUser.setFirstName(updatedUser.getFirstName());
                    }
                    if (updatedUser.getLastName() != null) {
                        existingUser.setLastName(updatedUser.getLastName());
                    }
                    if (updatedUser.getEmail() != null) {
                        existingUser.setEmail(updatedUser.getEmail());
                    }
                    if (updatedUser.getPhone() != null) {
                        existingUser.setPhone(updatedUser.getPhone());
                    }
                    if (updatedUser.getRole() != null) {
                        existingUser.setRole(updatedUser.getRole());
                    }
                    existingUser.setEnabled(updatedUser.isEnabled());
                    
                    User savedUser = userRepository.save(existingUser);
                    savedUser.setPassword(null); // Remove password from response
                    
                    logger.info("User {} updated successfully", id);
                    return ResponseEntity.ok(savedUser);
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error updating user with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id, @AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            logger.error("No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        
        if (id == null || id.trim().isEmpty()) {
            logger.error("Invalid user ID provided: {}", id);
            return ResponseEntity.badRequest().build();
        }
        
        logger.info("User {} attempting to delete user with ID: {}", currentUser.getEmail(), id);
        
        try {
            return userRepository.findById(id)
                .map(user -> {
                    // Check if user is in the same organization
                    if (!user.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        logger.warn("User {} attempted to delete user {} from different organization", 
                                  currentUser.getEmail(), id);
                        return ResponseEntity.status(403).build();
                    }
                    
                    // Only allow admins to delete users
                    if (!currentUser.getRole().equals(User.Role.ADMIN)) {
                        logger.warn("Non-admin user {} attempted to delete user {}", currentUser.getEmail(), id);
                        return ResponseEntity.status(403).build();
                    }
                    
                    // Prevent self-deletion
                    if (user.getId().equals(currentUser.getId())) {
                        logger.warn("User {} attempted to delete themselves", currentUser.getEmail());
                        return ResponseEntity.badRequest().build();
                    }
                    
                    userRepository.delete(user);
                    logger.info("User {} deleted successfully by {}", id, currentUser.getEmail());
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error deleting user with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<User> getCurrentUserProfile(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            logger.error("No authenticated user found");
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} requesting their profile", currentUser.getEmail());
        
        try {
            // Remove sensitive information
            currentUser.setPassword(null);
            return ResponseEntity.ok(currentUser);
        } catch (Exception e) {
            logger.error("Error fetching user profile for: {}", currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}

