package com.iotplatform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;
import com.iotplatform.security.CustomUserDetails;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(CustomUserDetailsService.class);

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        logger.info("🔍 Attempting to load user by email: '{}'", email);
        
        // Validate input
        if (email == null || email.trim().isEmpty()) {
            logger.error("❌ Email parameter is null or empty");
            throw new UsernameNotFoundException("Email cannot be null or empty");
        }
        
        String trimmedEmail = email.trim();
        logger.debug("🔍 Trimmed email: '{}'", trimmedEmail);
        
        try {
            logger.debug("🔍 Querying database for user with email: '{}'", trimmedEmail);
            
            User user = userRepository.findByEmail(trimmedEmail)
                    .orElseThrow(() -> {
                        logger.error("❌ User not found in database with email: '{}'", trimmedEmail);
                        return new UsernameNotFoundException("User not found with email: " + trimmedEmail);
                    });
            
            logger.debug("🔍 User found in database: ID={}, Email={}, Role={}, Enabled={}", 
                       user.getId(), user.getEmail(), user.getRole(), user.isEnabled());
            
            // Validate user data
            if (user.getId() == null || user.getId().trim().isEmpty()) {
                logger.error("❌ User found but has invalid ID: '{}'", trimmedEmail);
                throw new UsernameNotFoundException("User has invalid ID: " + trimmedEmail);
            }
            
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                logger.error("❌ User found but has invalid email: '{}'", trimmedEmail);
                throw new UsernameNotFoundException("User has invalid email: " + trimmedEmail);
            }
            
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                logger.error("❌ User found but has invalid password: '{}'", trimmedEmail);
                throw new UsernameNotFoundException("User has invalid password: " + trimmedEmail);
            }
            
            // Check if user is enabled
            if (!user.isEnabled()) {
                logger.warn("⚠️ User account is disabled: '{}'", trimmedEmail);
                throw new UsernameNotFoundException("User account is disabled: " + trimmedEmail);
            }
            
            // Validate role
            if (user.getRole() == null) {
                logger.error("❌ User found but has null role: '{}'", trimmedEmail);
                throw new UsernameNotFoundException("User has null role: " + trimmedEmail);
            }
            
            // Validate organization ID
            if (user.getOrganizationId() == null || user.getOrganizationId().trim().isEmpty()) {
                logger.warn("⚠️ User found but has invalid organization ID: '{}'", trimmedEmail);
                // Don't throw exception for this, just log a warning
            }
            
            logger.info("✅ User loaded successfully: {} (ID: {}, Role: {}, Organization: {}, Enabled: {})", 
                       user.getEmail(), user.getId(), user.getRole(), user.getOrganizationId(), user.isEnabled());
            
            // Create CustomUserDetails
            CustomUserDetails userDetails = new CustomUserDetails(user);
            
            // Validate the created UserDetails
            if (userDetails.getUsername() == null || userDetails.getUsername().trim().isEmpty()) {
                logger.error("❌ Created UserDetails has null or empty username for email: '{}'", trimmedEmail);
                throw new UsernameNotFoundException("Created UserDetails has invalid username: " + trimmedEmail);
            }
            
            if (userDetails.getAuthorities() == null || userDetails.getAuthorities().isEmpty()) {
                logger.warn("⚠️ Created UserDetails has no authorities for email: '{}'", trimmedEmail);
            } else {
                logger.debug("🔍 User authorities: {}", userDetails.getAuthorities());
            }
            
            logger.debug("🔍 Successfully created CustomUserDetails for user: '{}'", trimmedEmail);
            return userDetails;
            
        } catch (UsernameNotFoundException e) {
            // Re-throw UsernameNotFoundException as is
            logger.error("❌ UsernameNotFoundException for email: '{}' - {}", trimmedEmail, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("❌ Unexpected error loading user by email: '{}' - Error: {}", trimmedEmail, e.getMessage());
            logger.debug("🔍 Full stack trace for user loading error:", e);
            throw new UsernameNotFoundException("Error loading user: " + trimmedEmail, e);
        }
    }
}
