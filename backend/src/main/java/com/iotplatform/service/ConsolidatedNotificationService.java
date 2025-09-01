package com.iotplatform.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.iotplatform.model.Device;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.model.Notification;
import com.iotplatform.model.Rule;
import com.iotplatform.model.User;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.DeviceRepository;
import com.iotplatform.repository.DeviceSafetyPrecautionRepository;
import com.iotplatform.repository.NotificationRepository;
import com.iotplatform.repository.RuleRepository;
import com.iotplatform.repository.UserRepository;

@Service
public class ConsolidatedNotificationService {

    private static final Logger logger = LoggerFactory.getLogger(ConsolidatedNotificationService.class);

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DeviceRepository deviceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RuleRepository ruleRepository;

    @Autowired
    private DeviceMaintenanceRepository maintenanceRepository;

    @Autowired
    private DeviceSafetyPrecautionRepository safetyRepository;

    @Autowired
    private NotificationRepository notificationRepository;



    /**
     * Create a consolidated notification for device assignment with all related information
     */
    public Optional<Notification> createConsolidatedDeviceNotification(
            String deviceId, 
            String assignedUserId, 
            String organizationId,
            String createdBy) {
        
        try {
            // Get device information
            Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
            if (deviceOpt.isEmpty()) {
                logger.error("❌ Device not found for consolidated notification: {}", deviceId);
                return Optional.empty();
            }
            Device device = deviceOpt.get();

            // Get assigned user information
            Optional<User> assignedUserOpt = userRepository.findById(assignedUserId);
            if (assignedUserOpt.isEmpty()) {
                logger.error("❌ Assigned user not found for consolidated notification: {}", assignedUserId);
                return Optional.empty();
            }
            User assignedUser = assignedUserOpt.get();

            // Get creator information
            Optional<User> creatorOpt = userRepository.findById(createdBy);
            String creatorName = creatorOpt.map(user -> user.getFirstName() + " " + user.getLastName()).orElse("System");

            // Collect all related information
            Map<String, Object> consolidatedData = buildConsolidatedData(deviceId, device, assignedUser, creatorName);

            // Create comprehensive notification
            Notification notification = new Notification();
            notification.setId(UUID.randomUUID().toString());
            notification.setUserId(assignedUserId);
            notification.setTitle("🎯 New Device Assignment - Complete Overview");
            notification.setMessage(buildConsolidatedMessage(consolidatedData));
            notification.setCategory(Notification.NotificationCategory.DEVICE_ASSIGNMENT);
            notification.setOrganizationId(organizationId);
            notification.setDeviceId(deviceId);
            notification.setRead(false);
            
            // Store basic metadata (complex data structure can't be stored directly as Map<String, String>)
            Map<String, String> metadataMap = new java.util.HashMap<>();
            metadataMap.put("deviceId", deviceId);
            metadataMap.put("deviceName", device.getName());
            metadataMap.put("assignedUserId", assignedUserId);
            metadataMap.put("creatorName", creatorName);
            
            // Get summary data safely
            Object summaryObj = consolidatedData.get("summary");
            if (summaryObj instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> summary = (Map<String, Object>) summaryObj;
                metadataMap.put("totalRules", String.valueOf(summary.getOrDefault("totalRules", 0)));
                metadataMap.put("totalMaintenanceTasks", String.valueOf(summary.getOrDefault("totalMaintenanceTasks", 0)));
                metadataMap.put("totalSafetyPrecautions", String.valueOf(summary.getOrDefault("totalSafetyPrecautions", 0)));
            } else {
                metadataMap.put("totalRules", "0");
                metadataMap.put("totalMaintenanceTasks", "0");
                metadataMap.put("totalSafetyPrecautions", "0");
            }
            notification.setMetadata(metadataMap);

            // Create notification with preference check
            Optional<Notification> createdNotification = notificationService.createNotificationWithPreferenceCheck(
                assignedUserId, notification);

            if (createdNotification.isPresent()) {
                logger.info("✅ Created consolidated device notification for user: {} for device: {}", 
                           assignedUser.getEmail(), device.getName());
                return createdNotification;
            } else {
                logger.warn("⚠️ Consolidated notification blocked by user preferences for user: {}", 
                           assignedUser.getEmail());
                return Optional.empty();
            }

        } catch (Exception e) {
            logger.error("❌ Failed to create consolidated device notification for device: {} user: {}", 
                        deviceId, assignedUserId, e);
            return Optional.empty();
        }
    }

