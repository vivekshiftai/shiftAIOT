package com.iotplatform.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Entity
@Table(name = "devices")
public class Device {
    
    private static final Logger logger = LoggerFactory.getLogger(Device.class);
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private DeviceType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DeviceStatus status = DeviceStatus.ONLINE;

    @NotBlank
    @Size(max = 200)
    @Column(name = "location", nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "protocol", nullable = false)
    private Protocol protocol = Protocol.HTTP;

    @Column(name = "organization_id", nullable = false)
    private String organizationId;

    @Column(name = "assigned_user_id")
    private String assignedUserId;

    @Column(name = "assigned_by")
    private String assignedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Basic device info (nullable)
    @Size(max = 100)
    @Column(name = "manufacturer")
    private String manufacturer;

    @Size(max = 100)
    @Column(name = "model")
    private String model;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Connection details (nullable)
    @Size(max = 45)
    @Column(name = "ip_address")
    private String ipAddress;

    @Min(value = 1, message = "Port must be between 1 and 65535")
    @Max(value = 65535, message = "Port must be between 1 and 65535")
    @Column(name = "port")
    private Integer port;

    // MQTT specific fields (nullable)
    @Size(max = 255)
    @Column(name = "mqtt_broker")
    private String mqttBroker;

    @Size(max = 255)
    @Column(name = "mqtt_topic")
    private String mqttTopic;

    @Size(max = 100)
    @Column(name = "mqtt_username")
    private String mqttUsername;

    @Size(max = 255)
    @Column(name = "mqtt_password")
    private String mqttPassword;

    // HTTP specific fields (nullable)
    @Size(max = 500)
    @Column(name = "http_endpoint")
    private String httpEndpoint;

    @Size(max = 10)
    @Column(name = "http_method")
    private String httpMethod = "GET";

    @Column(name = "http_headers", columnDefinition = "TEXT")
    private String httpHeaders;

    // COAP specific fields (nullable)
    @Size(max = 255)
    @Column(name = "coap_host")
    private String coapHost;

    @Column(name = "coap_port")
    private Integer coapPort;

    @Size(max = 255)
    @Column(name = "coap_path")
    private String coapPath;

    // Collections (nullable)
    @ElementCollection
    @CollectionTable(name = "device_tags", joinColumns = @JoinColumn(name = "device_id"))
    @Column(name = "tag")
    private List<String> tags;

    @ElementCollection
    @CollectionTable(name = "device_config", joinColumns = @JoinColumn(name = "device_id"))
    @MapKeyColumn(name = "config_key")
    @Column(name = "config_value")
    private Map<String, String> config;

    public enum DeviceType {
        SENSOR, ACTUATOR, GATEWAY, CONTROLLER, MACHINE
    }

    public enum DeviceStatus {
        ONLINE, OFFLINE, WARNING, ERROR
    }

    public enum Protocol {
        MQTT, HTTP, COAP
    }

    @PrePersist
    protected void onCreate() {
        logger.debug("Creating new device: {}", name);
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        logger.debug("Updating device: {}", id);
        updatedAt = LocalDateTime.now();
    }

    @PostLoad
    protected void onLoad() {
        logger.debug("Loaded device from PostgreSQL: {}", id);
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public DeviceType getType() { return type; }
    public void setType(DeviceType type) { this.type = type; }

    public DeviceStatus getStatus() { return status; }
    public void setStatus(DeviceStatus status) { 
        logger.info("Device {} status changed from {} to {}", id, this.status, status);
        this.status = status; 
    }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public Protocol getProtocol() { return protocol; }
    public void setProtocol(Protocol protocol) { this.protocol = protocol; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }

    public String getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(String assignedUserId) { this.assignedUserId = assignedUserId; }

    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Basic device info getters and setters
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // Connection details getters and setters
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }

    // MQTT specific getters and setters
    public String getMqttBroker() { return mqttBroker; }
    public void setMqttBroker(String mqttBroker) { this.mqttBroker = mqttBroker; }

    public String getMqttTopic() { return mqttTopic; }
    public void setMqttTopic(String mqttTopic) { this.mqttTopic = mqttTopic; }

    public String getMqttUsername() { return mqttUsername; }
    public void setMqttUsername(String mqttUsername) { this.mqttUsername = mqttUsername; }

    public String getMqttPassword() { return mqttPassword; }
    public void setMqttPassword(String mqttPassword) { this.mqttPassword = mqttPassword; }

    // HTTP specific getters and setters
    public String getHttpEndpoint() { return httpEndpoint; }
    public void setHttpEndpoint(String httpEndpoint) { this.httpEndpoint = httpEndpoint; }

    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }

    public String getHttpHeaders() { return httpHeaders; }
    public void setHttpHeaders(String httpHeaders) { this.httpHeaders = httpHeaders; }

    // COAP specific getters and setters
    public String getCoapHost() { return coapHost; }
    public void setCoapHost(String coapHost) { this.coapHost = coapHost; }

    public Integer getCoapPort() { return coapPort; }
    public void setCoapPort(Integer coapPort) { this.coapPort = coapPort; }

    public String getCoapPath() { return coapPath; }
    public void setCoapPath(String coapPath) { this.coapPath = coapPath; }

    // Collections getters and setters
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Map<String, String> getConfig() { return config; }
    public void setConfig(Map<String, String> config) { this.config = config; }
}