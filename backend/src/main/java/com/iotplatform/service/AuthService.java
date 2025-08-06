package com.iotplatform.service;

import com.iotplatform.dto.LoginRequest;
import com.iotplatform.dto.SignupRequest;
import com.iotplatform.dto.JwtResponse;
import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;
import com.iotplatform.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtTokenProvider jwtTokenProvider;

    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        User user = (User) authentication.getPrincipal();
        
        // Update last login
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return new JwtResponse(jwt, user.getId(), user.getName(), user.getEmail(), 
                              user.getRole().name(), user.getOrganizationId());
    }

    public User registerUser(SignupRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already taken!");
        }

        // Create new user's account
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setRole(User.Role.valueOf(signUpRequest.getRole().toUpperCase()));
        user.setOrganizationId(signUpRequest.getOrganizationId());
        user.setPermissions(getDefaultPermissions(user.getRole()));

        return userRepository.save(user);
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