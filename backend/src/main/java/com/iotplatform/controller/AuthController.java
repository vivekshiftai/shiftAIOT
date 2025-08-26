package com.iotplatform.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.HttpStatus;

import com.iotplatform.dto.JwtResponse;
import com.iotplatform.dto.LoginRequest;
import com.iotplatform.dto.RefreshTokenRequest;
import com.iotplatform.dto.SignupRequest;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.security.JwtTokenProvider;
import com.iotplatform.service.AuthService;

import jakarta.validation.Valid;

import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

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
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        User user = userDetails.getUser();

        logger.info("User {} successfully authenticated with roles: {}", 
                   user.getEmail(), user.getRole().name());

        return ResponseEntity.ok(new JwtResponse(
                jwt,
                user.getId(),
                user.getFirstName() + " " + user.getLastName(),
                user.getEmail(),
                user.getRole().name(),
                user.getOrganizationId(),
                refreshToken
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
            String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

            logger.info("User {} successfully registered and authenticated with roles: {}", 
                       user.getEmail(), user.getRole().name());

            return ResponseEntity.ok(new JwtResponse(
                    jwt,
                    user.getId(),
                    user.getFirstName() + " " + user.getLastName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getOrganizationId(),
                    refreshToken
            ));
        } catch (Exception e) {
            String errorMessage = e.getMessage();
            
            // Convert technical error messages to user-friendly ones
            if (errorMessage.contains("Email is already in use")) {
                errorMessage = "An account with this email already exists. Please try signing in instead.";
            } else if (errorMessage.contains("Password must contain")) {
                errorMessage = "Password must meet all requirements: at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.";
            } else if (errorMessage.contains("Please enter a valid email address")) {
                errorMessage = "Please enter a valid email address.";
            } else if (errorMessage.contains("First name is required") || errorMessage.contains("Last name is required")) {
                errorMessage = "Please fill in all required fields.";
            } else if (errorMessage.contains("must be between")) {
                errorMessage = "Please check the length requirements for your input.";
            }
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", errorMessage,
                "success", false
            ));
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
            
            // Extract user information from the token instead of querying database
            String userId = jwtTokenProvider.getUserIdFromToken(refreshRequest.getToken());
            String userRole = jwtTokenProvider.getUserRoleFromToken(refreshRequest.getToken());
            String organizationId = jwtTokenProvider.getOrganizationIdFromToken(refreshRequest.getToken());
            String userFullName = jwtTokenProvider.getUserFullNameFromToken(refreshRequest.getToken());
            
            // Debug logging to see what's extracted from token
            logger.info("Token extraction debug - username: {}, userId: {}, userRole: {}, organizationId: {}, userFullName: {}", 
                       username, userId, userRole, organizationId, userFullName);
            
            User user;
            
            // Validate required fields
            if (userId == null || userRole == null || organizationId == null) {
                logger.warn("Missing required user information in token for user: {}, attempting database lookup as fallback", username);
                
                // Fallback to database lookup for old tokens
                User userFromDb = authService.findUserByEmail(username);
                if (userFromDb == null) {
                    logger.error("User not found in database for username: {}", username);
                    return ResponseEntity.status(401).body("User not found");
                }
                
                // Use database user information
                user = userFromDb;
                logger.info("Using database user information for token refresh: {}", username);
            } else {
                // Create a simple user object from token data
                user = new User();
                user.setId(userId);
                user.setEmail(username);
                user.setRole(User.Role.valueOf(userRole));
                user.setOrganizationId(organizationId);
                
                // Handle userFullName with null check and fallback
                if (userFullName != null && !userFullName.trim().isEmpty()) {
                    String[] nameParts = userFullName.trim().split(" ", 2);
                    user.setFirstName(nameParts[0]);
                    user.setLastName(nameParts.length > 1 ? nameParts[1] : "");
                } else {
                    // Fallback to username if full name is not available
                    user.setFirstName(username.split("@")[0]); // Use part before @ as first name
                    user.setLastName("");
                    logger.warn("User full name not found in token for user: {}, using fallback", username);
                }
            }
            
            // Create authentication object using CustomUserDetails as principal
            CustomUserDetails userDetails = new CustomUserDetails(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            
            // Generate new token and refresh token
            String newJwt = jwtTokenProvider.generateToken(authentication);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(authentication);
            
            logger.info("Token refreshed successfully for user: {} using token validation only", username);
            
            return ResponseEntity.ok(new JwtResponse(
                    newJwt,
                    user.getId(),
                    user.getFirstName() + " " + user.getLastName(),
                    user.getEmail(),
                    user.getRole().name(),
                    user.getOrganizationId(),
                    newRefreshToken
            ));
        } catch (Exception e) {
            logger.error("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(401).body("Token refresh failed: " + e.getMessage());
        }
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<?> refreshTokenApi(@RequestBody RefreshTokenRequest refreshRequest) {
        // Delegate to the existing refresh method for consistency
        return refreshToken(refreshRequest);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        StringBuilder errorMessage = new StringBuilder();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errorMessage.append(error.getDefaultMessage()).append("; ");
        });
        
        return ResponseEntity.badRequest().body(Map.of(
            "error", errorMessage.toString().trim(),
            "success", false
        ));
    }
}