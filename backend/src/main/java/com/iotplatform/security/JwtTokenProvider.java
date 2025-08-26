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
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.getSubject();
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the username for refresh purposes
            return ex.getClaims().getSubject();
        } catch (Exception ex) {
            logger.error("Error extracting username from token", ex);
            return null;
        }
    }

    public String getUsernameFromExpiredToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.getSubject();
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the username
            return ex.getClaims().getSubject();
        } catch (Exception ex) {
            logger.error("Error extracting username from expired token", ex);
            return null;
        }
    }

    public String getUserIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("userId", String.class);
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the user ID
            return ex.getClaims().get("userId", String.class);
        } catch (Exception ex) {
            logger.error("Error extracting user ID from token", ex);
            return null;
        }
    }

    public String getUserRoleFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("userRole", String.class);
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the user role
            return ex.getClaims().get("userRole", String.class);
        } catch (Exception ex) {
            logger.error("Error extracting user role from token", ex);
            return null;
        }
    }

    public String getOrganizationIdFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("organizationId", String.class);
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the organization ID
            return ex.getClaims().get("organizationId", String.class);
        } catch (Exception ex) {
            logger.error("Error extracting organization ID from token", ex);
            return null;
        }
    }

    public String getUserFullNameFromToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return claims.get("userFullName", String.class);
        } catch (ExpiredJwtException ex) {
            // For expired tokens, we can still extract the user full name
            return ex.getClaims().get("userFullName", String.class);
        } catch (Exception ex) {
            logger.error("Error extracting user full name from token", ex);
            return null;
        }
    }

    public boolean validateToken(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            
            logger.debug("JWT token validation successful");
            return true;
        } catch (SecurityException ex) {
            logger.warn("Invalid JWT signature for token: {}", authToken != null ? authToken.substring(0, Math.min(20, authToken.length())) + "..." : "null");
        } catch (MalformedJwtException ex) {
            logger.warn("Malformed JWT token: {}", ex.getMessage());
        } catch (ExpiredJwtException ex) {
            logger.warn("Expired JWT token for user: {}", ex.getClaims().getSubject());
        } catch (UnsupportedJwtException ex) {
            logger.warn("Unsupported JWT token: {}", ex.getMessage());
        } catch (IllegalArgumentException ex) {
            logger.warn("JWT claims string is empty: {}", ex.getMessage());
        } catch (Exception ex) {
            logger.warn("Unexpected error validating JWT token: {}", ex.getMessage());
        }
        return false;
    }

    public boolean isTokenExpired(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            return false; // Token is valid, not expired
        } catch (ExpiredJwtException ex) {
            logger.debug("JWT token is expired for user: {}", ex.getClaims().getSubject());
            return true;
        } catch (Exception ex) {
            logger.debug("Error checking token expiration: {}", ex.getMessage());
            return false; // Assume not expired if we can't determine
        }
    }
}