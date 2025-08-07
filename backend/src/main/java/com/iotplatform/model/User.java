package com.iotplatform.model;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
public class User implements UserDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Size(max = 50)
    @Column(name = "first_name", nullable = false)
    private String firstName;

    @NotBlank
    @Size(max = 50)
    @Column(name = "last_name", nullable = false)
    private String lastName;

    @NotBlank
    @Size(max = 100)
    @Email
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @NotBlank
    @Size(max = 120)
    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role = Role.USER;

    @Column(name = "organization_id", nullable = false)
    private String organizationId;

    @Column(name = "enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    // IoT Device Connection Settings
    @Column(name = "mqtt_broker_url")
    private String mqttBrokerUrl;

    @Column(name = "mqtt_username")
    private String mqttUsername;

    @Column(name = "mqtt_password")
    private String mqttPassword;

    @Column(name = "api_key")
    private String apiKey;

    @Column(name = "webhook_url")
    private String webhookUrl;

    @Column(name = "connection_type")
    @Enumerated(EnumType.STRING)
    private ConnectionType connectionType = ConnectionType.MQTT;

    public enum Role {
        ADMIN, USER
    }

    public enum ConnectionType {
        MQTT, HTTP, WEBSOCKET, COAP
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    @Override
    public Set<GrantedAuthority> getAuthorities() {
        Set<GrantedAuthority> authorities = new HashSet<>();
        
        // Add role-based authorities
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        
        // Add specific permissions based on role
        if (role == Role.ADMIN) {
            authorities.add(new SimpleGrantedAuthority("DEVICE_READ"));
            authorities.add(new SimpleGrantedAuthority("DEVICE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("DEVICE_DELETE"));
            authorities.add(new SimpleGrantedAuthority("RULE_READ"));
            authorities.add(new SimpleGrantedAuthority("RULE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("RULE_DELETE"));
            authorities.add(new SimpleGrantedAuthority("USER_READ"));
            authorities.add(new SimpleGrantedAuthority("USER_WRITE"));
            authorities.add(new SimpleGrantedAuthority("USER_DELETE"));
            authorities.add(new SimpleGrantedAuthority("NOTIFICATION_READ"));
            authorities.add(new SimpleGrantedAuthority("NOTIFICATION_WRITE"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_READ"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_WRITE"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_DELETE"));
        } else {
            authorities.add(new SimpleGrantedAuthority("DEVICE_READ"));
            authorities.add(new SimpleGrantedAuthority("RULE_READ"));
            authorities.add(new SimpleGrantedAuthority("NOTIFICATION_READ"));
            authorities.add(new SimpleGrantedAuthority("KNOWLEDGE_READ"));
        }
        
        return authorities;
    }

    @Override
    public String getUsername() {
        return email;
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
        return enabled;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getFullName() { return firstName + " " + lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    // IoT Connection Settings
    public String getMqttBrokerUrl() { return mqttBrokerUrl; }
    public void setMqttBrokerUrl(String mqttBrokerUrl) { this.mqttBrokerUrl = mqttBrokerUrl; }

    public String getMqttUsername() { return mqttUsername; }
    public void setMqttUsername(String mqttUsername) { this.mqttUsername = mqttUsername; }

    public String getMqttPassword() { return mqttPassword; }
    public void setMqttPassword(String mqttPassword) { this.mqttPassword = mqttPassword; }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }

    public String getWebhookUrl() { return webhookUrl; }
    public void setWebhookUrl(String webhookUrl) { this.webhookUrl = webhookUrl; }

    public ConnectionType getConnectionType() { return connectionType; }
    public void setConnectionType(ConnectionType connectionType) { this.connectionType = connectionType; }
}