package com.iotplatform.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Comparator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.iotplatform.model.Device;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.model.Rule;
import com.iotplatform.model.RuleCondition;
import com.iotplatform.model.RuleAction;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.DeviceSafetyPrecautionRepository;
import com.iotplatform.repository.RuleRepository;
import com.iotplatform.repository.RuleConditionRepository;
import com.iotplatform.repository.RuleActionRepository;
import com.iotplatform.dto.DeviceCreateWithFileRequest;

@Service
public class PDFProcessingService {
    
    private static final Logger logger = LoggerFactory.getLogger(PDFProcessingService.class);
    
    @Autowired
    private RuleRepository ruleRepository;
    
    @Autowired
    private RuleConditionRepository ruleConditionRepository;
    
    @Autowired
    private RuleActionRepository ruleActionRepository;
    
    @Autowired
    private DeviceMaintenanceRepository deviceMaintenanceRepository;
    
    @Autowired
    private DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository;
    
    /**
     * Save all PDF processing results to the database
     */
    @Transactional
    public void savePDFProcessingResults(Device device, DeviceCreateWithFileRequest.PDFResults pdfResults) {
        logger.info("Saving PDF processing results for device: {}", device.getId());
        
        try {
            // Save IoT Rules
            if (pdfResults.getIotRules() != null && !pdfResults.getIotRules().isEmpty()) {
                saveIoTRules(device, pdfResults.getIotRules());
            }
            
            // Save Maintenance Data
            if (pdfResults.getMaintenanceData() != null && !pdfResults.getMaintenanceData().isEmpty()) {
                saveMaintenanceData(device, pdfResults.getMaintenanceData());
            }
            
            // Save Safety Precautions
            if (pdfResults.getSafetyPrecautions() != null && !pdfResults.getSafetyPrecautions().isEmpty()) {
                saveSafetyPrecautions(device, pdfResults.getSafetyPrecautions());
            }
            
            logger.info("Successfully saved PDF processing results for device: {}", device.getId());
            
        } catch (Exception e) {
            logger.error("Error saving PDF processing results for device: {}", device.getId(), e);
            throw new RuntimeException("Failed to save PDF processing results", e);
        }
    }
    
    /**
     * Save IoT Rules from PDF processing
     */
    private void saveIoTRules(Device device, List<DeviceCreateWithFileRequest.IoTRule> iotRules) {
        logger.info("Saving {} IoT rules for device: {}", iotRules.size(), device.getId());
        
        for (DeviceCreateWithFileRequest.IoTRule ruleData : iotRules) {
            Rule rule = new Rule();
            rule.setName(ruleData.getDeviceName() + " - " + ruleData.getRuleType() + " Rule");
            rule.setDescription(ruleData.getDescription());
            rule.setActive(true);
            rule.setOrganizationId(device.getOrganizationId());
            
            Rule savedRule = ruleRepository.save(rule);
            
            // Create rule condition
            RuleCondition condition = new RuleCondition();
            condition.setRule(savedRule);
            condition.setDeviceId(device.getId());
            condition.setMetric("condition");
            condition.setValue(ruleData.getCondition());
            condition.setType(RuleCondition.ConditionType.TELEMETRY_THRESHOLD);
            condition.setOperator(RuleCondition.Operator.EQUALS);
            
            ruleConditionRepository.save(condition);
            
            // Create rule action
            RuleAction action = new RuleAction();
            action.setRule(savedRule);
            action.setType(RuleAction.ActionType.NOTIFICATION);
            // Note: Using config map instead of actionData string
            action.setConfig(Map.of("message", ruleData.getAction(), "priority", ruleData.getPriority()));
            
            ruleActionRepository.save(action);
            
            logger.info("Created rule with condition and action: {} for device: {}", savedRule.getName(), device.getId());
        }
    }
    
    /**
     * Save Maintenance Data from PDF processing
     */
    private void saveMaintenanceData(Device device, List<DeviceCreateWithFileRequest.MaintenanceData> maintenanceData) {
        logger.info("Saving {} maintenance items for device: {}", maintenanceData.size(), device.getId());
        
        for (DeviceCreateWithFileRequest.MaintenanceData maintenanceItem : maintenanceData) {
            DeviceMaintenance maintenance = new DeviceMaintenance();
            maintenance.setTaskName(maintenanceItem.getComponentName());
            maintenance.setDevice(device);
            maintenance.setDeviceName(device.getName());
            maintenance.setComponentName(maintenanceItem.getComponentName());
            maintenance.setMaintenanceType(DeviceMaintenance.MaintenanceType.PREVENTIVE);
            maintenance.setFrequency(maintenanceItem.getFrequency());
            maintenance.setDescription(maintenanceItem.getDescription());
            maintenance.setPriority(DeviceMaintenance.Priority.MEDIUM);
            maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
            maintenance.setOrganizationId(device.getOrganizationId());
            
            // Set next maintenance date based on frequency
            maintenance.setNextMaintenance(calculateNextMaintenanceDate(maintenanceItem.getFrequency()));
            
            deviceMaintenanceRepository.save(maintenance);
        }
    }
    
