package com.iotplatform.repository;

import com.iotplatform.model.NotificationTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, String> {
    
    /**
     * Find all active templates for an organization
     */
    List<NotificationTemplate> findByOrganizationIdAndActiveTrueOrderByNameAsc(String organizationId);
    
    /**
     * Find template by type and organization
     */
    Optional<NotificationTemplate> findByTypeAndOrganizationIdAndActiveTrue(
        NotificationTemplate.TemplateType type, 
        String organizationId
    );
    
    /**
     * Find all templates by type for an organization
     */
    List<NotificationTemplate> findByTypeAndOrganizationIdOrderByNameAsc(
        NotificationTemplate.TemplateType type, 
        String organizationId
    );
    
    /**
     * Find templates by name containing (case-insensitive)
     */
    @Query("SELECT nt FROM NotificationTemplate nt WHERE nt.organizationId = :organizationId AND LOWER(nt.name) LIKE LOWER(CONCAT('%', :name, '%')) AND nt.active = true")
    List<NotificationTemplate> findByNameContainingIgnoreCaseAndOrganizationId(
        @Param("name") String name, 
        @Param("organizationId") String organizationId
    );
    
    /**
     * Check if template name exists in organization
     */
    boolean existsByNameAndOrganizationId(String name, String organizationId);
    
    /**
     * Count active templates by organization
     */
    long countByOrganizationIdAndActiveTrue(String organizationId);
}
