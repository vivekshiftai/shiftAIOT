package com.iotplatform.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.dto.DeviceCreateRequest;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.repository.DeviceRepository;

@Service
public class DeviceService {

    private static final Logger logger = LoggerFactory.getLogger(DeviceService.class);

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private TelemetryService telemetryService;

    @Autowired
    private RuleService ruleService;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private PDFProcessingService pdfProcessingService;

    public List<Device> getAllDevices(String organizationId) {
        logger.info("DeviceService.getAllDevices called with organizationId: {}", organizationId);
        List<Device> devices = deviceRepository.findByOrganizationId(organizationId);
        logger.info("DeviceService.getAllDevices found {} devices for organization: {}", devices.size(), organizationId);
        return devices;
    }

    public List<Device> getDevicesByStatus(String organizationId, Device.DeviceStatus status) {
        return deviceRepository.findByOrganizationIdAndStatus(organizationId, status);
    }

    public List<Device> getDevicesByType(String organizationId, Device.DeviceType type) {
        return deviceRepository.findByOrganizationIdAndType(organizationId, type);
    }

    public List<Device> searchDevices(String organizationId, String search) {
        return deviceRepository.findByOrganizationIdAndSearch(organizationId, search);
    }

    public Optional<Device> getDevice(String id, String organizationId) {
        return deviceRepository.findByIdAndOrganizationId(id, organizationId);
    }

    public Device createDevice(Device device, String organizationId) {
        device.setId(UUID.randomUUID().toString());
        device.setOrganizationId(organizationId);
        // Set assigned user if provided
        if (device.getAssignedUserId() != null && !device.getAssignedUserId().trim().isEmpty()) {
            device.setAssignedUserId(device.getAssignedUserId());
        }
        // Use the status from the device if provided, otherwise default to ONLINE
        if (device.getStatus() == null) {
            device.setStatus(Device.DeviceStatus.ONLINE);
        }
        return deviceRepository.save(device);
    }

    public Device createDeviceFromRequest(DeviceCreateRequest request, String organizationId) {
        Device device = new Device();
        device.setId(UUID.randomUUID().toString());
        device.setOrganizationId(organizationId);
        
        // Set basic device information
        device.setName(request.getName());
        device.setType(request.getType());
        device.setLocation(request.getLocation());
        device.setProtocol(request.getProtocol());
        device.setStatus(request.getStatus());
        
        // Set optional basic device info
        device.setManufacturer(request.getManufacturer());
        device.setModel(request.getModel());
        device.setDescription(request.getDescription());
        
        // Set assigned user if provided
        if (request.getAssignedUserId() != null && !request.getAssignedUserId().trim().isEmpty()) {
            device.setAssignedUserId(request.getAssignedUserId());
        }
        
        // Set connection details
        device.setIpAddress(request.getIpAddress());
        device.setPort(request.getPort());
        
        // Set protocol-specific connection details
        switch (request.getProtocol()) {
            case MQTT:
                device.setMqttBroker(request.getMqttBroker());
                device.setMqttTopic(request.getMqttTopic());
                device.setMqttUsername(request.getMqttUsername());
                device.setMqttPassword(request.getMqttPassword());
                break;
            case HTTP:
                device.setHttpEndpoint(request.getHttpEndpoint());
                device.setHttpMethod(request.getHttpMethod());
                device.setHttpHeaders(request.getHttpHeaders());
                break;
            case COAP:
                device.setCoapHost(request.getCoapHost());
                device.setCoapPort(request.getCoapPort());
                device.setCoapPath(request.getCoapPath());
                break;
        }
        
        return deviceRepository.save(device);
    }