    /**
     * Build consolidated data structure with all device-related information
     */
    private Map<String, Object> buildConsolidatedData(String deviceId, Device device, User assignedUser, String creatorName) {
        Map<String, Object> data = new java.util.HashMap<>();

        // Basic device information
        data.put("device", Map.of(
            "id", device.getId(),
            "name", device.getName(),
            "type", device.getType(),
            "status", device.getStatus(),
            "location", device.getLocation(),
            "protocol", device.getProtocol(),
            "manufacturer", device.getManufacturer(),
            "model", device.getModel(),
            "description", device.getDescription(),
            "createdAt", device.getCreatedAt()
        ));

        // User information
        data.put("assignedUser", Map.of(
            "id", assignedUser.getId(),
            "name", assignedUser.getFirstName() + " " + assignedUser.getLastName(),
            "email", assignedUser.getEmail()
        ));

        data.put("createdBy", creatorName);

        // Rules information
        List<Rule> rules = ruleRepository.findByDeviceId(deviceId);
        data.put("rules", rules.stream().map(rule -> Map.of(
            "id", rule.getId(),
            "name", rule.getName(),
            "description", rule.getDescription(),
            "active", rule.isActive(),
            "metric", rule.getMetric(),
            "threshold", rule.getThreshold()
        )).collect(Collectors.toList()));

        // Maintenance information
        List<DeviceMaintenance> maintenanceTasks = maintenanceRepository.findByDeviceId(deviceId);
        data.put("maintenance", maintenanceTasks.stream().map(maintenance -> Map.of(
            "id", maintenance.getId(),
            "taskName", maintenance.getTaskName(),
            "componentName", maintenance.getComponentName(),
            "maintenanceType", maintenance.getMaintenanceType(),
            "frequency", maintenance.getFrequency(),
            "nextMaintenance", maintenance.getNextMaintenance(),
            "priority", maintenance.getPriority(),
            "status", maintenance.getStatus(),
            "description", maintenance.getDescription()
        )).collect(Collectors.toList()));

        // Safety precautions
        List<DeviceSafetyPrecaution> safetyPrecautions = safetyRepository.findByDeviceId(deviceId);
        data.put("safety", safetyPrecautions.stream().map(safety -> Map.of(
            "id", safety.getId(),
            "title", safety.getTitle(),
            "description", safety.getDescription(),
            "type", safety.getType(),
            "category", safety.getCategory(),
            "severity", safety.getSeverity(),
            "recommendedAction", safety.getRecommendedAction(),
            "isActive", safety.getIsActive()
        )).collect(Collectors.toList()));

        // Summary statistics
        data.put("summary", Map.of(
            "totalRules", rules.size(),
            "totalMaintenanceTasks", maintenanceTasks.size(),
            "totalSafetyPrecautions", safetyPrecautions.size(),
            "activeRules", rules.stream().filter(Rule::isActive).count(),
            "activeMaintenanceTasks", maintenanceTasks.stream().filter(m -> "ACTIVE".equals(m.getStatus())).count(),
            "criticalSafetyPrecautions", safetyPrecautions.stream().filter(s -> "CRITICAL".equals(s.getSeverity())).count()
        ));

        return data;
    }

