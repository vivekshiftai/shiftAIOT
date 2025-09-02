package com.iotplatform.repository;

import com.iotplatform.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
    
    @Query("SELECT n FROM Notification n WHERE n.organizationId = :organizationId AND " +
           "(n.userId IS NULL OR n.userId = :userId) ORDER BY n.createdAt DESC")
    List<Notification> findByOrganizationIdAndUserIdOrderByCreatedAtDesc(
            @Param("organizationId") String organizationId, 
            @Param("userId") String userId);
    
    long countByOrganizationIdAndReadFalse(String organizationId);
    
    @Query("SELECT COUNT(n) FROM Notification n WHERE n.organizationId = :organizationId AND " +
           "n.read = false AND (n.userId IS NULL OR n.userId = :userId)")
    long countUnreadByOrganizationIdAndUserId(@Param("organizationId") String organizationId, 
                                              @Param("userId") String userId);
    
    @Query("SELECT n FROM Notification n WHERE n.deviceId = :deviceId")
    List<Notification> findByDeviceId(@Param("deviceId") String deviceId);
    
    void deleteByDeviceId(String deviceId);
}