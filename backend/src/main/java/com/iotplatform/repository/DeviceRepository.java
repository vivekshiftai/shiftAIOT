package com.iotplatform.repository;

import com.iotplatform.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceRepository extends JpaRepository<Device, String> {
    List<Device> findByOrganizationId(String organizationId);
    
    List<Device> findByOrganizationIdAndStatus(String organizationId, Device.DeviceStatus status);
    
    List<Device> findByOrganizationIdAndType(String organizationId, Device.DeviceType type);
    
    @Query("SELECT d FROM Device d WHERE d.organizationId = :organizationId AND " +
           "(LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.location) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Device> findByOrganizationIdAndSearch(@Param("organizationId") String organizationId, 
                                               @Param("search") String search);
    
    Optional<Device> findByIdAndOrganizationId(String id, String organizationId);
    
    @Query("SELECT COUNT(d) FROM Device d WHERE d.organizationId = :organizationId AND d.status = :status")
    long countByOrganizationIdAndStatus(@Param("organizationId") String organizationId, 
                                        @Param("status") Device.DeviceStatus status);
}