    /**
     * Save Safety Precautions from PDF processing
     */
    private void saveSafetyPrecautions(Device device, List<DeviceCreateWithFileRequest.SafetyPrecaution> safetyPrecautions) {
        logger.info("Saving {} safety precautions for device: {}", safetyPrecautions.size(), device.getId());
        
        for (DeviceCreateWithFileRequest.SafetyPrecaution safetyItem : safetyPrecautions) {
            DeviceSafetyPrecaution safety = new DeviceSafetyPrecaution();
            safety.setDeviceId(device.getId());
            safety.setTitle(safetyItem.getTitle());
            safety.setDescription(safetyItem.getDescription());
            safety.setSeverity(safetyItem.getSeverity().toUpperCase());
            safety.setCategory(safetyItem.getCategory());
            safety.setRecommendedAction(safetyItem.getRecommendedAction());
            safety.setIsActive(true);
            safety.setOrganizationId(device.getOrganizationId());
            
            deviceSafetyPrecautionRepository.save(safety);
        }
    }
    
    /**
     * Calculate next maintenance date based on frequency
     */
    private LocalDate calculateNextMaintenanceDate(String frequency) {
        LocalDate today = LocalDate.now();
        
        switch (frequency.toLowerCase()) {
            case "daily":
                return today.plusDays(1);
            case "weekly":
                return today.plusWeeks(1);
            case "monthly":
                return today.plusMonths(1);
            case "quarterly":
                return today.plusMonths(3);
            case "semi-annually":
                return today.plusMonths(6);
            case "annually":
            case "yearly":
                return today.plusYears(1);
            default:
                return today.plusMonths(1); // Default to monthly
        }
    }
    
    /**
     * Get upcoming maintenance items for dashboard (top 3 due soon)
     */
    public List<DeviceMaintenance> getUpcomingMaintenance(String organizationId) {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate nextWeek = LocalDate.now().plusDays(7);
        
        List<DeviceMaintenance> allMaintenance = deviceMaintenanceRepository.findByOrganizationId(organizationId);
        
        // Filter for upcoming maintenance and sort by next maintenance date
        List<DeviceMaintenance> upcomingMaintenance = allMaintenance.stream()
            .filter(maint -> maint.getNextMaintenance() != null && 
                           maint.getNextMaintenance().isAfter(LocalDate.now().minusDays(1)) &&
                           maint.getStatus() == DeviceMaintenance.Status.ACTIVE)
            .sorted(Comparator.comparing(DeviceMaintenance::getNextMaintenance))
            .limit(3)
            .collect(Collectors.toList());
        
        logger.info("Found {} upcoming maintenance items for organization: {}", upcomingMaintenance.size(), organizationId);
        return upcomingMaintenance;
    }
    
    /**
     * Get maintenance count for dashboard
     */
    public long getMaintenanceCount(String organizationId) {
        return deviceMaintenanceRepository.findByOrganizationId(organizationId).stream()
            .filter(maint -> maint.getStatus() == DeviceMaintenance.Status.ACTIVE)
            .count();
    }
    
    /**
     * Get all maintenance items for a device
     */
    public List<DeviceMaintenance> getDeviceMaintenance(String deviceId) {
        List<DeviceMaintenance> maintenance = deviceMaintenanceRepository.findByDeviceId(deviceId);
        logger.info("Found {} maintenance items for device: {}", maintenance.size(), deviceId);
        return maintenance;
    }
    
    /**
     * Get all safety precautions for a device
     */
    public List<DeviceSafetyPrecaution> getDeviceSafetyPrecautions(String deviceId) {
        // Return all safety precautions for the device (both active and inactive)
        List<DeviceSafetyPrecaution> precautions = deviceSafetyPrecautionRepository.findByDeviceId(deviceId);
        logger.info("Found {} safety precautions for device: {}", precautions.size(), deviceId);
        return precautions;
    }
    
    /**
     * Get all rules for a device
     */
    public List<Rule> getDeviceRules(String deviceId) {
        try {
            // Use a more direct approach to avoid lazy loading issues
            List<Rule> rules = ruleRepository.findByDeviceId(deviceId);
            logger.info("Found {} rules for device: {}", rules.size(), deviceId);
            return rules;
        } catch (Exception e) {
            logger.error("Error fetching rules for device: {}", deviceId, e);
            return new ArrayList<>();
        }
    }
}
