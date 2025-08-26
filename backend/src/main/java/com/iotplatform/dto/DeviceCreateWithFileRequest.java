package com.iotplatform.dto;

import java.util.List;
import java.util.Map;

import com.iotplatform.model.Device;
import com.iotplatform.model.Device.DeviceType;
import com.iotplatform.model.Device.Protocol;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

public class DeviceCreateWithFileRequest {
    
    @NotBlank(message = "Device name is required")
    @Size(max = 100, message = "Device name must be less than 100 characters")
    private String name;
    
    @NotNull(message = "Device type is required")
    private DeviceType type;
    
    @NotBlank(message = "Device location is required")
    @Size(max = 200, message = "Location must be less than 200 characters")
    private String location;
    
    @NotNull(message = "Communication protocol is required")
    private Protocol protocol;
    
    // Status field
    private Device.DeviceStatus status;
    
    // Basic device info (optional)
    @Size(max = 100, message = "Manufacturer must be less than 100 characters")
    private String manufacturer;
    
    @Size(max = 100, message = "Model must be less than 100 characters")
    private String model;
    
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;
    
    // Connection details (optional)
    @Pattern(regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$", message = "Invalid IP address format")
    @Size(max = 45, message = "IP address must be less than 45 characters")
    private String ipAddress;
    
    @Min(value = 1, message = "Port must be between 1 and 65535")
    @Max(value = 65535, message = "Port must be between 1 and 65535")
    private Integer port;
    
    // MQTT specific fields (optional)
    @Size(max = 255, message = "MQTT broker must be less than 255 characters")
    private String mqttBroker;
    
    @Size(max = 255, message = "MQTT topic must be less than 255 characters")
    private String mqttTopic;
    
    @Size(max = 100, message = "MQTT username must be less than 100 characters")
    private String mqttUsername;
    
    @Size(max = 255, message = "MQTT password must be less than 255 characters")
    private String mqttPassword;
    
    // HTTP specific fields (optional)
    @Size(max = 500, message = "HTTP endpoint must be less than 500 characters")
    private String httpEndpoint;
    
    @Size(max = 10, message = "HTTP method must be less than 10 characters")
    private String httpMethod;
    
    private String httpHeaders;
    
    // COAP specific fields (optional)
    @Size(max = 255, message = "COAP host must be less than 255 characters")
    private String coapHost;
    
    private Integer coapPort;
    
    @Size(max = 255, message = "COAP path must be less than 255 characters")
    private String coapPath;
    
    // Collections (optional)
    private List<String> tags;
    private Map<String, String> config;
    
    // User assignment (optional)
    private String assignedUserId;
    
    // File upload information
    private String manualFileName;
    private String datasheetFileName;
    private String certificateFileName;
    
    // PDF Processing Results
    private PDFResults pdfResults;
    
    // Inner class for PDF results
    public static class PDFResults {
        private List<IoTRule> iotRules;
        private List<MaintenanceData> maintenanceData;
        private List<SafetyPrecaution> safetyPrecautions;
        private String pdfFilename;
        private String processingSummary;
        
        // Getters and Setters
        public List<IoTRule> getIotRules() { return iotRules; }
        public void setIotRules(List<IoTRule> iotRules) { this.iotRules = iotRules; }
        
        public List<MaintenanceData> getMaintenanceData() { return maintenanceData; }
        public void setMaintenanceData(List<MaintenanceData> maintenanceData) { this.maintenanceData = maintenanceData; }
        
        public List<SafetyPrecaution> getSafetyPrecautions() { return safetyPrecautions; }
        public void setSafetyPrecautions(List<SafetyPrecaution> safetyPrecautions) { this.safetyPrecautions = safetyPrecautions; }
        
        public String getPdfFilename() { return pdfFilename; }
        public void setPdfFilename(String pdfFilename) { this.pdfFilename = pdfFilename; }
        
        public String getProcessingSummary() { return processingSummary; }
        public void setProcessingSummary(String processingSummary) { this.processingSummary = processingSummary; }
    }
    
    // Inner classes for PDF results data
    public static class IoTRule {
        private String deviceName;
        private String ruleType;
        private String condition;
        private String action;
        private String priority;
        private String frequency;
        private String description;
        
        // Getters and Setters
        public String getDeviceName() { return deviceName; }
        public void setDeviceName(String deviceName) { this.deviceName = deviceName; }
        
        public String getRuleType() { return ruleType; }
        public void setRuleType(String ruleType) { this.ruleType = ruleType; }
        
        public String getCondition() { return condition; }
        public void setCondition(String condition) { this.condition = condition; }
        
        public String getAction() { return action; }
        public void setAction(String action) { this.action = action; }
        
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        
        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
    
    public static class MaintenanceData {
        private String componentName;
        private String maintenanceType;
        private String frequency;
        private String lastMaintenance;
        private String nextMaintenance;
        private String description;
        
        // Getters and Setters
        public String getComponentName() { return componentName; }
        public void setComponentName(String componentName) { this.componentName = componentName; }
        
        public String getMaintenanceType() { return maintenanceType; }
        public void setMaintenanceType(String maintenanceType) { this.maintenanceType = maintenanceType; }
        
        public String getFrequency() { return frequency; }
        public void setFrequency(String frequency) { this.frequency = frequency; }
        
        public String getLastMaintenance() { return lastMaintenance; }
        public void setLastMaintenance(String lastMaintenance) { this.lastMaintenance = lastMaintenance; }
        
        public String getNextMaintenance() { return nextMaintenance; }
        public void setNextMaintenance(String nextMaintenance) { this.nextMaintenance = nextMaintenance; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
    
    public static class SafetyPrecaution {
        private String id;
        private String title;
        private String description;
        private String severity;
        private String category;
        private String recommendedAction;
        
        // Getters and Setters
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        
        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }
        
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        
        public String getRecommendedAction() { return recommendedAction; }
        public void setRecommendedAction(String recommendedAction) { this.recommendedAction = recommendedAction; }
    }
    
    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public DeviceType getType() { return type; }
    public void setType(DeviceType type) { this.type = type; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public Protocol getProtocol() { return protocol; }
    public void setProtocol(Protocol protocol) { this.protocol = protocol; }
    
    public Device.DeviceStatus getStatus() { return status; }
    public void setStatus(Device.DeviceStatus status) { this.status = status; }
    
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
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    
    public Map<String, String> getConfig() { return config; }
    public void setConfig(Map<String, String> config) { this.config = config; }
    
    public String getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(String assignedUserId) { this.assignedUserId = assignedUserId; }
    
    public String getManualFileName() { return manualFileName; }
    public void setManualFileName(String manualFileName) { this.manualFileName = manualFileName; }
    
    public String getDatasheetFileName() { return datasheetFileName; }
    public void setDatasheetFileName(String datasheetFileName) { this.datasheetFileName = datasheetFileName; }
    
    public String getCertificateFileName() { return certificateFileName; }
    public void setCertificateFileName(String certificateFileName) { this.certificateFileName = certificateFileName; }
    
    public PDFResults getPdfResults() { return pdfResults; }
    public void setPdfResults(PDFResults pdfResults) { this.pdfResults = pdfResults; }
}
