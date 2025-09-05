package com.iotplatform.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.DeviceMaintenance;

@Repository
public interface DeviceMaintenanceRepository extends JpaRepository<DeviceMaintenance, String> {
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId")
    List<DeviceMaintenance> findByDeviceId(@Param("deviceId") String deviceId);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId AND dm.organizationId = :organizationId")
    List<DeviceMaintenance> findByDeviceIdAndOrganizationId(@Param("deviceId") String deviceId, @Param("organizationId") String organizationId);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId AND dm.taskName = :taskName AND dm.organizationId = :organizationId")
    Optional<DeviceMaintenance> findByDeviceIdAndTaskNameAndOrganizationId(@Param("deviceId") String deviceId, @Param("taskName") String taskName, @Param("organizationId") String organizationId);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId AND dm.organizationId = :organizationId AND dm.assignedTo IS NULL")
    List<DeviceMaintenance> findByDeviceIdAndOrganizationIdAndAssignedToIsNull(@Param("deviceId") String deviceId, @Param("organizationId") String organizationId);
    
    List<DeviceMaintenance> findByOrganizationId(String organizationId);
    
    List<DeviceMaintenance> findByStatus(DeviceMaintenance.Status status);
    
    List<DeviceMaintenance> findByPriority(DeviceMaintenance.Priority priority);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.nextMaintenance BETWEEN :startDate AND :endDate AND dm.status = 'ACTIVE'")
    List<DeviceMaintenance> findUpcomingMaintenance(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.nextMaintenance < :today AND dm.status = 'ACTIVE'")
    List<DeviceMaintenance> findOverdueMaintenance(@Param("today") LocalDate today);
    
    // Find by device ID, status, and next maintenance before a date
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId AND dm.status = :status AND dm.nextMaintenance < :date")
    List<DeviceMaintenance> findByDeviceIdAndStatusAndNextMaintenanceBefore(@Param("deviceId") String deviceId, @Param("status") DeviceMaintenance.Status status, @Param("date") LocalDate date);
    
    // Find by device ID, status, and next maintenance between dates
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId AND dm.status = :status AND dm.nextMaintenance BETWEEN :startDate AND :endDate")
    List<DeviceMaintenance> findByDeviceIdAndStatusAndNextMaintenanceBetween(@Param("deviceId") String deviceId, @Param("status") DeviceMaintenance.Status status, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // Find by status and next maintenance before a date
    List<DeviceMaintenance> findByStatusAndNextMaintenanceBefore(DeviceMaintenance.Status status, LocalDate date);
    
    @Query("SELECT COUNT(dm) FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId AND dm.status = :status")
    long countByDeviceIdAndStatus(@Param("deviceId") String deviceId, @Param("status") DeviceMaintenance.Status status);
    
    @Query("SELECT COUNT(dm) FROM DeviceMaintenance dm WHERE dm.organizationId = :organizationId AND dm.status = :status")
    long countByOrganizationIdAndStatus(@Param("organizationId") String organizationId, @Param("status") DeviceMaintenance.Status status);
    
    // Find by status and next maintenance less than or equal to a date
    @Query("SELECT dm FROM DeviceMaintenance dm WHERE dm.status = :status AND dm.nextMaintenance <= :date")
    List<DeviceMaintenance> findByStatusAndNextMaintenanceLessThanEqual(@Param("status") DeviceMaintenance.Status status, @Param("date") LocalDate date);
    
    @Modifying
    @Query("DELETE FROM DeviceMaintenance dm WHERE dm.device.id = :deviceId")
    void deleteByDeviceId(@Param("deviceId") String deviceId);
}
