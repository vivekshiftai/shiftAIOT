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
import org.springframework.web.bind.annotation.GetMapping;

import com.iotplatform.dto.JwtResponse;
import com.iotplatform.dto.LoginRequest;
import com.iotplatform.dto.RefreshTokenRequest;
import com.iotplatform.dto.SignupRequest;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.security.JwtTokenProvider;
import com.iotplatform.service.AuthService;
import com.iotplatform.repository.UserRepository;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;

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

    @Autowired
    private UserRepository userRepository;

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
        logger.info("🎯 Signup request received for email: {}", signupRequest.getEmail());
        try {
            User user = authService.signup(signupRequest);
            logger.info("✅ User created successfully in database: ID={}, Email={}", 
                       user.getId(), user.getEmail());
            
            // Authenticate the newly registered user
            logger.info("🔐 Attempting to authenticate newly registered user: {}", signupRequest.getEmail());
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(signupRequest.getEmail(), signupRequest.getPassword()));
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtTokenProvider.generateToken(authentication);
            String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

            logger.info("✅ User {} successfully registered and authenticated with roles: {}", 
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
            logger.error("❌ Signup failed for email: {}, Error: {}", signupRequest.getEmail(), e.getMessage(), e);
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
            
            logger.warn("📝 Returning user-friendly error message: {}", errorMessage);
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
            
            logger.info("🔄 Token refresh requested for user: {}", username);
            
            // Get user from database - must exist
            User user = authService.findUserByEmail(username);
            if (user == null) {
                logger.error("❌ User not found in database for: {}", username);
                return ResponseEntity.status(401).body("User not found in database: " + username);
            }
            
            // Create authentication object using CustomUserDetails as principal
            CustomUserDetails userDetails = new CustomUserDetails(user);
            Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities());
            
            // Generate new token and refresh token
            String newJwt = jwtTokenProvider.generateToken(authentication);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(authentication);
            
            logger.info("✅ Token refreshed successfully for user: {}", username);
            
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
            logger.error("❌ Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(401).body("Token refresh failed: " + e.getMessage());
        }
    }

    @PostMapping("/api/auth/refresh")
    public ResponseEntity<?> refreshTokenApi(@RequestBody RefreshTokenRequest refreshRequest) {
        // Delegate to the existing refresh method for consistency
        return refreshToken(refreshRequest);
    }

    @GetMapping("/api/auth/debug/users")
    public ResponseEntity<?> debugUsers() {
        try {
            List<User> users = userRepository.findAll();
            List<Map<String, Object>> userList = users.stream()
                .map(user -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", user.getId());
                    userMap.put("email", user.getEmail());
                    userMap.put("firstName", user.getFirstName());
                    userMap.put("lastName", user.getLastName());
                    userMap.put("role", user.getRole().name());
                    userMap.put("organizationId", user.getOrganizationId());
                    userMap.put("enabled", user.isEnabled());
                    userMap.put("createdAt", user.getCreatedAt());
                    userMap.put("lastLogin", user.getLastLogin());
                    return userMap;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("totalUsers", userList.size());
            response.put("users", userList);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error fetching users for debug: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to fetch users: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/api/auth/debug/current-user")
    public ResponseEntity<?> debugCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "No authentication found in SecurityContext");
                response.put("authentication", null);
                return ResponseEntity.ok(response);
            }
            
            List<String> authoritiesList = authentication.getAuthorities().stream()
                .map(Object::toString)
                .collect(Collectors.toList());
            
            Map<String, Object> authInfo = new HashMap<>();
            authInfo.put("authenticated", authentication.isAuthenticated());
            authInfo.put("principal", authentication.getPrincipal() != null ? authentication.getPrincipal().toString() : "null");
            authInfo.put("authorities", authoritiesList);
            authInfo.put("details", authentication.getDetails() != null ? authentication.getDetails().toString() : "null");
            authInfo.put("name", authentication.getName() != null ? authentication.getName() : "null");
            
            // If it's a CustomUserDetails, add more information
            if (authentication.getPrincipal() instanceof CustomUserDetails) {
                CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                User user = userDetails.getUser();
                
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("userId", user.getId());
                userInfo.put("email", user.getEmail());
                userInfo.put("firstName", user.getFirstName());
                userInfo.put("lastName", user.getLastName());
                userInfo.put("role", user.getRole().name());
                userInfo.put("organizationId", user.getOrganizationId());
                userInfo.put("enabled", user.isEnabled());
                userInfo.put("createdAt", user.getCreatedAt());
                userInfo.put("lastLogin", user.getLastLogin());
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Current user information");
                response.put("authentication", authInfo);
                response.put("user", userInfo);
                return ResponseEntity.ok(response);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Authentication found but not CustomUserDetails");
            response.put("authentication", authInfo);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting current user debug info: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to get current user info: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/api/auth/debug/token-info")
    public ResponseEntity<?> debugTokenInfo(HttpServletRequest request) {
        try {
            String bearerToken = request.getHeader("Authorization");
            Map<String, Object> tokenInfo = new java.util.HashMap<>();
            
            if (bearerToken == null || !bearerToken.startsWith("Bearer ")) {
                tokenInfo.put("tokenPresent", false);
                tokenInfo.put("message", "No Bearer token found in Authorization header");
            } else {
                String token = bearerToken.substring(7);
                tokenInfo.put("tokenPresent", true);
                tokenInfo.put("tokenLength", token.length());
                tokenInfo.put("tokenSample", token.length() > 50 ? token.substring(0, 50) + "..." : token);
                
                // Try to extract information from token
                try {
                    String username = jwtTokenProvider.getUsernameFromToken(token);
                    String userId = jwtTokenProvider.getUserIdFromToken(token);
                    String userRole = jwtTokenProvider.getUserRoleFromToken(token);
                    String organizationId = jwtTokenProvider.getOrganizationIdFromToken(token);
                    String userFullName = jwtTokenProvider.getUserFullNameFromToken(token);
                    boolean isValid = jwtTokenProvider.validateToken(token);
                    boolean isExpired = jwtTokenProvider.isTokenExpired(token);
                    
                    tokenInfo.put("username", username);
                    tokenInfo.put("userId", userId);
                    tokenInfo.put("userRole", userRole);
                    tokenInfo.put("organizationId", organizationId);
                    tokenInfo.put("userFullName", userFullName);
                    tokenInfo.put("isValid", isValid);
                    tokenInfo.put("isExpired", isExpired);
                    
                    // Try to load user from database
                    if (username != null) {
                        try {
                            User user = userRepository.findByEmail(username).orElse(null);
                            if (user != null) {
                                tokenInfo.put("userInDatabase", true);
                                tokenInfo.put("userEnabled", user.isEnabled());
                                tokenInfo.put("userRoleInDb", user.getRole().name());
                                tokenInfo.put("userOrgInDb", user.getOrganizationId());
                            } else {
                                tokenInfo.put("userInDatabase", false);
                                tokenInfo.put("userEnabled", null);
                                tokenInfo.put("userRoleInDb", null);
                                tokenInfo.put("userOrgInDb", null);
                            }
                        } catch (Exception e) {
                            tokenInfo.put("userInDatabase", "error");
                            tokenInfo.put("databaseError", e.getMessage());
                        }
                    }
                    
                } catch (Exception e) {
                    tokenInfo.put("tokenParsingError", e.getMessage());
                }
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("tokenInfo", tokenInfo);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error getting token debug info: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Failed to get token info: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<?> logout() {
        // This endpoint helps users logout and clear their tokens
        Map<String, Object> exampleLogin = new HashMap<>();
        exampleLogin.put("email", "user@shiftaiot.com");
        exampleLogin.put("password", "user123");
        
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Logout successful. Please clear your browser's local storage and login again.");
        response.put("action", "Clear localStorage and login with existing user credentials");
        response.put("loginEndpoint", "/auth/signin");
        response.put("loginMethod", "POST");
        response.put("exampleLogin", exampleLogin);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("service", "IoT Platform Auth Service");
        
        // Add database connectivity check
        try {
            long userCount = userRepository.count();
            response.put("database", "CONNECTED");
            response.put("userCount", userCount);
            logger.info("✅ Database health check passed. User count: {}", userCount);
        } catch (Exception e) {
            response.put("database", "DISCONNECTED");
            response.put("databaseError", e.getMessage());
            logger.error("❌ Database health check failed: {}", e.getMessage(), e);
        }
        
        return ResponseEntity.ok(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException ex) {
        StringBuilder errorMessage = new StringBuilder();
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errorMessage.append(error.getDefaultMessage()).append("; ");
        });
        
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("error", errorMessage.toString().trim());
        errorResponse.put("success", false);
        return ResponseEntity.badRequest().body(errorResponse);
    }
}