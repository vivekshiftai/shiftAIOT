package com.iotplatform.service;

import com.iotplatform.model.*;
import com.iotplatform.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class DeviceNotificationEnhancerService {
    
    private static final Logger logger = LoggerFactory.getLogger(DeviceNotificationEnhancerService.class);
    
    @Autowired
    private DeviceRepository deviceRepository;
    
    @Autowired
    private RuleRepository ruleRepository;
    
    @Autowired
    private DeviceMaintenanceRepository maintenanceRepository;
    
    @Autowired
    private DeviceSafetyPrecautionRepository safetyRepository;
    
    /**
     * Enhance a notification with comprehensive device information
     */
    public void enhanceNotificationWithDeviceInfo(Notification notification, String deviceId, String organizationId) {
        try {
            Optional<Device> deviceOpt = deviceRepository.findByIdAndOrganizationId(deviceId, organizationId);
            if (deviceOpt.isEmpty()) {
                logger.warn("Device not found for notification enhancement: {}", deviceId);
                return;
            }
            
            Device device = deviceOpt.get();
            
            // Set basic device information
            notification.setDeviceName(device.getName());
            notification.setDeviceType(device.getType() != null ? device.getType().toString() : null);
            notification.setDeviceLocation(device.getLocation());
            notification.setDeviceStatus(device.getStatus() != null ? device.getStatus().toString() : null);
            notification.setDeviceManufacturer(device.getManufacturer());
            notification.setDeviceModel(device.getModel());
            
            // Count rules and maintenance items
            long totalRulesCount = ruleRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId).size();
            long maintenanceCount = maintenanceRepository.countByDeviceIdAndStatus(deviceId, DeviceMaintenance.Status.ACTIVE);
            long safetyCount = safetyRepository.countActiveByDeviceIdAndOrganizationId(deviceId, organizationId);
            
            notification.setTotalRulesCount((int) totalRulesCount);
            notification.setMaintenanceRulesCount((int) maintenanceCount);
            notification.setSafetyRulesCount((int) safetyCount);
            
            logger.info("Enhanced notification with device info - Device: {}, Rules: {}, Maintenance: {}, Safety: {}", 
                       device.getName(), totalRulesCount, maintenanceCount, safetyCount);
            
        } catch (Exception e) {
            logger.error("Failed to enhance notification with device info for device: {}", deviceId, e);
            // Don't fail the notification creation if enhancement fails
        }
    }
    
    /**
     * Enhance a notification with comprehensive device information using provided counts
     * This method is used when we have the actual counts from the generation process
     */
    public void enhanceNotificationWithDeviceInfo(Notification notification, String deviceId, String organizationId, 
                                                 int rulesCount, int maintenanceCount, int safetyCount) {
        try {
            Optional<Device> deviceOpt = deviceRepository.findByIdAndOrganizationId(deviceId, organizationId);
            if (deviceOpt.isEmpty()) {
                logger.warn("Device not found for notification enhancement: {}", deviceId);
                return;
            }
            
            Device device = deviceOpt.get();
            
            // Set basic device information
            notification.setDeviceName(device.getName());
            notification.setDeviceType(device.getType() != null ? device.getType().toString() : null);
            notification.setDeviceLocation(device.getLocation());
            notification.setDeviceStatus(device.getStatus() != null ? device.getStatus().toString() : null);
            notification.setDeviceManufacturer(device.getManufacturer());
            notification.setDeviceModel(device.getModel());
            
            // Use provided counts instead of querying database
            notification.setTotalRulesCount(rulesCount);
            notification.setMaintenanceRulesCount(maintenanceCount);
            notification.setSafetyRulesCount(safetyCount);
            
            logger.info("Enhanced notification with device info using provided counts - Device: {}, Rules: {}, Maintenance: {}, Safety: {}", 
                       device.getName(), rulesCount, maintenanceCount, safetyCount);
            
        } catch (Exception e) {
            logger.error("Failed to enhance notification with device info for device: {}", deviceId, e);
            // Don't fail the notification creation if enhancement fails
        }
    }
    
    /**
     * Build a simple notification message with device details and counts only
     */
    public String buildEnhancedNotificationMessage(Notification notification) {
        StringBuilder message = new StringBuilder();
        
        // Basic device information
        if (notification.getDeviceName() != null) {
            message.append("📱 Device: ").append(notification.getDeviceName());
        }
        
        if (notification.getDeviceLocation() != null) {
            message.append(" at ").append(notification.getDeviceLocation());
        }
        
        if (notification.getDeviceStatus() != null) {
            message.append(" - Status: ").append(notification.getDeviceStatus());
        }
        
        message.append("\n\n");
        
        // Simple counts summary - only show counts, no detailed data
        message.append("📊 Configuration Summary:\n");
        
        // Rules count
        if (notification.getTotalRulesCount() != null && notification.getTotalRulesCount() > 0) {
            message.append("• ").append(notification.getTotalRulesCount()).append(" monitoring rules\n");
        }
        
        // Maintenance tasks count
        if (notification.getMaintenanceRulesCount() != null && notification.getMaintenanceRulesCount() > 0) {
            message.append("• ").append(notification.getMaintenanceRulesCount()).append(" maintenance tasks\n");
        }
        
        // Safety precautions count
        if (notification.getSafetyRulesCount() != null && notification.getSafetyRulesCount() > 0) {
            message.append("• ").append(notification.getSafetyRulesCount()).append(" safety precautions\n");
        }
        
        message.append("\n✅ Device is ready for monitoring and management.");
        
        return message.toString().trim();
    }
    
    /**
     * Get device statistics for notification enhancement
     */
    public DeviceNotificationStats getDeviceNotificationStats(String deviceId, String organizationId) {
        try {
            long totalRules = ruleRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId).size();
            long activeMaintenance = maintenanceRepository.countByDeviceIdAndStatus(deviceId, DeviceMaintenance.Status.ACTIVE);
            long activeSafety = safetyRepository.countActiveByDeviceIdAndOrganizationId(deviceId, organizationId);
            
            return new DeviceNotificationStats(totalRules, activeMaintenance, activeSafety);
        } catch (Exception e) {
            logger.error("Failed to get device notification stats for device: {}", deviceId, e);
            return new DeviceNotificationStats(0, 0, 0);
        }
    }
    
    /**
     * Data class for device notification statistics
     */
    public static class DeviceNotificationStats {
        private final long totalRules;
        private final long activeMaintenance;
        private final long activeSafety;
        
        public DeviceNotificationStats(long totalRules, long activeMaintenance, long activeSafety) {
            this.totalRules = totalRules;
            this.activeMaintenance = activeMaintenance;
            this.activeSafety = activeSafety;
        }
        
        public long getTotalRules() { return totalRules; }
        public long getActiveMaintenance() { return activeMaintenance; }
        public long getActiveSafety() { return activeSafety; }
    }
}
