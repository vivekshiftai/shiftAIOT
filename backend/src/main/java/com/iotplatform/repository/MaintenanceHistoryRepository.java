package com.iotplatform.repository;

import com.iotplatform.model.MaintenanceHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for MaintenanceHistory entities.
 * Provides methods for querying maintenance history data.
 */
@Repository
public interface MaintenanceHistoryRepository extends JpaRepository<MaintenanceHistory, String> {
    
    /**
     * Find all maintenance history records for a specific device
     */
    List<MaintenanceHistory> findByDeviceIdOrderByScheduledDateDesc(String deviceId);
    
    /**
     * Find all maintenance history records for a specific organization
     */
    List<MaintenanceHistory> findByOrganizationIdOrderByScheduledDateDesc(String organizationId);
    
    /**
     * Find maintenance history records for a device within a date range
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.deviceId = :deviceId " +
           "AND mh.scheduledDate BETWEEN :startDate AND :endDate " +
           "ORDER BY mh.scheduledDate DESC")
    List<MaintenanceHistory> findByDeviceIdAndScheduledDateBetween(
            @Param("deviceId") String deviceId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    /**
     * Find maintenance history records for an organization within a date range
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.organizationId = :organizationId " +
           "AND mh.scheduledDate BETWEEN :startDate AND :endDate " +
           "ORDER BY mh.scheduledDate DESC")
    List<MaintenanceHistory> findByOrganizationIdAndScheduledDateBetween(
            @Param("organizationId") String organizationId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    /**
     * Find maintenance history records by status
     */
    List<MaintenanceHistory> findByStatusOrderByScheduledDateDesc(MaintenanceHistory.Status status);
    
    /**
     * Find maintenance history records by status and organization
     */
    List<MaintenanceHistory> findByStatusAndOrganizationIdOrderByScheduledDateDesc(
            MaintenanceHistory.Status status, String organizationId);
    
    /**
     * Find maintenance history records by assigned user
     */
    List<MaintenanceHistory> findByAssignedToOrderByScheduledDateDesc(String assignedTo);
    
    /**
     * Find maintenance history records by assigned user and organization
     */
    List<MaintenanceHistory> findByAssignedToAndOrganizationIdOrderByScheduledDateDesc(
            String assignedTo, String organizationId);
    
    /**
     * Find maintenance history records by original maintenance ID
     */
    List<MaintenanceHistory> findByOriginalMaintenanceIdOrderByScheduledDateDesc(String originalMaintenanceId);
    
    /**
     * Find maintenance history records by maintenance cycle number for a device
     */
    List<MaintenanceHistory> findByDeviceIdAndMaintenanceCycleNumberOrderByScheduledDateDesc(
            String deviceId, Integer cycleNumber);
    
    /**
     * Find the latest maintenance history record for a device
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.deviceId = :deviceId " +
           "ORDER BY mh.scheduledDate DESC LIMIT 1")
    Optional<MaintenanceHistory> findLatestByDeviceId(@Param("deviceId") String deviceId);
    
    /**
     * Find the next maintenance cycle number for a device
     */
    @Query("SELECT COALESCE(MAX(mh.maintenanceCycleNumber), 0) + 1 FROM MaintenanceHistory mh " +
           "WHERE mh.deviceId = :deviceId")
    Integer findNextCycleNumberForDevice(@Param("deviceId") String deviceId);
    
    /**
     * Count maintenance history records by status
     */
    long countByStatus(MaintenanceHistory.Status status);
    
    /**
     * Count maintenance history records by status and organization
     */
    long countByStatusAndOrganizationId(MaintenanceHistory.Status status, String organizationId);
    
    /**
     * Count maintenance history records by device
     */
    long countByDeviceId(String deviceId);
    
    /**
     * Find overdue maintenance history records (scheduled date in the past, status not completed)
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.scheduledDate < :today " +
           "AND mh.status NOT IN ('COMPLETED', 'CANCELLED') " +
           "ORDER BY mh.scheduledDate ASC")
    List<MaintenanceHistory> findOverdueMaintenance(@Param("today") LocalDate today);
    
    /**
     * Find overdue maintenance history records for an organization
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.organizationId = :organizationId " +
           "AND mh.scheduledDate < :today " +
           "AND mh.status NOT IN ('COMPLETED', 'CANCELLED') " +
           "ORDER BY mh.scheduledDate ASC")
    List<MaintenanceHistory> findOverdueMaintenanceByOrganization(
            @Param("organizationId") String organizationId, @Param("today") LocalDate today);
    
    /**
     * Find maintenance history records scheduled for today
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.scheduledDate = :today " +
           "AND mh.status NOT IN ('COMPLETED', 'CANCELLED') " +
           "ORDER BY mh.priority DESC, mh.scheduledDate ASC")
    List<MaintenanceHistory> findTodaysMaintenance(@Param("today") LocalDate today);
    
    /**
     * Find maintenance history records scheduled for today for an organization
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.organizationId = :organizationId " +
           "AND mh.scheduledDate = :today " +
           "AND mh.status NOT IN ('COMPLETED', 'CANCELLED') " +
           "ORDER BY mh.priority DESC, mh.scheduledDate ASC")
    List<MaintenanceHistory> findTodaysMaintenanceByOrganization(
            @Param("organizationId") String organizationId, @Param("today") LocalDate today);
    
    /**
     * Find maintenance history records scheduled for a specific date range
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.scheduledDate BETWEEN :startDate AND :endDate " +
           "ORDER BY mh.scheduledDate ASC, mh.priority DESC")
    List<MaintenanceHistory> findMaintenanceInDateRange(
            @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    /**
     * Find maintenance history records by priority
     */
    List<MaintenanceHistory> findByPriorityOrderByScheduledDateDesc(MaintenanceHistory.Priority priority);
    
