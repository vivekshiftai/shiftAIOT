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
     * Build a comprehensive notification message with device details
     */
    public String buildEnhancedNotificationMessage(Notification notification) {
        StringBuilder message = new StringBuilder();
        
        // Basic device information
        if (notification.getDeviceName() != null) {
            message.append("Device: ").append(notification.getDeviceName());
        }
        
        if (notification.getDeviceType() != null) {
            message.append(" (").append(notification.getDeviceType()).append(")");
        }
        
        if (notification.getDeviceLocation() != null) {
            message.append(" at ").append(notification.getDeviceLocation());
        }
        
        if (notification.getDeviceStatus() != null) {
            message.append(" - Status: ").append(notification.getDeviceStatus());
        }
        
        message.append("\n\n");
        
        // Device specifications
        if (notification.getDeviceManufacturer() != null || notification.getDeviceModel() != null) {
            message.append("Specifications: ");
            if (notification.getDeviceManufacturer() != null) {
                message.append(notification.getDeviceManufacturer());
            }
            if (notification.getDeviceModel() != null) {
                if (notification.getDeviceManufacturer() != null) {
                    message.append(" ");
                }
                message.append(notification.getDeviceModel());
            }
            message.append("\n\n");
        }
        
        // Rules and maintenance summary
        message.append("Configuration Summary:\n");
        if (notification.getTotalRulesCount() != null && notification.getTotalRulesCount() > 0) {
            message.append("• Total Rules: ").append(notification.getTotalRulesCount());
            if (notification.getMaintenanceRulesCount() != null && notification.getMaintenanceRulesCount() > 0) {
                message.append(" (including ").append(notification.getMaintenanceRulesCount()).append(" maintenance tasks)");
            }
            message.append("\n");
        }
        
        if (notification.getSafetyRulesCount() != null && notification.getSafetyRulesCount() > 0) {
            message.append("• Safety Precautions: ").append(notification.getSafetyRulesCount()).append("\n");
        }
        
        if (notification.getMaintenanceRulesCount() != null && notification.getMaintenanceRulesCount() > 0) {
            message.append("• Active Maintenance Tasks: ").append(notification.getMaintenanceRulesCount()).append("\n");
        }
        
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
