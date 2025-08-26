package com.iotplatform.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.iotplatform.model.Organization;
import com.iotplatform.model.Organization.Status;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, String> {
    
    List<Organization> findByStatus(Status status);
    
    Optional<Organization> findByName(String name);
    
    boolean existsByName(String name);
    
    @Query("SELECT o FROM Organization o WHERE o.status = :status AND " +
           "(LOWER(o.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(o.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Organization> findByStatusAndSearch(@Param("status") Status status, 
                                           @Param("search") String search);
    
    @Query("SELECT COUNT(o) FROM Organization o WHERE o.status = :status")
    long countByStatus(@Param("status") Status status);
    
    @Query("SELECT o FROM Organization o WHERE o.subscriptionPlan = :plan")
    List<Organization> findBySubscriptionPlan(@Param("plan") Organization.SubscriptionPlan plan);
}
