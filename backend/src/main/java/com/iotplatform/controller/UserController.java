package com.iotplatform.controller;

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
@RequestMapping("/users")
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
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = userDetails.getUser();
        if (id == null || id.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return userRepository.findById(id)
                .map(existingUser -> {
                    if (!existingUser.getOrganizationId().equals(currentUser.getOrganizationId())) {
                        return ResponseEntity.status(403).<User>build();
                    }
                    if (!currentUser.getRole().equals(User.Role.ADMIN) && 
                        updatedUser.getRole() != null && !updatedUser.getRole().equals(existingUser.getRole())) {
                        return ResponseEntity.status(403).<User>build();
                    }
                    if (updatedUser.getFirstName() != null) existingUser.setFirstName(updatedUser.getFirstName());
                    if (updatedUser.getLastName() != null) existingUser.setLastName(updatedUser.getLastName());
                    if (updatedUser.getEmail() != null) existingUser.setEmail(updatedUser.getEmail());
                    if (updatedUser.getPhone() != null) existingUser.setPhone(updatedUser.getPhone());
                    if (updatedUser.getRole() != null) existingUser.setRole(updatedUser.getRole());
                    existingUser.setEnabled(updatedUser.isEnabled());
                    User savedUser = userRepository.save(existingUser);
                    savedUser.setPassword(null);
                    return ResponseEntity.ok(savedUser);
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

    @GetMapping("/profile")
    public ResponseEntity<User> getCurrentUserProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User currentUser = userDetails.getUser();
        currentUser.setPassword(null);
        return ResponseEntity.ok(currentUser);
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

