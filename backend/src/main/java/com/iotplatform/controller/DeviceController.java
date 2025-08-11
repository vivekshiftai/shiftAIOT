package com.iotplatform.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iotplatform.dto.DeviceCreateResponse;
import com.iotplatform.dto.DeviceCreateWithFileRequest;
import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.User;
import com.iotplatform.service.DeviceService;
import com.iotplatform.service.FileStorageService;
import com.iotplatform.service.TelemetryService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/devices")
public class DeviceController {

    private static final Logger logger = LoggerFactory.getLogger(DeviceController.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final String ANONYMOUS_USER = "anonymous";
    private static final String DEFAULT_ORGANIZATION = "default";
    private static final int MAX_FILE_SIZE = 10485760; // 10MB in bytes

    private final DeviceService deviceService;
    private final TelemetryService telemetryService;
    private final FileStorageService fileStorageService;

    public DeviceController(DeviceService deviceService, TelemetryService telemetryService, FileStorageService fileStorageService) {
        this.deviceService = deviceService;
        this.telemetryService = telemetryService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<Device>> getAllDevices(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
        logger.info("User {} requesting devices with filters - status: {}, type: {}, search: {}", 
                   userEmail, status, type, search);
        logger.info("Organization ID: {}", organizationId);
        
        List<Device> devices;
        
        try {
            if (search != null && !search.trim().isEmpty()) {
                devices = deviceService.searchDevices(organizationId, search.trim());
                logger.info("Found {} devices matching search: {}", devices.size(), search);
            } else if (status != null && !status.trim().isEmpty()) {
                devices = deviceService.getDevicesByStatus(organizationId, Device.DeviceStatus.valueOf(status.toUpperCase()));
                logger.info("Found {} devices with status: {}", devices.size(), status);
            } else if (type != null && !type.trim().isEmpty()) {
                devices = deviceService.getDevicesByType(organizationId, Device.DeviceType.valueOf(type.toUpperCase()));
                logger.info("Found {} devices with type: {}", devices.size(), type);
            } else {
                devices = deviceService.getAllDevices(organizationId);
                logger.info("Found {} total devices for organization: {}", devices.size(), organizationId);
            }
            
            logger.info("Returning {} devices to user: {}", devices.size(), userEmail);
            return ResponseEntity.ok(devices);
        } catch (IllegalArgumentException e) {
            logger.error("Invalid filter parameter for user {}: {}", userEmail, e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            logger.error("Error getting devices for user {}: {}", userEmail, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Device> getDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
    public ResponseEntity<Device> createDevice(@Valid @RequestBody Device device, @AuthenticationPrincipal User user) {
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
        logger.info("User {} creating new device: {}", userEmail, device.getName());
        
        try {
            Device createdDevice = deviceService.createDevice(device, organizationId);
            logger.info("Device {} created successfully with ID: {}", device.getName(), createdDevice.getId());
            return ResponseEntity.ok(createdDevice);
        } catch (Exception e) {
            logger.error("Failed to create device {}: {}", device.getName(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/with-files")
    public ResponseEntity<DeviceCreateResponse> createDeviceWithFiles(
            @RequestParam("deviceData") String deviceData,
            @RequestParam(value = "manualFile", required = false) MultipartFile manualFile,
            @RequestParam(value = "datasheetFile", required = false) MultipartFile datasheetFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @AuthenticationPrincipal User user) {
        
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
    public ResponseEntity<Device> updateDevice(@PathVariable String id, @Valid @RequestBody Device deviceDetails, @AuthenticationPrincipal User user) {
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
    public ResponseEntity<?> deleteDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
    public ResponseEntity<Device> updateDeviceStatus(@PathVariable String id, @RequestBody Device.DeviceStatus status, @AuthenticationPrincipal User user) {
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
    public ResponseEntity<?> postTelemetryData(@PathVariable String id, @Valid @RequestBody TelemetryDataRequest telemetryData) {
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
    public ResponseEntity<String> getTelemetryData(@PathVariable String id, @RequestParam(defaultValue = "1h") String range) {
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
    public ResponseEntity<DeviceStatsResponse> getDeviceStats(@AuthenticationPrincipal User user) {
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
            @AuthenticationPrincipal User user) {
        
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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
            @AuthenticationPrincipal User user) {
        
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
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

    @PostMapping("/onboard-with-ai")
    public ResponseEntity<DeviceCreateResponse> onboardDeviceWithAI(
            @RequestParam("deviceData") String deviceData,
            @RequestParam(value = "manualFile", required = false) MultipartFile manualFile,
            @RequestParam(value = "datasheetFile", required = false) MultipartFile datasheetFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @RequestParam(value = "aiRules", required = false) String aiRulesJson,
            @AuthenticationPrincipal User user) {
        
        String userEmail = getUserEmail(user);
        String organizationId = getOrganizationId(user);
        
        logger.info("User {} starting AI-powered device onboarding", userEmail);
        
        try {
            // Parse device data
            DeviceCreateWithFileRequest deviceRequest = objectMapper.readValue(deviceData, DeviceCreateWithFileRequest.class);
            
            // Create device with files
            DeviceCreateResponse response = deviceService.createDeviceWithFiles(deviceRequest, manualFile, datasheetFile, certificateFile, organizationId);
            
            // Log the device creation with maintenance details
            logger.info("Device created with ID: {} and maintenance schedule: {}", response.getId(), deviceRequest.getMaintenanceSchedule());
            
            // Process AI-generated rules if provided
            if (aiRulesJson != null && !aiRulesJson.trim().isEmpty()) {
                processAIRules(aiRulesJson, response.getId());
            }
            
            logger.info("AI-powered device onboarding completed for device: {}", response.getId());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to onboard device with AI: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/process-pdf-rag")
    public ResponseEntity<?> processPDFWithRAG(@RequestParam("pdfFile") MultipartFile pdfFile,
                                             @RequestParam("deviceId") String deviceId,
                                             @AuthenticationPrincipal User user) {
        try {
            String userEmail = getUserEmail(user);
            
            logger.info("User {} requesting PDF RAG processing for device {}", userEmail, deviceId);
            
            if (pdfFile == null || pdfFile.isEmpty()) {
                logger.warn("No PDF file provided for RAG processing by user {}", userEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "No PDF file provided"));
            }
            
            if (deviceId == null || deviceId.trim().isEmpty()) {
                logger.warn("Invalid device ID provided for RAG processing by user {}", userEmail);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid device ID"));
            }
            
            // Process PDF with RAG system
            Map<String, Object> result = deviceService.processPDFWithRAG(pdfFile, deviceId.trim());
            
            if (Boolean.TRUE.equals(result.get("success"))) {
                logger.info("PDF RAG processing completed successfully for device {}", deviceId);
                return ResponseEntity.ok(result);
            } else {
                logger.error("PDF RAG processing failed for device {}", deviceId);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
            }
            
        } catch (Exception e) {
            logger.error("Error in PDF RAG processing", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to process PDF with RAG: " + e.getMessage()));
        }
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
}