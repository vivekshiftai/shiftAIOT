package com.iotplatform.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsService userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            // Skip authentication for public endpoints only
            String requestURI = request.getRequestURI();
            String contentType = request.getContentType();
            String method = request.getMethod();
            
            logger.info("🔐 JWT Filter - URI: {}, Method: {}, Content-Type: {}", 
                       requestURI, method, contentType);
            
            // Define public endpoints that don't require authentication
            String[] publicEndpoints = {
                "/api/auth/",
                "/auth/",
                "/api/health",
                "/health",
                "/swagger-ui",
                "/v3/api-docs",
                "/api/devices/health",
                "/knowledge/",
                "/upload-pdf",
                "/query",
                "/pdfs/"
            };
            
            for (String endpoint : publicEndpoints) {
                if (requestURI.startsWith(endpoint)) {
                    logger.debug("Skipping JWT authentication for public endpoint: {}", requestURI);
                    filterChain.doFilter(request, response);
                    return;
                }
            }

            String jwt = getJwtFromRequest(request);
            logger.info("🔐 JWT Filter - URI: {}, JWT present: {}, JWT length: {}", 
                       requestURI, StringUtils.hasText(jwt), jwt != null ? jwt.length() : 0);

            if (StringUtils.hasText(jwt)) {
                // Enhanced token validation with detailed logging
                logger.debug("🔍 Starting JWT validation process for token: {}...", 
                           jwt.length() > 20 ? jwt.substring(0, 20) : jwt);
                
                boolean isValid = tokenProvider.validateToken(jwt);
                boolean isExpired = tokenProvider.isTokenExpired(jwt);
                
                logger.info("🔐 JWT validation result: valid={}, expired={}", isValid, isExpired);
                
                if (isValid) {
                    String username = tokenProvider.getUsernameFromToken(jwt);
                    logger.info("🔐 Username extracted from token: {}", username);
                    
                    if (username != null && !username.trim().isEmpty()) {
                        try {
                            // Enhanced user loading with detailed error handling
                            logger.debug("🔍 Attempting to load user details for username: {}", username);
                            
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            
                            if (userDetails != null) {
                                logger.info("🔐 User details loaded successfully for: {} with roles: {}", 
                                          username, userDetails.getAuthorities());
                                
                                // Validate user details
                                if (userDetails.getUsername() == null || userDetails.getUsername().trim().isEmpty()) {
                                    logger.error("❌ User details loaded but username is null or empty for: {}", username);
                                    throw new RuntimeException("Invalid user details - username is null or empty");
                                }
                                
                                if (userDetails.getAuthorities() == null || userDetails.getAuthorities().isEmpty()) {
                                    logger.warn("⚠️ User has no authorities assigned: {}", username);
                                }
                                
                                // Check if user is admin and log it
                                boolean isAdmin = userDetails.getAuthorities().stream()
                                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
                                if (isAdmin) {
                                    logger.info("🔐 Admin user detected: {} - granting all permissions", username);
                                }
                                
                                UsernamePasswordAuthenticationToken authentication = 
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                                SecurityContextHolder.getContext().setAuthentication(authentication);
                                logger.info("✅ Authentication successful for user: {} on endpoint: {}", username, requestURI);
                                
                                // Log additional authentication details for debugging
                                logger.debug("🔐 Authentication details - Principal: {}, Authorities: {}, Details: {}", 
                                           authentication.getPrincipal(), 
                                           authentication.getAuthorities(), 
                                           authentication.getDetails());
                            } else {
                                logger.error("❌ UserDetailsService returned null for username: {}", username);
                                throw new RuntimeException("UserDetailsService returned null");
                            }
                        } catch (UsernameNotFoundException e) {
                            logger.error("❌ User not found in database for username: {} - {}", username, e.getMessage());
                            // Log additional debugging information
                            logger.debug("🔍 UsernameNotFoundException details: {}", e.getMessage());
                        } catch (Exception userLoadError) {
                            logger.error("❌ Failed to load user details for username: {} - Error: {}", 
                                       username, userLoadError.getMessage(), userLoadError);
                            // Log the full stack trace for debugging
                            logger.debug("🔍 Full stack trace for user loading error:", userLoadError);
                        }
                    } else {
                        logger.error("❌ Could not extract valid username from JWT token - username: '{}'", username);
                        // Log token details for debugging (first 50 chars)
                        if (jwt != null && jwt.length() > 50) {
                            logger.debug("❌ JWT token sample: {}...", jwt.substring(0, 50));
                        }
                    }
                } else {
                    logger.warn("❌ JWT token validation failed for endpoint: {}", requestURI);
                    // Enhanced error logging for token validation failures
                    if (isExpired) {
                        logger.warn("❌ JWT token is expired for endpoint: {}", requestURI);
                    }
                    // Log a sample of the token for debugging (first 50 chars)
                    if (jwt != null && jwt.length() > 50) {
                        logger.debug("❌ JWT token sample: {}...", jwt.substring(0, 50));
                    }
                }
            } else {
                logger.warn("❌ No JWT token found in request for endpoint: {}", requestURI);
                // Log request headers for debugging
                logger.debug("🔍 Request headers for debugging:");
                java.util.Enumeration<String> headerNames = request.getHeaderNames();
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    String headerValue = request.getHeader(headerName);
                    if ("authorization".equalsIgnoreCase(headerName)) {
                        logger.debug("🔍 Authorization header: {}", 
                                   headerValue != null && headerValue.length() > 20 ? 
                                   headerValue.substring(0, 20) + "..." : headerValue);
                    } else {
                        logger.debug("🔍 {}: {}", headerName, headerValue);
                    }
                }
            }
        } catch (Exception ex) {
            logger.error("❌ Could not set user authentication in security context for URI: {} - Error: {}", 
                       request.getRequestURI(), ex.getMessage(), ex);
            // Log the full stack trace for debugging
            logger.debug("🔍 Full stack trace for authentication error:", ex);
            // Don't block the request, just log the error
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            logger.debug("🔍 Extracted JWT token from Authorization header: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            return token;
        }
        logger.debug("🔍 No valid Authorization header found");
        return null;
    }
}