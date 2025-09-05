package com.iotplatform.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Date;
import java.time.LocalDateTime;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MaxUploadSizeExceededException;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceCreateRequest;
import com.iotplatform.dto.DeviceStatsResponse;

import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.dto.DeviceUpdateRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.Device.Protocol;
import com.iotplatform.model.User;
import com.iotplatform.service.DeviceService;
import com.iotplatform.service.DeviceSafetyPrecautionService;
import com.iotplatform.service.DeviceWebSocketService;
import com.iotplatform.service.FileStorageService;
import com.iotplatform.service.TelemetryService;
import com.iotplatform.service.UnifiedOnboardingService;
import com.iotplatform.service.MaintenanceScheduleService;
import com.iotplatform.model.Rule;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.model.RuleCondition;
import com.iotplatform.service.PDFProcessingService;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.repository.RuleRepository;
import com.iotplatform.repository.RuleConditionRepository;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.DeviceSafetyPrecautionRepository;
import com.iotplatform.repository.DeviceRepository;
import com.iotplatform.repository.UserRepository;
import com.iotplatform.model.Notification;
import com.iotplatform.service.NotificationService;
import com.iotplatform.service.DeviceNotificationEnhancerService;
import com.iotplatform.service.UnifiedPDFService;
import com.iotplatform.model.UnifiedPDF;

