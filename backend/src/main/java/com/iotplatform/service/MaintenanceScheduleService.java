package com.iotplatform.service;

import com.iotplatform.model.MaintenanceSchedule;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.repository.MaintenanceScheduleRepository;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.dto.MaintenanceGenerationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

/**
 * Service for managing maintenance schedules.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class MaintenanceScheduleService {
    
    private final MaintenanceScheduleRepository maintenanceScheduleRepository;
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    
    /**
     * Create a new maintenance schedule.
     */
    public MaintenanceSchedule createSchedule(MaintenanceSchedule schedule) {
        log.info("Creating maintenance schedule for device: {}", schedule.getDeviceId());
        return maintenanceScheduleRepository.save(schedule);
    }
    
    /**
     * Get all maintenance schedules for a device.
     */
    public List<MaintenanceSchedule> getSchedulesByDeviceId(String deviceId) {
        log.info("Fetching maintenance schedules for device: {}", deviceId);
        return maintenanceScheduleRepository.findByDeviceId(deviceId);
    }
    
    /**
     * Get a maintenance schedule by ID.
     */
    public Optional<MaintenanceSchedule> getScheduleById(String id) {
        return maintenanceScheduleRepository.findById(id);
    }
    
    /**
     * Update a maintenance schedule.
     */
    public MaintenanceSchedule updateSchedule(MaintenanceSchedule schedule) {
        log.info("Updating maintenance schedule: {}", schedule.getId());
        return maintenanceScheduleRepository.save(schedule);
    }
    
    /**
     * Delete a maintenance schedule.
     */
    public void deleteSchedule(String id) {
        log.info("Deleting maintenance schedule: {}", id);
        maintenanceScheduleRepository.deleteById(id);
    }
    
    /**
     * Get all maintenance schedules.
     */
    public List<MaintenanceSchedule> getAllSchedules() {
        return maintenanceScheduleRepository.findAll();
    }
    
    /**
     * Get maintenance tasks by device ID.
     */
    public List<DeviceMaintenance> getMaintenanceByDeviceId(String deviceId) {
        log.info("Fetching maintenance tasks for device: {}", deviceId);
        return deviceMaintenanceRepository.findByDeviceId(deviceId);
    }
    
    /**
     * Create maintenance tasks from PDF.
     */
    public void createMaintenanceFromPDF(List<MaintenanceGenerationResponse.MaintenanceTask> maintenanceTasks, String deviceId, String organizationId) {
        log.info("Creating maintenance tasks from PDF for device: {}", deviceId);
        for (MaintenanceGenerationResponse.MaintenanceTask maintenanceData : maintenanceTasks) {
            DeviceMaintenance maintenance = new DeviceMaintenance();
            maintenance.setId(UUID.randomUUID().toString());
            maintenance.setDeviceId(deviceId);
            maintenance.setOrganizationId(organizationId);
            maintenance.setTitle(maintenanceData.getTitle());
            maintenance.setDescription(maintenanceData.getDescription());
            maintenance.setCategory(maintenanceData.getCategory());
            maintenance.setPriority(maintenanceData.getPriority());
            maintenance.setStatus(DeviceMaintenance.Status.ACTIVE);
            maintenance.setCreatedAt(LocalDateTime.now());
            maintenance.setUpdatedAt(LocalDateTime.now());
            
            deviceMaintenanceRepository.save(maintenance);
        }
        log.info("Created {} maintenance tasks from PDF for device: {}", maintenanceTasks.size(), deviceId);
    }
    
    /**
     * Get upcoming maintenance for a device.
     */
    public List<DeviceMaintenance> getUpcomingMaintenance(String deviceId) {
        log.info("Fetching upcoming maintenance for device: {}", deviceId);
        return deviceMaintenanceRepository.findByDeviceId(deviceId);
    }
    
    /**
     * Get maintenance count for a device.
     */
    public long getMaintenanceCount(String deviceId) {
        log.info("Fetching maintenance count for device: {}", deviceId);
        return deviceMaintenanceRepository.countByDeviceIdAndStatus(deviceId, DeviceMaintenance.Status.ACTIVE);
    }
}