    public DeviceCreateResponse createDeviceWithFiles(DeviceCreateWithFileRequest request, 
                                                   MultipartFile manualFile, 
                                                   MultipartFile datasheetFile, 
                                                   MultipartFile certificateFile, 
                                                   String organizationId) throws IOException {
        
        // Create the device
        Device device = new Device();
        device.setId(UUID.randomUUID().toString());
        device.setOrganizationId(organizationId);
        // Use the status from the request if provided, otherwise default to ONLINE
        if (request.getStatus() != null) {
            device.setStatus(request.getStatus());
        } else {
            device.setStatus(Device.DeviceStatus.ONLINE);
        }
        
        // Set basic device information
        device.setName(request.getName());
        device.setType(request.getType());
        device.setLocation(request.getLocation());
        device.setProtocol(request.getProtocol());
        device.setFirmware(request.getFirmware());
        device.setTags(request.getTags());
        device.setConfig(request.getConfig());
        
        // Set device specifications
        device.setManufacturer(request.getManufacturer());
        device.setModel(request.getModel());
        device.setSerialNumber(request.getSerialNumber());
        device.setMacAddress(request.getMacAddress());
        device.setIpAddress(request.getIpAddress());
        device.setPort(request.getPort());
        
        // Set documentation URLs (if provided)
        device.setManualUrl(request.getManualUrl());
        device.setDatasheetUrl(request.getDatasheetUrl());
        device.setCertificateUrl(request.getCertificateUrl());
        
        // Set additional metadata
        device.setDescription(request.getDescription());
        device.setInstallationNotes(request.getInstallationNotes());
        device.setMaintenanceSchedule(request.getMaintenanceSchedule());
        device.setWarrantyInfo(request.getWarrantyInfo());
        
        // Set connectivity details
        device.setWifiSsid(request.getWifiSsid());
        device.setMqttBroker(request.getMqttBroker());
        device.setMqttTopic(request.getMqttTopic());
        
        // Set power and environmental details
        device.setPowerSource(request.getPowerSource());
        device.setPowerConsumption(request.getPowerConsumption());
        device.setOperatingTemperatureMin(request.getOperatingTemperatureMin());
        device.setOperatingTemperatureMax(request.getOperatingTemperatureMax());
        device.setOperatingHumidityMin(request.getOperatingHumidityMin());
        device.setOperatingHumidityMax(request.getOperatingHumidityMax());
        
        // Save the device first
        Device savedDevice = deviceRepository.save(device);
        
        // Handle file uploads
        boolean manualUploaded = false;
        boolean datasheetUploaded = false;
        boolean certificateUploaded = false;
        
        if (manualFile != null && !manualFile.isEmpty()) {
            try {
                String manualPath = fileStorageService.storeFile(manualFile, savedDevice.getId());
                savedDevice.setManualUrl(manualPath);
                manualUploaded = true;
            } catch (Exception e) {
                // Log error but continue with device creation
                System.err.println("Failed to upload manual file: " + e.getMessage());
            }
        }
        
        if (datasheetFile != null && !datasheetFile.isEmpty()) {
            try {
                String datasheetPath = fileStorageService.storeFile(datasheetFile, savedDevice.getId());
                savedDevice.setDatasheetUrl(datasheetPath);
                datasheetUploaded = true;
            } catch (Exception e) {
                // Log error but continue with device creation
                System.err.println("Failed to upload datasheet file: " + e.getMessage());
            }
        }
        
        if (certificateFile != null && !certificateFile.isEmpty()) {
            try {
                String certificatePath = fileStorageService.storeFile(certificateFile, savedDevice.getId());
                savedDevice.setCertificateUrl(certificatePath);
                certificateUploaded = true;
            } catch (Exception e) {
                // Log error but continue with device creation
                System.err.println("Failed to upload certificate file: " + e.getMessage());
            }
        }
        
        // Update device with file paths if files were uploaded
        if (manualUploaded || datasheetUploaded || certificateUploaded) {
            savedDevice = deviceRepository.save(savedDevice);
        }
        
        // Process PDF results if provided
        if (request.getPdfResults() != null) {
            try {
                pdfProcessingService.savePDFProcessingResults(savedDevice, request.getPdfResults());
                logger.info("PDF results processed and saved successfully for device: {}", savedDevice.getId());
            } catch (Exception e) {
                logger.error("Failed to process PDF results for device: {}", savedDevice.getId(), e);
                // Continue with device creation even if PDF processing fails
            }
        }
        
        // Create response
        DeviceCreateResponse response = new DeviceCreateResponse();
        response.setId(savedDevice.getId());
        response.setName(savedDevice.getName());
        response.setType(savedDevice.getType());
        response.setStatus(savedDevice.getStatus());
        response.setLocation(savedDevice.getLocation());
        response.setProtocol(savedDevice.getProtocol());
        response.setFirmware(savedDevice.getFirmware());
        response.setTags(savedDevice.getTags());
        response.setConfig(savedDevice.getConfig());
        response.setManufacturer(savedDevice.getManufacturer());
        response.setModel(savedDevice.getModel());
        response.setSerialNumber(savedDevice.getSerialNumber());
        response.setMacAddress(savedDevice.getMacAddress());
        response.setIpAddress(savedDevice.getIpAddress());
        response.setPort(savedDevice.getPort());
        response.setManualUrl(savedDevice.getManualUrl());
        response.setDatasheetUrl(savedDevice.getDatasheetUrl());
        response.setCertificateUrl(savedDevice.getCertificateUrl());
        response.setDescription(savedDevice.getDescription());
        response.setInstallationNotes(savedDevice.getInstallationNotes());
        response.setMaintenanceSchedule(savedDevice.getMaintenanceSchedule());
        response.setWarrantyInfo(savedDevice.getWarrantyInfo());
        response.setWifiSsid(savedDevice.getWifiSsid());
        response.setMqttBroker(savedDevice.getMqttBroker());
        response.setMqttTopic(savedDevice.getMqttTopic());
        response.setPowerSource(savedDevice.getPowerSource());
        response.setPowerConsumption(savedDevice.getPowerConsumption());
        response.setOperatingTemperatureMin(savedDevice.getOperatingTemperatureMin());
        response.setOperatingTemperatureMax(savedDevice.getOperatingTemperatureMax());
        response.setOperatingHumidityMin(savedDevice.getOperatingHumidityMin());
        response.setOperatingHumidityMax(savedDevice.getOperatingHumidityMax());
        response.setCreatedAt(savedDevice.getCreatedAt());
        response.setUpdatedAt(savedDevice.getUpdatedAt());
        response.setManualUploaded(manualUploaded);
        response.setDatasheetUploaded(datasheetUploaded);
        response.setCertificateUploaded(certificateUploaded);
        
        return response;
    }
    
