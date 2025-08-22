package com.iotplatform.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Date;

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

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceCreateRequest;
import com.iotplatform.dto.DeviceStatsResponse;

import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.User;
import com.iotplatform.service.DeviceService;
import com.iotplatform.service.FileStorageService;
import com.iotplatform.service.TelemetryService;
import com.iotplatform.service.UnifiedOnboardingService;
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

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private static final Logger logger = LoggerFactory.getLogger(DeviceController.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ANONYMOUS_USER = "anonymous";
    private static final String DEFAULT_ORGANIZATION = "default";
    private static final int MAX_FILE_SIZE = 524288000; // 500MB in bytes

    private final DeviceService deviceService;
    private final TelemetryService telemetryService;
    private final FileStorageService fileStorageService;
    private final PDFProcessingService pdfProcessingService;
    private final UnifiedOnboardingService unifiedOnboardingService;
    private final RuleRepository ruleRepository;
    private final RuleConditionRepository ruleConditionRepository;
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository;
    private final DeviceRepository deviceRepository;
    private final UserRepository userRepository;

    public DeviceController(DeviceService deviceService, TelemetryService telemetryService, FileStorageService fileStorageService, PDFProcessingService pdfProcessingService, UnifiedOnboardingService unifiedOnboardingService, RuleRepository ruleRepository, RuleConditionRepository ruleConditionRepository, DeviceMaintenanceRepository deviceMaintenanceRepository, DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository, DeviceRepository deviceRepository, UserRepository userRepository) {
        this.deviceService = deviceService;
        this.telemetryService = telemetryService;
        this.fileStorageService = fileStorageService;
        this.pdfProcessingService = pdfProcessingService;
        this.unifiedOnboardingService = unifiedOnboardingService;
        this.ruleRepository = ruleRepository;
        this.ruleConditionRepository = ruleConditionRepository;
        this.deviceMaintenanceRepository = deviceMaintenanceRepository;
        this.deviceSafetyPrecautionRepository = deviceSafetyPrecautionRepository;
        this.deviceRepository = deviceRepository;
        this.userRepository = userRepository;
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
            
            DeviceCreateResponse response = deviceService.createDeviceWithFiles(request, manualFile, datasheetFile, certificateFile, organizationId);
            logger.info("Device {} created successfully with files, ID: {}", request.getName(), response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to create device with files: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Device> updateDevice(@PathVariable String id, @Valid @RequestBody Device deviceDetails, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} updating device: {}", userEmail, id);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Device updatedDevice = deviceService.updateDevice(id.trim(), deviceDetails, organizationId);
            logger.info("Device {} updated successfully", id);
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            logger.error("Failed to update device {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} deleting device: {}", userEmail, id);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            deviceService.deleteDevice(id.trim(), organizationId);
            logger.info("Device {} deleted successfully", id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Failed to delete device {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Device> updateDeviceStatus(@PathVariable String id, @RequestBody Device.DeviceStatus status, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} updating device {} status to: {}", userEmail, id, status);
        
        if (id == null || id.trim().isEmpty()) {
            logger.warn("Invalid device ID provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        if (status == null) {
            logger.warn("Invalid status provided by user {}", userEmail);
            return ResponseEntity.badRequest().build();
        }
        
        try {
            Device updatedDevice = deviceService.updateDeviceStatus(id.trim(), status, organizationId);
            logger.info("Device {} status updated to: {}", id, status);
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            logger.error("Failed to update device {} status: {}", id, e.getMessage());
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
            // Get device to verify ownership and get file path
            Optional<Device> device = deviceService.getDevice(id.trim(), organizationId);
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, userEmail);
                return ResponseEntity.notFound().build();
            }
            
            String filePath = getDocumentationFilePath(device.get(), type.trim().toLowerCase());
            if (filePath == null) {
                logger.warn("Documentation file not found for device {}: type={}", id, type);
                return ResponseEntity.notFound().build();
            }
            
            // Load file from storage
            byte[] fileContent = fileStorageService.loadFile(filePath);
            String filename = getDocumentationFilename(type.trim().toLowerCase());
            String contentType = fileStorageService.getFileType(filename);
            
            logger.info("Documentation file downloaded successfully: device={}, type={}, size={} bytes", 
                       id, type, fileContent.length);
            
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .body(fileContent);
                    
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
            
            Map<String, Object> documentationInfo = buildDocumentationInfo(device.get(), id);
            
            logger.debug("Documentation info retrieved for device {}: {}", id, documentationInfo);
            return ResponseEntity.ok(documentationInfo);
            
        } catch (Exception e) {
            logger.error("Failed to get device documentation info: device={}, error={}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/debug-db")
    public ResponseEntity<?> debugDatabase(@RequestParam String email) {
        logger.info("🔍 Debug database endpoint called for email: {}", email);
        
        try {
            // Check if user exists in database
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                logger.info("✅ User found in database: {}", user.getEmail());
                
                return ResponseEntity.ok(Map.of(
                    "status", "found",
                    "user", Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "firstName", user.getFirstName(),
                        "lastName", user.getLastName(),
                        "role", user.getRole(),
                        "organizationId", user.getOrganizationId(),
                        "enabled", user.isEnabled(),
                        "createdAt", user.getCreatedAt(),
                        "updatedAt", user.getUpdatedAt()
                    ),
                    "timestamp", new Date()
                ));
            } else {
                logger.warn("❌ User not found in database for email: {}", email);
                return ResponseEntity.status(404).body(Map.of(
                    "status", "not_found",
                    "message", "User not found in database",
                    "email", email,
                    "timestamp", new Date()
                ));
            }
        } catch (Exception e) {
            logger.error("❌ Database check failed for email: {}", email, e);
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", "Database check failed: " + e.getMessage(),
                "timestamp", new Date()
            ));
        }
    }

    @GetMapping("/debug-auth")
    public ResponseEntity<?> debugAuthentication(@AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 Debug authentication endpoint called");
        
        if (userDetails == null) {
            logger.warn("❌ userDetails is null");
            return ResponseEntity.status(401).body(Map.of(
                "status", "unauthenticated",
                "message", "No user details found",
                "timestamp", new Date()
            ));
        }
        
        if (userDetails.getUser() == null) {
            logger.warn("❌ userDetails.getUser() is null");
            return ResponseEntity.status(401).body(Map.of(
                "status", "unauthenticated",
                "message", "User object is null",
                "timestamp", new Date()
            ));
        }
        
        User user = userDetails.getUser();
        logger.info("✅ User authenticated successfully: {}", user.getEmail());
        
        return ResponseEntity.ok(Map.of(
            "status", "authenticated",
            "user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "role", user.getRole(),
                "organizationId", user.getOrganizationId(),
                "enabled", user.isEnabled()
            ),
            "authorities", userDetails.getAuthorities().stream()
                .map(Object::toString)
                .collect(java.util.stream.Collectors.toList()),
            "timestamp", new Date()
        ));
    }

    @PostMapping("/onboard-with-ai")
    public ResponseEntity<DeviceCreateResponse> onboardDeviceWithAI(
            @RequestParam("deviceData") String deviceData,
            @RequestParam(value = "manualFile", required = false) MultipartFile manualFile,
            @RequestParam(value = "datasheetFile", required = false) MultipartFile datasheetFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @RequestParam(value = "aiRules", required = false) String aiRulesJson,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        logger.info("onboardDeviceWithAI called - userDetails: {}, user: {}", 
                   userDetails != null, userDetails != null ? userDetails.getUser() != null : false);
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.error("Authentication failed: userDetails is null or user is null");
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        String userEmail = user.getEmail();
        String organizationId = user.getOrganizationId();
        
        logger.info("User {} starting unified AI-powered device onboarding", userEmail);
        
        // Log file information for debugging
        if (manualFile != null) {
            logger.info("Manual file received: name={}, size={} bytes, content-type={}", 
                manualFile.getOriginalFilename(), manualFile.getSize(), manualFile.getContentType());
        }
        if (datasheetFile != null) {
            logger.info("Datasheet file received: name={}, size={} bytes, content-type={}", 
                datasheetFile.getOriginalFilename(), datasheetFile.getSize(), datasheetFile.getContentType());
        }
        if (certificateFile != null) {
            logger.info("Certificate file received: name={}, size={} bytes, content-type={}", 
                certificateFile.getOriginalFilename(), certificateFile.getSize(), certificateFile.getContentType());
        }
        
        try {
            // Parse device data
            DeviceCreateWithFileRequest deviceRequest = objectMapper.readValue(deviceData, DeviceCreateWithFileRequest.class);
            logger.info("Device data parsed successfully: name={}, type={}", deviceRequest.getName(), deviceRequest.getType());
            
            // Use unified onboarding service for sequential workflow
            DeviceCreateResponse response = unifiedOnboardingService.completeUnifiedOnboarding(
                deviceRequest, manualFile, datasheetFile, certificateFile, organizationId
            );
            
            // Log the device creation with maintenance details
            logger.info("Unified onboarding completed for device: {} with ID: {}", deviceRequest.getName(), response.getId());
            
            // Process additional AI-generated rules if provided
            if (aiRulesJson != null && !aiRulesJson.trim().isEmpty()) {
                processAIRules(aiRulesJson, response.getId());
            }
            
            logger.info("AI-powered device onboarding completed successfully for device: {}", response.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to onboard device with AI: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/pdf-results")
    public ResponseEntity<?> getDevicePDFResults(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
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
            
            Device device = deviceOpt.get();
            
            // Get PDF processing results
            List<Rule> rules = pdfProcessingService.getDeviceRules(id);
            List<DeviceMaintenance> maintenance = pdfProcessingService.getDeviceMaintenance(id);
            List<DeviceSafetyPrecaution> safetyPrecautions = pdfProcessingService.getDeviceSafetyPrecautions(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("device", device);
            response.put("rules", rules);
            response.put("maintenance", maintenance);
            response.put("safetyPrecautions", safetyPrecautions);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving PDF results for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve PDF results"));
        }
    }

    @GetMapping("/{id}/maintenance")
    public ResponseEntity<?> getDeviceMaintenance(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
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
            
            List<DeviceMaintenance> maintenance = pdfProcessingService.getDeviceMaintenance(id);
            return ResponseEntity.ok(maintenance);
            
        } catch (Exception e) {
            logger.error("Error retrieving maintenance for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve maintenance data"));
        }
    }

    @GetMapping("/{id}/safety-precautions")
    public ResponseEntity<?> getDeviceSafetyPrecautions(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
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
            
            List<DeviceSafetyPrecaution> safetyPrecautions = pdfProcessingService.getDeviceSafetyPrecautions(id);
            return ResponseEntity.ok(safetyPrecautions);
            
        } catch (Exception e) {
            logger.error("Error retrieving safety precautions for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve safety precautions"));
        }
    }

    @GetMapping("/{id}/rules")
    public ResponseEntity<?> getDeviceRules(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
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
            
            List<Rule> rules = pdfProcessingService.getDeviceRules(id);
            logger.info("Retrieved {} rules for device: {}", rules.size(), id);
            return ResponseEntity.ok(rules);
            
        } catch (Exception e) {
            logger.error("Error retrieving rules for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve rules"));
        }
    }

    @GetMapping("/{id}/test-data")
    public ResponseEntity<?> getDeviceTestData(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
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
            
            Device device = deviceOpt.get();
            List<Rule> rules = pdfProcessingService.getDeviceRules(id);
            List<DeviceMaintenance> maintenance = pdfProcessingService.getDeviceMaintenance(id);
            List<DeviceSafetyPrecaution> safetyPrecautions = pdfProcessingService.getDeviceSafetyPrecautions(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("device", device);
            response.put("rules", rules);
            response.put("maintenance", maintenance);
            response.put("safetyPrecautions", safetyPrecautions);
            response.put("rulesCount", rules.size());
            response.put("maintenanceCount", maintenance.size());
            response.put("safetyCount", safetyPrecautions.size());
            
            logger.info("Test data for device {}: {} rules, {} maintenance, {} safety", 
                       id, rules.size(), maintenance.size(), safetyPrecautions.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving test data for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve test data"));
        }
    }

    @GetMapping("/{id}/debug-data")
    public ResponseEntity<?> getDeviceDebugData(@PathVariable String id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 Debug endpoint called for device: {}, userDetails: {}", id, userDetails != null ? "present" : "null");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ No user details found in debug endpoint");
            return ResponseEntity.status(401).body(Map.of("error", "No user details found"));
        }
        User user = userDetails.getUser();
        logger.info("✅ User authenticated: {} ({})", user.getEmail(), user.getOrganizationId());
        
        try {
            String organizationId = user.getOrganizationId();
            
            Optional<Device> deviceOpt = deviceService.getDevice(id, organizationId);
            if (deviceOpt.isEmpty()) {
                logger.warn("❌ Device not found: {}", id);
                return ResponseEntity.notFound().build();
            }
            
            Device device = deviceOpt.get();
            logger.info("✅ Device found: {} ({})", device.getName(), device.getOrganizationId());
            
            // Get all rules for the organization to see if any exist
            List<Rule> allRules = ruleRepository.findByOrganizationId(organizationId);
            
            // Get all rule conditions to see if any are linked to this device
            List<RuleCondition> allConditions = ruleConditionRepository.findAll();
            List<RuleCondition> deviceConditions = ruleConditionRepository.findByDeviceId(id);
            
            // Get all maintenance for the organization
            List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
            List<DeviceMaintenance> deviceMaintenance = deviceMaintenanceRepository.findByDeviceId(id);
            
            // Get all safety precautions for the organization
            List<DeviceSafetyPrecaution> allSafety = deviceSafetyPrecautionRepository.findByOrganizationId(organizationId);
            List<DeviceSafetyPrecaution> deviceSafety = deviceSafetyPrecautionRepository.findByDeviceId(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("device", Map.of(
                "id", device.getId(),
                "name", device.getName(),
                "organizationId", device.getOrganizationId(),
                "config", device.getConfig()
            ));
            response.put("debug", Map.of(
                "totalRulesInOrg", allRules.size(),
                "totalConditions", allConditions.size(),
                "deviceConditions", deviceConditions.size(),
                "totalMaintenanceInOrg", allMaintenance.size(),
                "deviceMaintenance", deviceMaintenance.size(),
                "totalSafetyInOrg", allSafety.size(),
                "deviceSafety", deviceSafety.size()
            ));
            response.put("deviceConditions", deviceConditions);
            response.put("deviceMaintenance", deviceMaintenance);
            response.put("deviceSafety", deviceSafety);
            
            logger.info("✅ Debug data for device {}: {} total rules, {} device conditions, {} device maintenance, {} device safety", 
                       id, allRules.size(), deviceConditions.size(), deviceMaintenance.size(), deviceSafety.size());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Error retrieving debug data for device: {}", id, e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve debug data", "exception", e.getMessage()));
        }
    }

    @GetMapping("/auth-test")
    public ResponseEntity<?> testAuthentication(@AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("🔍 Auth test endpoint called, userDetails: {}", userDetails != null ? "present" : "null");
        
        if (userDetails == null || userDetails.getUser() == null) {
            logger.warn("❌ No user details found in auth test");
            return ResponseEntity.status(401).body(Map.of("error", "No user details found"));
        }
        
        User user = userDetails.getUser();
        logger.info("✅ Auth test successful for user: {} ({})", user.getEmail(), user.getOrganizationId());
        
        return ResponseEntity.ok(Map.of(
            "message", "Authentication successful",
            "user", Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "organizationId", user.getOrganizationId(),
                "role", user.getRole()
            )
        ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, String>> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException e) {
        logger.error("File upload size exceeded: {}", e.getMessage());
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "File size too large");
        errorResponse.put("message", "The uploaded file exceeds the maximum allowed size of 500MB. Please try with a smaller file.");
        return ResponseEntity.status(413).body(errorResponse);
    }

    // Helper methods
    private String getUserEmail(User user) {
        return user != null ? user.getEmail() : ANONYMOUS_USER;
    }
    
    private String getOrganizationId(User user) {
        return user != null ? user.getOrganizationId() : DEFAULT_ORGANIZATION;
    }
    
    private boolean isValidDeviceRequest(DeviceCreateWithFileRequest request) {
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
        
        // Validate MAC address format if provided
        if (request.getMacAddress() != null && !request.getMacAddress().trim().isEmpty()) {
            String macPattern = "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$";
            if (!request.getMacAddress().matches(macPattern)) {
                logger.error("Invalid MAC address format: {}", request.getMacAddress());
                return false;
            }
        }
        
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
        
        // Validate environmental specifications
        if (request.getOperatingTemperatureMin() != null && request.getOperatingTemperatureMax() != null) {
            if (request.getOperatingTemperatureMin() >= request.getOperatingTemperatureMax()) {
                logger.error("Operating temperature min must be less than max");
                return false;
            }
        }
        
        if (request.getOperatingHumidityMin() != null && request.getOperatingHumidityMax() != null) {
            if (request.getOperatingHumidityMin() >= request.getOperatingHumidityMax()) {
                logger.error("Operating humidity min must be less than max");
                return false;
            }
        }
        
        // Validate power consumption if provided
        if (request.getPowerConsumption() != null && request.getPowerConsumption() < 0) {
            logger.error("Power consumption must be positive");
            return false;
        }
        
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
        return switch (type) {
            case "manual" -> device.getManualUrl();
            case "datasheet" -> device.getDatasheetUrl();
            case "certificate" -> device.getCertificateUrl();
            default -> null;
        };
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
        
        files.put("manual", buildFileInfo(device.getManualUrl(), deviceId, "manual"));
        files.put("datasheet", buildFileInfo(device.getDatasheetUrl(), deviceId, "datasheet"));
        files.put("certificate", buildFileInfo(device.getCertificateUrl(), deviceId, "certificate"));
        
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
    
    private void processAIRules(String aiRulesJson, String deviceId) {
        try {
            List<Map<String, Object>> aiRules = objectMapper.readValue(aiRulesJson, 
                new TypeReference<List<Map<String, Object>>>() {});
            
            logger.info("Processing {} AI-generated rules for device: {}", aiRules.size(), deviceId);
            
            // Here you would integrate with your AI service to process the rules
            // For now, we'll just log the rules
            for (Map<String, Object> ruleData : aiRules) {
                if (Boolean.TRUE.equals(ruleData.get("isSelected"))) {
                    logger.info("Selected AI rule: {} - {}", ruleData.get("name"), ruleData.get("description"));
                }
            }
            
            logger.info("AI rules processed for device: {}", deviceId);
        } catch (Exception e) {
            logger.warn("Failed to process AI rules for device {}: {}", deviceId, e.getMessage());
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
            // For now, we'll get maintenance for all devices in the organization
            // In a real implementation, you might want to get maintenance for specific devices
            List<DeviceMaintenance> upcomingMaintenance = new ArrayList<>();
            long totalCount = 0;
            
            // Get all devices for the organization and collect their maintenance
            List<Device> devices = deviceRepository.findByOrganizationId(organizationId);
            for (Device device : devices) {
                upcomingMaintenance.addAll(pdfProcessingService.getUpcomingMaintenance(device.getId()));
                totalCount += pdfProcessingService.getMaintenanceCount(device.getId());
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("upcomingMaintenance", upcomingMaintenance);
            response.put("totalCount", totalCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Error retrieving upcoming maintenance: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to retrieve upcoming maintenance"));
        }
    }
}