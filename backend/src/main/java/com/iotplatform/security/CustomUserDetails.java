package com.iotplatform.security;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.iotplatform.model.User;

public class CustomUserDetails implements UserDetails {
    
    private final User user;
    
    public CustomUserDetails(User user) {
        this.user = user;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        
        // Add permissions based on role
        if (user.getRole() == User.Role.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("DEVICE_READ"));
            authorities.add(new SimpleGrantedAuthority("DEVICE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("DEVICE_DELETE"));
            authorities.add(new SimpleGrantedAuthority("RULE_READ"));
            authorities.add(new SimpleGrantedAuthority("RULE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("RULE_DELETE"));
            // Maintenance permissions for admins
            authorities.add(new SimpleGrantedAuthority("MAINTENANCE_READ"));
            authorities.add(new SimpleGrantedAuthority("MAINTENANCE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("MAINTENANCE_DELETE"));
            authorities.add(new SimpleGrantedAuthority("USER_READ"));
            authorities.add(new SimpleGrantedAuthority("USER_WRITE"));
            authorities.add(new SimpleGrantedAuthority("USER_DELETE"));
            authorities.add(new SimpleGrantedAuthority("NOTIFICATION_READ"));
            authorities.add(new SimpleGrantedAuthority("NOTIFICATION_WRITE"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_READ"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_DELETE"));
        } else {
            // Regular user can only read
            authorities.add(new SimpleGrantedAuthority("DEVICE_READ"));
            authorities.add(new SimpleGrantedAuthority("RULE_READ"));
            // Allow regular users to read and create/update maintenance tasks
            authorities.add(new SimpleGrantedAuthority("MAINTENANCE_READ"));
            authorities.add(new SimpleGrantedAuthority("MAINTENANCE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("NOTIFICATION_READ"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_READ"));
        }
        
        return authorities;
    }
    
    @Override
    public String getPassword() {
        return user.getPassword();
    }
    
    @Override
    public String getUsername() {
        return user.getEmail();
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return user.isEnabled();
    }
    
    public User getUser() {
        return user;
    }
}
