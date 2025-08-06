package com.iotplatform.controller;

import com.iotplatform.dto.DeviceStatsResponse;
import com.iotplatform.dto.TelemetryDataRequest;
import com.iotplatform.model.Device;
import com.iotplatform.model.User;
import com.iotplatform.service.DeviceService;
import com.iotplatform.service.TelemetryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/devices")
public class DeviceController {

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
        
        List<Device> devices;
        
        if (search != null && !search.isEmpty()) {
            devices = deviceService.searchDevices(user.getOrganizationId(), search);
        } else if (status != null) {
            devices = deviceService.getDevicesByStatus(user.getOrganizationId(), Device.DeviceStatus.valueOf(status.toUpperCase()));
        } else if (type != null) {
            devices = deviceService.getDevicesByType(user.getOrganizationId(), Device.DeviceType.valueOf(type.toUpperCase()));
        } else {
            devices = deviceService.getAllDevices(user.getOrganizationId());
        }
        
        return ResponseEntity.ok(devices);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<Device> getDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        Optional<Device> device = deviceService.getDevice(id, user.getOrganizationId());
        return device.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<Device> createDevice(@Valid @RequestBody Device device, @AuthenticationPrincipal User user) {
        Device createdDevice = deviceService.createDevice(device, user.getOrganizationId());
        return ResponseEntity.ok(createdDevice);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<Device> updateDevice(@PathVariable String id, @Valid @RequestBody Device deviceDetails, @AuthenticationPrincipal User user) {
        try {
            Device updatedDevice = deviceService.updateDevice(id, deviceDetails, user.getOrganizationId());
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_DELETE')")
    public ResponseEntity<?> deleteDevice(@PathVariable String id, @AuthenticationPrincipal User user) {
        try {
            deviceService.deleteDevice(id, user.getOrganizationId());
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<Device> updateDeviceStatus(@PathVariable String id, @RequestBody Device.DeviceStatus status, @AuthenticationPrincipal User user) {
        try {
            Device updatedDevice = deviceService.updateDeviceStatus(id, status, user.getOrganizationId());
            return ResponseEntity.ok(updatedDevice);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/telemetry")
    public ResponseEntity<?> postTelemetryData(@PathVariable String id, @Valid @RequestBody TelemetryDataRequest telemetryData, @AuthenticationPrincipal User user) {
        try {
            deviceService.processTelemetryData(id, telemetryData, user.getOrganizationId());
            return ResponseEntity.ok().body("Telemetry data processed successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/telemetry")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<String> getTelemetryData(@PathVariable String id, @RequestParam(defaultValue = "1h") String range) {
        String telemetryData = telemetryService.getTelemetryData(id, range);
        return ResponseEntity.ok(telemetryData);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<DeviceStatsResponse> getDeviceStats(@AuthenticationPrincipal User user) {
        DeviceStatsResponse stats = deviceService.getDeviceStats(user.getOrganizationId());
        return ResponseEntity.ok(stats);
    }
}