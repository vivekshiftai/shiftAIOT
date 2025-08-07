package com.iotplatform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.DeviceConnection;

@Repository
public interface DeviceConnectionRepository extends JpaRepository<DeviceConnection, String> {
    
    List<DeviceConnection> findByOrganizationId(String organizationId);
    
    Optional<DeviceConnection> findByDeviceIdAndOrganizationId(String deviceId, String organizationId);
    
    List<DeviceConnection> findByOrganizationIdAndStatus(String organizationId, DeviceConnection.ConnectionStatus status);
    
    List<DeviceConnection> findByOrganizationIdAndConnectionType(String organizationId, DeviceConnection.ConnectionType connectionType);
    
    @Query("SELECT dc FROM DeviceConnection dc WHERE dc.organizationId = :organizationId AND dc.status = 'CONNECTED'")
    List<DeviceConnection> findActiveConnections(@Param("organizationId") String organizationId);
    
    @Query("SELECT COUNT(dc) FROM DeviceConnection dc WHERE dc.organizationId = :organizationId AND dc.status = 'CONNECTED'")
    long countActiveConnections(@Param("organizationId") String organizationId);
}
