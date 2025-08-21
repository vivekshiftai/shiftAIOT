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
    @Column(name = "type", nullable = false)
    private DeviceType type = DeviceType.SENSOR;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private DeviceStatus status = DeviceStatus.OFFLINE;

    @NotBlank
    @Size(max = 200)
    @Column(name = "location", nullable = false)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "protocol", nullable = false)
    private Protocol protocol = Protocol.HTTP;

    @Column(name = "organization_id", nullable = false)
    private String organizationId;

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

    // Legacy fields (kept for backward compatibility, nullable)
    @Size(max = 50)
    @Column(name = "firmware")
    private String firmware;

    @Column(name = "last_seen")
    private LocalDateTime lastSeen;

    @Column(name = "battery_level")
    private Integer batteryLevel;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "humidity")
    private Double humidity;

    @Size(max = 100)
    @Column(name = "serial_number")
    private String serialNumber;

    @Size(max = 17)
    @Column(name = "mac_address")
    private String macAddress;

    @Size(max = 500)
    @Column(name = "manual_url")
    private String manualUrl;

    @Size(max = 500)
    @Column(name = "datasheet_url")
    private String datasheetUrl;

    @Size(max = 500)
    @Column(name = "certificate_url")
    private String certificateUrl;

    @Column(name = "installation_notes", columnDefinition = "TEXT")
    private String installationNotes;

    @Size(max = 500)
    @Column(name = "maintenance_schedule")
    private String maintenanceSchedule;

    @Size(max = 500)
    @Column(name = "warranty_info")
    private String warrantyInfo;

    @Size(max = 100)
    @Column(name = "wifi_ssid")
    private String wifiSsid;

    @Size(max = 50)
    @Column(name = "power_source")
    private String powerSource;

    @Column(name = "power_consumption")
    private Double powerConsumption;

    @Column(name = "operating_temperature_min")
    private Double operatingTemperatureMin;

    @Column(name = "operating_temperature_max")
    private Double operatingTemperatureMax;

    @Column(name = "operating_humidity_min")
    private Double operatingHumidityMin;

    @Column(name = "operating_humidity_max")
    private Double operatingHumidityMax;

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
        SENSOR, ACTUATOR, GATEWAY, CONTROLLER
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
        lastSeen = LocalDateTime.now();
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

    // Legacy fields getters and setters
    public String getFirmware() { return firmware; }
    public void setFirmware(String firmware) { this.firmware = firmware; }

    public LocalDateTime getLastSeen() { return lastSeen; }
    public void setLastSeen(LocalDateTime lastSeen) { 
        logger.debug("Device {} last seen updated to: {}", id, lastSeen);
        this.lastSeen = lastSeen; 
    }

    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Double getHumidity() { return humidity; }
    public void setHumidity(Double humidity) { this.humidity = humidity; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }

    public String getManualUrl() { return manualUrl; }
    public void setManualUrl(String manualUrl) { this.manualUrl = manualUrl; }

    public String getDatasheetUrl() { return datasheetUrl; }
    public void setDatasheetUrl(String datasheetUrl) { this.datasheetUrl = datasheetUrl; }

    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }

    public String getInstallationNotes() { return installationNotes; }
    public void setInstallationNotes(String installationNotes) { this.installationNotes = installationNotes; }

    public String getMaintenanceSchedule() { return maintenanceSchedule; }
    public void setMaintenanceSchedule(String maintenanceSchedule) { this.maintenanceSchedule = maintenanceSchedule; }

    public String getWarrantyInfo() { return warrantyInfo; }
    public void setWarrantyInfo(String warrantyInfo) { this.warrantyInfo = warrantyInfo; }

    public String getWifiSsid() { return wifiSsid; }
    public void setWifiSsid(String wifiSsid) { this.wifiSsid = wifiSsid; }

    public String getPowerSource() { return powerSource; }
    public void setPowerSource(String powerSource) { this.powerSource = powerSource; }

    public Double getPowerConsumption() { return powerConsumption; }
    public void setPowerConsumption(Double powerConsumption) { this.powerConsumption = powerConsumption; }

    public Double getOperatingTemperatureMin() { return operatingTemperatureMin; }
    public void setOperatingTemperatureMin(Double operatingTemperatureMin) { this.operatingTemperatureMin = operatingTemperatureMin; }

    public Double getOperatingTemperatureMax() { return operatingTemperatureMax; }
    public void setOperatingTemperatureMax(Double operatingTemperatureMax) { this.operatingTemperatureMax = operatingTemperatureMax; }

    public Double getOperatingHumidityMin() { return operatingHumidityMin; }
    public void setOperatingHumidityMin(Double operatingHumidityMin) { this.operatingHumidityMin = operatingHumidityMin; }

    public Double getOperatingHumidityMax() { return operatingHumidityMax; }
    public void setOperatingHumidityMax(Double operatingHumidityMax) { this.operatingHumidityMax = operatingHumidityMax; }

    // Collections getters and setters
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public Map<String, String> getConfig() { return config; }
    public void setConfig(Map<String, String> config) { this.config = config; }
}