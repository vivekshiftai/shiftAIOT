package com.iotplatform.security;

import java.util.Date;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;

@Component
public class JwtTokenProvider {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpirationInMs;

    @Value("${jwt.refresh-expiration:604800000}")
    private long jwtRefreshExpirationInMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    public String generateToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        CustomUserDetails customUserDetails = (CustomUserDetails) userPrincipal;

        Date expiryDate = new Date(System.currentTimeMillis() + jwtExpirationInMs);

        String token = Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(new Date())
                .expiration(expiryDate)
                .claim("userId", customUserDetails.getUser().getId())
                .claim("userRole", customUserDetails.getUser().getRole().name())
                .claim("organizationId", customUserDetails.getUser().getOrganizationId())
                .claim("userFullName", customUserDetails.getUser().getFirstName() + " " + customUserDetails.getUser().getLastName())
                .signWith(getSigningKey())
                .compact();

        logger.info("Generated JWT token for user: {} with expiration: {}", 
                   userPrincipal.getUsername(), expiryDate);
        
        return token;
    }

    public String generateRefreshToken(Authentication authentication) {
        UserDetails userPrincipal = (UserDetails) authentication.getPrincipal();
        CustomUserDetails customUserDetails = (CustomUserDetails) userPrincipal;

        Date expiryDate = new Date(System.currentTimeMillis() + jwtRefreshExpirationInMs);

        String refreshToken = Jwts.builder()
                .subject(userPrincipal.getUsername())
                .issuedAt(new Date())
                .expiration(expiryDate)
                .claim("type", "refresh")
                .claim("userId", customUserDetails.getUser().getId())
                .claim("userRole", customUserDetails.getUser().getRole().name())
                .claim("organizationId", customUserDetails.getUser().getOrganizationId())
                .claim("userFullName", customUserDetails.getUser().getFirstName() + " " + customUserDetails.getUser().getLastName())
                .signWith(getSigningKey())
                .compact();

        logger.info("Generated refresh token for user: {} with expiration: {}", 
                   userPrincipal.getUsername(), expiryDate);
        
        return refreshToken;
    }

    public String getUsernameFromToken(String token) {
        try {
            logger.debug("🔍 Extracting username from JWT token: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String username = claims.getSubject();
            logger.debug("🔍 Successfully extracted username from token: {}", username);
            return username;
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the username for refresh purposes
            String username = ex.getClaims().getSubject();
            logger.warn("⚠️ Token is expired, but extracted username: {}", username);
            return username;
        } catch (SecurityException ex) {
            logger.error("❌ Security exception while extracting username from token: {}", ex.getMessage());
            return null;
        } catch (MalformedJwtException ex) {
            logger.error("❌ Malformed JWT token while extracting username: {}", ex.getMessage());
            return null;
        } catch (UnsupportedJwtException ex) {
            logger.error("❌ Unsupported JWT token while extracting username: {}", ex.getMessage());
            return null;
        } catch (IllegalArgumentException ex) {
            logger.error("❌ Illegal argument while extracting username from token: {}", ex.getMessage());
            return null;
        } catch (Exception ex) {
            logger.error("❌ Unexpected error extracting username from token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for username extraction error:", ex);
            return null;
        }
    }

    public String getUsernameFromExpiredToken(String token) {
        try {
            logger.debug("🔍 Extracting username from expired JWT token: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String username = claims.getSubject();
            logger.debug("🔍 Successfully extracted username from expired token: {}", username);
            return username;
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the username
            String username = ex.getClaims().getSubject();
            logger.debug("🔍 Extracted username from expired token: {}", username);
            return username;
        } catch (Exception ex) {
            logger.error("❌ Error extracting username from expired token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for expired token username extraction error:", ex);
            return null;
        }
    }

    public String getUserIdFromToken(String token) {
        try {
            logger.debug("🔍 Extracting user ID from JWT token: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.get("userId", String.class);
            logger.debug("🔍 Successfully extracted user ID from token: {}", userId);
            return userId;
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the user ID
            String userId = ex.getClaims().get("userId", String.class);
            logger.warn("⚠️ Token is expired, but extracted user ID: {}", userId);
            return userId;
        } catch (Exception ex) {
            logger.error("❌ Error extracting user ID from token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for user ID extraction error:", ex);
            return null;
        }
    }

    public String getUserRoleFromToken(String token) {
        try {
            logger.debug("🔍 Extracting user role from JWT token: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userRole = claims.get("userRole", String.class);
            logger.debug("🔍 Successfully extracted user role from token: {}", userRole);
            return userRole;
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the user role
            String userRole = ex.getClaims().get("userRole", String.class);
            logger.warn("⚠️ Token is expired, but extracted user role: {}", userRole);
            return userRole;
        } catch (Exception ex) {
            logger.error("❌ Error extracting user role from token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for user role extraction error:", ex);
            return null;
        }
    }

    public String getOrganizationIdFromToken(String token) {
        try {
            logger.debug("🔍 Extracting organization ID from JWT token: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String organizationId = claims.get("organizationId", String.class);
            logger.debug("🔍 Successfully extracted organization ID from token: {}", organizationId);
            return organizationId;
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the organization ID
            String organizationId = ex.getClaims().get("organizationId", String.class);
            logger.warn("⚠️ Token is expired, but extracted organization ID: {}", organizationId);
            return organizationId;
        } catch (Exception ex) {
            logger.error("❌ Error extracting organization ID from token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for organization ID extraction error:", ex);
            return null;
        }
    }

    public String getUserFullNameFromToken(String token) {
        try {
            logger.debug("🔍 Extracting user full name from JWT token: {}...", 
                       token.length() > 20 ? token.substring(0, 20) : token);
            
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userFullName = claims.get("userFullName", String.class);
            logger.debug("🔍 Successfully extracted user full name from token: {}", userFullName);
            return userFullName;
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the user full name
            String userFullName = ex.getClaims().get("userFullName", String.class);
            logger.warn("⚠️ Token is expired, but extracted user full name: {}", userFullName);
            return userFullName;
        } catch (Exception ex) {
            logger.error("❌ Error extracting user full name from token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for user full name extraction error:", ex);
            return null;
        }
    }

    public boolean validateToken(String authToken) {
        try {
            logger.debug("🔍 Starting JWT token validation: {}...", 
                       authToken.length() > 20 ? authToken.substring(0, 20) : authToken);
            
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken)
                .getPayload();
            
            // Additional validation checks
            String subject = claims.getSubject();
            if (subject == null || subject.trim().isEmpty()) {
                logger.warn("❌ JWT token validation failed: subject is null or empty");
                return false;
            }
            
            Date expiration = claims.getExpiration();
            if (expiration == null) {
                logger.warn("❌ JWT token validation failed: expiration is null");
                return false;
            }
            
            if (expiration.before(new Date())) {
                logger.warn("❌ JWT token validation failed: token is expired (expiration: {}, current: {})", 
                           expiration, new Date());
                return false;
            }
            
            logger.debug("✅ JWT token validation successful for user: {}", subject);
            return true;
        } catch (SecurityException ex) {
            logger.warn("❌ Invalid JWT signature for token: {}", 
                       authToken != null ? authToken.substring(0, Math.min(20, authToken.length())) + "..." : "null");
            logger.debug("🔍 Security exception details: {}", ex.getMessage());
        } catch (MalformedJwtException ex) {
            logger.warn("❌ Malformed JWT token: {}", ex.getMessage());
            logger.debug("🔍 Malformed JWT exception details: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.warn("❌ Expired JWT token for user: {}", ex.getClaims().getSubject());
            logger.debug("🔍 Expired JWT exception details: {}", ex.getMessage());
        } catch (UnsupportedJwtException ex) {
            logger.warn("❌ Unsupported JWT token: {}", ex.getMessage());
            logger.debug("🔍 Unsupported JWT exception details: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.warn("❌ JWT claims string is empty: {}", ex.getMessage());
            logger.debug("🔍 IllegalArgumentException details: {}", ex.getMessage());
        } catch (Exception ex) {
            logger.warn("❌ Unexpected error validating JWT token: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for JWT validation error:", ex);
        }
        return false;
    }

    public boolean isTokenExpired(String authToken) {
        try {
            logger.debug("🔍 Checking if JWT token is expired: {}...", 
                       authToken.length() > 20 ? authToken.substring(0, 20) : authToken);
            
            Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken)
                .getPayload();
            
            Date expiration = claims.getExpiration();
            boolean isExpired = expiration != null && expiration.before(new Date());
            
            if (isExpired) {
                logger.debug("❌ JWT token is expired for user: {} (expiration: {}, current: {})", 
                           claims.getSubject(), expiration, new Date());
            } else {
                logger.debug("✅ JWT token is not expired for user: {} (expiration: {})", 
                           claims.getSubject(), expiration);
            }
            
            return isExpired;
        } catch (ExpiredJwtException ex) {
            logger.debug("❌ JWT token is expired for user: {}", ex.getClaims().getSubject());
            return true;
        } catch (Exception ex) {
            logger.debug("❌ Error checking token expiration: {}", ex.getMessage());
            logger.debug("🔍 Full stack trace for token expiration check error:", ex);
            return false; // Assume not expired if we can't determine
        }
    }
}