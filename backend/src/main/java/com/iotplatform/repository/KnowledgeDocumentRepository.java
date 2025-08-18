package com.iotplatform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.KnowledgeDocument;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, Long> {
    
    List<KnowledgeDocument> findByOrganizationIdOrderByUploadedAtDesc(String organizationId);
    
    List<KnowledgeDocument> findByOrganizationIdAndVectorizedTrue(String organizationId);
    
    Optional<KnowledgeDocument> findByIdAndOrganizationId(Long id, String organizationId);
    
    @Query("SELECT COUNT(d) FROM KnowledgeDocument d WHERE d.organizationId = :organizationId")
    long countByOrganizationId(@Param("organizationId") String organizationId);
    
    @Query("SELECT COUNT(d) FROM KnowledgeDocument d WHERE d.organizationId = :organizationId AND d.vectorized = true")
    long countByOrganizationIdAndVectorizedTrue(@Param("organizationId") String organizationId);
    
    List<KnowledgeDocument> findByOrganizationIdAndDeviceIdOrderByUploadedAtDesc(String organizationId, String deviceId);
    
    List<KnowledgeDocument> findByOrganizationIdAndDeviceIdIsNullOrderByUploadedAtDesc(String organizationId);
    
    @Query("SELECT d FROM KnowledgeDocument d WHERE d.organizationId = :organizationId AND (d.deviceId = :deviceId OR :deviceId IS NULL) ORDER BY d.uploadedAt DESC")
    List<KnowledgeDocument> findByOrganizationIdAndOptionalDeviceIdOrderByUploadedAtDesc(@Param("organizationId") String organizationId, @Param("deviceId") String deviceId);
}