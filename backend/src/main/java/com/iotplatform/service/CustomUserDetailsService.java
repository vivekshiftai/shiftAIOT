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
        logger.info("🔍 Attempting to load user by email: {}", email);
        
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        logger.error("❌ User not found with email: {}", email);
                        return new UsernameNotFoundException("User not found with email: " + email);
                    });
            
            // Validate user data
            if (user.getId() == null || user.getId().trim().isEmpty()) {
                logger.error("❌ User found but has invalid ID: {}", email);
                throw new UsernameNotFoundException("User has invalid ID: " + email);
            }
            
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                logger.error("❌ User found but has invalid email: {}", email);
                throw new UsernameNotFoundException("User has invalid email: " + email);
            }
            
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                logger.error("❌ User found but has invalid password: {}", email);
                throw new UsernameNotFoundException("User has invalid password: " + email);
            }
            
            // Check if user is enabled
            if (!user.isEnabled()) {
                logger.warn("⚠️ User account is disabled: {}", email);
                throw new UsernameNotFoundException("User account is disabled: " + email);
            }
            
            logger.info("✅ User loaded successfully: {} (ID: {}, Role: {}, Organization: {})", 
                       user.getEmail(), user.getId(), user.getRole(), user.getOrganizationId());
            
            return new CustomUserDetails(user);
            
        } catch (UsernameNotFoundException e) {
            // Re-throw UsernameNotFoundException as is
            throw e;
        } catch (Exception e) {
            logger.error("❌ Unexpected error loading user by email: {}", email, e);
            throw new UsernameNotFoundException("Error loading user: " + email, e);
        }
    }
}
