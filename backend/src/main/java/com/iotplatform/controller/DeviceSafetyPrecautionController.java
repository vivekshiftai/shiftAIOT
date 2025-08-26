package com.iotplatform.controller;

import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.service.DeviceSafetyPrecautionService;
import com.iotplatform.security.CustomUserDetails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/device-safety-precautions")
public class DeviceSafetyPrecautionController {
    
    private static final Logger logger = LoggerFactory.getLogger(DeviceSafetyPrecautionController.class);
    
    private final DeviceSafetyPrecautionService deviceSafetyPrecautionService;
    
    @Autowired
    public DeviceSafetyPrecautionController(DeviceSafetyPrecautionService deviceSafetyPrecautionService) {
        this.deviceSafetyPrecautionService = deviceSafetyPrecautionService;
    }
    
    @GetMapping
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> getAllSafetyPrecautions(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting all safety precautions for organization: {}", userDetails.getUser().getEmail(), organizationId);
        
        try {
            List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionService.getAllSafetyPrecautionsByOrganization(organizationId);
            logger.info("Found {} safety precautions for organization: {}", precautions.size(), organizationId);
            return ResponseEntity.ok(precautions);
        } catch (Exception e) {
            logger.error("Error fetching safety precautions for organization {}: {}", organizationId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> getSafetyPrecautionsByDevice(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting safety precautions for device: {}", userDetails.getUser().getEmail(), deviceId);
        
        try {
            List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionService.getAllSafetyPrecautionsByDevice(deviceId, organizationId);
            logger.info("Found {} safety precautions for device: {}", precautions.size(), deviceId);
            return ResponseEntity.ok(precautions);
        } catch (Exception e) {
            logger.error("Error fetching safety precautions for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/device/{deviceId}/active")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> getActiveSafetyPrecautionsByDevice(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting active safety precautions for device: {}", userDetails.getUser().getEmail(), deviceId);
        
        try {
            List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionService.getActiveSafetyPrecautionsByDevice(deviceId, organizationId);
            logger.info("Found {} active safety precautions for device: {}", precautions.size(), deviceId);
            return ResponseEntity.ok(precautions);
        } catch (Exception e) {
            logger.error("Error fetching active safety precautions for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<DeviceSafetyPrecaution> getSafetyPrecautionById(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} requesting safety precaution by ID: {}", userDetails.getUser().getEmail(), id);
        
        try {
            return deviceSafetyPrecautionService.getSafetyPrecautionById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            logger.error("Error fetching safety precaution by ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceSafetyPrecaution> createSafetyPrecaution(
            @RequestBody DeviceSafetyPrecaution safetyPrecaution,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        safetyPrecaution.setOrganizationId(organizationId);
        
        logger.info("User {} creating safety precaution for device: {}", userDetails.getUser().getEmail(), safetyPrecaution.getDeviceId());
        
        try {
            DeviceSafetyPrecaution createdPrecaution = deviceSafetyPrecautionService.createSafetyPrecaution(safetyPrecaution);
            logger.info("Safety precaution created successfully with ID: {} for device: {}", createdPrecaution.getId(), createdPrecaution.getDeviceId());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPrecaution);
        } catch (Exception e) {
            logger.error("Error creating safety precaution: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/bulk")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> createMultipleSafetyPrecautions(
            @RequestBody List<DeviceSafetyPrecaution> safetyPrecautions,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        
        // Set organization ID for all precautions
        for (DeviceSafetyPrecaution precaution : safetyPrecautions) {
            precaution.setOrganizationId(organizationId);
        }
        
        logger.info("User {} creating {} safety precautions", userDetails.getUser().getEmail(), safetyPrecautions.size());
        
        try {
            List<DeviceSafetyPrecaution> createdPrecautions = deviceSafetyPrecautionService.createMultipleSafetyPrecautions(safetyPrecautions);
            logger.info("Successfully created {} safety precautions", createdPrecautions.size());
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPrecautions);
        } catch (Exception e) {
            logger.error("Error creating multiple safety precautions: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceSafetyPrecaution> updateSafetyPrecaution(
            @PathVariable String id,
            @RequestBody DeviceSafetyPrecaution updatedPrecaution,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} updating safety precaution with ID: {}", userDetails.getUser().getEmail(), id);
        
        try {
            DeviceSafetyPrecaution updated = deviceSafetyPrecautionService.updateSafetyPrecaution(id, updatedPrecaution);
            logger.info("Safety precaution updated successfully");
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            logger.warn("Safety precaution with ID: {} not found", id);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error updating safety precaution: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<?> deleteSafetyPrecaution(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        logger.info("User {} deleting safety precaution with ID: {}", userDetails.getUser().getEmail(), id);
        
        try {
            deviceSafetyPrecautionService.deleteSafetyPrecaution(id);
            logger.info("Safety precaution deleted successfully");
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting safety precaution: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/device/{deviceId}")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<?> deleteSafetyPrecautionsByDevice(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} deleting all safety precautions for device: {}", userDetails.getUser().getEmail(), deviceId);
        
        try {
            deviceSafetyPrecautionService.deleteSafetyPrecautionsByDevice(deviceId, organizationId);
            logger.info("Safety precautions deleted successfully for device: {}", deviceId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Error deleting safety precautions for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/device/{deviceId}/type/{type}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> getSafetyPrecautionsByType(
            @PathVariable String deviceId,
            @PathVariable String type,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting safety precautions by type: {} for device: {}", userDetails.getUser().getEmail(), type, deviceId);
        
        try {
            List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionService.getSafetyPrecautionsByType(deviceId, type, organizationId);
            logger.info("Found {} safety precautions of type: {} for device: {}", precautions.size(), type, deviceId);
            return ResponseEntity.ok(precautions);
        } catch (Exception e) {
            logger.error("Error fetching safety precautions by type for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/device/{deviceId}/category/{category}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> getSafetyPrecautionsByCategory(
            @PathVariable String deviceId,
            @PathVariable String category,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting safety precautions by category: {} for device: {}", userDetails.getUser().getEmail(), category, deviceId);
        
        try {
            List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionService.getSafetyPrecautionsByCategory(deviceId, category, organizationId);
            logger.info("Found {} safety precautions of category: {} for device: {}", precautions.size(), category, deviceId);
            return ResponseEntity.ok(precautions);
        } catch (Exception e) {
            logger.error("Error fetching safety precautions by category for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/device/{deviceId}/severity/{severity}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceSafetyPrecaution>> getSafetyPrecautionsBySeverity(
            @PathVariable String deviceId,
            @PathVariable String severity,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting safety precautions by severity: {} for device: {}", userDetails.getUser().getEmail(), severity, deviceId);
        
        try {
            List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionService.getSafetyPrecautionsBySeverity(deviceId, severity, organizationId);
            logger.info("Found {} safety precautions of severity: {} for device: {}", precautions.size(), severity, deviceId);
            return ResponseEntity.ok(precautions);
        } catch (Exception e) {
            logger.error("Error fetching safety precautions by severity for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/device/{deviceId}/count")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<Map<String, Long>> getActiveSafetyPrecautionsCount(
            @PathVariable String deviceId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        
        String organizationId = userDetails.getUser().getOrganizationId();
        logger.info("User {} requesting active safety precautions count for device: {}", userDetails.getUser().getEmail(), deviceId);
        
        try {
            long count = deviceSafetyPrecautionService.getActiveSafetyPrecautionsCount(deviceId, organizationId);
            logger.info("Found {} active safety precautions for device: {}", count, deviceId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            logger.error("Error counting active safety precautions for device {}: {}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
