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
        
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} requesting devices with filters - status: {}, type: {}, search: {}", 
                   userEmail, status, type, search);
        logger.info("Organization ID: {}", organizationId);
        
        List<Device> devices;
        
        try {
            if (search != null && !search.isEmpty()) {
                devices = deviceService.searchDevices(organizationId, search);
                logger.info("Found {} devices matching search: {}", devices.size(), search);
            } else if (status != null) {
                devices = deviceService.getDevicesByStatus(organizationId, Device.DeviceStatus.valueOf(status.toUpperCase()));
                logger.info("Found {} devices with status: {}", devices.size(), status);
            } else if (type != null) {
                devices = deviceService.getDevicesByType(organizationId, Device.DeviceType.valueOf(type.toUpperCase()));
                logger.info("Found {} devices with type: {}", devices.size(), type);
            } else {
                devices = deviceService.getAllDevices(organizationId);
                logger.info("Found {} total devices for organization: {}", devices.size(), organizationId);
            }
            
            logger.info("Returning {} devices to user: {}", devices.size(), userEmail);
            return ResponseEntity.ok(devices);
        } catch (Exception e) {
            logger.error("Error getting devices for user {}: {}", userEmail, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Device> getDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} requesting device with ID: {}", userEmail, id);
        
        Optional<Device> device = deviceService.getDevice(id, organizationId);
        
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
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
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
        
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} creating new device with files: {}", userEmail, deviceData);
        
        try {
            // Parse the device data JSON string
            DeviceCreateWithFileRequest request = objectMapper.readValue(deviceData, DeviceCreateWithFileRequest.class);
            
            // Enhanced validation for device data
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                logger.error("Device name is required");
                return ResponseEntity.badRequest().body(null);
            }
            
            if (request.getType() == null) {
                logger.error("Device type is required");
                return ResponseEntity.badRequest().body(null);
            }
            
            if (request.getLocation() == null || request.getLocation().trim().isEmpty()) {
                logger.error("Device location is required");
                return ResponseEntity.badRequest().body(null);
            }
            
            if (request.getProtocol() == null) {
                logger.error("Device protocol is required");
                return ResponseEntity.badRequest().body(null);
            }
            
            // Validate MAC address format if provided
            if (request.getMacAddress() != null && !request.getMacAddress().trim().isEmpty()) {
                String macPattern = "^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$";
                if (!request.getMacAddress().matches(macPattern)) {
                    logger.error("Invalid MAC address format: {}", request.getMacAddress());
                    return ResponseEntity.badRequest().body(null);
                }
            }
            
            // Validate IP address format if provided
            if (request.getIpAddress() != null && !request.getIpAddress().trim().isEmpty()) {
                String ipPattern = "^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$";
                if (!request.getIpAddress().matches(ipPattern)) {
                    logger.error("Invalid IP address format: {}", request.getIpAddress());
                    return ResponseEntity.badRequest().body(null);
                }
            }
            
            // Validate port number if provided
            if (request.getPort() != null && (request.getPort() < 1 || request.getPort() > 65535)) {
                logger.error("Invalid port number: {}", request.getPort());
                return ResponseEntity.badRequest().body(null);
            }
            
            // Validate environmental specifications
            if (request.getOperatingTemperatureMin() != null && request.getOperatingTemperatureMax() != null) {
                if (request.getOperatingTemperatureMin() >= request.getOperatingTemperatureMax()) {
                    logger.error("Operating temperature min must be less than max");
                    return ResponseEntity.badRequest().body(null);
                }
            }
            
            if (request.getOperatingHumidityMin() != null && request.getOperatingHumidityMax() != null) {
                if (request.getOperatingHumidityMin() >= request.getOperatingHumidityMax()) {
                    logger.error("Operating humidity min must be less than max");
                    return ResponseEntity.badRequest().body(null);
                }
            }
            
            // Validate power consumption if provided
            if (request.getPowerConsumption() != null && request.getPowerConsumption() < 0) {
                logger.error("Power consumption must be positive");
                return ResponseEntity.badRequest().body(null);
            }
            
            // Validate file types and sizes if files are provided
            if (manualFile != null && !manualFile.isEmpty()) {
                if (!fileStorageService.isValidFileType(manualFile.getOriginalFilename())) {
                    logger.error("Invalid manual file type: {}", manualFile.getOriginalFilename());
                    return ResponseEntity.badRequest().body(null);
                }
                if (manualFile.getSize() > 10485760) { // 10MB limit
                    logger.error("Manual file size exceeds limit: {} bytes", manualFile.getSize());
                    return ResponseEntity.status(413).body(null);
                }
            }
            
            if (datasheetFile != null && !datasheetFile.isEmpty()) {
                if (!fileStorageService.isValidFileType(datasheetFile.getOriginalFilename())) {
                    logger.error("Invalid datasheet file type: {}", datasheetFile.getOriginalFilename());
                    return ResponseEntity.badRequest().body(null);
                }
                if (datasheetFile.getSize() > 10485760) { // 10MB limit
                    logger.error("Datasheet file size exceeds limit: {} bytes", datasheetFile.getSize());
                    return ResponseEntity.status(413).body(null);
                }
            }
            
            if (certificateFile != null && !certificateFile.isEmpty()) {
                if (!fileStorageService.isValidFileType(certificateFile.getOriginalFilename())) {
                    logger.error("Invalid certificate file type: {}", certificateFile.getOriginalFilename());
                    return ResponseEntity.badRequest().body(null);
                }
                if (certificateFile.getSize() > 10485760) { // 10MB limit
                    logger.error("Certificate file size exceeds limit: {} bytes", certificateFile.getSize());
                    return ResponseEntity.status(413).body(null);
                }
            }
            
            DeviceCreateResponse response = deviceService.createDeviceWithFiles(request, manualFile, datasheetFile, certificateFile, organizationId);
            logger.info("Device {} created successfully with files, ID: {}", request.getName(), response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to create device with files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Device> updateDevice(@PathVariable String id, @Valid @RequestBody Device deviceDetails, @AuthenticationPrincipal User user) {
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} updating device: {}", userEmail, id);
        
        try {
            Device updatedDevice = deviceService.updateDevice(id, deviceDetails, organizationId);
            logger.info("Device {} updated successfully", id);
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            logger.error("Failed to update device {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} deleting device: {}", userEmail, id);
        
        try {
            deviceService.deleteDevice(id, organizationId);
            logger.info("Device {} deleted successfully", id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Failed to delete device {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Device> updateDeviceStatus(@PathVariable String id, @RequestBody Device.DeviceStatus status, @AuthenticationPrincipal User user) {
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} updating device {} status to: {}", userEmail, id, status);
        
        try {
            Device updatedDevice = deviceService.updateDeviceStatus(id, status, organizationId);
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
        
        try {
            telemetryService.storeTelemetryData(id, telemetryData);
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
        
        try {
            String telemetryData = telemetryService.getTelemetryData(id, range);
            return ResponseEntity.ok(telemetryData);
        } catch (Exception e) {
            logger.error("Failed to get telemetry data for device {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body("Failed to retrieve telemetry data");
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<DeviceStatsResponse> getDeviceStats(@AuthenticationPrincipal User user) {
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
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
        
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} requesting device documentation: device={}, type={}", userEmail, id, type);
        
        try {
            // Get device to verify ownership and get file path
            Optional<Device> device = deviceService.getDevice(id, organizationId);
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, userEmail);
                return ResponseEntity.notFound().build();
            }
            
            String filePath = null;
            String contentType = null;
            String filename = null;
            
            switch (type.toLowerCase()) {
                case "manual":
                    filePath = device.get().getManualUrl();
                    filename = "manual.pdf";
                    break;
                case "datasheet":
                    filePath = device.get().getDatasheetUrl();
                    filename = "datasheet.pdf";
                    break;
                case "certificate":
                    filePath = device.get().getCertificateUrl();
                    filename = "certificate.pdf";
                    break;
                default:
                    logger.error("Invalid documentation type: {}", type);
                    return ResponseEntity.badRequest().build();
            }
            
            if (filePath == null || filePath.trim().isEmpty()) {
                logger.warn("Documentation file not found for device {}: type={}", id, type);
                return ResponseEntity.notFound().build();
            }
            
            // Load file from storage
            byte[] fileContent = fileStorageService.loadFile(filePath);
            contentType = fileStorageService.getFileType(filename);
            
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
        
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} requesting device documentation info: device={}", userEmail, id);
        
        try {
            Optional<Device> device = deviceService.getDevice(id, organizationId);
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, userEmail);
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> documentationInfo = new HashMap<>();
            documentationInfo.put("deviceId", id);
            documentationInfo.put("deviceName", device.get().getName());
            
            // Check which documentation files are available
            Map<String, Object> files = new HashMap<>();
            
            if (device.get().getManualUrl() != null && !device.get().getManualUrl().trim().isEmpty()) {
                Map<String, Object> manualInfo = new HashMap<>();
                manualInfo.put("available", true);
                manualInfo.put("url", "/devices/" + id + "/documentation/manual");
                try {
                    manualInfo.put("size", fileStorageService.getFileSize(device.get().getManualUrl()));
                } catch (Exception e) {
                    manualInfo.put("size", "unknown");
                }
                files.put("manual", manualInfo);
            } else {
                files.put("manual", Map.of("available", false));
            }
            
            if (device.get().getDatasheetUrl() != null && !device.get().getDatasheetUrl().trim().isEmpty()) {
                Map<String, Object> datasheetInfo = new HashMap<>();
                datasheetInfo.put("available", true);
                datasheetInfo.put("url", "/devices/" + id + "/documentation/datasheet");
                try {
                    datasheetInfo.put("size", fileStorageService.getFileSize(device.get().getDatasheetUrl()));
                } catch (Exception e) {
                    datasheetInfo.put("size", "unknown");
                }
                files.put("datasheet", datasheetInfo);
            } else {
                files.put("datasheet", Map.of("available", false));
            }
            
            if (device.get().getCertificateUrl() != null && !device.get().getCertificateUrl().trim().isEmpty()) {
                Map<String, Object> certificateInfo = new HashMap<>();
                certificateInfo.put("available", true);
                certificateInfo.put("url", "/devices/" + id + "/documentation/certificate");
                try {
                    certificateInfo.put("size", fileStorageService.getFileSize(device.get().getCertificateUrl()));
                } catch (Exception e) {
                    certificateInfo.put("size", "unknown");
                }
                files.put("certificate", certificateInfo);
            } else {
                files.put("certificate", Map.of("available", false));
            }
            
            documentationInfo.put("files", files);
            
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
        
        String userEmail = user != null ? user.getEmail() : "anonymous";
        String organizationId = user != null ? user.getOrganizationId() : "default";
        
        logger.info("User {} starting AI-powered device onboarding", userEmail);
        
        try {
            // Parse device data
            DeviceCreateWithFileRequest deviceRequest = objectMapper.readValue(deviceData, DeviceCreateWithFileRequest.class);
            
                             // Create device with files
                 DeviceCreateResponse response = deviceService.createDeviceWithFiles(deviceRequest, manualFile, datasheetFile, certificateFile, organizationId);
                 
                 // Log the device creation with maintenance details
                 logger.info("Device created with ID: {} and maintenance schedule: {}", response.getId(), deviceRequest.getMaintenanceSchedule());
            
            // Process AI-generated rules if provided
            if (aiRulesJson != null && !aiRulesJson.isEmpty()) {
                try {
                    List<Map<String, Object>> aiRules = objectMapper.readValue(aiRulesJson, 
                        objectMapper.getTypeFactory().constructCollectionType(List.class, Map.class));
                    
                    logger.info("Processing {} AI-generated rules for device: {}", aiRules.size(), response.getId());
                    
                    // Here you would integrate with your AI service to process the rules
                    // For now, we'll just log the rules
                    for (Map<String, Object> ruleData : aiRules) {
                        if ((Boolean) ruleData.get("isSelected")) {
                            logger.info("Selected AI rule: {} - {}", ruleData.get("name"), ruleData.get("description"));
                        }
                    }
                    
                    logger.info("AI rules processed for device: {}", response.getId());
                } catch (Exception e) {
                    logger.warn("Failed to process AI rules for device {}: {}", response.getId(), e.getMessage());
                }
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
            String userEmail = user != null ? user.getEmail() : "anonymous";
            
            logger.info("User {} requesting PDF RAG processing for device {}", userEmail, deviceId);
            
            // Process PDF with RAG system
            Map<String, Object> result = deviceService.processPDFWithRAG(pdfFile, deviceId);
            
            if ((Boolean) result.get("success")) {
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
}