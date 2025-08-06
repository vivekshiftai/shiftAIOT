package com.iotplatform.controller;

import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
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

import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.User;
import com.iotplatform.service.DeviceService;
import com.iotplatform.service.TelemetryService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/devices")
public class DeviceController {

    private static final Logger logger = LoggerFactory.getLogger(DeviceController.class);

    @Autowired
    private DeviceService deviceService;

    @Autowired
    private TelemetryService telemetryService;

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
}