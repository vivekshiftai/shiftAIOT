package com.iotplatform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.iotplatform.model.MaintenanceSchedule;

public interface MaintenanceScheduleRepository extends JpaRepository<MaintenanceSchedule, String> {
    
    // Find by organization
    List<MaintenanceSchedule> findByOrganizationId(String organizationId);
    
    // Find by organization and status
    List<MaintenanceSchedule> findByOrganizationIdAndStatus(String organizationId, String status);
    
    // Find by organization and priority
    List<MaintenanceSchedule> findByOrganizationIdAndPriority(String organizationId, String priority);
    
    // Find by device ID
    List<MaintenanceSchedule> findByDeviceId(String deviceId);
    
    // Find by organization and device ID
    List<MaintenanceSchedule> findByOrganizationIdAndDeviceId(String organizationId, String deviceId);
    
    // Find by ID and organization (for security)
    Optional<MaintenanceSchedule> findByIdAndOrganizationId(String id, String organizationId);
    
    // Search by task name or description
    @Query("SELECT m FROM MaintenanceSchedule m WHERE m.organizationId = :organizationId AND (LOWER(m.taskName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<MaintenanceSchedule> searchByOrganizationIdAndTaskNameOrDescription(@Param("organizationId") String organizationId, @Param("searchTerm") String searchTerm);
    
    // Find overdue tasks
    @Query("SELECT m FROM MaintenanceSchedule m WHERE m.organizationId = :organizationId AND m.nextMaintenance < CURRENT_DATE AND m.status != 'completed'")
    List<MaintenanceSchedule> findOverdueTasks(@Param("organizationId") String organizationId);
    
    // Find upcoming tasks (next 7 days)
    @Query("SELECT m FROM MaintenanceSchedule m WHERE m.organizationId = :organizationId AND m.nextMaintenance BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND m.status != 'completed'")
    List<MaintenanceSchedule> findUpcomingTasks(@Param("organizationId") String organizationId);
}
