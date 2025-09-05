package com.iotplatform.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.iotplatform.model.Device;
import com.iotplatform.model.Device.DeviceStatus;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.HashMap;

@Service
public class DeviceWebSocketService {

    private static final Logger logger = LoggerFactory.getLogger(DeviceWebSocketService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Send device status update to all connected clients
     */
    public void broadcastDeviceStatusUpdate(Device device) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "DEVICE_STATUS_UPDATE");
            message.put("deviceId", device.getId());
            message.put("status", device.getStatus());
            message.put("updatedAt", device.getUpdatedAt());
            message.put("deviceName", device.getName());
            message.put("organizationId", device.getOrganizationId());

            String messageJson = objectMapper.writeValueAsString(message);
            
            logger.info("📡 Broadcasting device status update: device={} ({}) status={} organization={}", 
                       device.getName(), device.getId(), device.getStatus(), device.getOrganizationId());
            
            // Broadcast to all clients
            messagingTemplate.convertAndSend("/topic/devices/status", messageJson);
            
            // Send to specific organization
            messagingTemplate.convertAndSend("/topic/organization/" + device.getOrganizationId() + "/devices/status", messageJson);
            
            logger.info("✅ Device status update broadcasted successfully for device: {} with status: {}", device.getId(), device.getStatus());
        } catch (Exception e) {
            logger.error("❌ Failed to broadcast device status update for device: {}", device.getId(), e);
        }
    }

    /**
     * Send device status update to specific user
     */
    public void sendDeviceStatusUpdateToUser(String userId, Device device) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "DEVICE_STATUS_UPDATE");
            message.put("deviceId", device.getId());
            message.put("status", device.getStatus());
            message.put("updatedAt", device.getUpdatedAt());
            message.put("deviceName", device.getName());

            String messageJson = objectMapper.writeValueAsString(message);
            
            messagingTemplate.convertAndSendToUser(userId, "/queue/devices/status", messageJson);
            
            logger.info("Sent device status update to user: {} for device: {} with status: {}", userId, device.getId(), device.getStatus());
        } catch (Exception e) {
            logger.error("Failed to send device status update to user: {} for device: {}", userId, device.getId(), e);
        }
    }

    /**
     * Send device list update to organization
     */
    public void broadcastDeviceListUpdate(String organizationId, Map<String, Object> deviceListData) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "DEVICE_LIST_UPDATE");
            message.put("organizationId", organizationId);
            message.put("data", deviceListData);

            String messageJson = objectMapper.writeValueAsString(message);
            
            messagingTemplate.convertAndSend("/topic/organization/" + organizationId + "/devices/list", messageJson);
            
            logger.info("Broadcasted device list update for organization: {}", organizationId);
        } catch (Exception e) {
            logger.error("Failed to broadcast device list update for organization: {}", organizationId, e);
        }
    }


    /**
     * Send device deletion notification
     */
    public void broadcastDeviceDeletion(String deviceId, String deviceName, String organizationId) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "DEVICE_DELETED");
            message.put("deviceId", deviceId);
            message.put("deviceName", deviceName);
            message.put("organizationId", organizationId);

            String messageJson = objectMapper.writeValueAsString(message);
            
            messagingTemplate.convertAndSend("/topic/organization/" + organizationId + "/devices/deleted", messageJson);
            
            logger.info("Broadcasted device deletion for device: {} in organization: {}", deviceId, organizationId);
        } catch (Exception e) {
            logger.error("Failed to broadcast device deletion for device: {}", deviceId, e);
        }
    }

    /**
     * Send device creation notification
     */
    public void broadcastDeviceCreation(Device device) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "DEVICE_CREATED");
            message.put("device", device);

            String messageJson = objectMapper.writeValueAsString(message);
            
            messagingTemplate.convertAndSend("/topic/organization/" + device.getOrganizationId() + "/devices/created", messageJson);
            
            logger.info("Broadcasted device creation for device: {} in organization: {}", device.getId(), device.getOrganizationId());
        } catch (Exception e) {
            logger.error("Failed to broadcast device creation for device: {}", device.getId(), e);
        }
    }

    /**
     * Send real-time device statistics update
     */
    public void broadcastDeviceStats(String organizationId, Map<String, Object> stats) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "DEVICE_STATS_UPDATE");
            message.put("organizationId", organizationId);
            message.put("stats", stats);

            String messageJson = objectMapper.writeValueAsString(message);
            
            messagingTemplate.convertAndSend("/topic/organization/" + organizationId + "/devices/stats", messageJson);
            
            logger.debug("Broadcasted device stats update for organization: {}", organizationId);
        } catch (Exception e) {
            logger.error("Failed to broadcast device stats for organization: {}", organizationId, e);
        }
    }
}
