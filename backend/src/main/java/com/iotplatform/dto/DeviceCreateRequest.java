package com.iotplatform.dto;

import java.util.List;
import java.util.Map;

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
    private DeviceType type;
    
    @NotBlank(message = "Device location is required")
    @Size(max = 200, message = "Location must be less than 200 characters")
    private String location;
    
    @NotNull(message = "Communication protocol is required")
    private Protocol protocol;
    
    @Size(max = 50, message = "Firmware version must be less than 50 characters")
    private String firmware;
    
    private List<String> tags;
    
    private Map<String, String> config;
    
    // Device specifications
    private String manufacturer;
    private String model;
    private String serialNumber;
    private String macAddress;
    private String ipAddress;
    private Integer port;
    
    // Documentation
    private String manualUrl;
    private String datasheetUrl;
    private String certificateUrl;
    
    // Additional metadata
    private String description;
    private String installationNotes;
    private String maintenanceSchedule;
    private String warrantyInfo;
    
    // Connectivity details
    private String wifiSsid;
    private String wifiPassword;
    private String mqttBroker;
    private String mqttTopic;
    private String mqttUsername;
    private String mqttPassword;
    
    // Power and environmental
    private String powerSource;
    private Double powerConsumption;
    private Double operatingTemperatureMin;
    private Double operatingTemperatureMax;
    private Double operatingHumidityMin;
    private Double operatingHumidityMax;
    
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
}
