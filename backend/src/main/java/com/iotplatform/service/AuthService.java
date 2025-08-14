package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

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

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

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
        if (userRepository.existsByEmail(signupRequest.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

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
        
        // Generate organization ID (in a real app, this might come from the signup process)
        user.setOrganizationId(UUID.randomUUID().toString());
        
        // Set default IoT connection settings
        user.setConnectionType(User.ConnectionType.MQTT);
        user.setMqttBrokerUrl("mqtt.broker.com");
        user.setMqttUsername("iot_user");
        user.setMqttPassword("iot_password");
        user.setApiKey(UUID.randomUUID().toString());
        user.setWebhookUrl("https://webhook.site/your-unique-url");

        return userRepository.save(user);
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