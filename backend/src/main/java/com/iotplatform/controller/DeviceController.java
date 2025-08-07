package com.iotplatform.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<Device>> getAllDevices(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String search) {
        
        logger.info("User {} requesting devices with filters - status: {}, type: {}, search: {}", 
                   user.getEmail(), status, type, search);
        
        List<Device> devices;
        
        if (search != null && !search.isEmpty()) {
            devices = deviceService.searchDevices(user.getOrganizationId(), search);
            logger.debug("Found {} devices matching search: {}", devices.size(), search);
        } else if (status != null) {
            devices = deviceService.getDevicesByStatus(user.getOrganizationId(), Device.DeviceStatus.valueOf(status.toUpperCase()));
            logger.debug("Found {} devices with status: {}", devices.size(), status);
        } else if (type != null) {
            devices = deviceService.getDevicesByType(user.getOrganizationId(), Device.DeviceType.valueOf(type.toUpperCase()));
            logger.debug("Found {} devices with type: {}", devices.size(), type);
        } else {
            devices = deviceService.getAllDevices(user.getOrganizationId());
            logger.debug("Found {} total devices", devices.size());
        }
        
        return ResponseEntity.ok(devices);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<Device> getDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        logger.info("User {} requesting device with ID: {}", user.getEmail(), id);
        
        Optional<Device> device = deviceService.getDevice(id, user.getOrganizationId());
        
        if (device.isPresent()) {
            logger.debug("Device {} found for user {}", id, user.getEmail());
            return ResponseEntity.ok(device.get());
        } else {
            logger.warn("Device {} not found for user {}", id, user.getEmail());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<Device> createDevice(@Valid @RequestBody Device device, @AuthenticationPrincipal User user) {
        logger.info("User {} creating new device: {}", user.getEmail(), device.getName());
        
        try {
            Device createdDevice = deviceService.createDevice(device, user.getOrganizationId());
            logger.info("Device {} created successfully with ID: {}", device.getName(), createdDevice.getId());
            return ResponseEntity.ok(createdDevice);
        } catch (Exception e) {
            logger.error("Failed to create device {}: {}", device.getName(), e.getMessage());
            throw e;
        }
    }

    @PostMapping("/with-files")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceCreateResponse> createDeviceWithFiles(
            @RequestParam("deviceData") String deviceData,
            @RequestParam(value = "manualFile", required = false) MultipartFile manualFile,
            @RequestParam(value = "datasheetFile", required = false) MultipartFile datasheetFile,
            @RequestParam(value = "certificateFile", required = false) MultipartFile certificateFile,
            @AuthenticationPrincipal User user) {
        
        logger.info("User {} creating new device with files: {}", user.getEmail(), deviceData);
        
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
            
            DeviceCreateResponse response = deviceService.createDeviceWithFiles(request, manualFile, datasheetFile, certificateFile, user.getOrganizationId());
            logger.info("Device {} created successfully with files, ID: {}", request.getName(), response.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to create device with files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<Device> updateDevice(@PathVariable String id, @Valid @RequestBody Device deviceDetails, @AuthenticationPrincipal User user) {
        logger.info("User {} updating device: {}", user.getEmail(), id);
        
        try {
            Device updatedDevice = deviceService.updateDevice(id, deviceDetails, user.getOrganizationId());
            logger.info("Device {} updated successfully", id);
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            logger.error("Failed to update device {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_DELETE')")
    public ResponseEntity<?> deleteDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        logger.info("User {} deleting device: {}", user.getEmail(), id);
        
        try {
            deviceService.deleteDevice(id, user.getOrganizationId());
            logger.info("Device {} deleted successfully", id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Failed to delete device {}: {}", id, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<Device> updateDeviceStatus(@PathVariable String id, @RequestBody Device.DeviceStatus status, @AuthenticationPrincipal User user) {
        logger.info("User {} updating device {} status to: {}", user.getEmail(), id, status);
        
        try {
            Device updatedDevice = deviceService.updateDeviceStatus(id, status, user.getOrganizationId());
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
    @PreAuthorize("hasAuthority('DEVICE_READ')")
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
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<DeviceStatsResponse> getDeviceStats(@AuthenticationPrincipal User user) {
        logger.info("User {} requesting device statistics", user.getEmail());
        
        try {
            DeviceStatsResponse stats = deviceService.getDeviceStats(user.getOrganizationId());
            logger.debug("Device stats retrieved for user {}: total={}, online={}, offline={}", 
                       user.getEmail(), stats.getTotal(), stats.getOnline(), stats.getOffline());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Failed to get device stats for user {}: {}", user.getEmail(), e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}/documentation/{type}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<byte[]> downloadDeviceDocumentation(
            @PathVariable String id,
            @PathVariable String type,
            @AuthenticationPrincipal User user) {
        
        logger.info("User {} requesting device documentation: device={}, type={}", user.getEmail(), id, type);
        
        try {
            // Get device to verify ownership and get file path
            Optional<Device> device = deviceService.getDevice(id, user.getOrganizationId());
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, user.getEmail());
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
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<Map<String, Object>> getDeviceDocumentationInfo(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        
        logger.info("User {} requesting device documentation info: device={}", user.getEmail(), id);
        
        try {
            Optional<Device> device = deviceService.getDevice(id, user.getOrganizationId());
            if (device.isEmpty()) {
                logger.warn("Device {} not found for user {}", id, user.getEmail());
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
}