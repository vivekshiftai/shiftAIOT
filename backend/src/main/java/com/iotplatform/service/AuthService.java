package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.Set;
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
import com.iotplatform.security.JwtTokenProvider;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtTokenProvider jwtTokenProvider;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        logger.info("Authentication attempt for user: {}", loginRequest.getEmail());
        
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        User user = (User) authentication.getPrincipal();
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        logger.info("User {} authenticated successfully", user.getEmail());
        return new JwtResponse(jwt, user.getId(), user.getFullName(), user.getEmail(), 
                              user.getRole().name(), user.getOrganizationId());
    }

    public User registerUser(SignupRequest signUpRequest) {
        logger.info("User registration attempt for email: {}", signUpRequest.getEmail());
        
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            logger.warn("Registration failed: Email {} is already taken", signUpRequest.getEmail());
            throw new RuntimeException("Error: Email is already taken!");
        }

        // Create new user's account
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setFirstName(signUpRequest.getFirstName());
        user.setLastName(signUpRequest.getLastName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setPhoneNumber(signUpRequest.getPhoneNumber());
        user.setRole(User.Role.valueOf(signUpRequest.getRole().toUpperCase()));
        user.setOrganizationId(signUpRequest.getOrganizationId());
        user.setPermissions(getDefaultPermissions(user.getRole()));

        User savedUser = userRepository.save(user);
        logger.info("User {} registered successfully with ID: {}", signUpRequest.getEmail(), savedUser.getId());
        return savedUser;
    }

    private Set<User.Permission> getDefaultPermissions(User.Role role) {
        return switch (role) {
            case SUPER_ADMIN -> Set.of(User.Permission.values());
            case ORG_ADMIN -> Set.of(
                User.Permission.DEVICE_READ, User.Permission.DEVICE_WRITE, User.Permission.DEVICE_DELETE,
                User.Permission.RULE_READ, User.Permission.RULE_WRITE, User.Permission.RULE_DELETE,
                User.Permission.USER_READ, User.Permission.USER_WRITE, User.Permission.USER_DELETE,
                User.Permission.NOTIFICATION_READ, User.Permission.NOTIFICATION_WRITE,
                User.Permission.KNOWLEDGE_READ, User.Permission.KNOWLEDGE_WRITE, User.Permission.KNOWLEDGE_DELETE
            );
            case DEVICE_MANAGER -> Set.of(
                User.Permission.DEVICE_READ, User.Permission.DEVICE_WRITE,
                User.Permission.RULE_READ, User.Permission.RULE_WRITE,
                User.Permission.NOTIFICATION_READ,
                User.Permission.KNOWLEDGE_READ
            );
            case OPERATOR -> Set.of(
                User.Permission.DEVICE_READ,
                User.Permission.RULE_READ,
                User.Permission.NOTIFICATION_READ,
                User.Permission.KNOWLEDGE_READ
            );
            case VIEWER -> Set.of(
                User.Permission.DEVICE_READ,
                User.Permission.NOTIFICATION_READ,
                User.Permission.KNOWLEDGE_READ
            );
        };
    }
}