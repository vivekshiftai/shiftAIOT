package com.iotplatform.service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;

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
import com.iotplatform.model.User;
import com.iotplatform.repository.UserRepository;
import com.iotplatform.service.NotificationService;
import com.iotplatform.service.DeviceNotificationEnhancerService;
import com.iotplatform.repository.DeviceConnectionRepository;
import com.iotplatform.model.DeviceConnection;


@Service
public class DeviceService {

    private static final Logger logger = LoggerFactory.getLogger(DeviceService.class);

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationService notificationService;

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
    private DeviceWebSocketService deviceWebSocketService;

    @Autowired
    private MaintenanceScheduleRepository maintenanceScheduleRepository;

    @Autowired
    private DeviceNotificationEnhancerService deviceNotificationEnhancerService;

    @Autowired
    private DeviceConnectionRepository deviceConnectionRepository;


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
        // Set assigned by if provided
        if (device.getAssignedBy() != null && !device.getAssignedBy().trim().isEmpty()) {
            device.setAssignedBy(device.getAssignedBy());
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
        
        // Always set status to ONLINE during creation - ignore any status from request
        device.setStatus(Device.DeviceStatus.ONLINE);
        logger.info("📱 Device status set to ONLINE for creation - device: {}", request.getName());
        
        // Set basic device information
        device.setName(request.getName());
        device.setType(request.getType());
        device.setLocation(request.getLocation());
        device.setProtocol(request.getProtocol());
        
        // Always set status to ONLINE during creation - ignore any status from request
        device.setStatus(Device.DeviceStatus.ONLINE);
        logger.info("📱 Device status set to ONLINE for creation - device: {}", request.getName());
        
        // Set optional basic device info
        device.setManufacturer(request.getManufacturer());
        device.setModel(request.getModel());
        device.setDescription(request.getDescription());
        
        // Set assigned user if provided
        if (request.getAssignedUserId() != null && !request.getAssignedUserId().trim().isEmpty()) {
            device.setAssignedUserId(request.getAssignedUserId());
        }
        // Set assigned by if provided
        if (request.getAssignedBy() != null && !request.getAssignedBy().trim().isEmpty()) {
            device.setAssignedBy(request.getAssignedBy());
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
        
        // Save the device
        Device savedDevice = deviceRepository.save(device);
        logger.info("📱 Device created successfully with ID: {}", savedDevice.getId());
        
        // Create device creation notification for the creator
        try {
            String creatorId = device.getAssignedBy() != null ? device.getAssignedBy() : device.getAssignedUserId();
            if (creatorId != null && !creatorId.trim().isEmpty()) {
                logger.info("📝 Creating device creation notification for creator: {} for device: {}", 
                           creatorId, savedDevice.getName());
                createDeviceCreationNotification(savedDevice, creatorId, organizationId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to create device creation notification for device: {}", savedDevice.getId(), e);
            // Don't fail device creation if notification fails
        }
        
        return savedDevice;
    }

    /**
     * Create device without storing PDF files in our database
     * PDF files will be sent directly to PDF Processing Service
     */
    public DeviceCreateResponse createDeviceWithoutFiles(DeviceCreateWithFileRequest request, 
                                                       String organizationId, String currentUserId) throws IOException {
        
        // Create the device
        Device device = new Device();
        device.setId(UUID.randomUUID().toString());
        device.setOrganizationId(organizationId);
        
        // Set user assignment - use assignedUserId from request if provided, otherwise use current user
        if (request.getAssignedUserId() != null && !request.getAssignedUserId().trim().isEmpty()) {
            device.setAssignedUserId(request.getAssignedUserId().trim());
            logger.info("📱 Device assigned to user: {} - notification will be handled by calling service", 
                       request.getAssignedUserId().trim());
        } else {
            device.setAssignedUserId(currentUserId);
            logger.info("📱 Device auto-assigned to creator: {}", currentUserId);
        }
        device.setAssignedBy(currentUserId);
        
        // Always set status to ONLINE during onboarding - ignore any status from request
        device.setStatus(Device.DeviceStatus.ONLINE);
        logger.info("📱 Device status set to ONLINE for onboarding - device: {}", request.getName());
        
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
            logger.info("Device created successfully with ID: {} and status: {}", savedDevice.getId(), savedDevice.getStatus());
        } catch (Exception e) {
            logger.error("Failed to create device: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create device: " + e.getMessage(), e);
        }
        
        // Create notification for device assignment if assigned to different user
        if (request.getAssignedUserId() != null && !request.getAssignedUserId().trim().isEmpty() 
            && !request.getAssignedUserId().trim().equals(currentUserId)) {
            try {
                logger.info("📝 Creating device assignment notification for user: {} for device: {}", 
                           request.getAssignedUserId().trim(), savedDevice.getName());
                logger.info("📝 Device details - ID: {}, Name: {}, Organization: {}", 
                           savedDevice.getId(), savedDevice.getName(), organizationId);
                createDeviceAssignmentNotification(savedDevice, request.getAssignedUserId().trim(), organizationId);
            } catch (Exception e) {
                logger.error("❌ Failed to create device assignment notification for device: {}", savedDevice.getId(), e);
                // Don't fail device creation if notification fails
            }
        } else {
            logger.info("📝 No notification needed - assignedUserId: {}, currentUserId: {}, condition: {}", 
                       request.getAssignedUserId(), currentUserId, 
                       request.getAssignedUserId() != null && !request.getAssignedUserId().trim().isEmpty() 
                       && !request.getAssignedUserId().trim().equals(currentUserId));
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
                                                   String organizationId,
                                                   String currentUserId) throws IOException {
        
        // Create the device
        Device device = new Device();
        device.setId(UUID.randomUUID().toString());
        device.setOrganizationId(organizationId);
        
        // Set user assignment - use assignedUserId from request if provided, otherwise use current user
        if (request.getAssignedUserId() != null && !request.getAssignedUserId().trim().isEmpty()) {
            device.setAssignedUserId(request.getAssignedUserId().trim());
            device.setAssignedBy(currentUserId);
            
            // Note: Notification will be created by the calling service (UnifiedOnboardingService)
            // to ensure a single consolidated notification with all device information
            logger.info("📱 Device assigned to user: {} - notification will be handled by calling service", 
                       request.getAssignedUserId().trim());
        } else {
            device.setAssignedUserId(currentUserId);
            device.setAssignedBy(currentUserId);
            logger.info("📱 Device auto-assigned to creator: {}", currentUserId);
        }
        
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
    


    @Transactional(rollbackFor = Exception.class)
    public void deleteDevice(String id, String organizationId) {
        // Enhanced input validation with detailed logging
        if (id == null || id.trim().isEmpty()) {
            logger.error("❌ Device deletion failed: Device ID cannot be null or empty");
            throw new IllegalArgumentException("Device ID cannot be null or empty");
        }
        if (organizationId == null || organizationId.trim().isEmpty()) {
            logger.error("❌ Device deletion failed: Organization ID cannot be null or empty");
            throw new IllegalArgumentException("Organization ID cannot be null or empty");
        }
        
        String trimmedId = id.trim();
        String trimmedOrgId = organizationId.trim();
        
        logger.info("🔍 Starting device deletion process for device: {} in organization: {}", trimmedId, trimmedOrgId);
        
        // Find and validate device exists
        Device device;
        try {
            device = deviceRepository.findByIdAndOrganizationId(trimmedId, trimmedOrgId)
                    .orElseThrow(() -> new RuntimeException("Device not found with ID: " + trimmedId + " in organization: " + trimmedOrgId));
            logger.info("✅ Device found: {} ({})", device.getName(), trimmedId);
        } catch (Exception e) {
            logger.error("❌ Device deletion failed: Could not find device {} in organization {}", trimmedId, trimmedOrgId, e);
            throw new RuntimeException("Device not found with ID: " + trimmedId + " in organization: " + trimmedOrgId, e);
        }
        
        // Additional validation checks with warnings
        if (device.getStatus() == Device.DeviceStatus.ONLINE) {
            logger.warn("⚠️ Attempting to delete ONLINE device: {} - {}", trimmedId, device.getName());
        }
        
        // Check if device has active connections
        try {
            Optional<DeviceConnection> deviceConnection = deviceConnectionRepository.findByDeviceIdAndOrganizationId(trimmedId, trimmedOrgId);
            if (deviceConnection.isPresent() && deviceConnection.get().getStatus() == DeviceConnection.ConnectionStatus.CONNECTED) {
                logger.warn("⚠️ Device {} has an active connection - this may cause issues during deletion", trimmedId);
            }
        } catch (Exception e) {
            logger.warn("⚠️ Could not check device connections: {}", e.getMessage());
        }
        
        // Check if device has pending maintenance tasks
        try {
            long pendingMaintenance = deviceMaintenanceRepository.countByDeviceIdAndStatus(trimmedId, DeviceMaintenance.Status.PENDING);
            if (pendingMaintenance > 0) {
                logger.warn("⚠️ Device {} has {} pending maintenance tasks", trimmedId, pendingMaintenance);
            }
        } catch (Exception e) {
            logger.warn("⚠️ Could not check pending maintenance: {}", e.getMessage());
        }
        
        logger.info("🚀 Starting comprehensive deletion of device: {} and all related data", trimmedId);
        
        // Track deletion progress and failures
        List<String> deletionErrors = new ArrayList<>();
        List<String> successfulDeletions = new ArrayList<>();
        
        try {
            // Delete device-related data in the correct order to avoid foreign key constraints
            
            // 1. Delete device connections
            try {
                deviceConnectionService.deleteConnection(trimmedId, trimmedOrgId);
                logger.info("✅ Deleted device connections for device: {}", trimmedId);
                successfulDeletions.add("device connections");
            } catch (Exception e) {
                String errorMsg = "Failed to delete device connections: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions instead of throwing immediately
            }
            
            // 2. Delete device safety precautions
            try {
                deviceSafetyPrecautionService.deleteSafetyPrecautionsByDevice(trimmedId, trimmedOrgId);
                logger.info("✅ Deleted safety precautions for device: {}", trimmedId);
                successfulDeletions.add("safety precautions");
            } catch (Exception e) {
                String errorMsg = "Failed to delete safety precautions: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 3. Delete device maintenance tasks
            try {
                deviceMaintenanceRepository.deleteByDeviceId(trimmedId);
                logger.info("✅ Deleted maintenance tasks for device: {}", trimmedId);
                successfulDeletions.add("maintenance tasks");
            } catch (Exception e) {
                String errorMsg = "Failed to delete maintenance tasks: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 4. Delete device rules and rule conditions
            try {
                List<Rule> deviceRules = ruleRepository.findByDeviceId(trimmedId);
                logger.info("🔍 Found {} rules to delete for device: {}", deviceRules.size(), trimmedId);
                
                if (!deviceRules.isEmpty()) {
                    for (Rule rule : deviceRules) {
                        logger.info("🗑️ Deleting rule: {} (ID: {}) for device: {}", rule.getName(), rule.getId(), trimmedId);
                        
                        // Delete rule conditions first
                        try {
                            ruleConditionRepository.deleteByRuleId(rule.getId());
                            logger.debug("✅ Deleted rule conditions for rule: {}", rule.getId());
                        } catch (Exception e) {
                            String errorMsg = "Failed to delete rule conditions for rule " + rule.getId() + ": " + e.getMessage();
                            logger.error("❌ {}", errorMsg, e);
                            deletionErrors.add(errorMsg);
                            // Continue with other deletions
                        }
                        
                        // Delete rule actions
                        try {
                            ruleActionRepository.deleteByRuleId(rule.getId());
                            logger.debug("✅ Deleted rule actions for rule: {}", rule.getId());
                        } catch (Exception e) {
                            String errorMsg = "Failed to delete rule actions for rule " + rule.getId() + ": " + e.getMessage();
                            logger.error("❌ {}", errorMsg, e);
                            deletionErrors.add(errorMsg);
                            // Continue with other deletions
                        }
                    }
                    
                    // Delete the rules
                    try {
                        ruleRepository.deleteByDeviceId(trimmedId);
                        logger.info("✅ Deleted {} rules for device: {}", deviceRules.size(), trimmedId);
                        successfulDeletions.add("rules (" + deviceRules.size() + " rules)");
                        
                        // Verify deletion
                        List<Rule> remainingRules = ruleRepository.findByDeviceId(trimmedId);
                        if (!remainingRules.isEmpty()) {
                            String errorMsg = "Verification failed: " + remainingRules.size() + " rules still remain for device: " + trimmedId;
                            logger.error("❌ {}", errorMsg);
                            for (Rule remainingRule : remainingRules) {
                                logger.error("Remaining rule: {} (ID: {})", remainingRule.getName(), remainingRule.getId());
                            }
                            deletionErrors.add(errorMsg);
                        }
                    } catch (Exception e) {
                        String errorMsg = "Failed to delete rules: " + e.getMessage();
                        logger.error("❌ {}", errorMsg, e);
                        deletionErrors.add(errorMsg);
                    }
                } else {
                    logger.info("ℹ️ No rules found for device: {}", trimmedId);
                    successfulDeletions.add("rules (0 rules)");
                }
                
            } catch (Exception e) {
                String errorMsg = "Failed to process rules deletion: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 5. Delete device documentation
            try {
                deviceDocumentationRepository.deleteByDeviceId(trimmedId);
                logger.info("✅ Deleted device documentation for device: {}", trimmedId);
                successfulDeletions.add("device documentation");
            } catch (Exception e) {
                String errorMsg = "Failed to delete device documentation: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 6. Delete PDF queries related to this device
            try {
                int deletedQueries = pdfQueryRepository.deleteByDeviceId(trimmedId, LocalDateTime.now());
                logger.info("✅ Deleted {} PDF queries for device: {}", deletedQueries, trimmedId);
                successfulDeletions.add("PDF queries (" + deletedQueries + " queries)");
            } catch (Exception e) {
                String errorMsg = "Failed to delete PDF queries: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 7. Delete notifications related to this device
            try {
                notificationRepository.deleteByDeviceId(trimmedId);
                logger.info("✅ Deleted notifications for device: {}", trimmedId);
                successfulDeletions.add("notifications");
            } catch (Exception e) {
                String errorMsg = "Failed to delete notifications: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 8. Delete maintenance schedules related to this device
            try {
                maintenanceScheduleRepository.deleteByDeviceId(trimmedId);
                logger.info("✅ Deleted maintenance schedules for device: {}", trimmedId);
                successfulDeletions.add("maintenance schedules");
            } catch (Exception e) {
                String errorMsg = "Failed to delete maintenance schedules: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                // Continue with other deletions
            }
            
            // 9. Finally, delete the device itself
            try {
                deviceRepository.delete(device);
                logger.info("✅ Successfully deleted device: {} and all related data", trimmedId);
                successfulDeletions.add("device entity");
            } catch (Exception e) {
                String errorMsg = "Failed to delete device entity: " + e.getMessage();
                logger.error("❌ {}", errorMsg, e);
                deletionErrors.add(errorMsg);
                throw new RuntimeException("Critical failure: Could not delete device entity", e);
            }
            
            // Log successful deletion summary
            logger.info("🎉 Device deletion completed successfully for device: {}", trimmedId);
            logger.info("✅ Successfully deleted: {}", String.join(", ", successfulDeletions));
            
            // If there were any errors during the process, log them but don't fail the deletion
            if (!deletionErrors.isEmpty()) {
                logger.warn("⚠️ Device deletion completed with some errors for device: {}", trimmedId);
                logger.warn("❌ Errors encountered: {}", String.join("; ", deletionErrors));
                logger.warn("✅ Successful deletions: {}", String.join("; ", successfulDeletions));
            }
            
        } catch (Exception e) {
            // Log comprehensive error information
            logger.error("💥 Device deletion failed for device: {}", trimmedId, e);
            logger.error("❌ Deletion errors encountered: {}", deletionErrors);
            logger.error("✅ Successful deletions before failure: {}", successfulDeletions);
            
            // Provide detailed error context
            String errorContext = String.format(
                "Device deletion failed for device %s. Errors: %s. Successful deletions: %s",
                trimmedId,
                String.join("; ", deletionErrors),
                String.join("; ", successfulDeletions)
            );
            
            throw new RuntimeException(errorContext, e);
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
        logger.info("🔄 Updating device status: deviceId={}, newStatus={}, organizationId={}", id, status, organizationId);
        
        Device device = deviceRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new RuntimeException("Device not found"));

        Device.DeviceStatus oldStatus = device.getStatus();
        logger.info("📊 Device status change: {} -> {} for device: {} ({})", oldStatus, status, device.getName(), id);
        
        // Update device status
        device.setStatus(status);
        device.setUpdatedAt(LocalDateTime.now());
        
        Device savedDevice = deviceRepository.save(device);
        logger.info("✅ Device status saved to database: {} is now {}", device.getName(), status);
        
        // Broadcast real-time status update
        try {
            deviceWebSocketService.broadcastDeviceStatusUpdate(savedDevice);
            logger.info("📡 WebSocket broadcast sent for device status update: {} -> {} for device: {}", oldStatus, status, device.getName());
        } catch (Exception e) {
            logger.error("❌ Failed to broadcast device status update for device: {}", id, e);
            // Don't fail the status update if WebSocket broadcast fails
        }
        
        return savedDevice;
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

    private void createDeviceAssignmentNotification(Device device, String assignedUserId, String organizationId) {
        try {
            // Get the assigned user
            Optional<User> assignedUserOpt = userRepository.findById(assignedUserId);
            if (assignedUserOpt.isPresent()) {
                User assignedUser = assignedUserOpt.get();
                
                // Create enhanced notification with comprehensive device information
                Notification notification = new Notification();
                notification.setTitle("New Device Assignment");
                notification.setMessage("You have been assigned a new device. The device is ready for monitoring and management.");
                notification.setCategory(Notification.NotificationCategory.DEVICE_ASSIGNMENT);
                notification.setUserId(assignedUserId);
                notification.setDeviceId(device.getId());
                notification.setOrganizationId(organizationId);
                notification.setRead(false);
                
                // Enhance notification with comprehensive device information
                deviceNotificationEnhancerService.enhanceNotificationWithDeviceInfo(notification, device.getId(), organizationId);
                
                // Build enhanced message
                String enhancedMessage = deviceNotificationEnhancerService.buildEnhancedNotificationMessage(notification);
                notification.setMessage(enhancedMessage);
                
                // Save notification using the notification service with preference check
                Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(assignedUserId, notification);
                
                if (createdNotification.isPresent()) {
                    logger.info("Created enhanced device assignment notification for user: {} for device: {}", 
                               assignedUser.getEmail(), device.getName());
                } else {
                    logger.info("Device assignment notification blocked by user preferences for user: {}", 
                               assignedUser.getEmail());
                }
            } else {
                logger.warn("Could not create notification - assigned user not found: {}", assignedUserId);
            }
        } catch (Exception e) {
            logger.error("Failed to create device assignment notification for user: {} device: {}", 
                        assignedUserId, device.getId(), e);
            // Don't fail the device creation if notification fails
        }
    }

    private void createDeviceUpdateNotification(Device device, String assignedUserId, String organizationId, String updatedBy) {
        try {
            // Get the assigned user
            Optional<User> assignedUserOpt = userRepository.findById(assignedUserId);
            if (assignedUserOpt.isPresent()) {
                User assignedUser = assignedUserOpt.get();
                
                // Get the user who made the update
                Optional<User> updatedByUserOpt = userRepository.findById(updatedBy);
                String updatedByUserName = updatedByUserOpt.map(user -> user.getFirstName() + " " + user.getLastName()).orElse("System");
                
                // Create notification for device update
                Notification notification = new Notification();
                notification.setTitle("Device Assignment Updated");
                notification.setMessage(String.format(
                    "Your device assignment has been updated by %s. " +
                    "Device: %s (%s) at location: %s is now assigned to you.",
                    updatedByUserName,
                    device.getName(),
                    device.getType(),
                    device.getLocation()
                ));
                notification.setCategory(Notification.NotificationCategory.DEVICE_UPDATE);
                notification.setUserId(assignedUserId);
                notification.setDeviceId(device.getId());
                notification.setOrganizationId(organizationId);
                notification.setRead(false);
                
                // Save notification using the notification service with preference check
                Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(assignedUserId, notification);
                
                if (createdNotification.isPresent()) {
                    logger.info("✅ Created device update notification for user: {} for device: {}", 
                               assignedUser.getEmail(), device.getName());
                } else {
                    logger.info("⚠️ Device update notification blocked by user preferences for user: {}", 
                               assignedUser.getEmail());
                }
            } else {
                logger.warn("⚠️ Could not create update notification - assigned user not found: {}", assignedUserId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to create device update notification for user: {} device: {}", 
                        assignedUserId, device.getId(), e);
            // Don't fail the device update if notification fails
        }
    }

    private void createDeviceCreationNotification(Device device, String creatorId, String organizationId) {
        try {
            // Get the creator user
            Optional<User> creatorUserOpt = userRepository.findById(creatorId);
            if (creatorUserOpt.isPresent()) {
                User creatorUser = creatorUserOpt.get();
                
                // Create enhanced notification with comprehensive device information
                Notification notification = new Notification();
                notification.setTitle("New Device Created");
                notification.setMessage(String.format(
                    "A new device has been created. Device: %s (%s) at location: %s is assigned to you.",
                    device.getName(),
                    device.getType(),
                    device.getLocation()
                ));
                notification.setCategory(Notification.NotificationCategory.DEVICE_CREATION);
                notification.setUserId(creatorId);
                notification.setDeviceId(device.getId());
                notification.setOrganizationId(organizationId);
                notification.setRead(false);
                
                // Enhance notification with comprehensive device information
                deviceNotificationEnhancerService.enhanceNotificationWithDeviceInfo(notification, device.getId(), organizationId);
                
                // Build enhanced message
                String enhancedMessage = deviceNotificationEnhancerService.buildEnhancedNotificationMessage(notification);
                notification.setMessage(enhancedMessage);
                
                // Save notification using the notification service with preference check
                Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(creatorId, notification);
                
                if (createdNotification.isPresent()) {
                    logger.info("✅ Created device creation notification for user: {} for device: {}", 
                               creatorUser.getEmail(), device.getName());
                } else {
                    logger.info("⚠️ Device creation notification blocked by user preferences for user: {}", 
                               creatorUser.getEmail());
                }
            } else {
                logger.warn("Could not create notification - creator user not found: {}", creatorId);
            }
        } catch (Exception e) {
            logger.error("Failed to create device creation notification for user: {} device: {}", 
                        creatorId, device.getId(), e);
            // Don't fail the device creation if notification fails
        }
    }
}