    /**
     * Find maintenance history records by priority and organization
     */
    List<MaintenanceHistory> findByPriorityAndOrganizationIdOrderByScheduledDateDesc(
            MaintenanceHistory.Priority priority, String organizationId);
    
    /**
     * Find maintenance history records by maintenance type
     */
    List<MaintenanceHistory> findByMaintenanceTypeOrderByScheduledDateDesc(MaintenanceHistory.MaintenanceType maintenanceType);
    
    /**
     * Find maintenance history records by maintenance type and organization
     */
    List<MaintenanceHistory> findByMaintenanceTypeAndOrganizationIdOrderByScheduledDateDesc(
            MaintenanceHistory.MaintenanceType maintenanceType, String organizationId);
    
    /**
     * Get maintenance statistics for a device
     */
    @Query("SELECT " +
           "COUNT(mh) as totalMaintenance, " +
           "COUNT(CASE WHEN mh.status = 'COMPLETED' THEN 1 END) as completedMaintenance, " +
           "COUNT(CASE WHEN mh.status = 'OVERDUE' THEN 1 END) as overdueMaintenance, " +
           "COUNT(CASE WHEN mh.status = 'SCHEDULED' THEN 1 END) as scheduledMaintenance " +
           "FROM MaintenanceHistory mh WHERE mh.deviceId = :deviceId")
    Object[] getMaintenanceStatisticsForDevice(@Param("deviceId") String deviceId);
    
    /**
     * Get maintenance statistics for an organization
     */
    @Query("SELECT " +
           "COUNT(mh) as totalMaintenance, " +
           "COUNT(CASE WHEN mh.status = 'COMPLETED' THEN 1 END) as completedMaintenance, " +
           "COUNT(CASE WHEN mh.status = 'OVERDUE' THEN 1 END) as overdueMaintenance, " +
           "COUNT(CASE WHEN mh.status = 'SCHEDULED' THEN 1 END) as scheduledMaintenance " +
           "FROM MaintenanceHistory mh WHERE mh.organizationId = :organizationId")
    Object[] getMaintenanceStatisticsForOrganization(@Param("organizationId") String organizationId);
    
    /**
     * Find maintenance history records by snapshot type
     */
    List<MaintenanceHistory> findBySnapshotTypeOrderByCreatedAtDesc(String snapshotType);
    
    /**
     * Find maintenance history records by snapshot type and organization
     */
    List<MaintenanceHistory> findBySnapshotTypeAndOrganizationIdOrderByCreatedAtDesc(
            String snapshotType, String organizationId);
    
    /**
     * Find daily snapshots for a specific date
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.snapshotType = 'DAILY_SNAPSHOT' " +
           "AND DATE(mh.createdAt) = :snapshotDate " +
           "ORDER BY mh.createdAt DESC")
    List<MaintenanceHistory> findDailySnapshotsByDate(@Param("snapshotDate") LocalDate snapshotDate);
    
    /**
     * Find daily snapshots for a specific date and organization
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.snapshotType = 'DAILY_SNAPSHOT' " +
           "AND mh.organizationId = :organizationId " +
           "AND DATE(mh.createdAt) = :snapshotDate " +
           "ORDER BY mh.createdAt DESC")
    List<MaintenanceHistory> findDailySnapshotsByDateAndOrganization(
            @Param("organizationId") String organizationId, @Param("snapshotDate") LocalDate snapshotDate);
    
    /**
     * Find latest daily snapshot for each device
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.snapshotType = 'DAILY_SNAPSHOT' " +
           "AND mh.id IN (SELECT MAX(mh2.id) FROM MaintenanceHistory mh2 " +
           "WHERE mh2.snapshotType = 'DAILY_SNAPSHOT' " +
           "GROUP BY mh2.deviceId) " +
           "ORDER BY mh.createdAt DESC")
    List<MaintenanceHistory> findLatestDailySnapshots();
    
    /**
     * Find latest daily snapshot for each device in organization
     */
    @Query("SELECT mh FROM MaintenanceHistory mh WHERE mh.snapshotType = 'DAILY_SNAPSHOT' " +
           "AND mh.organizationId = :organizationId " +
           "AND mh.id IN (SELECT MAX(mh2.id) FROM MaintenanceHistory mh2 " +
           "WHERE mh2.snapshotType = 'DAILY_SNAPSHOT' " +
           "AND mh2.organizationId = :organizationId " +
           "GROUP BY mh2.deviceId) " +
           "ORDER BY mh.createdAt DESC")
    List<MaintenanceHistory> findLatestDailySnapshotsByOrganization(@Param("organizationId") String organizationId);
    
    /**
     * Count maintenance history records by snapshot type
     */
    long countBySnapshotType(String snapshotType);
    
    /**
     * Count maintenance history records by snapshot type and organization
     */
    long countBySnapshotTypeAndOrganizationId(String snapshotType, String organizationId);
}
