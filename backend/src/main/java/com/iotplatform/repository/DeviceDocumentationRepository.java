package com.iotplatform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.DeviceDocumentation;

@Repository
public interface DeviceDocumentationRepository extends JpaRepository<DeviceDocumentation, String> {
    
    List<DeviceDocumentation> findByDeviceId(String deviceId);
    
    List<DeviceDocumentation> findByDeviceIdAndDocumentType(String deviceId, String documentType);
    
    List<DeviceDocumentation> findByProcessingStatus(String processingStatus);
    
    List<DeviceDocumentation> findByDeviceIdAndProcessingStatus(String deviceId, String processingStatus);
    
    @Query("SELECT d FROM DeviceDocumentation d WHERE d.deviceId IN (SELECT dev.id FROM Device dev WHERE dev.organizationId = :organizationId)")
    List<DeviceDocumentation> findByOrganizationId(@Param("organizationId") String organizationId);
    
    @Query("SELECT d FROM DeviceDocumentation d WHERE d.deviceId IN (SELECT dev.id FROM Device dev WHERE dev.organizationId = :organizationId) AND d.documentType = :documentType")
    List<DeviceDocumentation> findByOrganizationIdAndDocumentType(@Param("organizationId") String organizationId, @Param("documentType") String documentType);
    
    @Query("SELECT d FROM DeviceDocumentation d WHERE d.id = :id AND d.deviceId IN (SELECT dev.id FROM Device dev WHERE dev.organizationId = :organizationId)")
    Optional<DeviceDocumentation> findByIdAndDeviceOrganizationId(@Param("id") String id, @Param("organizationId") String organizationId);
    
    @Query("SELECT COUNT(d) FROM DeviceDocumentation d WHERE d.deviceId = :deviceId")
    long countByDeviceId(@Param("deviceId") String deviceId);
    
    @Query("SELECT COUNT(d) FROM DeviceDocumentation d WHERE d.deviceId IN (SELECT dev.id FROM Device dev WHERE dev.organizationId = :organizationId) AND d.documentType = :documentType")
    long countByOrganizationIdAndDocumentType(@Param("organizationId") String organizationId, @Param("documentType") String documentType);
    
    void deleteByDeviceId(String deviceId);
    
    // Find by collection name (from external service)
    List<DeviceDocumentation> findByCollectionName(String collectionName);
    
    // Find by PDF name (from external service)
    List<DeviceDocumentation> findByPdfName(String pdfName);
}
