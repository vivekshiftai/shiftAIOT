package com.iotplatform.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

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
            if (requestURI.startsWith("/api/auth/") || 
                requestURI.startsWith("/auth/") ||
                requestURI.startsWith("/api/health") ||
                requestURI.startsWith("/health") ||
                requestURI.startsWith("/swagger-ui") ||
                requestURI.startsWith("/v3/api-docs")) {
                logger.debug("Skipping JWT authentication for public endpoint: {}", requestURI);
                filterChain.doFilter(request, response);
                return;
            }

            String jwt = getJwtFromRequest(request);
            logger.info("🔐 JWT Filter - URI: {}, JWT present: {}, JWT length: {}", 
                       requestURI, StringUtils.hasText(jwt), jwt != null ? jwt.length() : 0);

            if (StringUtils.hasText(jwt)) {
                boolean isValid = tokenProvider.validateToken(jwt);
                logger.info("🔐 JWT validation result: {}", isValid);
                
                if (isValid) {
                    String username = tokenProvider.getUsernameFromToken(jwt);
                    logger.info("🔐 Username extracted from token: {}", username);
                    
                    if (username != null) {
                        try {
                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            logger.info("🔐 User details loaded successfully for: {} with roles: {}", 
                                      username, userDetails.getAuthorities());
                            
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
                        } catch (Exception userLoadError) {
                            logger.error("❌ Failed to load user details for username: {}", username, userLoadError);
                        }
                    } else {
                        logger.error("❌ Could not extract username from valid JWT token");
                    }
                } else {
                    logger.warn("❌ JWT token validation failed for endpoint: {}", requestURI);
                    // Log a sample of the token for debugging (first 50 chars)
                    if (jwt != null && jwt.length() > 50) {
                        logger.debug("❌ JWT token sample: {}...", jwt.substring(0, 50));
                    }
                }
            } else {
                logger.warn("❌ No JWT token found in request for endpoint: {}", requestURI);
            }
        } catch (Exception ex) {
            logger.error("❌ Could not set user authentication in security context", ex);
            // Don't block the request, just log the error
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}