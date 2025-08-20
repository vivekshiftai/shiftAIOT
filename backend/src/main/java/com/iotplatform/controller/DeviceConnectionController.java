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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.model.DeviceConnection;
import com.iotplatform.model.User;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.DeviceConnectionService;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/device-connections")
public class DeviceConnectionController {

    private static final Logger logger = LoggerFactory.getLogger(DeviceConnectionController.class);

    @Autowired
    private DeviceConnectionService deviceConnectionService;

    @GetMapping
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceConnection>> getAllConnections(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} requesting device connections", user.getEmail());
        
        List<DeviceConnection> connections = deviceConnectionService.getAllConnections(user.getOrganizationId());
        logger.debug("Found {} device connections", connections.size());
        
        return ResponseEntity.ok(connections);
    }

    @GetMapping("/{deviceId}")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<DeviceConnection> getConnection(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} requesting connection for device: {}", user.getEmail(), deviceId);
        
        Optional<DeviceConnection> connection = deviceConnectionService.getConnection(deviceId, user.getOrganizationId());
        
        if (connection.isPresent()) {
            logger.debug("Connection found for device: {}", deviceId);
            return ResponseEntity.ok(connection.get());
        } else {
            logger.warn("Connection not found for device: {}", deviceId);
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceConnection> createConnection(@RequestBody DeviceConnection connection, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} creating connection for device: {}", user.getEmail(), connection.getDeviceId());
        
        try {
            DeviceConnection createdConnection = deviceConnectionService.createConnection(connection, user.getOrganizationId());
            logger.info("Connection created successfully for device: {}", connection.getDeviceId());
            return ResponseEntity.ok(createdConnection);
        } catch (Exception e) {
            logger.error("Failed to create connection for device {}: {}", connection.getDeviceId(), e.getMessage());
            throw e;
        }
    }

    @PutMapping("/{deviceId}")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceConnection> updateConnection(@PathVariable String deviceId, @RequestBody DeviceConnection connectionDetails, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} updating connection for device: {}", user.getEmail(), deviceId);
        
        try {
            DeviceConnection updatedConnection = deviceConnectionService.updateConnection(deviceId, connectionDetails, user.getOrganizationId());
            logger.info("Connection updated successfully for device: {}", deviceId);
            return ResponseEntity.ok(updatedConnection);
        } catch (RuntimeException e) {
            logger.error("Failed to update connection for device {}: {}", deviceId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{deviceId}")
    @PreAuthorize("hasAuthority('DEVICE_DELETE')")
    public ResponseEntity<?> deleteConnection(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} deleting connection for device: {}", user.getEmail(), deviceId);
        
        try {
            deviceConnectionService.deleteConnection(deviceId, user.getOrganizationId());
            logger.info("Connection deleted successfully for device: {}", deviceId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Failed to delete connection for device {}: {}", deviceId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{deviceId}/connect")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceConnection> connectDevice(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} connecting device: {}", user.getEmail(), deviceId);
        
        try {
            DeviceConnection connectedDevice = deviceConnectionService.connectDevice(deviceId, user.getOrganizationId());
            logger.info("Device {} connected successfully", deviceId);
            return ResponseEntity.ok(connectedDevice);
        } catch (RuntimeException e) {
            logger.error("Failed to connect device {}: {}", deviceId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{deviceId}/disconnect")
    @PreAuthorize("hasAuthority('DEVICE_WRITE')")
    public ResponseEntity<DeviceConnection> disconnectDevice(@PathVariable String deviceId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} disconnecting device: {}", user.getEmail(), deviceId);
        
        try {
            DeviceConnection disconnectedDevice = deviceConnectionService.disconnectDevice(deviceId, user.getOrganizationId());
            logger.info("Device {} disconnected successfully", deviceId);
            return ResponseEntity.ok(disconnectedDevice);
        } catch (RuntimeException e) {
            logger.error("Failed to disconnect device {}: {}", deviceId, e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/active")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<List<DeviceConnection>> getActiveConnections(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} requesting active connections", user.getEmail());
        
        List<DeviceConnection> activeConnections = deviceConnectionService.getActiveConnections(user.getOrganizationId());
        logger.debug("Found {} active connections", activeConnections.size());
        
        return ResponseEntity.ok(activeConnections);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAuthority('DEVICE_READ')")
    public ResponseEntity<ConnectionStats> getConnectionStats(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        logger.info("User {} requesting connection stats", user.getEmail());
        
        long activeCount = deviceConnectionService.getActiveConnectionCount(user.getOrganizationId());
        long totalCount = deviceConnectionService.getAllConnections(user.getOrganizationId()).size();
        
        ConnectionStats stats = new ConnectionStats(activeCount, totalCount);
        logger.debug("Connection stats - Active: {}, Total: {}", activeCount, totalCount);
        
        return ResponseEntity.ok(stats);
    }

    public static class ConnectionStats {
        private long activeConnections;
        private long totalConnections;

        public ConnectionStats(long activeConnections, long totalConnections) {
            this.activeConnections = activeConnections;
            this.totalConnections = totalConnections;
        }

        public long getActiveConnections() { return activeConnections; }
        public void setActiveConnections(long activeConnections) { this.activeConnections = activeConnections; }

        public long getTotalConnections() { return totalConnections; }
        public void setTotalConnections(long totalConnections) { this.totalConnections = totalConnections; }
    }
}
