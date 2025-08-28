package com.iotplatform.service;

import com.iotplatform.model.NotificationTemplate;
import com.iotplatform.model.Notification;
import com.iotplatform.repository.NotificationTemplateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service to initialize default notification templates
 */
@Service
public class DefaultNotificationTemplateService {
    
    private static final Logger logger = LoggerFactory.getLogger(DefaultNotificationTemplateService.class);
    
    @Autowired
    private NotificationTemplateRepository templateRepository;
    
    @Autowired
    private NotificationTemplateService templateService;
    
    /**
     * Initialize default templates for an organization
     */
    public void initializeDefaultTemplates(String organizationId, String createdBy) {
        logger.info("Initializing default notification templates for organization: {}", organizationId);
        
        try {
            // Check if templates already exist
            List<NotificationTemplate> existingTemplates = templateRepository.findByOrganizationIdAndActiveTrueOrderByNameAsc(organizationId);
            if (!existingTemplates.isEmpty()) {
                logger.info("Templates already exist for organization: {}, skipping initialization", organizationId);
                return;
            }
            
            // Create default templates
            createDeviceAssignmentTemplate(organizationId, createdBy);
            createDeviceCreationTemplate(organizationId, createdBy);
            createMaintenanceScheduleTemplate(organizationId, createdBy);
            createMaintenanceReminderTemplate(organizationId, createdBy);
            createDeviceOfflineTemplate(organizationId, createdBy);
            createDeviceOnlineTemplate(organizationId, createdBy);
            createTemperatureAlertTemplate(organizationId, createdBy);
            createBatteryLowTemplate(organizationId, createdBy);
            createRuleTriggeredTemplate(organizationId, createdBy);
            
            logger.info("Successfully initialized default notification templates for organization: {}", organizationId);
            
        } catch (Exception e) {
            logger.error("Error initializing default templates for organization: {}", organizationId, e);
        }
    }
    
    /**
     * Create device assignment template
     */
    private void createDeviceAssignmentTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Device Assignment Notification");
        template.setType(NotificationTemplate.TemplateType.DEVICE_ASSIGNMENT);
        template.setTitleTemplate("New Device Assignment - {{deviceName}}");
        template.setMessageTemplate(
            "Hello {{userName}},\n\n" +
            "You have been assigned a new device:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "🔧 Type: {{deviceType}}\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "🔄 Status: {{deviceStatus}}\n" +
            "📅 Assigned: {{timestamp}}\n\n" +
            "The device is now ready for monitoring. Please review the device details and ensure it's properly configured.\n\n" +
            "Best regards,\nIoT Platform Team"
        );
        template.setNotificationType(Notification.NotificationType.INFO);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when a device is assigned to a user");
        
