package com.iotplatform.repository;

import com.iotplatform.model.Rule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RuleRepository extends JpaRepository<Rule, String> {
    List<Rule> findByOrganizationId(String organizationId);
    List<Rule> findByOrganizationIdAndActive(String organizationId, boolean active);
    Optional<Rule> findByIdAndOrganizationId(String id, String organizationId);
    List<Rule> findByActiveTrue();
    
    List<Rule> findByDeviceId(String deviceId);
    
    List<Rule> findByDeviceIdAndOrganizationId(String deviceId, String organizationId);
    
    @Query("SELECT r FROM Rule r WHERE r.deviceId = :deviceId AND r.name = :name AND r.organizationId = :organizationId")
    Optional<Rule> findByDeviceIdAndNameAndOrganizationId(@Param("deviceId") String deviceId, @Param("name") String name, @Param("organizationId") String organizationId);
    
    void deleteByDeviceId(String deviceId);
}