package com.iotplatform.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.dto.JwtResponse;
import com.iotplatform.dto.LoginRequest;
import com.iotplatform.dto.SignupRequest;
import com.iotplatform.model.User;
import com.iotplatform.service.AuthService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthService authService;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Authentication attempt for user: {}", loginRequest.getEmail());
        
        try {
            JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
            logger.info("User {} authenticated successfully", loginRequest.getEmail());
            return ResponseEntity.ok(jwtResponse);
        } catch (Exception e) {
            logger.error("Authentication failed for user {}: {}", loginRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        logger.info("User registration attempt for email: {}", signUpRequest.getEmail());
        
        try {
            User user = authService.registerUser(signUpRequest);
            logger.info("User {} registered successfully with ID: {}", signUpRequest.getEmail(), user.getId());
            return ResponseEntity.ok().body("User registered successfully!");
        } catch (RuntimeException e) {
            logger.error("User registration failed for {}: {}", signUpRequest.getEmail(), e.getMessage());
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }
}