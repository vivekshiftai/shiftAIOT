package com.iotplatform.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.dto.JwtResponse;
import com.iotplatform.dto.LoginRequest;
import com.iotplatform.dto.RefreshTokenRequest;
import com.iotplatform.dto.SignupRequest;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.security.JwtTokenProvider;
import com.iotplatform.service.AuthService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtTokenProvider.generateToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getOrganizationId()
        ));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signupRequest) {
        try {
            User user = authService.signup(signupRequest);
            
            // Authenticate the newly registered user
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(signupRequest.getEmail(), signupRequest.getPassword()));
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getFirstName() + " " + user.getLastName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getOrganizationId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest refreshRequest) {
        try {
            String username = null;
            
            // First try to get username from valid token
            if (jwtTokenProvider.validateToken(refreshRequest.getToken())) {
                username = jwtTokenProvider.getUsernameFromToken(refreshRequest.getToken());
            } else {
                // If token is expired, try to extract username from expired token
                username = jwtTokenProvider.getUsernameFromExpiredToken(refreshRequest.getToken());
            }
            
            if (username == null) {
                return ResponseEntity.status(401).body("Invalid token - cannot extract user information");
            }
            
            // Find user by email
            User user = authService.findUserByEmail(username);
            if (user == null) {
                return ResponseEntity.status(401).body("User not found");
            }
            
            // Create authentication object using CustomUserDetails as principal (not a String)
            CustomUserDetails userDetails = new CustomUserDetails(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            
            // Generate new token
            String newJwt = jwtTokenProvider.generateToken(authentication);
            
            return ResponseEntity.ok(new JwtResponse(
                    newJwt,
                    user.getId(),
                    user.getFirstName() + " " + user.getLastName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getOrganizationId()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Token refresh failed: " + e.getMessage());
        }
    }
}