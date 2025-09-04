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
        logger.debug("🔍 Building consolidated data for device: {} with assigned user: {}", deviceId, assignedUser.getEmail());
        Map<String, Object> data = new java.util.HashMap<>();

        // Basic device information
        Map<String, Object> deviceInfo = new java.util.HashMap<>();
        deviceInfo.put("id", device.getId());
        deviceInfo.put("name", device.getName() != null ? device.getName() : "Unknown Device");
        deviceInfo.put("type", device.getType() != null ? device.getType() : "UNKNOWN");
        deviceInfo.put("status", device.getStatus() != null ? device.getStatus() : "UNKNOWN");
        deviceInfo.put("location", device.getLocation() != null ? device.getLocation() : "Unknown Location");
        deviceInfo.put("protocol", device.getProtocol() != null ? device.getProtocol() : "UNKNOWN");
        deviceInfo.put("manufacturer", device.getManufacturer());
        deviceInfo.put("model", device.getModel());
        deviceInfo.put("description", device.getDescription());
        deviceInfo.put("createdAt", device.getCreatedAt());
        data.put("device", deviceInfo);
        
        logger.debug("✅ Device info built successfully: {}", deviceInfo.get("name"));

        // User information
        Map<String, Object> userInfo = new java.util.HashMap<>();
        userInfo.put("id", assignedUser.getId());
        userInfo.put("name", assignedUser.getFirstName() + " " + assignedUser.getLastName());
        userInfo.put("email", assignedUser.getEmail());
        data.put("assignedUser", userInfo);
        logger.debug("✅ User info built successfully: {}", userInfo.get("name"));

        data.put("createdBy", creatorName);

        // Rules information
        List<Rule> rules = ruleRepository.findByDeviceId(deviceId);
        logger.debug("📋 Found {} rules for device: {}", rules.size(), deviceId);
        data.put("rules", rules.stream().map(rule -> {
            Map<String, Object> ruleInfo = new java.util.HashMap<>();
            ruleInfo.put("id", rule.getId());
            ruleInfo.put("name", rule.getName());
            ruleInfo.put("description", rule.getDescription());
            ruleInfo.put("active", rule.isActive());
            ruleInfo.put("metric", rule.getMetric());
            ruleInfo.put("threshold", rule.getThreshold());
            return ruleInfo;
        }).collect(Collectors.toList()));

        // Maintenance information
        List<DeviceMaintenance> maintenanceTasks = maintenanceRepository.findByDeviceId(deviceId);
        logger.debug("🔧 Found {} maintenance tasks for device: {}", maintenanceTasks.size(), deviceId);
        data.put("maintenance", maintenanceTasks.stream().map(maintenance -> {
            Map<String, Object> maintenanceInfo = new java.util.HashMap<>();
            maintenanceInfo.put("id", maintenance.getId());
            maintenanceInfo.put("taskName", maintenance.getTaskName());
            maintenanceInfo.put("componentName", maintenance.getComponentName());
            maintenanceInfo.put("maintenanceType", maintenance.getMaintenanceType());
            maintenanceInfo.put("frequency", maintenance.getFrequency());
            maintenanceInfo.put("nextMaintenance", maintenance.getNextMaintenance());
            maintenanceInfo.put("priority", maintenance.getPriority());
            maintenanceInfo.put("status", maintenance.getStatus());
            maintenanceInfo.put("description", maintenance.getDescription());
            return maintenanceInfo;
        }).collect(Collectors.toList()));

        // Safety precautions
        List<DeviceSafetyPrecaution> safetyPrecautions = safetyRepository.findByDeviceId(deviceId);
        logger.debug("⚠️ Found {} safety precautions for device: {}", safetyPrecautions.size(), deviceId);
        data.put("safety", safetyPrecautions.stream().map(safety -> {
            Map<String, Object> safetyInfo = new java.util.HashMap<>();
            safetyInfo.put("id", safety.getId());
            safetyInfo.put("title", safety.getTitle());
            safetyInfo.put("description", safety.getDescription());
            safetyInfo.put("type", safety.getType());
            safetyInfo.put("category", safety.getCategory());
            safetyInfo.put("severity", safety.getSeverity());
            safetyInfo.put("recommendedAction", safety.getRecommendedAction());
            safetyInfo.put("isActive", safety.getIsActive());
            return safetyInfo;
        }).collect(Collectors.toList()));

        // Summary statistics
        Map<String, Object> summaryInfo = new java.util.HashMap<>();
        summaryInfo.put("totalRules", rules.size());
        summaryInfo.put("totalMaintenanceTasks", maintenanceTasks.size());
        summaryInfo.put("totalSafetyPrecautions", safetyPrecautions.size());
        summaryInfo.put("activeRules", rules.stream().filter(Rule::isActive).count());
        summaryInfo.put("activeMaintenanceTasks", maintenanceTasks.stream().filter(m -> "ACTIVE".equals(m.getStatus())).count());
        summaryInfo.put("criticalSafetyPrecautions", safetyPrecautions.stream().filter(s -> "CRITICAL".equals(s.getSeverity())).count());
        data.put("summary", summaryInfo);
        
        logger.debug("📊 Summary built successfully - Rules: {}, Maintenance: {}, Safety: {}", 
                   summaryInfo.get("totalRules"), summaryInfo.get("totalMaintenanceTasks"), summaryInfo.get("totalSafetyPrecautions"));

        return data;
    }

    /**
     * Build clean, simple notification message with just essential numbers
     */
    private String buildConsolidatedMessage(Map<String, Object> data) {
        StringBuilder message = new StringBuilder();
        
        @SuppressWarnings("unchecked")
        Map<String, Object> device = (Map<String, Object>) data.get("device");
        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) data.get("summary");

        // Clean device header
        message.append("📱 Device: ").append(device.get("name")).append(" (").append(device.get("type")).append(")\n");
        message.append("📍 Location: ").append(device.get("location")).append("\n");
        message.append("🌐 Protocol: ").append(device.get("protocol")).append("\n");
        message.append("📊 Status: ").append(device.get("status")).append("\n\n");

        // Simple summary with just numbers
        message.append("📋 Summary:\n");
        message.append("• ").append(summary.get("totalRules")).append(" monitoring rules\n");
        message.append("• ").append(summary.get("totalMaintenanceTasks")).append(" maintenance tasks\n");
        message.append("• ").append(summary.get("totalSafetyPrecautions")).append(" safety precautions\n\n");

        // Simple call to action
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
                Map<String, Object> errorMap = new java.util.HashMap<>();
                errorMap.put("error", "Notification not found");
                return errorMap;
            }

            Notification notification = notificationOpt.get();
            if (notification.getMetadata() == null || notification.getMetadata().isEmpty()) {
                Map<String, Object> errorMap = new java.util.HashMap<>();
                errorMap.put("error", "No detailed data available");
                return errorMap;
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
            Map<String, Object> errorMap = new java.util.HashMap<>();
            errorMap.put("error", "Failed to load notification details");
            return errorMap;
        }
    }
}
