package com.iotplatform.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.DeviceSafetyPrecaution;

@Repository
public interface DeviceSafetyPrecautionRepository extends JpaRepository<DeviceSafetyPrecaution, String> {
    
    List<DeviceSafetyPrecaution> findByDeviceId(String deviceId);
    
    List<DeviceSafetyPrecaution> findByDeviceIdAndIsActiveTrue(String deviceId);
    
    List<DeviceSafetyPrecaution> findBySeverity(DeviceSafetyPrecaution.Severity severity);
    
    List<DeviceSafetyPrecaution> findByCategory(String category);
    
    List<DeviceSafetyPrecaution> findByDeviceIdAndSeverity(String deviceId, DeviceSafetyPrecaution.Severity severity);
    
    List<DeviceSafetyPrecaution> findByDeviceIdAndCategory(String deviceId, String category);
    
    long countByDeviceIdAndIsActiveTrue(String deviceId);
    
    long countByDeviceIdAndSeverity(String deviceId, DeviceSafetyPrecaution.Severity severity);
}
