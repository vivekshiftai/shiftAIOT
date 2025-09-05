package com.iotplatform.repository;

import com.iotplatform.model.DeviceSafetyPrecaution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeviceSafetyPrecautionRepository extends JpaRepository<DeviceSafetyPrecaution, String> {
    
    List<DeviceSafetyPrecaution> findByDeviceId(String deviceId);
    
    List<DeviceSafetyPrecaution> findByDeviceIdAndOrganizationId(String deviceId, String organizationId);
    
    List<DeviceSafetyPrecaution> findByDeviceIdAndIsActiveTrueAndOrganizationId(String deviceId, String organizationId);
    
    List<DeviceSafetyPrecaution> findByOrganizationId(String organizationId);
    
    @Query("SELECT dsp FROM DeviceSafetyPrecaution dsp WHERE dsp.deviceId = :deviceId AND dsp.organizationId = :organizationId AND dsp.type = :type")
    List<DeviceSafetyPrecaution> findByDeviceIdAndTypeAndOrganizationId(@Param("deviceId") String deviceId, 
                                                                       @Param("type") String type, 
                                                                       @Param("organizationId") String organizationId);
    
    @Query("SELECT dsp FROM DeviceSafetyPrecaution dsp WHERE dsp.deviceId = :deviceId AND dsp.organizationId = :organizationId AND dsp.category = :category")
    List<DeviceSafetyPrecaution> findByDeviceIdAndCategoryAndOrganizationId(@Param("deviceId") String deviceId, 
                                                                           @Param("category") String category, 
                                                                           @Param("organizationId") String organizationId);
    
    @Query("SELECT dsp FROM DeviceSafetyPrecaution dsp WHERE dsp.deviceId = :deviceId AND dsp.organizationId = :organizationId AND dsp.severity = :severity")
    List<DeviceSafetyPrecaution> findByDeviceIdAndSeverityAndOrganizationId(@Param("deviceId") String deviceId, 
                                                                           @Param("severity") String severity, 
                                                                           @Param("organizationId") String organizationId);
    
    void deleteByDeviceIdAndOrganizationId(String deviceId, String organizationId);
    
    @Query("SELECT COUNT(dsp) FROM DeviceSafetyPrecaution dsp WHERE dsp.deviceId = :deviceId AND dsp.organizationId = :organizationId AND dsp.isActive = true")
    long countActiveByDeviceIdAndOrganizationId(@Param("deviceId") String deviceId, @Param("organizationId") String organizationId);
    
}
