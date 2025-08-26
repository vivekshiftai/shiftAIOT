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

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import jakarta.servlet.http.HttpServletRequest;

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
                .map(user -> Map.of(
                    "id", user.getId(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "role", user.getRole().name(),
                    "organizationId", user.getOrganizationId(),
                    "enabled", user.isEnabled(),
                    "createdAt", user.getCreatedAt(),
                    "lastLogin", user.getLastLogin()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "totalUsers", userList.size(),
                "users", userList
            ));
        } catch (Exception e) {
            logger.error("Error fetching users for debug: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to fetch users: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/api/auth/debug/current-user")
    public ResponseEntity<?> debugCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "No authentication found in SecurityContext",
                    "authentication", null
                ));
            }
            
            Map<String, Object> authInfo = Map.of(
                "authenticated", authentication.isAuthenticated(),
                "principal", authentication.getPrincipal() != null ? authentication.getPrincipal().toString() : "null",
                "authorities", authentication.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()),
                "details", authentication.getDetails() != null ? authentication.getDetails().toString() : "null",
                "name", authentication.getName() != null ? authentication.getName() : "null"
            );
            
            // If it's a CustomUserDetails, add more information
            if (authentication.getPrincipal() instanceof CustomUserDetails) {
                CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
                User user = userDetails.getUser();
                
                Map<String, Object> userInfo = Map.of(
                    "userId", user.getId(),
                    "email", user.getEmail(),
                    "firstName", user.getFirstName(),
                    "lastName", user.getLastName(),
                    "role", user.getRole().name(),
                    "organizationId", user.getOrganizationId(),
                    "enabled", user.isEnabled(),
                    "createdAt", user.getCreatedAt(),
                    "lastLogin", user.getLastLogin()
                );
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Current user information",
                    "authentication", authInfo,
                    "user", userInfo
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Authentication found but not CustomUserDetails",
                "authentication", authInfo
            ));
            
        } catch (Exception e) {
            logger.error("Error getting current user debug info: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to get current user info: " + e.getMessage()
            ));
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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "tokenInfo", tokenInfo
            ));
            
        } catch (Exception e) {
            logger.error("Error getting token debug info: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Failed to get token info: " + e.getMessage()
            ));
        }
    }

    @PostMapping("/api/auth/logout")
    public ResponseEntity<?> logout() {
        // This endpoint helps users logout and clear their tokens
        return ResponseEntity.ok(Map.of(
            "message", "Logout successful. Please clear your browser's local storage and login again.",
            "action", "Clear localStorage and login with existing user credentials",
            "loginEndpoint", "/auth/signin",
            "loginMethod", "POST",
            "exampleLogin", Map.of(
                "email", "user@shiftaiot.com",
                "password", "user123"
            )
        ));
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