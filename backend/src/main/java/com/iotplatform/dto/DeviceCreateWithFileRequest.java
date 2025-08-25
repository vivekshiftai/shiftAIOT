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
    
    @Size(max = 50, message = "Firmware version must be less than 50 characters")
    private String firmware;
    
    // Status field
    private Device.DeviceStatus status;
    
    private List<String> tags;
    
    private Map<String, String> config;
    
    // Device specifications - Required fields
    @NotBlank(message = "Manufacturer is required")
    @Size(max = 100, message = "Manufacturer must be less than 100 characters")
    private String manufacturer;
    
    @NotBlank(message = "Model is required")
    @Size(max = 100, message = "Model must be less than 100 characters")
    private String model;
    
    @Size(max = 100, message = "Serial number must be less than 100 characters")
    private String serialNumber;
    
    @Pattern(regexp = "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$", message = "Invalid MAC address format (use XX:XX:XX:XX:XX:XX)")
    @Size(max = 17, message = "MAC address must be less than 17 characters")
    private String macAddress;
    
    @Pattern(regexp = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$", message = "Invalid IP address format")
    @Size(max = 45, message = "IP address must be less than 45 characters")
    private String ipAddress;
    
    @Min(value = 1, message = "Port must be between 1 and 65535")
    @Max(value = 65535, message = "Port must be between 1 and 65535")
    private Integer port;
    
    // Documentation URLs (for existing files)
    private String manualUrl;
    private String datasheetUrl;
    private String certificateUrl;
    
    // Additional metadata
    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;
    
    @Size(max = 2000, message = "Installation notes must be less than 2000 characters")
    private String installationNotes;
    
    @Size(max = 500, message = "Maintenance schedule must be less than 500 characters")
    private String maintenanceSchedule;
    
    @Size(max = 500, message = "Warranty info must be less than 500 characters")
    private String warrantyInfo;
    
    // Connectivity details
    @Size(max = 100, message = "WiFi SSID must be less than 100 characters")
    private String wifiSsid;
    
    @Size(max = 255, message = "WiFi password must be less than 255 characters")
    private String wifiPassword;
    
    @Size(max = 255, message = "MQTT broker must be less than 255 characters")
    private String mqttBroker;
    
    @Size(max = 255, message = "MQTT topic must be less than 255 characters")
    private String mqttTopic;
    
    @Size(max = 100, message = "MQTT username must be less than 100 characters")
    private String mqttUsername;
    
    @Size(max = 255, message = "MQTT password must be less than 255 characters")
    private String mqttPassword;
    
    // Power and environmental
    @Size(max = 50, message = "Power source must be less than 50 characters")
    private String powerSource;
    
    @Min(value = 0, message = "Power consumption must be positive")
    private Double powerConsumption;
    
    @Min(value = -273, message = "Operating temperature minimum must be above absolute zero")
    @Max(value = 1000, message = "Operating temperature minimum must be below 1000°C")
    private Double operatingTemperatureMin;
    
    @Min(value = -273, message = "Operating temperature maximum must be above absolute zero")
    @Max(value = 1000, message = "Operating temperature maximum must be below 1000°C")
    private Double operatingTemperatureMax;
    
    @Min(value = 0, message = "Operating humidity minimum must be positive")
    @Max(value = 100, message = "Operating humidity minimum must be below 100%")
    private Double operatingHumidityMin;
    
    @Min(value = 0, message = "Operating humidity maximum must be positive")
    @Max(value = 100, message = "Operating humidity maximum must be below 100%")
    private Double operatingHumidityMax;
    
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
    
    public String getFirmware() { return firmware; }
    public void setFirmware(String firmware) { this.firmware = firmware; }
    
    public Device.DeviceStatus getStatus() { return status; }
    public void setStatus(Device.DeviceStatus status) { this.status = status; }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
    
    public Map<String, String> getConfig() { return config; }
    public void setConfig(Map<String, String> config) { this.config = config; }
    
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    
    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }
    
    public String getMacAddress() { return macAddress; }
    public void setMacAddress(String macAddress) { this.macAddress = macAddress; }
    
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    
    public Integer getPort() { return port; }
    public void setPort(Integer port) { this.port = port; }
    
    public String getManualUrl() { return manualUrl; }
    public void setManualUrl(String manualUrl) { this.manualUrl = manualUrl; }
    
    public String getDatasheetUrl() { return datasheetUrl; }
    public void setDatasheetUrl(String datasheetUrl) { this.datasheetUrl = datasheetUrl; }
    
    public String getCertificateUrl() { return certificateUrl; }
    public void setCertificateUrl(String certificateUrl) { this.certificateUrl = certificateUrl; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getInstallationNotes() { return installationNotes; }
    public void setInstallationNotes(String installationNotes) { this.installationNotes = installationNotes; }
    
    public String getMaintenanceSchedule() { return maintenanceSchedule; }
    public void setMaintenanceSchedule(String maintenanceSchedule) { this.maintenanceSchedule = maintenanceSchedule; }
    
    public String getWarrantyInfo() { return warrantyInfo; }
    public void setWarrantyInfo(String warrantyInfo) { this.warrantyInfo = warrantyInfo; }
    
    public String getWifiSsid() { return wifiSsid; }
    public void setWifiSsid(String wifiSsid) { this.wifiSsid = wifiSsid; }
    
    public String getWifiPassword() { return wifiPassword; }
    public void setWifiPassword(String wifiPassword) { this.wifiPassword = wifiPassword; }
    
    public String getMqttBroker() { return mqttBroker; }
    public void setMqttBroker(String mqttBroker) { this.mqttBroker = mqttBroker; }
    
    public String getMqttTopic() { return mqttTopic; }
    public void setMqttTopic(String mqttTopic) { this.mqttTopic = mqttTopic; }
    
    public String getMqttUsername() { return mqttUsername; }
    public void setMqttUsername(String mqttUsername) { this.mqttUsername = mqttUsername; }
    
    public String getMqttPassword() { return mqttPassword; }
    public void setMqttPassword(String mqttPassword) { this.mqttPassword = mqttPassword; }
    
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
    
    public String getManualFileName() { return manualFileName; }
    public void setManualFileName(String manualFileName) { this.manualFileName = manualFileName; }
    
    public String getDatasheetFileName() { return datasheetFileName; }
    public void setDatasheetFileName(String datasheetFileName) { this.datasheetFileName = datasheetFileName; }
    
    public String getCertificateFileName() { return certificateFileName; }
    public void setCertificateFileName(String certificateFileName) { this.certificateFileName = certificateFileName; }
    
    public PDFResults getPdfResults() { return pdfResults; }
    public void setPdfResults(PDFResults pdfResults) { this.pdfResults = pdfResults; }
}
