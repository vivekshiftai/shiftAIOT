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
import org.springframework.transaction.annotation.Transactional;

import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.dto.DeviceCreateRequest;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.repository.DeviceRepository;
import com.iotplatform.model.Rule;
import com.iotplatform.repository.RuleRepository;
import com.iotplatform.model.RuleCondition;
import com.iotplatform.repository.RuleConditionRepository;
import com.iotplatform.model.RuleAction;
import com.iotplatform.repository.RuleActionRepository;
import com.iotplatform.service.DeviceConnectionService;
import com.iotplatform.model.DeviceDocumentation;
import com.iotplatform.repository.DeviceDocumentationRepository;
import com.iotplatform.model.PDFQuery;
import com.iotplatform.repository.PDFQueryRepository;
import com.iotplatform.model.Notification;
import com.iotplatform.repository.NotificationRepository;
import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import com.iotplatform.service.DeviceSafetyPrecautionService;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.repository.DeviceMaintenanceRepository;


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

    @Autowired
    private DeviceConnectionService deviceConnectionService;

    @Autowired
    private DeviceSafetyPrecautionService deviceSafetyPrecautionService;

    @Autowired
    private DeviceMaintenanceRepository deviceMaintenanceRepository;

    @Autowired
    private RuleRepository ruleRepository;

    @Autowired
    private RuleConditionRepository ruleConditionRepository;

    @Autowired
    private RuleActionRepository ruleActionRepository;

    @Autowired
    private DeviceDocumentationRepository deviceDocumentationRepository;

    @Autowired
    private PDFQueryRepository pdfQueryRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private MaintenanceScheduleRepository maintenanceScheduleRepository;


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

    /**
     * Create device without storing PDF files in our database
     * PDF files will be sent directly to PDF Processing Service
     */
    public DeviceCreateResponse createDeviceWithoutFiles(DeviceCreateWithFileRequest request, 
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
        device.setTags(request.getTags());
        device.setConfig(request.getConfig());
        
        // Set device specifications
        device.setManufacturer(request.getManufacturer());
        device.setModel(request.getModel());
        device.setDescription(request.getDescription());
        
        // Set connection details
        device.setIpAddress(request.getIpAddress());
        device.setPort(request.getPort());
        
        // Set MQTT specific fields
        device.setMqttBroker(request.getMqttBroker());
        device.setMqttTopic(request.getMqttTopic());
        device.setMqttUsername(request.getMqttUsername());
        device.setMqttPassword(request.getMqttPassword());
        
        // Set HTTP specific fields
        device.setHttpEndpoint(request.getHttpEndpoint());
        device.setHttpMethod(request.getHttpMethod());
        device.setHttpHeaders(request.getHttpHeaders());
        
        // Set COAP specific fields
        device.setCoapHost(request.getCoapHost());
        device.setCoapPort(request.getCoapPort());
        device.setCoapPath(request.getCoapPath());
        
        // Log device details before saving for debugging
        logger.debug("Creating device: name={}, type={}, location={}, ipAddress={}", 
            device.getName(), device.getType(), device.getLocation(), device.getIpAddress());
        
        // Save the device (without storing PDF files)
        Device savedDevice;
        try {
            savedDevice = deviceRepository.save(device);
            logger.info("Device created successfully with ID: {}", savedDevice.getId());
        } catch (Exception e) {
            logger.error("Failed to create device: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create device: " + e.getMessage(), e);
        }
        
        // Create response without file upload information
        DeviceCreateResponse response = new DeviceCreateResponse();
        response.setId(savedDevice.getId());
        response.setName(savedDevice.getName());
        response.setType(savedDevice.getType());
        response.setLocation(savedDevice.getLocation());
        response.setStatus(savedDevice.getStatus());
        response.setCreatedAt(savedDevice.getCreatedAt());
        response.setUpdatedAt(savedDevice.getUpdatedAt());
        
        return response;
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
        device.setTags(request.getTags());
        device.setConfig(request.getConfig());
        
        // Set device specifications
        device.setManufacturer(request.getManufacturer());
        device.setModel(request.getModel());
        device.setDescription(request.getDescription());
        
        // Set connection details
        device.setIpAddress(request.getIpAddress());
        device.setPort(request.getPort());
        
        // Set MQTT specific fields
        device.setMqttBroker(request.getMqttBroker());
        device.setMqttTopic(request.getMqttTopic());
        device.setMqttUsername(request.getMqttUsername());
        device.setMqttPassword(request.getMqttPassword());
        
        // Set HTTP specific fields
        device.setHttpEndpoint(request.getHttpEndpoint());
        device.setHttpMethod(request.getHttpMethod());
        device.setHttpHeaders(request.getHttpHeaders());
        
        // Set COAP specific fields
        device.setCoapHost(request.getCoapHost());
        device.setCoapPort(request.getCoapPort());
        device.setCoapPath(request.getCoapPath());
        
        // Log device details before saving for debugging
        logger.debug("Creating device with files: name={}, type={}, location={}, ipAddress={}", 
            device.getName(), device.getType(), device.getLocation(), device.getIpAddress());
        
        // Save the device first
        Device savedDevice;
        try {
            savedDevice = deviceRepository.save(device);
            logger.info("Device created successfully with ID: {}", savedDevice.getId());
        } catch (Exception e) {
            logger.error("Failed to create device: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create device: " + e.getMessage(), e);
        }
        
        // Note: File uploads are now handled separately through the device documentation system
        // This method now only creates the device with basic information
        
        // Note: File upload handling removed from simplified schema
        
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
        response.setTags(savedDevice.getTags());
        response.setConfig(savedDevice.getConfig());
        response.setManufacturer(savedDevice.getManufacturer());
        response.setModel(savedDevice.getModel());
        response.setDescription(savedDevice.getDescription());
        response.setIpAddress(savedDevice.getIpAddress());
        response.setPort(savedDevice.getPort());
        response.setMqttBroker(savedDevice.getMqttBroker());
        response.setMqttTopic(savedDevice.getMqttTopic());
        response.setMqttUsername(savedDevice.getMqttUsername());
        response.setMqttPassword(savedDevice.getMqttPassword());
        response.setHttpEndpoint(savedDevice.getHttpEndpoint());
        response.setHttpMethod(savedDevice.getHttpMethod());
        response.setHttpHeaders(savedDevice.getHttpHeaders());
        response.setCoapHost(savedDevice.getCoapHost());
        response.setCoapPort(savedDevice.getCoapPort());
        response.setCoapPath(savedDevice.getCoapPath());
        response.setCreatedAt(savedDevice.getCreatedAt());
        response.setUpdatedAt(savedDevice.getUpdatedAt());
        
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
    


    @Transactional
    public void deleteDevice(String id, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));
        
        logger.info("Starting comprehensive deletion of device: {} and all related data", id);
        
        try {
            // Delete device-related data in the correct order to avoid foreign key constraints
            
            // 1. Delete device connections
            try {
                deviceConnectionService.deleteConnection(id, organizationId);
                logger.info("Deleted device connections for device: {}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete device connections for device: {} - {}", id, e.getMessage());
            }
            
            // 2. Delete device safety precautions
            try {
                deviceSafetyPrecautionService.deleteSafetyPrecautionsByDevice(id, organizationId);
                logger.info("Deleted safety precautions for device: {}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete safety precautions for device: {} - {}", id, e.getMessage());
            }
            
            // 3. Delete device maintenance tasks
            try {
                deviceMaintenanceRepository.deleteByDeviceId(id);
                logger.info("Deleted maintenance tasks for device: {}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete maintenance tasks for device: {} - {}", id, e.getMessage());
            }
            
            // 4. Delete device rules and rule conditions
            try {
                List<Rule> deviceRules = ruleRepository.findByDeviceId(id);
                logger.info("Found {} rules to delete for device: {}", deviceRules.size(), id);
                
                for (Rule rule : deviceRules) {
                    logger.info("Deleting rule: {} (ID: {}) for device: {}", rule.getName(), rule.getId(), id);
                    
                    // Delete rule conditions first
                    try {
                        ruleConditionRepository.deleteByRuleId(rule.getId());
                        logger.info("Deleted rule conditions for rule: {}", rule.getId());
                    } catch (Exception e) {
                        logger.warn("Failed to delete rule conditions for rule: {} - {}", rule.getId(), e.getMessage());
                    }
                    
                    // Delete rule actions
                    try {
                        ruleActionRepository.deleteByRuleId(rule.getId());
                        logger.info("Deleted rule actions for rule: {}", rule.getId());
                    } catch (Exception e) {
                        logger.warn("Failed to delete rule actions for rule: {} - {}", rule.getId(), e.getMessage());
                    }
                }
                
                // Delete the rules
                try {
                    ruleRepository.deleteByDeviceId(id);
                    logger.info("Deleted {} rules for device: {}", deviceRules.size(), id);
                } catch (Exception e) {
                    logger.warn("Failed to delete rules for device: {} - {}", id, e.getMessage());
                }
                
                logger.info("Successfully deleted {} rules and related data for device: {}", deviceRules.size(), id);
                
                // Verify deletion
                try {
                    List<Rule> remainingRules = ruleRepository.findByDeviceId(id);
                    if (remainingRules.isEmpty()) {
                        logger.info("✅ Verification: All rules successfully deleted for device: {}", id);
                    } else {
                        logger.warn("⚠️ Verification: {} rules still remain for device: {}", remainingRules.size(), id);
                        for (Rule remainingRule : remainingRules) {
                            logger.warn("Remaining rule: {} (ID: {})", remainingRule.getName(), remainingRule.getId());
                        }
                    }
                } catch (Exception e) {
                    logger.warn("Failed to verify rule deletion for device: {} - {}", id, e.getMessage());
                }
            } catch (Exception e) {
                logger.error("Failed to delete rules for device: {} - {}", id, e.getMessage(), e);
            }
            
            // 5. Delete device documentation
            try {
                deviceDocumentationRepository.deleteByDeviceId(id);
                logger.info("Deleted device documentation for device: {}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete device documentation for device: {} - {}", id, e.getMessage());
            }
            
            // 6. Delete PDF queries related to this device
            try {
                int deletedQueries = pdfQueryRepository.deleteByDeviceId(id, LocalDateTime.now());
                logger.info("Deleted {} PDF queries for device: {}", deletedQueries, id);
            } catch (Exception e) {
                logger.warn("Failed to delete PDF queries for device: {} - {}", id, e.getMessage());
            }
            
            // 7. Delete notifications related to this device
            try {
                notificationRepository.deleteByDeviceId(id);
                logger.info("Deleted notifications for device: {}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete notifications for device: {} - {}", id, e.getMessage());
            }
            
            // 8. Delete maintenance schedules related to this device
            try {
                maintenanceScheduleRepository.deleteByDeviceId(id);
                logger.info("Deleted maintenance schedules for device: {}", id);
            } catch (Exception e) {
                logger.warn("Failed to delete maintenance schedules for device: {} - {}", id, e.getMessage());
            }
            
            // 9. Finally, delete the device itself
            deviceRepository.delete(device);
            logger.info("Successfully deleted device: {} and all related data", id);
            
        } catch (Exception e) {
            logger.error("Error during comprehensive device deletion for device: {}", id, e);
            throw new RuntimeException("Failed to delete device and related data: " + e.getMessage(), e);
        }
    }

    public Device updateDevice(String id, Device deviceDetails, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Update only the fields that should be updatable
        if (deviceDetails.getName() != null) {
            device.setName(deviceDetails.getName());
        }
        if (deviceDetails.getLocation() != null) {
            device.setLocation(deviceDetails.getLocation());
        }
        if (deviceDetails.getManufacturer() != null) {
            device.setManufacturer(deviceDetails.getManufacturer());
        }
        if (deviceDetails.getModel() != null) {
            device.setModel(deviceDetails.getModel());
        }
        if (deviceDetails.getMqttBroker() != null) {
            device.setMqttBroker(deviceDetails.getMqttBroker());
        }
        if (deviceDetails.getMqttTopic() != null) {
            device.setMqttTopic(deviceDetails.getMqttTopic());
        }
        if (deviceDetails.getHttpEndpoint() != null) {
            device.setHttpEndpoint(deviceDetails.getHttpEndpoint());
        }
        if (deviceDetails.getCoapHost() != null) {
            device.setCoapHost(deviceDetails.getCoapHost());
        }
        if (deviceDetails.getCoapPort() != null) {
            device.setCoapPort(deviceDetails.getCoapPort());
        }
        if (deviceDetails.getAssignedUserId() != null) {
            device.setAssignedUserId(deviceDetails.getAssignedUserId());
        }

        // Note: lastSeen field removed from simplified schema
        return deviceRepository.save(device);
    }

    public Device updateDeviceStatus(String id, Device.DeviceStatus status, String organizationId) {
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        device.setStatus(status);
        // Note: lastSeen field removed from simplified schema
        return deviceRepository.save(device);
    }

    public void processTelemetryData(String deviceId, TelemetryDataRequest telemetryData, String organizationId) {
        // Update device with latest telemetry
        Device device = deviceRepository.findByIdAndOrganizationId(deviceId, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        // Note: Device model simplified - telemetry data stored separately
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