package com.iotplatform.service;

import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class DatabaseMigrationService implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseMigrationService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        logger.info("🚀 Starting database migration and initialization...");
        
        // Ensure default users exist
        ensureDefaultUsersExist();
        
        logger.info("✅ Database migration and initialization completed");
    }

    private void ensureDefaultUsersExist() {
        logger.info("👥 Ensuring default users exist in database...");
        
        // Create default admin user if not exists
        ensureUserExists(
            "admin@shiftaiot.com",
            "Admin",
            "User",
            "admin123",
            User.Role.ADMIN,
            "shiftAIOT-org-2024"
        );
        
        // Create default regular user if not exists
        ensureUserExists(
            "user@shiftaiot.com",
            "Regular",
            "User",
            "user123",
            User.Role.USER,
            "shiftAIOT-org-2024"
        );
        
        logger.info("✅ Default users check completed");
    }

    private void ensureUserExists(String email, String firstName, String lastName, 
                                String password, User.Role role, String organizationId) {
        try {
            Optional<User> existingUser = userRepository.findByEmail(email);
            
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                logger.info("✅ User already exists: {} (ID: {}, Role: {})", 
                           email, user.getId(), user.getRole());
                
                // Update user if needed
                boolean updated = false;
                
                if (!user.getFirstName().equals(firstName)) {
                    user.setFirstName(firstName);
                    updated = true;
                }
                
                if (!user.getLastName().equals(lastName)) {
                    user.setLastName(lastName);
                    updated = true;
                }
                
                if (user.getRole() != role) {
                    user.setRole(role);
                    updated = true;
                }
                
                if (!user.getOrganizationId().equals(organizationId)) {
                    user.setOrganizationId(organizationId);
                    updated = true;
                }
                
                if (!user.isEnabled()) {
                    user.setEnabled(true);
                    updated = true;
                }
                
                if (updated) {
                    user.setUpdatedAt(LocalDateTime.now());
                    userRepository.save(user);
                    logger.info("✅ Updated user: {}", email);
                }
                
            } else {
                // Create new user
                User newUser = new User();
                newUser.setId(java.util.UUID.randomUUID().toString());
                newUser.setFirstName(firstName);
                newUser.setLastName(lastName);
                newUser.setEmail(email);
                newUser.setPassword(passwordEncoder.encode(password));
                newUser.setRole(role);
                newUser.setOrganizationId(organizationId);
                newUser.setEnabled(true);
                newUser.setCreatedAt(LocalDateTime.now());
                newUser.setUpdatedAt(LocalDateTime.now());
                
                User savedUser = userRepository.save(newUser);
                logger.info("✅ Created new user: {} (ID: {}, Role: {})", 
                           email, savedUser.getId(), savedUser.getRole());
            }
            
        } catch (Exception e) {
            logger.error("❌ Error ensuring user exists: {}", email, e);
        }
    }
}