import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.iotplatform.dto.UnifiedOnboardingProgress;
import java.util.function.Consumer;
import io.swagger.v3.oas.annotations.Operation;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private static final Logger logger = LoggerFactory.getLogger(DeviceController.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ANONYMOUS_USER = "anonymous";
    private static final String DEFAULT_ORGANIZATION = "shiftAIOT-org-2024";
    private static final int MAX_FILE_SIZE = 524288000; // 500MB in bytes

    private final DeviceService deviceService;
    private final TelemetryService telemetryService;
    private final FileStorageService fileStorageService;
    private final PDFProcessingService pdfProcessingService;
    private final UnifiedOnboardingService unifiedOnboardingService;
    private final DeviceSafetyPrecautionService deviceSafetyPrecautionService;
    private final RuleRepository ruleRepository;
    private final RuleConditionRepository ruleConditionRepository;
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final DeviceWebSocketService deviceWebSocketService;
    private final MaintenanceScheduleService maintenanceScheduleService;
    private final DeviceNotificationEnhancerService deviceNotificationEnhancerService;
    private final UnifiedPDFService unifiedPDFService;

    public DeviceController(DeviceService deviceService, TelemetryService telemetryService, FileStorageService fileStorageService, PDFProcessingService pdfProcessingService, UnifiedOnboardingService unifiedOnboardingService, DeviceSafetyPrecautionService deviceSafetyPrecautionService, RuleRepository ruleRepository, RuleConditionRepository ruleConditionRepository, DeviceMaintenanceRepository deviceMaintenanceRepository, DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository, DeviceRepository deviceRepository, UserRepository userRepository, NotificationService notificationService, DeviceWebSocketService deviceWebSocketService, MaintenanceScheduleService maintenanceScheduleService, DeviceNotificationEnhancerService deviceNotificationEnhancerService, UnifiedPDFService unifiedPDFService) {
        this.deviceService = deviceService;
        this.telemetryService = telemetryService;
        this.fileStorageService = fileStorageService;
        this.pdfProcessingService = pdfProcessingService;
        this.unifiedOnboardingService = unifiedOnboardingService;
        this.deviceSafetyPrecautionService = deviceSafetyPrecautionService;
        this.ruleRepository = ruleRepository;
        this.ruleConditionRepository = ruleConditionRepository;
        this.deviceMaintenanceRepository = deviceMaintenanceRepository;
        this.deviceSafetyPrecautionRepository = deviceSafetyPrecautionRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.deviceWebSocketService = deviceWebSocketService;
        this.maintenanceScheduleService = maintenanceScheduleService;
        this.deviceNotificationEnhancerService = deviceNotificationEnhancerService;
        this.unifiedPDFService = unifiedPDFService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<Device>> getAllDevices(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} requesting devices with filters - status: {}, type: {}, search: {}", 
                   userEmail, null, null, null);
        logger.info("Organization ID: {}", organizationId);
        
        List<Device> devices;
        
        try {
            devices = deviceService.getAllDevices(organizationId);
            logger.info("Found {} total devices for organization: {}", devices.size(), organizationId);
        } catch (Exception e) {
            logger.error("Error getting devices for user {}: {}", userEmail, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        
        logger.info("Returning {} devices to user: {}", devices.size(), userEmail);
        return ResponseEntity.ok(devices);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Device> getDevice(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} requesting device with ID: {}", userEmail, id);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        Optional<Device> device = deviceService.getDevice(id.trim(), organizationId);
        
        if (device.isPresent()) {
            logger.debug("Device {} found for user {}", id, userEmail);
            return ResponseEntity.ok(device.get());
        } else {
            logger.warn("Device {} not found for user {}", id, userEmail);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Device> createDevice(@Valid @RequestBody Device device, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} creating new device: {}", userEmail, device.getName());
        
        try {
            device.setOrganizationId(organizationId);
            Device createdDevice = deviceService.createDevice(device, organizationId);
            logger.info("Device {} created successfully with ID: {}", device.getName(), createdDevice.getId());
            
            // Broadcast device creation
            try {
                deviceWebSocketService.broadcastDeviceCreation(createdDevice);
            } catch (Exception e) {
                logger.error("Failed to broadcast device creation for device: {}", createdDevice.getId(), e);
            }
            
            return ResponseEntity.ok(createdDevice);
        } catch (Exception e) {
            logger.error("Failed to create device {}: {}", device.getName(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/simple")
    public ResponseEntity<Device> createSimpleDevice(@Valid @RequestBody DeviceCreateRequest request, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} creating new simple device: {} with protocol: {}", userEmail, request.getName(), request.getProtocol());
        
        try {
            Device createdDevice = deviceService.createDeviceFromRequest(request, organizationId);
            logger.info("Simple device {} created successfully with ID: {}", request.getName(), createdDevice.getId());
            return ResponseEntity.ok(createdDevice);
        } catch (Exception e) {
            logger.error("Failed to create simple device {}: {}", request.getName(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/with-files")
    public ResponseEntity<DeviceCreateResponse> createDeviceWithFiles(
            @RequestParam("deviceData") String deviceData,
            @RequestParam(value = "manualFile", required = false) MultipartFile manualFile,
            @RequestParam(value = "datasheetFile", required = false) MultipartFile datasheetFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} creating new device with files: {}", userEmail, deviceData);
        
        try {
            // Parse the device data JSON string
            DeviceCreateWithFileRequest request = objectMapper.readValue(deviceData, DeviceCreateWithFileRequest.class);
            
            // Enhanced validation for device data
            if (!isValidDeviceRequest(request)) {
                return ResponseEntity.badRequest().build();
            }
            
            // Validate files if provided
            if (!validateFiles(manualFile, datasheetFile, certificateFile)) {
                return ResponseEntity.badRequest().build();
            }
            
            String currentUserId = user.getId();
            DeviceCreateResponse response = deviceService.createDeviceWithFiles(request, manualFile, datasheetFile, certificateFile, organizationId, currentUserId);
            logger.info("Device {} created successfully with files, ID: {}", request.getName(), response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to create device with files: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDevice(@PathVariable String id, @Valid @RequestBody DeviceUpdateRequest deviceRequest, 
                                       @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔄 PUT /api/devices/{} - Device update request received from user: {}", 
                   id, userDetails.getUser().getEmail());
        
        // Log the incoming request data for debugging
        logger.info("📝 Device update request data: {}", deviceRequest);
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ No authenticated user found for device update request");
            return ResponseEntity.status(401).build();
        }
        
        User currentUser = userDetails.getUser();
        
        // Validate device ID
        if (id == null || id.trim().isEmpty()) {
            logger.warn("❌ Invalid device ID provided: {}", id);
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Invalid device ID",
                "message", "Device ID cannot be null or empty"
            ));
        }
        
        try {
            // Check if device exists and belongs to the same organization
            Optional<Device> existingDeviceOpt = deviceRepository.findById(id.trim());
            if (existingDeviceOpt.isEmpty()) {
                logger.warn("❌ Device not found: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            Device existingDevice = existingDeviceOpt.get();
            if (!existingDevice.getOrganizationId().equals(currentUser.getOrganizationId())) {
                logger.warn("❌ Forbidden access attempt - user {} trying to update device {} from different organization: {} vs {}", 
                          currentUser.getEmail(), id, currentUser.getOrganizationId(), existingDevice.getOrganizationId());
                return ResponseEntity.status(403).build();
            }
            
            logger.info("✅ Device found and access verified. Proceeding with update for device: {}", existingDevice.getName());
            
            // Update device fields only if they are not null (partial update)
            // Log each field update for debugging
            
            // REQUIRED FIELDS - always update if provided (even if empty string)
            if (deviceRequest.getName() != null) {
                // For required fields, preserve empty strings - validation will handle them
                String newName = deviceRequest.getName().trim();
                logger.info("📝 Updating device name from '{}' to '{}'", existingDevice.getName(), newName);
                existingDevice.setName(newName);
            }
            if (deviceRequest.getLocation() != null) {
                // For required fields, preserve empty strings - validation will handle them
                String newLocation = deviceRequest.getLocation().trim();
                logger.info("📝 Updating device location from '{}' to '{}'", existingDevice.getLocation(), newLocation);
                existingDevice.setLocation(newLocation);
            }
            if (deviceRequest.getManufacturer() != null) {
                String newManufacturer = convertEmptyToNull(deviceRequest.getManufacturer());
                logger.info("📝 Updating device manufacturer from '{}' to '{}'", existingDevice.getManufacturer(), newManufacturer);
                existingDevice.setManufacturer(newManufacturer);
            }
            if (deviceRequest.getModel() != null) {
                String newModel = convertEmptyToNull(deviceRequest.getModel());
                logger.info("📝 Updating device model from '{}' to '{}'", existingDevice.getModel(), newModel);
                existingDevice.setModel(newModel);
            }
            if (deviceRequest.getDescription() != null) {
                String newDescription = convertEmptyToNull(deviceRequest.getDescription());
                logger.info("📝 Updating device description from '{}' to '{}'", existingDevice.getDescription(), newDescription);
                existingDevice.setDescription(newDescription);
            }
            if (deviceRequest.getIpAddress() != null) {
                String newIpAddress = convertEmptyToNull(deviceRequest.getIpAddress());
                logger.info("📝 Updating device IP address from '{}' to '{}'", existingDevice.getIpAddress(), newIpAddress);
                existingDevice.setIpAddress(newIpAddress);
            }
            if (deviceRequest.getPort() != null) {
                logger.info("📝 Updating device port from {} to {}", existingDevice.getPort(), deviceRequest.getPort());
                existingDevice.setPort(deviceRequest.getPort());
            }
            if (deviceRequest.getMqttBroker() != null) {
                String newMqttBroker = convertEmptyToNull(deviceRequest.getMqttBroker());
                logger.info("📝 Updating device MQTT broker from '{}' to '{}'", existingDevice.getMqttBroker(), newMqttBroker);
                existingDevice.setMqttBroker(newMqttBroker);
            }
            if (deviceRequest.getMqttTopic() != null) {
                String newMqttTopic = convertEmptyToNull(deviceRequest.getMqttTopic());
                logger.info("📝 Updating device MQTT topic from '{}' to '{}'", existingDevice.getMqttTopic(), newMqttTopic);
                existingDevice.setMqttTopic(newMqttTopic);
            }
            if (deviceRequest.getMqttUsername() != null) {
                String newMqttUsername = convertEmptyToNull(deviceRequest.getMqttUsername());
                logger.info("📝 Updating device MQTT username from '{}' to '{}'", existingDevice.getMqttUsername(), newMqttUsername);
                existingDevice.setMqttUsername(newMqttUsername);
            }
            if (deviceRequest.getMqttPassword() != null) {
                String newMqttPassword = convertEmptyToNull(deviceRequest.getMqttPassword());
                logger.info("📝 Updating device MQTT password from '{}' to '{}'", existingDevice.getMqttPassword(), newMqttPassword);
                existingDevice.setMqttPassword(newMqttPassword);
            }
            if (deviceRequest.getHttpEndpoint() != null) {
                String newHttpEndpoint = convertEmptyToNull(deviceRequest.getHttpEndpoint());
                logger.info("📝 Updating device HTTP endpoint from '{}' to '{}'", existingDevice.getHttpEndpoint(), newHttpEndpoint);
                existingDevice.setHttpEndpoint(newHttpEndpoint);
            }
            if (deviceRequest.getHttpMethod() != null) {
                String newHttpMethod = convertEmptyToNull(deviceRequest.getHttpMethod());
                logger.info("📝 Updating device HTTP method from '{}' to '{}'", existingDevice.getHttpMethod(), newHttpMethod);
                existingDevice.setHttpMethod(newHttpMethod);
            }
            if (deviceRequest.getHttpHeaders() != null) {
                String newHttpHeaders = convertEmptyToNull(deviceRequest.getHttpHeaders());
                logger.info("📝 Updating device HTTP headers from '{}' to '{}'", existingDevice.getHttpHeaders(), newHttpHeaders);
                existingDevice.setHttpHeaders(newHttpHeaders);
            }
            if (deviceRequest.getCoapHost() != null) {
                String newCoapHost = convertEmptyToNull(deviceRequest.getCoapHost());
                logger.info("📝 Updating device COAP host from '{}' to '{}'", existingDevice.getCoapHost(), newCoapHost);
                existingDevice.setCoapHost(newCoapHost);
            }
            if (deviceRequest.getCoapPort() != null) {
                logger.info("📝 Updating device COAP port from {} to {}", existingDevice.getCoapPort(), deviceRequest.getCoapPort());
                existingDevice.setCoapPort(deviceRequest.getCoapPort());
            }
            if (deviceRequest.getCoapPath() != null) {
                String newCoapPath = convertEmptyToNull(deviceRequest.getCoapPath());
                logger.info("📝 Updating device COAP path from '{}' to '{}'", existingDevice.getCoapPath(), newCoapPath);
                existingDevice.setCoapPath(newCoapPath);
            }
            
            // Check if assigned user has changed
            String previousAssignedUserId = existingDevice.getAssignedUserId();
            if (deviceRequest.getAssignedUserId() != null && 
                !deviceRequest.getAssignedUserId().equals(previousAssignedUserId)) {
                
                // Update assigned user
                existingDevice.setAssignedUserId(deviceRequest.getAssignedUserId());
                existingDevice.setAssignedBy(currentUser.getId());
                
                // Create notification for the newly assigned user
                createDeviceAssignmentNotification(existingDevice, deviceRequest.getAssignedUserId(), 
                                                  currentUser.getOrganizationId(), currentUser.getId());
                
                logger.info("✅ Device assignment changed from {} to {} for device: {}", 
                           previousAssignedUserId, deviceRequest.getAssignedUserId(), id);
            }
            
            // Always update the timestamp
            existingDevice.setUpdatedAt(LocalDateTime.now());
            
            Device updatedDevice = deviceRepository.save(existingDevice);
            
            logger.info("✅ Device updated successfully: {} by user: {}", id, currentUser.getEmail());
            
            return ResponseEntity.ok(updatedDevice);
            
        } catch (Exception e) {
            logger.error("❌ Error updating device: {} by user: {}", id, currentUser.getEmail(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Failed to update device",
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 DELETE request received for device ID: {}", id);
        logger.info("🔍 User details: {}", userDetails != null ? "present" : "null");
        
        // Enhanced authentication validation
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ Authentication failed - user details or user is null");
            return ResponseEntity.status(401).body(Map.of(
                "success", false,
                "error", "Authentication failed",
                "message", "User not authenticated",
                "timestamp", java.time.LocalDateTime.now().toString(),
                "errorCode", "AUTH_001"
            ));
        }
        
        User user = userDetails.getUser();
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        // Validate user organization
        if (organizationId == null || organizationId.trim().isEmpty()) {
            logger.error("❌ User {} has no organization ID", userEmail);
            return ResponseEntity.status(400).body(Map.of(
                "success", false,
                "error", "Invalid user configuration",
                "message", "User is not associated with any organization",
                "timestamp", java.time.LocalDateTime.now().toString(),
                "errorCode", "USER_001"
            ));
        }
        
        logger.info("🔍 User {} (org: {}) attempting to delete device: {}", userEmail, organizationId, id);
        
        // Enhanced device ID validation
        if (id == null || id.trim().isEmpty()) {
            logger.warn("❌ Invalid device ID provided by user {}: '{}'", userEmail, id);
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Invalid device ID",
                "message", "Device ID cannot be null or empty",
                "timestamp", java.time.LocalDateTime.now().toString(),
                "errorCode", "DEVICE_001"
            ));
        }
        
        String trimmedId = id.trim();
        logger.info("🔍 Trimmed device ID: '{}'", trimmedId);
        
        // Check if device exists before attempting deletion
        try {
            Optional<Device> existingDevice = deviceRepository.findByIdAndOrganizationId(trimmedId, organizationId);
            if (existingDevice.isEmpty()) {
                logger.warn("❌ Device {} not found in organization {} for user {}", trimmedId, organizationId, userEmail);
                return ResponseEntity.status(404).body(Map.of(
                    "success", false,
                    "error", "Device not found",
                    "message", "Device was not found or you don't have access to it",
                    "deviceId", trimmedId,
                    "timestamp", java.time.LocalDateTime.now().toString(),
                    "errorCode", "DEVICE_002"
                ));
            }
            
            Device device = existingDevice.get();
            logger.info("✅ Device found: {} ({}) - Status: {}", device.getName(), trimmedId, device.getStatus());
            
            // Check if device is currently in use
            if (device.getStatus() == Device.DeviceStatus.ONLINE) {
                logger.warn("⚠️ User {} attempting to delete ONLINE device: {} - {}", userEmail, trimmedId, device.getName());
            }
            
        } catch (Exception e) {
            logger.error("❌ Error checking device existence for device {}: {}", trimmedId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Database error",
                "message", "Failed to verify device existence",
                "deviceId", trimmedId,
                "timestamp", java.time.LocalDateTime.now().toString(),
                "errorCode", "DB_001"
            ));
        }
        
        try {
            logger.info("🔍 Starting device deletion process for device: {}", trimmedId);
            
            // Get device info before deletion for broadcasting
            Optional<Device> deviceToDelete = deviceRepository.findByIdAndOrganizationId(trimmedId, organizationId);
            String deviceName = deviceToDelete.map(Device::getName).orElse("Unknown Device");
            
            // Perform the actual deletion
            deviceService.deleteDevice(trimmedId, organizationId);
            logger.info("✅ Device {} deleted successfully", trimmedId);
            
            // Broadcast device deletion
            try {
                deviceWebSocketService.broadcastDeviceDeletion(trimmedId, deviceName, organizationId);
                logger.info("✅ Device deletion broadcast sent successfully");
            } catch (Exception e) {
                logger.error("⚠️ Failed to broadcast device deletion for device: {} - {}", trimmedId, e.getMessage());
                // Don't fail the deletion if broadcasting fails
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Device deleted successfully",
                "deviceId", trimmedId,
                "deviceName", deviceName,
                "deletedAt", java.time.LocalDateTime.now().toString(),
                "deletedBy", userEmail,
                "organizationId", organizationId
            ));
            
        } catch (RuntimeException e) {
            logger.error("❌ Failed to delete device {}: {}", trimmedId, e.getMessage(), e);
            
            // Provide more specific error messages based on the exception
            String errorType = "Deletion failed";
            String errorMessage = e.getMessage();
            String errorCode = "DELETION_001";
            
            if (errorMessage.contains("Device not found")) {
                errorType = "Device not found";
                errorMessage = "Device was not found or has already been deleted";
                errorCode = "DEVICE_003";
            } else if (errorMessage.contains("Failed to delete device connections")) {
                errorType = "Connection deletion failed";
                errorMessage = "Failed to delete device connections. Device may be in use.";
                errorCode = "CONNECTION_001";
            } else if (errorMessage.contains("Failed to delete rules")) {
                errorType = "Rules deletion failed";
                errorMessage = "Failed to delete device rules and configurations.";
                errorCode = "RULES_001";
            } else if (errorMessage.contains("Failed to delete maintenance")) {
                errorType = "Maintenance deletion failed";
                errorMessage = "Failed to delete maintenance schedules and tasks.";
                errorCode = "MAINTENANCE_001";
            } else if (errorMessage.contains("Failed to delete device documentation")) {
                errorType = "Documentation deletion failed";
                errorMessage = "Failed to delete device documentation.";
                errorCode = "DOCS_001";
            } else if (errorMessage.contains("Failed to delete PDF queries")) {
                errorType = "PDF queries deletion failed";
                errorMessage = "Failed to delete PDF queries related to the device.";
                errorCode = "PDF_001";
            } else if (errorMessage.contains("Failed to delete notifications")) {
                errorType = "Notifications deletion failed";
                errorMessage = "Failed to delete device notifications.";
                errorCode = "NOTIFICATION_001";
            }
            
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", errorType,
                "message", errorMessage,
                "deviceId", trimmedId,
                "errorCode", errorCode,
                "timestamp", java.time.LocalDateTime.now().toString(),
                "details", e.getMessage()
            ));
            
        } catch (Exception e) {
            logger.error("❌ Unexpected error during device deletion {}: {}", trimmedId, e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "error", "Unexpected error",
                "message", "An unexpected error occurred during device deletion",
                "deviceId", trimmedId,
                "errorCode", "UNKNOWN_001",
                "timestamp", java.time.LocalDateTime.now().toString(),
                "details", e.getMessage()
            ));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Device> updateDeviceStatus(@PathVariable String id, @RequestBody Device.DeviceStatus status, @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔧 PATCH /api/devices/{}/status called", id);
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ Authentication failed - no user details");
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("👤 User {} (org: {}) updating device {} status to: {}", userEmail, organizationId, id, status);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("❌ Invalid device ID provided by user {}: '{}'", userEmail, id);
            return ResponseEntity.badRequest().build();
        }
        
        if (status == null) {
            logger.warn("❌ Invalid status provided by user {}: '{}'", userEmail, status);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Device updatedDevice = deviceService.updateDeviceStatus(id.trim(), status, organizationId);
            logger.info("✅ Device {} status updated successfully to: {} by user: {}", id, status, userEmail);
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            logger.error("❌ Failed to update device {} status: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/telemetry")
    public ResponseEntity<?> postTelemetryData(@PathVariable String id, @Valid @RequestBody TelemetryDataRequest telemetryData, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.debug("Receiving telemetry data for device: {}", id);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID for telemetry data");
            return ResponseEntity.badRequest().body("Invalid device ID");
        }
        
        try {
            telemetryService.storeTelemetryData(id.trim(), telemetryData);
            logger.debug("Telemetry data stored successfully for device: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Failed to store telemetry data for device {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Failed to store telemetry data");
        }
    }

    @GetMapping("/{id}/telemetry")
    public ResponseEntity<String> getTelemetryData(@PathVariable String id, @RequestParam(defaultValue = "1h") String range, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.debug("User requesting telemetry data for device: {} with range: {}", id, range);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID for telemetry data request");
            return ResponseEntity.badRequest().body("Invalid device ID");
        }
        
        try {
            String telemetryData = telemetryService.getTelemetryData(id.trim(), range);
            return ResponseEntity.ok(telemetryData);
        } catch (Exception e) {
            logger.error("Failed to get telemetry data for device {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Failed to retrieve telemetry data");
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<DeviceStatsResponse> getDeviceStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} requesting device statistics", userEmail);
        
        try {
            DeviceStatsResponse stats = deviceService.getDeviceStats(organizationId);
            logger.debug("Device stats retrieved for user {}: total={}, online={}, offline={}", 
                       userEmail, stats.getTotal(), stats.getOnline(), stats.getOffline());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Failed to get device stats for user {}: {}", userEmail, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/documentation/{type}")
    public ResponseEntity<byte[]> downloadDeviceDocumentation(
            @PathVariable String id,
            @PathVariable String type,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} requesting device documentation: device={}, type={}", userEmail, id, type);
        
        if (id == null || id.trim().isEmpty() || type == null || type.trim().isEmpty()) {
            logger.warn("Invalid device ID or documentation type provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            // Get device to verify ownership
            Optional<Device> device = deviceService.getDevice(id.trim(), organizationId);
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, userEmail);
                return ResponseEntity.notFound().build();
            }
            
            // Get PDF from unified system
            List<UnifiedPDF> pdfs = unifiedPDFService.getPDFsByDeviceAndOrganization(id.trim(), organizationId);
            UnifiedPDF targetPDF = pdfs.stream()
                .filter(pdf -> pdf.getDocumentType().toString().toLowerCase().equals(type.trim().toLowerCase()))
                .findFirst()
                .orElse(null);
            
            if (targetPDF == null) {
                logger.warn("Documentation file not found for device {}: type={}", id, type);
                return ResponseEntity.notFound().build();
            }
            
            // For now, return a placeholder since we don't have actual file storage
            // In a real implementation, you would download from the external PDF service
            String filename = targetPDF.getOriginalFilename();
            String contentType = "application/pdf";
            
            logger.info("Documentation file found in unified system: device={}, type={}, filename={}", 
                       id, type, filename);
            
            // Return placeholder response - in production, download actual file from external service
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .body("PDF file download not yet implemented - file exists in unified system".getBytes());
                    
        } catch (Exception e) {
            logger.error("Failed to download device documentation: device={}, type={}, error={}", 
                        id, type, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/documentation")
    public ResponseEntity<Map<String, Object>> getDeviceDocumentationInfo(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} requesting device documentation info: device={}", userEmail, id);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Optional<Device> device = deviceService.getDevice(id.trim(), organizationId);
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, userEmail);
                return ResponseEntity.notFound().build();
            }
            
            // Get documentation info from unified PDF system
            List<UnifiedPDF> pdfs = unifiedPDFService.getPDFsByDeviceAndOrganization(id.trim(), organizationId);
            
            Map<String, Object> documentationInfo = buildDocumentationInfoFromUnifiedSystem(device.get(), id, pdfs);
            
            logger.debug("Documentation info retrieved for device {}: {}", id, documentationInfo);
            return ResponseEntity.ok(documentationInfo);
            
        } catch (Exception e) {
            logger.error("Failed to get device documentation info: device={}, error={}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get device PDF references from knowledge system for chat functionality
     */
    @GetMapping("/{id}/pdf-references")
    public ResponseEntity<Map<String, Object>> getDevicePDFReferences(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} requesting device PDF references: device={}", userEmail, id);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Optional<Device> device = deviceService.getDevice(id.trim(), organizationId);
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, userEmail);
                return ResponseEntity.notFound().build();
            }
            
            // Get PDF references from unified system
            List<UnifiedPDF> pdfReferences = unifiedPDFService.getPDFsByDeviceAndOrganization(id, organizationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("deviceId", id);
            response.put("deviceName", device.get().getName());
            response.put("pdfReferences", pdfReferences.stream().map(doc -> {
                Map<String, Object> docMap = new HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("name", doc.getName());
                docMap.put("originalFilename", doc.getOriginalFilename());
                docMap.put("documentType", doc.getDocumentType());
                docMap.put("fileSize", doc.getFileSize());
                docMap.put("processingStatus", doc.getProcessingStatus());
                docMap.put("vectorized", doc.getVectorized());
                docMap.put("uploadedAt", doc.getUploadedAt());
                docMap.put("processedAt", doc.getProcessedAt());
                docMap.put("deviceId", doc.getDeviceId());
                docMap.put("deviceName", doc.getDeviceName());
                return docMap;
            }).collect(Collectors.toList()));
            response.put("totalCount", pdfReferences.size());
            
            logger.debug("PDF references retrieved for device {}: {} documents", id, pdfReferences.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to get device PDF references: device={}, error={}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Test endpoint to manually store a PDF reference in the knowledge system
     * This is for debugging purposes only
     */
    @PostMapping("/{id}/test-pdf-storage")
    public ResponseEntity<Map<String, Object>> testPDFStorage(
            @PathVariable String id,
            @RequestBody Map<String, Object> testData,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        
        try {
            // Extract test data
            String deviceName = (String) testData.get("deviceName");
            String fileName = (String) testData.get("fileName");
            Long fileSize = Long.valueOf(testData.get("fileSize").toString());
            String documentType = (String) testData.get("documentType");
            
            logger.info("🧪 Testing PDF storage for device: {} with file: {}", id, fileName);
            
            // Test the storage method using unified system
            UnifiedPDF testPDF = unifiedPDFService.createDevicePDF(
                id, deviceName, fileName, "Test Document", UnifiedPDF.DocumentType.valueOf(documentType.toUpperCase()), fileSize, organizationId, "test_user"
            );
            
            // Try to retrieve it
            List<UnifiedPDF> pdfReferences = unifiedPDFService.getPDFsByDeviceAndOrganization(id, organizationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "PDF storage test completed");
            response.put("storedCount", pdfReferences.size());
            response.put("pdfReferences", pdfReferences.stream().map(doc -> {
                Map<String, Object> docMap = new HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("name", doc.getName());
                docMap.put("originalFilename", doc.getOriginalFilename());
                docMap.put("documentType", doc.getDocumentType());
                docMap.put("fileSize", doc.getFileSize());
                docMap.put("processingStatus", doc.getProcessingStatus());
                docMap.put("vectorized", doc.getVectorized());
                docMap.put("uploadedAt", doc.getUploadedAt());
                docMap.put("processedAt", doc.getProcessedAt());
                docMap.put("deviceId", doc.getDeviceId());
                docMap.put("deviceName", doc.getDeviceName());
                return docMap;
            }).collect(Collectors.toList()));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ PDF storage test failed for device: {} - {}", id, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("exceptionType", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Test endpoint to verify database connection and knowledge_documents table
     */
    @GetMapping("/{id}/test-db-connection")
    public ResponseEntity<Map<String, Object>> testDatabaseConnection(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        
        try {
            Map<String, Object> response = new HashMap<>();
            
            // Test 1: Check if we can access the unified_pdfs table
            try {
                List<UnifiedPDF> allPDFs = unifiedPDFService.getPDFsByOrganization(organizationId);
                long totalDocs = allPDFs.size();
                response.put("unifiedPdfTableAccessible", true);
                response.put("totalDocumentsInSystem", totalDocs);
                logger.info("✅ Unified PDFs table is accessible. Total documents: {}", totalDocs);
            } catch (Exception e) {
                response.put("unifiedPdfTableAccessible", false);
                response.put("unifiedPdfTableError", e.getMessage());
                logger.error("❌ Cannot access unified_pdfs table: {}", e.getMessage());
            }
            
            // Test 2: Check if we can find any documents for this organization
            try {
                List<UnifiedPDF> orgDocs = unifiedPDFService.getPDFsByOrganization(organizationId);
                response.put("organizationDocsAccessible", true);
                response.put("organizationDocumentsCount", orgDocs.size());
                logger.info("✅ Organization documents accessible. Count: {}", orgDocs.size());
            } catch (Exception e) {
                response.put("organizationDocsAccessible", false);
                response.put("organizationDocsError", e.getMessage());
                logger.error("❌ Cannot access organization documents: {}", e.getMessage());
            }
            
            // Test 3: Check if we can find any documents for this device
            try {
                List<UnifiedPDF> deviceDocs = unifiedPDFService.getPDFsByDeviceAndOrganization(id, organizationId);
                response.put("deviceDocsAccessible", true);
                response.put("deviceDocsCount", deviceDocs.size());
                logger.info("✅ Device documents accessible. Count: {}", deviceDocs.size());
            } catch (Exception e) {
                response.put("deviceDocsAccessible", false);
                response.put("deviceDocsError", e.getMessage());
                logger.error("❌ Cannot access device documents: {}", e.getMessage());
            }
            
            response.put("success", true);
            response.put("message", "Database connection test completed");
            response.put("deviceId", id);
            response.put("organizationId", organizationId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Database connection test failed for device: {} - {}", id, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            errorResponse.put("exceptionType", e.getClass().getSimpleName());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        logger.info("🏥 Health check endpoint called");
        return ResponseEntity.ok(Map.of(
            "status", "healthy",
            "timestamp", new Date(),
            "service", "IoT Platform Backend",
            "version", "1.0.0"
        ));
    }

    /**
     * Handle JSON processing errors during device data parsing
     */
    @ExceptionHandler(com.fasterxml.jackson.core.JsonProcessingException.class)
    public ResponseEntity<Map<String, Object>> handleJsonProcessingException(com.fasterxml.jackson.core.JsonProcessingException ex) {
        logger.error("❌ JSON processing error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = Map.of(
            "error", "Invalid JSON data",
            "message", "The device data could not be parsed. Please check the format.",
            "details", ex.getMessage(),
            "timestamp", new Date()
        );
        
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle validation errors for device requests
     */
    @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(org.springframework.web.bind.MethodArgumentNotValidException ex) {
        logger.error("❌ Validation error: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = Map.of(
            "error", "Validation failed",
            "message", "Device data validation failed. Please check the input.",
            "details", ex.getMessage(),
            "timestamp", new Date()
        );
        
        return ResponseEntity.badRequest().body(errorResponse);
    }

    /**
     * Handle missing request parameters with detailed logging
     */
    @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParameter(
            org.springframework.web.bind.MissingServletRequestParameterException ex) {
        
        logger.error("❌ Missing request parameter: {}", ex.getParameterName());
        logger.error("❌ Parameter type: {}", ex.getParameterType());
        logger.error("❌ Error message: {}", ex.getMessage());
        
        Map<String, Object> errorResponse = Map.of(
            "error", "Missing required parameter",
            "parameter", ex.getParameterName(),
            "type", ex.getParameterType(),
            "message", "Required request parameter '" + ex.getParameterName() + "' for method parameter type " + ex.getParameterType() + " is not present",
            "timestamp", new Date()
        );
        
        return ResponseEntity.badRequest().body(errorResponse);
    }

    // Helper methods
    private String getUserEmail(User user) {
        return user != null ? user.getEmail() : ANONYMOUS_USER;
    }
    
    private String getOrganizationId(User user) {
        return user != null ? user.getOrganizationId() : DEFAULT_ORGANIZATION;
    }
    
    private boolean isValidDeviceRequest(DeviceCreateWithFileRequest request) {
        // Enhanced validation with detailed logging
        logger.info("Validating device request for device: {}", request.getName());
        
        // Required field validation
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            logger.error("Device name is required");
            return false;
        }
        
        if (request.getType() == null) {
            logger.error("Device type is required");
            return false;
        }
        
        if (request.getLocation() == null || request.getLocation().trim().isEmpty()) {
            logger.error("Device location is required");
            return false;
        }
        
        if (request.getProtocol() == null) {
            logger.error("Device protocol is required");
            return false;
        }
        
        // Required device specifications
        if (request.getManufacturer() == null || request.getManufacturer().trim().isEmpty()) {
            logger.error("Manufacturer is required");
            return false;
        }
        
        if (request.getModel() == null || request.getModel().trim().isEmpty()) {
            logger.error("Model is required");
            return false;
        }
        
        // Note: MAC address field removed from simplified schema
        
        // Validate IP address format if provided
        if (request.getIpAddress() != null && !request.getIpAddress().trim().isEmpty()) {
            String ipPattern = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
            if (!request.getIpAddress().matches(ipPattern)) {
                logger.error("Invalid IP address format: {}", request.getIpAddress());
                return false;
            }
        }
        
        // Validate port number if provided
        if (request.getPort() != null && (request.getPort() < 1 || request.getPort() > 65535)) {
            logger.error("Invalid port number: {}", request.getPort());
            return false;
        }
        
        // Cross-field validation for protocol-specific requirements
        if (request.getProtocol() == Protocol.MQTT) {
            if (request.getMqttBroker() == null || request.getMqttBroker().trim().isEmpty()) {
                logger.error("MQTT broker is required for MQTT protocol");
                return false;
            }
            if (request.getMqttTopic() == null || request.getMqttTopic().trim().isEmpty()) {
                logger.error("MQTT topic is required for MQTT protocol");
                return false;
            }
        }
        
        // Note: Environmental and power fields removed from simplified schema
        
        // Validate field lengths
        if (request.getName() != null && request.getName().length() > 100) {
            logger.error("Device name exceeds maximum length of 100 characters");
            return false;
        }
        
        if (request.getLocation() != null && request.getLocation().length() > 200) {
            logger.error("Location exceeds maximum length of 200 characters");
            return false;
        }
        
        if (request.getManufacturer() != null && request.getManufacturer().length() > 100) {
            logger.error("Manufacturer exceeds maximum length of 100 characters");
            return false;
        }
        
        if (request.getModel() != null && request.getModel().length() > 100) {
            logger.error("Model exceeds maximum length of 100 characters");
            return false;
        }
        
        logger.info("Device request validation passed for device: {}", request.getName());
        return true;
    }
    
    private boolean validateFiles(MultipartFile manualFile, MultipartFile datasheetFile, MultipartFile certificateFile) {
        // Validate file types and sizes if files are provided
        if (manualFile != null && !manualFile.isEmpty()) {
            if (!fileStorageService.isValidFileType(manualFile.getOriginalFilename())) {
                logger.error("Invalid manual file type: {}", manualFile.getOriginalFilename());
                return false;
            }
            if (manualFile.getSize() > MAX_FILE_SIZE) {
                logger.error("Manual file size exceeds limit: {} bytes", manualFile.getSize());
                return false;
            }
        }
        
        if (datasheetFile != null && !datasheetFile.isEmpty()) {
            if (!fileStorageService.isValidFileType(datasheetFile.getOriginalFilename())) {
                logger.error("Invalid datasheet file type: {}", datasheetFile.getOriginalFilename());
                return false;
            }
            if (datasheetFile.getSize() > MAX_FILE_SIZE) {
                logger.error("Datasheet file size exceeds limit: {} bytes", datasheetFile.getSize());
                return false;
            }
        }
        
        if (certificateFile != null && !certificateFile.isEmpty()) {
            if (!fileStorageService.isValidFileType(certificateFile.getOriginalFilename())) {
                logger.error("Invalid certificate file type: {}", certificateFile.getOriginalFilename());
                return false;
            }
            if (certificateFile.getSize() > MAX_FILE_SIZE) {
                logger.error("Certificate file size exceeds limit: {} bytes", certificateFile.getSize());
                return false;
            }
        }
        
        return true;
    }
    
    private String getDocumentationFilePath(Device device, String type) {
        // Note: Documentation fields removed from simplified schema
        // Documentation is now handled through the unified PDF system
        return null;
    }
    
    private String getDocumentationFilename(String type) {
        return switch (type) {
            case "manual" -> "manual.pdf";
            case "datasheet" -> "datasheet.pdf";
            case "certificate" -> "certificate.pdf";
            default -> "document.pdf";
        };
    }
    
    private Map<String, Object> buildDocumentationInfo(Device device, String deviceId) {
        Map<String, Object> documentationInfo = new HashMap<>();
        documentationInfo.put("deviceId", deviceId);
        documentationInfo.put("deviceName", device.getName());
        
        // Check which documentation files are available
        Map<String, Object> files = new HashMap<>();
        
        // Note: Documentation fields removed from simplified schema
        // Documentation is now handled through the device documentation system
        files.put("manual", Map.of("available", false));
        files.put("datasheet", Map.of("available", false));
        files.put("certificate", Map.of("available", false));
        
        documentationInfo.put("files", files);
        return documentationInfo;
    }
    
    private Map<String, Object> buildDocumentationInfoFromUnifiedSystem(Device device, String deviceId, List<UnifiedPDF> pdfs) {
        Map<String, Object> documentationInfo = new HashMap<>();
        documentationInfo.put("deviceId", deviceId);
        documentationInfo.put("deviceName", device.getName());
        
        // Check which documentation files are available from unified PDF system
        Map<String, Object> files = new HashMap<>();
        
        // Check for manual
        boolean hasManual = pdfs.stream()
            .anyMatch(pdf -> pdf.getDocumentType() == UnifiedPDF.DocumentType.MANUAL);
        files.put("manual", Map.of("available", hasManual));
        
        // Check for datasheet
        boolean hasDatasheet = pdfs.stream()
            .anyMatch(pdf -> pdf.getDocumentType() == UnifiedPDF.DocumentType.DATASHEET);
        files.put("datasheet", Map.of("available", hasDatasheet));
        
        // Check for certificate
        boolean hasCertificate = pdfs.stream()
            .anyMatch(pdf -> pdf.getDocumentType() == UnifiedPDF.DocumentType.CERTIFICATE);
        files.put("certificate", Map.of("available", hasCertificate));
        
        // Add PDF count information
        documentationInfo.put("totalPDFs", pdfs.size());
        documentationInfo.put("pdfs", pdfs.stream()
            .map(pdf -> Map.of(
                "id", pdf.getId(),
                "name", pdf.getName(),
                "originalFilename", pdf.getOriginalFilename(),
                "documentType", pdf.getDocumentType(),
                "processingStatus", pdf.getProcessingStatus(),
                "uploadedAt", pdf.getUploadedAt()
            ))
            .collect(Collectors.toList()));
        
        documentationInfo.put("files", files);
        return documentationInfo;
    }
    
    private Map<String, Object> buildFileInfo(String fileUrl, String deviceId, String type) {
        if (fileUrl != null && !fileUrl.trim().isEmpty()) {
            Map<String, Object> fileInfo = new HashMap<>();
            fileInfo.put("available", true);
            fileInfo.put("url", "/devices/" + deviceId + "/documentation/" + type);
            try {
                fileInfo.put("size", fileStorageService.getFileSize(fileUrl));
            } catch (Exception e) {
                fileInfo.put("size", "unknown");
            }
            return fileInfo;
        } else {
            return Map.of("available", false);
        }
    }
    


    /**
     * Get device onboarding progress
     */
    @GetMapping("/{id}/onboarding-progress")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<?> getOnboardingProgress(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            String organizationId = user.getOrganizationId();
            
            Optional<Device> deviceOpt = deviceService.getDevice(id, organizationId);
            if (deviceOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if device has been processed with PDF
            List<Rule> rules = pdfProcessingService.getDeviceRules(id);
            List<DeviceMaintenance> maintenance = pdfProcessingService.getDeviceMaintenance(id);
            List<DeviceSafetyPrecaution> safetyPrecautions = pdfProcessingService.getDeviceSafetyPrecautions(id);
            
            Map<String, Object> progress = new HashMap<>();
            progress.put("stage", "complete");
            progress.put("progress", 100);
            progress.put("message", "Onboarding completed");
            progress.put("rulesCount", rules.size());
            progress.put("maintenanceCount", maintenance.size());
            progress.put("safetyCount", safetyPrecautions.size());
            
            return ResponseEntity.ok(progress);
            
        } catch (Exception e) {
            logger.error("Error retrieving onboarding progress for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve onboarding progress"));
        }
    }

    /**
     * Check if device onboarding is complete
     */
    @GetMapping("/{id}/onboarding-status")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<?> getOnboardingStatus(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            String organizationId = user.getOrganizationId();
            
            Optional<Device> deviceOpt = deviceService.getDevice(id, organizationId);
            if (deviceOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if device has been processed with PDF
            List<Rule> rules = pdfProcessingService.getDeviceRules(id);
            List<DeviceMaintenance> maintenance = pdfProcessingService.getDeviceMaintenance(id);
            List<DeviceSafetyPrecaution> safetyPrecautions = pdfProcessingService.getDeviceSafetyPrecautions(id);
            
            boolean completed = !rules.isEmpty() || !maintenance.isEmpty() || !safetyPrecautions.isEmpty();
            
            Map<String, Object> status = new HashMap<>();
            status.put("completed", completed);
            status.put("rulesCount", rules.size());
            status.put("maintenanceCount", maintenance.size());
            status.put("safetyCount", safetyPrecautions.size());
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            logger.error("Error checking onboarding status for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to check onboarding status"));
        }
    }

    /**
     * Get upcoming maintenance for dashboard
     */
    @GetMapping("/maintenance/upcoming")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<?> getUpcomingMaintenance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        try {
            String organizationId = user.getOrganizationId();
            logger.info("Fetching upcoming maintenance for organization: {}", organizationId);
            
            // Use the maintenance schedule service directly instead of PDF processing service
            List<DeviceMaintenance> upcomingMaintenance = maintenanceScheduleService.getUpcomingMaintenanceByOrganization(organizationId);
            long totalCount = maintenanceScheduleService.getMaintenanceCountByOrganization(organizationId);
            
            logger.info("Found {} upcoming maintenance tasks and {} total maintenance tasks for organization: {}", 
                       upcomingMaintenance.size(), totalCount, organizationId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("upcomingMaintenance", upcomingMaintenance);
            response.put("totalCount", totalCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving upcoming maintenance: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve upcoming maintenance"));
        }
    }

    /**
     * Device onboarding endpoint - simplified version without aiRules
     * Only accepts device data and PDF file
     */
    @PostMapping("/unified-onboarding")
    public ResponseEntity<DeviceCreateResponse> unifiedOnboarding(
            @RequestParam("deviceData") String deviceData,
            @RequestParam(value = "manualFile", required = false) MultipartFile manualFile,
            @RequestParam(value = "datasheetFile", required = false) MultipartFile datasheetFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("❌ Authentication failed: userDetails is null or user is null");
            return ResponseEntity.status(401).build();
        }
        
        try {
            logger.info("✅ User {} starting simplified device onboarding", userDetails.getUser().getEmail());
            
            // Parse device data
            ObjectMapper objectMapper = new ObjectMapper();
            DeviceCreateWithFileRequest deviceRequest = objectMapper.readValue(deviceData, DeviceCreateWithFileRequest.class);
            
            // Log file information
            if (manualFile != null) {
                logger.info("📁 Manual file received: name={}, size={} bytes, content-type={}", 
                           manualFile.getOriginalFilename(), manualFile.getSize(), manualFile.getContentType());
            }
            if (datasheetFile != null) {
                logger.info("📁 Datasheet file received: name={}, size={} bytes, content-type={}", 
                           datasheetFile.getOriginalFilename(), datasheetFile.getSize(), datasheetFile.getContentType());
            }
            if (certificateFile != null) {
                logger.info("📁 Certificate file received: name={}, size={} bytes, content-type={}", 
                           certificateFile.getOriginalFilename(), certificateFile.getSize(), certificateFile.getContentType());
            }
            
            // Get organization ID from authenticated user
            String organizationId = userDetails.getUser().getOrganizationId();
            logger.info("🏢 Using organization ID: {}", organizationId);
            
            // Call unified onboarding service with progress callback
            String currentUserId = userDetails.getUser().getId();
            
            // Create a simple progress callback that logs progress
            Consumer<UnifiedOnboardingProgress> progressCallback = (progress) -> {
                logger.info("📊 Onboarding Progress - Stage: {}, Progress: {}%, Message: {}", 
                           progress.getStage(), progress.getProgress(), progress.getMessage());
            };
            
            DeviceCreateResponse response = unifiedOnboardingService.completeUnifiedOnboarding(
                deviceRequest, manualFile, datasheetFile, certificateFile, organizationId, currentUserId, progressCallback);
            
            logger.info("✅ Device onboarding completed successfully for user: {}", userDetails.getUser().getEmail());
            return ResponseEntity.ok(response);
            
        } catch (JsonProcessingException e) {
            logger.error("❌ Failed to parse device data JSON", e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            logger.error("❌ Failed to onboard device: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get device documentation for chat queries
     */
    @GetMapping("/{deviceId}/documentation/chat")
    @Operation(summary = "Get device documentation for chat queries", 
               description = "Retrieve device documentation that can be used for chat queries")
    public ResponseEntity<?> getDeviceDocumentationForChat(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            logger.info("📚 Fetching device documentation for chat - Device: {}, User: {}", deviceId, userDetails.getUsername());
            
            List<UnifiedPDF> documentation = unifiedPDFService.getPDFsByDeviceAndOrganization(deviceId, userDetails.getUser().getOrganizationId());
            
            Map<String, Object> response = new HashMap<>();
            response.put("deviceId", deviceId);
            response.put("totalDocuments", documentation.size());
            response.put("documentation", documentation);
            
            logger.info("✅ Successfully fetched {} documentation entries for device: {}", documentation.size(), deviceId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Failed to fetch device documentation for chat - Device: {}", deviceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch device documentation for chat"));
        }
    }
    
    /**
     * Get device documentation summary for chat interface
     */
    @GetMapping("/{deviceId}/documentation/chat/summary")
    @Operation(summary = "Get device documentation summary for chat", 
               description = "Retrieve a summary of device documentation for the chat interface")
    public ResponseEntity<?> getDeviceDocumentationSummaryForChat(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            logger.info("📊 Fetching device documentation summary for chat - Device: {}, User: {}", deviceId, userDetails.getUsername());
            
            List<UnifiedPDF> documentation = unifiedPDFService.getPDFsByDeviceAndOrganization(deviceId, userDetails.getUser().getOrganizationId());
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("deviceId", deviceId);
            summary.put("totalDocuments", documentation.size());
            summary.put("documentTypes", documentation.stream()
                .map(UnifiedPDF::getDocumentType)
                .distinct()
                .collect(Collectors.toList()));
            summary.put("processingStatus", documentation.stream()
                .map(UnifiedPDF::getProcessingStatus)
                .distinct()
                .collect(Collectors.toList()));
            
            logger.info("✅ Successfully generated device documentation summary for chat - Device: {}", deviceId);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            logger.error("❌ Failed to generate device documentation summary for chat - Device: {}", deviceId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to generate device documentation summary for chat"));
        }
    }
    
    /**
     * Get device documentation by type for chat queries
     */
    @GetMapping("/{deviceId}/documentation/chat/type/{documentType}")
    @Operation(summary = "Get device documentation by type for chat", 
               description = "Retrieve device documentation of a specific type for chat queries")
    public ResponseEntity<?> getDeviceDocumentationByTypeForChat(
            @PathVariable String deviceId,
            @PathVariable String documentType,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        try {
            logger.info("📋 Fetching device documentation by type for chat - Device: {}, Type: {}, User: {}", 
                    deviceId, documentType, userDetails.getUsername());
            
            List<UnifiedPDF> allDocs = unifiedPDFService.getPDFsByType(userDetails.getUser().getOrganizationId(), UnifiedPDF.DocumentType.valueOf(documentType.toUpperCase()));
            List<UnifiedPDF> documentation = allDocs.stream()
                .filter(doc -> deviceId.equals(doc.getDeviceId()))
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("deviceId", deviceId);
            response.put("documentType", documentType);
            response.put("totalDocuments", documentation.size());
            response.put("documentation", documentation);
            
            logger.info("✅ Successfully fetched {} {} documentation entries for device: {}", 
                    documentation.size(), documentType, deviceId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Failed to fetch device documentation by type for chat - Device: {}, Type: {}", 
                    deviceId, documentType, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch device documentation by type for chat"));
        }
    }


    private String convertEmptyToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmedValue = value.trim();
        if (trimmedValue.isEmpty()) {
            logger.debug("🔄 Converting empty string to null for field update");
            return null;
        }
        return value;
    }

    private void createDeviceAssignmentNotification(Device device, String assignedUserId, String organizationId, String updatedBy) {
        try {
            // Get the assigned user
            Optional<User> assignedUserOpt = userRepository.findById(assignedUserId);
            if (assignedUserOpt.isPresent()) {
                User assignedUser = assignedUserOpt.get();
                
                // Get the user who made the update
                Optional<User> updatedByUserOpt = userRepository.findById(updatedBy);
                String updatedByUserName = updatedByUserOpt.map(user -> user.getFirstName() + " " + user.getLastName()).orElse("System");
                
                // Create enhanced notification for device assignment
                Notification notification = new Notification();
                notification.setTitle("Device Assignment Updated");
                notification.setMessage(String.format(
                    "You have been assigned a device by %s. The device is now ready for monitoring and management.",
                    updatedByUserName
                ));
                notification.setCategory(Notification.NotificationCategory.DEVICE_ASSIGNMENT);
                notification.setType(Notification.NotificationType.INFO); // Explicitly set type for backward compatibility
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
                    logger.info("✅ Created enhanced device assignment notification for user: {} for device: {}", 
                               assignedUser.getEmail(), device.getName());
                } else {
                    logger.info("⚠️ Device assignment notification blocked by user preferences for user: {}", 
                               assignedUser.getEmail());
                }
            } else {
                logger.warn("⚠️ Could not create notification - assigned user not found: {}", assignedUserId);
            }
        } catch (Exception e) {
            logger.error("❌ Failed to create device assignment notification for user: {} device: {}", 
                        assignedUserId, device.getId(), e);
            // Don't fail the device update if notification fails
        }
    }
}