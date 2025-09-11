package com.iotplatform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
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
    
    // Find by organization and maintenance type
    List<MaintenanceSchedule> findByOrganizationIdAndMaintenanceType(String organizationId, String maintenanceType);
    
    // Find by ID and organization (for security)
    Optional<MaintenanceSchedule> findByIdAndOrganizationId(String id, String organizationId);
    
    // Count by organization
    long countByOrganizationId(String organizationId);
    
    // Count by organization and status
    long countByOrganizationIdAndStatus(String organizationId, String status);
    
    // Search by task name or description
    @Query("SELECT m FROM MaintenanceSchedule m WHERE m.organizationId = :organizationId AND (LOWER(m.taskName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(m.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<MaintenanceSchedule> searchByOrganizationIdAndTaskNameOrDescription(@Param("organizationId") String organizationId, @Param("searchTerm") String searchTerm);
    
    // Find overdue tasks
    @Query(value = "SELECT * FROM device_maintenance m WHERE m.organization_id = :organizationId AND m.next_maintenance < CURRENT_DATE AND m.status != 'completed'", nativeQuery = true)
    List<MaintenanceSchedule> findOverdueTasks(@Param("organizationId") String organizationId);
    
    // Find upcoming tasks (next 7 days)
    @Query(value = "SELECT * FROM device_maintenance m WHERE m.organization_id = :organizationId AND m.next_maintenance BETWEEN CURRENT_DATE AND DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY) AND m.status != 'completed'", nativeQuery = true)
    List<MaintenanceSchedule> findUpcomingTasks(@Param("organizationId") String organizationId);
    
    // Find today's maintenance tasks
    @Query(value = "SELECT * FROM device_maintenance m WHERE m.organization_id = :organizationId AND m.next_maintenance = CURRENT_DATE AND m.status != 'completed'", nativeQuery = true)
    List<MaintenanceSchedule> findTodaysMaintenanceTasks(@Param("organizationId") String organizationId);
    
    // Find today's maintenance tasks with device and user details
    @Query(value = """
        SELECT m.*, d.name as device_name, d.assigned_user_id, u.first_name, u.last_name, u.email 
        FROM device_maintenance m 
        LEFT JOIN devices d ON m.device_id = d.id 
        LEFT JOIN users u ON d.assigned_user_id = u.id 
        WHERE m.organization_id = :organizationId 
        AND m.next_maintenance = CURRENT_DATE 
        AND m.status != 'completed'
        """, nativeQuery = true)
    List<Object[]> findTodaysMaintenanceTasksWithDetails(@Param("organizationId") String organizationId);
    
    // Find ALL today's maintenance tasks with device and user details (across all organizations)
    // This includes overdue tasks and tasks scheduled for today
    @Query(value = """
        SELECT m.*, d.name as device_name, d.assigned_user_id, u.first_name, u.last_name, u.email 
        FROM device_maintenance m 
        LEFT JOIN devices d ON m.device_id = d.id 
        LEFT JOIN users u ON d.assigned_user_id = u.id 
        WHERE m.next_maintenance <= CURRENT_DATE 
        AND m.status IN ('ACTIVE', 'PENDING', 'OVERDUE')
        AND d.assigned_user_id IS NOT NULL
        """, nativeQuery = true)
    List<Object[]> findAllTodaysMaintenanceTasksWithDetails();
    
    // Delete by device ID
    @Modifying
    @Query("DELETE FROM MaintenanceSchedule m WHERE m.deviceId = :deviceId")
    void deleteByDeviceId(@Param("deviceId") String deviceId);
    
    // Update maintenance status
    @Modifying
    @Query("UPDATE MaintenanceSchedule m SET m.status = :status, m.updatedAt = CURRENT_TIMESTAMP WHERE m.id = :id")
    void updateMaintenanceStatus(@Param("id") String id, @Param("status") String status);
    
    // Update maintenance task schedule (next maintenance date and status)
    @Modifying
    @Query("UPDATE MaintenanceSchedule m SET m.nextMaintenance = :nextMaintenance, m.status = :status, m.updatedAt = CURRENT_TIMESTAMP WHERE m.id = :id")
    void updateMaintenanceTaskSchedule(@Param("id") String id, @Param("nextMaintenance") java.time.LocalDate nextMaintenance, @Param("status") String status);
    
    // Find maintenance tasks that need reminders (due today or overdue, not completed)
    @Query(value = """
        SELECT m.*, d.name as device_name, d.assigned_user_id, u.first_name, u.last_name, u.email 
        FROM device_maintenance m 
        LEFT JOIN devices d ON m.device_id = d.id 
        LEFT JOIN users u ON d.assigned_user_id = u.id 
        WHERE m.next_maintenance <= CURRENT_DATE 
        AND m.status IN ('ACTIVE', 'PENDING', 'OVERDUE')
        AND d.assigned_user_id IS NOT NULL
        AND u.id IS NOT NULL
        """, nativeQuery = true)
    List<Object[]> findMaintenanceTasksNeedingReminders();
    
}
