package com.iotplatform.repository;

import com.iotplatform.model.KnowledgeDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KnowledgeDocumentRepository extends JpaRepository<KnowledgeDocument, String> {
    List<KnowledgeDocument> findByOrganizationIdOrderByUploadedAtDesc(String organizationId);
    List<KnowledgeDocument> findByOrganizationIdAndVectorizedTrue(String organizationId);
    Optional<KnowledgeDocument> findByIdAndOrganizationId(String id, String organizationId);
}