        // Set variables
        Map<String, String> variables = new HashMap<>();
        variables.put("userName", "Name of the assigned user");
        variables.put("deviceName", "Name of the device");
        variables.put("deviceType", "Type of device (SENSOR, ACTUATOR, etc.)");
        variables.put("deviceLocation", "Location of the device");
        variables.put("deviceStatus", "Current status of the device");
        variables.put("timestamp", "Assignment timestamp");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create device creation template
     */
    private void createDeviceCreationTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Device Creation Notification");
        template.setType(NotificationTemplate.TemplateType.DEVICE_CREATION);
        template.setTitleTemplate("New Device Added - {{deviceName}}");
        template.setMessageTemplate(
            "A new device has been added to the platform:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "🔧 Type: {{deviceType}}\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "🌐 Protocol: {{deviceProtocol}}\n" +
            "👤 Created by: {{createdBy}}\n" +
            "📅 Created: {{timestamp}}\n\n" +
            "The device is now available for assignment and monitoring."
        );
        template.setNotificationType(Notification.NotificationType.SUCCESS);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when a new device is created");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the device");
        variables.put("deviceType", "Type of device");
        variables.put("deviceLocation", "Location of the device");
        variables.put("deviceProtocol", "Communication protocol");
        variables.put("createdBy", "Name of user who created the device");
        variables.put("timestamp", "Creation timestamp");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create maintenance schedule template
     */
    private void createMaintenanceScheduleTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Maintenance Schedule Notification");
        template.setType(NotificationTemplate.TemplateType.MAINTENANCE_SCHEDULE);
        template.setTitleTemplate("Maintenance Scheduled - {{deviceName}}");
        template.setMessageTemplate(
            "Maintenance has been scheduled for your device:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "🔧 Task: {{taskName}}\n" +
            "📅 Scheduled Date: {{scheduledDate}}\n" +
            "⏰ Scheduled Time: {{scheduledTime}}\n" +
            "🎯 Priority: {{priority}}\n" +
            "📝 Description: {{description}}\n\n" +
            "Please ensure the device is available for maintenance at the scheduled time."
        );
        template.setNotificationType(Notification.NotificationType.WARNING);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when maintenance is scheduled");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the device");
        variables.put("taskName", "Maintenance task name");
        variables.put("scheduledDate", "Scheduled maintenance date");
        variables.put("scheduledTime", "Scheduled maintenance time");
        variables.put("priority", "Priority level");
        variables.put("description", "Maintenance description");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create maintenance reminder template
     */
    private void createMaintenanceReminderTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Maintenance Reminder Notification");
        template.setType(NotificationTemplate.TemplateType.MAINTENANCE_REMINDER);
        template.setTitleTemplate("Maintenance Reminder - {{deviceName}}");
        template.setMessageTemplate(
            "🔔 Maintenance Reminder\n\n" +
            "Your device requires maintenance:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "🔧 Task: {{taskName}}\n" +
            "📅 Due Date: {{dueDate}}\n" +
            "⏰ Due Time: {{dueTime}}\n" +
            "🎯 Priority: {{priority}}\n" +
            "📝 Description: {{description}}\n\n" +
            "Please complete the maintenance task as soon as possible."
        );
        template.setNotificationType(Notification.NotificationType.WARNING);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent as maintenance reminder");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the device");
        variables.put("taskName", "Maintenance task name");
        variables.put("dueDate", "Due date for maintenance");
        variables.put("dueTime", "Due time for maintenance");
        variables.put("priority", "Priority level");
        variables.put("description", "Maintenance description");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create device offline template
     */
    private void createDeviceOfflineTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Device Offline Alert");
        template.setType(NotificationTemplate.TemplateType.DEVICE_OFFLINE);
        template.setTitleTemplate("⚠️ Device Offline - {{deviceName}}");
        template.setMessageTemplate(
            "🚨 Device Offline Alert\n\n" +
            "The following device has gone offline:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "🔧 Type: {{deviceType}}\n" +
            "⏰ Offline Since: {{offlineTime}}\n\n" +
            "Please check the device connection and ensure it's properly powered and connected to the network."
        );
        template.setNotificationType(Notification.NotificationType.ERROR);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when device goes offline");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the device");
        variables.put("deviceLocation", "Location of the device");
        variables.put("deviceType", "Type of device");
        variables.put("offlineTime", "Time when device went offline");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create device online template
     */
    private void createDeviceOnlineTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Device Online Notification");
        template.setType(NotificationTemplate.TemplateType.DEVICE_ONLINE);
        template.setTitleTemplate("✅ Device Online - {{deviceName}}");
        template.setMessageTemplate(
            "🎉 Device Online\n\n" +
            "The following device is now online and reporting data:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "🔧 Type: {{deviceType}}\n" +
            "⏰ Online Since: {{onlineTime}}\n\n" +
            "The device is now actively monitoring and reporting telemetry data."
        );
        template.setNotificationType(Notification.NotificationType.SUCCESS);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when device comes online");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the device");
        variables.put("deviceLocation", "Location of the device");
        variables.put("deviceType", "Type of device");
        variables.put("onlineTime", "Time when device came online");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create temperature alert template
     */
    private void createTemperatureAlertTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Temperature Alert");
        template.setType(NotificationTemplate.TemplateType.TEMPERATURE_ALERT);
        template.setTitleTemplate("🌡️ Temperature Alert - {{deviceName}}");
        template.setMessageTemplate(
            "🌡️ Temperature Threshold Exceeded\n\n" +
            "The temperature sensor has reported a value above the threshold:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "🌡️ Current Temperature: {{temperature}}°C\n" +
            "🎯 Threshold: {{threshold}}°C\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "⏰ Time: {{timestamp}}\n\n" +
            "Please check the device and take necessary action to control the temperature."
        );
        template.setNotificationType(Notification.NotificationType.ERROR);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when temperature exceeds threshold");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the temperature sensor");
        variables.put("temperature", "Current temperature reading");
        variables.put("threshold", "Temperature threshold");
        variables.put("deviceLocation", "Location of the device");
        variables.put("timestamp", "Time of the reading");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create battery low template
     */
    private void createBatteryLowTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Battery Low Warning");
        template.setType(NotificationTemplate.TemplateType.BATTERY_LOW);
        template.setTitleTemplate("🔋 Battery Low - {{deviceName}}");
        template.setMessageTemplate(
            "🔋 Low Battery Warning\n\n" +
            "The device battery level is critically low:\n\n" +
            "📱 Device: {{deviceName}}\n" +
            "🔋 Battery Level: {{batteryLevel}}%\n" +
            "⚠️ Critical Level: {{criticalLevel}}%\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "⏰ Time: {{timestamp}}\n\n" +
            "Please replace or recharge the battery to prevent device shutdown."
        );
        template.setNotificationType(Notification.NotificationType.ERROR);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when device battery is low");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("deviceName", "Name of the device");
        variables.put("batteryLevel", "Current battery level percentage");
        variables.put("criticalLevel", "Critical battery level threshold");
        variables.put("deviceLocation", "Location of the device");
        variables.put("timestamp", "Time of the reading");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
    
    /**
     * Create rule triggered template
     */
    private void createRuleTriggeredTemplate(String organizationId, String createdBy) {
        NotificationTemplate template = new NotificationTemplate();
        template.setName("Rule Triggered Alert");
        template.setType(NotificationTemplate.TemplateType.RULE_TRIGGERED);
        template.setTitleTemplate("⚡ Rule Triggered - {{ruleName}}");
        template.setMessageTemplate(
            "⚡ Rule Triggered\n\n" +
            "A monitoring rule has been triggered:\n\n" +
            "📋 Rule: {{ruleName}}\n" +
            "📱 Device: {{deviceName}}\n" +
            "📝 Description: {{ruleDescription}}\n" +
            "🎯 Condition: {{condition}}\n" +
            "📍 Location: {{deviceLocation}}\n" +
            "⏰ Triggered: {{timestamp}}\n\n" +
            "Please review the rule conditions and take appropriate action."
        );
        template.setNotificationType(Notification.NotificationType.INFO);
        template.setActive(true);
        template.setOrganizationId(organizationId);
        template.setCreatedBy(createdBy);
        template.setDescription("Notification sent when a monitoring rule is triggered");
        
        Map<String, String> variables = new HashMap<>();
        variables.put("ruleName", "Name of the triggered rule");
        variables.put("deviceName", "Name of the device");
        variables.put("ruleDescription", "Description of the rule");
        variables.put("condition", "Condition that was triggered");
        variables.put("deviceLocation", "Location of the device");
        variables.put("timestamp", "Time when rule was triggered");
        template.setVariables(variables);
        
        templateService.createTemplate(template);
    }
}