    private void processPDFResults(Device device, DeviceCreateWithFileRequest.PDFResults pdfResults) {
        logger.info("Processing PDF results for device: {}", device.getId());
        
        try {
            // Save all PDF processing results to the database using PDFProcessingService
            pdfProcessingService.savePDFProcessingResults(device, pdfResults);
            
            // Store PDF processing metadata in device config
            Map<String, String> deviceConfig = device.getConfig();
            if (deviceConfig == null) {
                deviceConfig = new HashMap<>();
            }
            
            deviceConfig.put("pdf_processed", "true");
            deviceConfig.put("pdf_filename", pdfResults.getPdfFilename());
            deviceConfig.put("processing_summary", pdfResults.getProcessingSummary());
            deviceConfig.put("iot_rules_count", String.valueOf(pdfResults.getIotRules() != null ? pdfResults.getIotRules().size() : 0));
            deviceConfig.put("maintenance_items_count", String.valueOf(pdfResults.getMaintenanceData() != null ? pdfResults.getMaintenanceData().size() : 0));
            deviceConfig.put("safety_precautions_count", String.valueOf(pdfResults.getSafetyPrecautions() != null ? pdfResults.getSafetyPrecautions().size() : 0));
            
            device.setConfig(deviceConfig);
            deviceRepository.save(device);
            
            logger.info("PDF results processing completed for device: {}", device.getId());
            
        } catch (Exception e) {
            logger.error("Error processing PDF results for device: {}", device.getId(), e);
            throw new RuntimeException("Failed to process PDF results", e);
        }
    }
    


    public Device updateDevice(String id, Device deviceDetails, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setName(deviceDetails.getName());
        device.setType(deviceDetails.getType());
        device.setLocation(deviceDetails.getLocation());
        device.setProtocol(deviceDetails.getProtocol());
        device.setFirmware(deviceDetails.getFirmware());
        device.setTags(deviceDetails.getTags());
        device.setConfig(deviceDetails.getConfig());

        return deviceRepository.save(device);
    }

    public void deleteDevice(String id, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        deviceRepository.delete(device);
    }

    public Device updateDeviceStatus(String id, Device.DeviceStatus status, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setStatus(status);
        device.setLastSeen(LocalDateTime.now());
        return deviceRepository.save(device);
    }

    public void processTelemetryData(String deviceId, TelemetryDataRequest telemetryData, String organizationId) {
        // Update device with latest telemetry
        Device device = deviceRepository.findByIdAndOrganizationId(deviceId, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setLastSeen(LocalDateTime.now());
        if (telemetryData.getMetrics().containsKey("temperature")) {
            device.setTemperature(telemetryData.getMetrics().get("temperature"));
        }
        if (telemetryData.getMetrics().containsKey("humidity")) {
            device.setHumidity(telemetryData.getMetrics().get("humidity"));
        }
        if (telemetryData.getMetrics().containsKey("batteryLevel")) {
            device.setBatteryLevel(telemetryData.getMetrics().get("batteryLevel").intValue());
        }

        deviceRepository.save(device);

        // Store telemetry data
        telemetryService.storeTelemetryData(deviceId, telemetryData);

        // Evaluate rules
        ruleService.evaluateRules(deviceId, telemetryData, organizationId);
    }

    public DeviceStatsResponse getDeviceStats(String organizationId) {
        long total = deviceRepository.findByOrganizationId(organizationId).size();
        long online = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.ONLINE);
        long offline = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.OFFLINE);
        long warning = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.WARNING);
        long error = deviceRepository.countByOrganizationIdAndStatus(organizationId, Device.DeviceStatus.ERROR);

        return new DeviceStatsResponse(total, online, offline, warning, error);
    }
}