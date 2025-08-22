package com.iotplatform.repository;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.DeviceMaintenance;

@Repository
public interface DeviceMaintenanceRepository extends JpaRepository<DeviceMaintenance, String> {
    
    List<DeviceMaintenance> findByDeviceId(String deviceId);
    
    List<DeviceMaintenance> findByDeviceIdAndOrganizationId(String deviceId, String organizationId);
    
    List<DeviceMaintenance> findByOrganizationId(String organizationId);
    
    List<DeviceMaintenance> findByStatus(DeviceMaintenance.Status status);
    
    List<DeviceMaintenance> findByPriority(DeviceMaintenance.Priority priority);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.nextMaintenance BETWEEN :startDate AND :endDate AND dm.status = 'ACTIVE'")
    List<DeviceMaintenance> findUpcomingMaintenance(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.nextMaintenance < :today AND dm.status = 'ACTIVE'")
    List<DeviceMaintenance> findOverdueMaintenance(@Param("today") LocalDate today);
    
    // Find by device ID, status, and next maintenance before a date
    List<DeviceMaintenance> findByDeviceIdAndStatusAndNextMaintenanceBefore(String deviceId, DeviceMaintenance.Status status, LocalDate date);
    
    // Find by device ID, status, and next maintenance between dates
    List<DeviceMaintenance> findByDeviceIdAndStatusAndNextMaintenanceBetween(String deviceId, DeviceMaintenance.Status status, LocalDate startDate, LocalDate endDate);
    
    // Find by status and next maintenance before a date
    List<DeviceMaintenance> findByStatusAndNextMaintenanceBefore(DeviceMaintenance.Status status, LocalDate date);
    
    long countByDeviceIdAndStatus(String deviceId, DeviceMaintenance.Status status);
    
    long countByOrganizationIdAndStatus(String organizationId, DeviceMaintenance.Status status);
}