    /**
     * Build comprehensive notification message
     */
    private String buildConsolidatedMessage(Map<String, Object> data) {
        StringBuilder message = new StringBuilder();
        
        @SuppressWarnings("unchecked")
        Map<String, Object> device = (Map<String, Object>) data.get("device");
        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) data.get("summary");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> rules = (List<Map<String, Object>>) data.get("rules");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> maintenance = (List<Map<String, Object>>) data.get("maintenance");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> safety = (List<Map<String, Object>>) data.get("safety");

        message.append("📱 Device: ").append(device.get("name")).append(" (").append(device.get("type")).append(")\n");
        message.append("📍 Location: ").append(device.get("location")).append("\n");
        message.append("🌐 Protocol: ").append(device.get("protocol")).append("\n");
        message.append("📊 Status: ").append(device.get("status")).append("\n\n");

        // Summary
        message.append("📋 Summary:\n");
        message.append("• ").append(summary.get("totalRules")).append(" monitoring rules\n");
        message.append("• ").append(summary.get("totalMaintenanceTasks")).append(" maintenance tasks\n");
        message.append("• ").append(summary.get("totalSafetyPrecautions")).append(" safety precautions\n\n");

        // Key rules (first 3)
        if (!rules.isEmpty()) {
            message.append("🔍 Key Monitoring Rules:\n");
            rules.stream().limit(3).forEach(rule -> {
                message.append("• ").append(rule.get("name"));
                if (rule.get("metric") != null) {
                    message.append(" (").append(rule.get("metric")).append(")");
                }
                message.append("\n");
            });
            if (rules.size() > 3) {
                message.append("• ... and ").append(rules.size() - 3).append(" more rules\n");
            }
            message.append("\n");
        }

        // Key maintenance tasks (first 3)
        if (!maintenance.isEmpty()) {
            message.append("🔧 Upcoming Maintenance:\n");
            maintenance.stream().limit(3).forEach(task -> {
                message.append("• ").append(task.get("taskName"));
                if (task.get("nextMaintenance") != null) {
                    message.append(" (Due: ").append(task.get("nextMaintenance")).append(")");
                }
                message.append("\n");
            });
            if (maintenance.size() > 3) {
                message.append("• ... and ").append(maintenance.size() - 3).append(" more tasks\n");
            }
            message.append("\n");
        }

        // Critical safety precautions
        long criticalCount = safety.stream().filter(s -> "CRITICAL".equals(s.get("severity"))).count();
        if (criticalCount > 0) {
            message.append("⚠️ Critical Safety Precautions: ").append(criticalCount).append(" items require immediate attention\n\n");
        }

        message.append("Click to view complete details and manage your device.");

        return message.toString();
    }

    /**
     * Get detailed notification data for frontend display
     */
    public Map<String, Object> getNotificationDetails(String notificationId) {
        try {
            Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
            if (notificationOpt.isEmpty()) {
                return Map.of("error", "Notification not found");
            }

            Notification notification = notificationOpt.get();
            if (notification.getMetadata() == null || notification.getMetadata().isEmpty()) {
                return Map.of("error", "No detailed data available");
            }

            // For consolidated notifications, rebuild detailed data from device ID
            String deviceId = notification.getMetadata().get("deviceId");
            if (deviceId != null) {
                Optional<Device> deviceOpt = deviceRepository.findById(deviceId);
                if (deviceOpt.isPresent()) {
                    Device device = deviceOpt.get();
                    String assignedUserId = notification.getMetadata().get("assignedUserId");
                    Optional<User> assignedUserOpt = userRepository.findById(assignedUserId);
                    if (assignedUserOpt.isPresent()) {
                        String creatorName = notification.getMetadata().get("creatorName");
                        return buildConsolidatedData(deviceId, device, assignedUserOpt.get(), creatorName);
                    }
                }
            }

            // Fallback to basic metadata
            return new java.util.HashMap<>(notification.getMetadata());

        } catch (Exception e) {
            logger.error("❌ Failed to get notification details: {}", e.getMessage(), e);
            return Map.of("error", "Failed to load notification details");
        }
    }
}
