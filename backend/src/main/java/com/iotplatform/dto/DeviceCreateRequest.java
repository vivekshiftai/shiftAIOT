package com.iotplatform.dto;

import com.iotplatform.model.Device;
import com.iotplatform.model.Device.DeviceType;
import com.iotplatform.model.Device.Protocol;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class DeviceCreateRequest {
    
    @NotBlank(message = "Device name is required")
    @Size(max = 100, message = "Device name must be less than 100 characters")
    private String name;
    
    @NotNull(message = "Device type is required")
    private DeviceType type = DeviceType.SENSOR;
    
    @NotBlank(message = "Device location is required")
    @Size(max = 200, message = "Location must be less than 200 characters")
    private String location;
    
    @NotNull(message = "Communication protocol is required")
    private Protocol protocol = Protocol.HTTP;
    
    // Basic device info (optional)
    private String manufacturer;
    private String model;
    private String description;
    
    // Connection details (optional)
    private String ipAddress;
    private Integer port;
    
    // MQTT specific fields (optional)
    private String mqttBroker;
    private String mqttTopic;
    private String mqttUsername;
    private String mqttPassword;
    
    // HTTP specific fields (optional)
    private String httpEndpoint;
    private String httpMethod = "GET";
    private String httpHeaders;
    
    // COAP specific fields (optional)
    private String coapHost;
    private Integer coapPort;
    private String coapPath;
    
    // Status field (optional)
    private Device.DeviceStatus status = Device.DeviceStatus.ONLINE;
    
    // Assigned user field (optional)
    private String assignedUserId;
    
    // Assigned by field (optional)
    private String assignedBy;
    
    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public DeviceType getType() { return type; }
    public void setType(DeviceType type) { this.type = type; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public Protocol getProtocol() { return protocol; }
    public void setProtocol(Protocol protocol) { this.protocol = protocol; }
    
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    
    public String getMqttBroker() { return mqttBroker; }
    public void setMqttBroker(String mqttBroker) { this.mqttBroker = mqttBroker; }
    
    public String getMqttTopic() { return mqttTopic; }
    public void setMqttTopic(String mqttTopic) { this.mqttTopic = mqttTopic; }
    
    public String getMqttUsername() { return mqttUsername; }
    public void setMqttUsername(String mqttUsername) { this.mqttUsername = mqttUsername; }
    
    public String getMqttPassword() { return mqttPassword; }
    public void setMqttPassword(String mqttPassword) { this.mqttPassword = mqttPassword; }
    
    public String getHttpEndpoint() { return httpEndpoint; }
    public void setHttpEndpoint(String httpEndpoint) { this.httpEndpoint = httpEndpoint; }
    
    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }
    
    public String getHttpHeaders() { return httpHeaders; }
    public void setHttpHeaders(String httpHeaders) { this.httpHeaders = httpHeaders; }
    
    public String getCoapHost() { return coapHost; }
    public void setCoapHost(String coapHost) { this.coapHost = coapHost; }
    
    public Integer getCoapPort() { return coapPort; }
    public void setCoapPort(Integer coapPort) { this.coapPort = coapPort; }
    
    public String getCoapPath() { return coapPath; }
    public void setCoapPath(String coapPath) { this.coapPath = coapPath; }
    
    public Device.DeviceStatus getStatus() { return status; }
    public void setStatus(Device.DeviceStatus status) { this.status = status; }
    
    public String getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(String assignedUserId) { this.assignedUserId = assignedUserId; }
    
    public String getAssignedBy() { return assignedBy; }
    public void setAssignedBy(String assignedBy) { this.assignedBy = assignedBy; }
}
