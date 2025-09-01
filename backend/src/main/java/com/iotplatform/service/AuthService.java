package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.iotplatform.dto.JwtResponse;
import com.iotplatform.dto.LoginRequest;
import com.iotplatform.dto.SignupRequest;
import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.security.JwtTokenProvider;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private NotificationSettingsService notificationSettingsService;

    public JwtResponse login(LoginRequest loginRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();
            
            // Validate user role before proceeding
            try {
                User.Role role = user.getRole();
                if (role == null) {
                    // If role is null, set it to USER
                    user.setRole(User.Role.USER);
                    userRepository.save(user);
                }
            } catch (IllegalArgumentException e) {
                // If role is invalid, set it to USER
                user.setRole(User.Role.USER);
                userRepository.save(user);
            }
            
            user.setLastLogin(LocalDateTime.now());
            userRepository.save(user);

            return new JwtResponse(jwt, user.getId(), user.getFirstName() + " " + user.getLastName(), user.getEmail(), user.getRole().name(), user.getOrganizationId());
        } catch (Exception e) {
            throw new RuntimeException("Authentication failed: " + e.getMessage());
        }
    }

    public User findUserByEmail(String email) {
        return userRepository.findByEmail(email).orElse(null);
    }

    public User signup(SignupRequest signupRequest) {
        logger.info("🚀 Starting user signup process for email: {}", signupRequest.getEmail());
        
        // Check if email already exists
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            logger.warn("❌ Signup failed: Email already exists: {}", signupRequest.getEmail());
            throw new RuntimeException("Email is already in use!");
        }

        // Validate password strength
        String password = signupRequest.getPassword();
        if (password.length() < 3) {
            logger.warn("❌ Signup failed: Password too short for email: {}", signupRequest.getEmail());
            throw new RuntimeException("Password must be at least 3 characters long");
        }
        // Removed complex password validation to match frontend requirements
        // Users can now use simpler passwords as per the updated requirements

        logger.info("✅ Password validation passed for email: {}", signupRequest.getEmail());

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setFirstName(signupRequest.getFirstName());
        user.setLastName(signupRequest.getLastName());
        user.setEmail(signupRequest.getEmail());
        user.setPassword(passwordEncoder.encode(signupRequest.getPassword()));
        
        // Validate and set role based on request, default to USER
        try {
            User.Role role = signupRequest.getRole();
            if (role == null) {
                role = User.Role.USER;
            }
            user.setRole(role);
        } catch (IllegalArgumentException e) {
            // If invalid role is provided, default to USER
            user.setRole(User.Role.USER);
        }
        
        // Use a consistent organization ID for all users (as requested)
        user.setOrganizationId("shiftAIOT-org-2024");
        
        logger.info("📝 User object prepared for database save: ID={}, Email={}, Role={}, Organization={}", 
                   user.getId(), user.getEmail(), user.getRole(), user.getOrganizationId());
        
        // User is ready to be saved
        try {
            User savedUser = userRepository.save(user);
            logger.info("✅ User successfully saved to database: ID={}, Email={}", 
                       savedUser.getId(), savedUser.getEmail());
            
            // Initialize user preferences for the new user
            try {
                notificationSettingsService.ensureUserPreferencesInitialized(savedUser.getId());
                logger.info("✅ User preferences initialized for user: {}", savedUser.getEmail());
            } catch (Exception e) {
                logger.warn("⚠️ Failed to initialize user preferences for user: {}", savedUser.getEmail(), e);
                // Don't fail the signup if preferences initialization fails
            }
            
            return savedUser;
        } catch (Exception e) {
            logger.error("❌ Failed to save user to database: Email={}, Error={}", 
                        signupRequest.getEmail(), e.getMessage(), e);
            throw new RuntimeException("Failed to save user to database: " + e.getMessage());
        }
    }

    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public boolean isAdmin(User user) {
        return user.getRole() == User.Role.ADMIN;
    }

    public boolean isUser(User user) {
        return user.getRole() == User.Role.USER;
    }

    public boolean hasPermission(User user, String permission) {
        if (isAdmin(user)) {
            return true; // Admin has all permissions
        }
        
        // Check specific permissions for USER role
        switch (permission) {
            case "DEVICE_READ":
            case "RULE_READ":
            case "NOTIFICATION_READ":
            case "KNOWLEDGE_READ":
                return true; // USER can read devices, rules, notifications, and knowledge
            case "DEVICE_WRITE":
            case "DEVICE_DELETE":
            case "RULE_WRITE":
            case "RULE_DELETE":
            case "USER_WRITE":
            case "USER_DELETE":
            case "NOTIFICATION_WRITE":
            case "KNOWLEDGE_WRITE":
            case "KNOWLEDGE_DELETE":
                return false; // USER cannot perform write/delete actions
            default:
                return false;
        }
    }
}