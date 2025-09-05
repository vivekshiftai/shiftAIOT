package com.iotplatform.service;

import com.iotplatform.model.Organization;
import com.iotplatform.repository.OrganizationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing organizations
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    /**
     * Ensure that the default organization exists.
     * This method will create the organization if it doesn't exist.
     * 
     * @param organizationId The organization ID to ensure exists
     * @return The organization (existing or newly created)
     */
    @Transactional
    public Organization ensureOrganizationExists(String organizationId) {
        try {
            log.info("🔍 Checking if organization exists: {}", organizationId);
            
            Optional<Organization> existingOrg = organizationRepository.findById(organizationId);
            
            if (existingOrg.isPresent()) {
                log.debug("✅ Organization already exists: {}", organizationId);
                return existingOrg.get();
            }
            
            // Create the organization if it doesn't exist
            log.info("🏢 Creating new organization: {}", organizationId);
            Organization newOrganization = new Organization();
            newOrganization.setId(organizationId);
            newOrganization.setName("ShiftAIOT Organization");
            newOrganization.setDescription("Default organization for ShiftAIOT platform");
            newOrganization.setStatus(Organization.Status.ACTIVE);
            newOrganization.setSubscriptionPlan(Organization.SubscriptionPlan.ENTERPRISE);
            newOrganization.setMaxUsers(1000); // Set high limits for default org
            newOrganization.setMaxDevices(10000);
            
            Organization savedOrganization = organizationRepository.save(newOrganization);
            log.info("✅ Organization created successfully: {} - {}", savedOrganization.getId(), savedOrganization.getName());
            
            return savedOrganization;
            
        } catch (Exception e) {
            log.error("❌ Failed to ensure organization exists: {} - {}", organizationId, e.getMessage(), e);
            throw new RuntimeException("Failed to ensure organization exists: " + e.getMessage(), e);
        }
    }

    /**
     * Get organization by ID, creating it if it doesn't exist
     * 
     * @param organizationId The organization ID
     * @return The organization
     */
    @Transactional
    public Organization getOrCreateOrganization(String organizationId) {
        return ensureOrganizationExists(organizationId);
    }

    /**
     * Create a new organization with the specified details
     * 
     * @param id The organization ID
     * @param name The organization name
     * @param description The organization description
     * @return The created organization
     */
    @Transactional
    public Organization createOrganization(String id, String name, String description) {
        try {
            log.info("🏢 Creating new organization: {} - {}", id, name);
            
            Organization organization = new Organization();
            organization.setId(id);
            organization.setName(name);
            organization.setDescription(description);
            organization.setStatus(Organization.Status.ACTIVE);
            organization.setSubscriptionPlan(Organization.SubscriptionPlan.ENTERPRISE);
            organization.setMaxUsers(1000);
            organization.setMaxDevices(10000);
            
            Organization savedOrganization = organizationRepository.save(organization);
            log.info("✅ Organization created successfully: {} - {}", savedOrganization.getId(), savedOrganization.getName());
            
            return savedOrganization;
            
        } catch (Exception e) {
            log.error("❌ Failed to create organization: {} - {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to create organization: " + e.getMessage(), e);
        }
    }

    /**
     * Check if an organization exists
     * 
     * @param organizationId The organization ID to check
     * @return true if the organization exists, false otherwise
     */
    public boolean organizationExists(String organizationId) {
        return organizationRepository.existsById(organizationId);
    }

    /**
     * Get organization by ID
     * 
     * @param organizationId The organization ID
     * @return Optional containing the organization if found
     */
    public Optional<Organization> getOrganization(String organizationId) {
        return organizationRepository.findById(organizationId);
    }

    /**
     * Get all organizations
     * 
     * @return List of all organizations
     */
    public java.util.List<Organization> getAllOrganizations() {
        return organizationRepository.findAll();
    }

    /**
     * Get all active organizations
     * 
     * @return List of active organizations
     */
    public java.util.List<Organization> getActiveOrganizations() {
        return organizationRepository.findByStatus(Organization.Status.ACTIVE);
    }

    /**
     * Get organization by ID (for controller compatibility)
     * 
     * @param id The organization ID
     * @return Optional containing the organization if found
     */
    public Optional<Organization> getOrganizationById(String id) {
        return organizationRepository.findById(id);
    }

    /**
     * Create organization from Organization object (for controller compatibility)
     * 
     * @param organization The organization to create
     * @return The created organization
     */
    @Transactional
    public Organization createOrganization(Organization organization) {
        try {
            log.info("🏢 Creating new organization: {} - {}", organization.getId(), organization.getName());
            
            // Set ID if not provided
            if (organization.getId() == null || organization.getId().trim().isEmpty()) {
                organization.setId(java.util.UUID.randomUUID().toString());
            }
            
            // Set default values if not provided
            if (organization.getStatus() == null) {
                organization.setStatus(Organization.Status.ACTIVE);
            }
            if (organization.getSubscriptionPlan() == null) {
                organization.setSubscriptionPlan(Organization.SubscriptionPlan.ENTERPRISE);
            }
            if (organization.getMaxUsers() == null) {
                organization.setMaxUsers(1000);
            }
            if (organization.getMaxDevices() == null) {
                organization.setMaxDevices(10000);
            }
            
            Organization savedOrganization = organizationRepository.save(organization);
            log.info("✅ Organization created successfully: {} - {}", savedOrganization.getId(), savedOrganization.getName());
            
            return savedOrganization;
            
        } catch (Exception e) {
            log.error("❌ Failed to create organization: {} - {}", organization.getId(), e.getMessage(), e);
            throw new RuntimeException("Failed to create organization: " + e.getMessage(), e);
        }
    }

    /**
     * Update organization
     * 
     * @param id The organization ID
     * @param organizationDetails The updated organization details
     * @return The updated organization
     */
    @Transactional
    public Organization updateOrganization(String id, Organization organizationDetails) {
        try {
            log.info("🔧 Updating organization: {}", id);
            
            Optional<Organization> existingOrgOpt = organizationRepository.findById(id);
            if (existingOrgOpt.isEmpty()) {
                throw new RuntimeException("Organization not found with ID: " + id);
            }
            
            Organization existingOrg = existingOrgOpt.get();
            
            // Update fields if provided
            if (organizationDetails.getName() != null) {
                existingOrg.setName(organizationDetails.getName());
            }
            if (organizationDetails.getDescription() != null) {
                existingOrg.setDescription(organizationDetails.getDescription());
            }
            if (organizationDetails.getContactEmail() != null) {
                existingOrg.setContactEmail(organizationDetails.getContactEmail());
            }
            if (organizationDetails.getContactPhone() != null) {
                existingOrg.setContactPhone(organizationDetails.getContactPhone());
            }
            if (organizationDetails.getAddress() != null) {
                existingOrg.setAddress(organizationDetails.getAddress());
            }
            if (organizationDetails.getCity() != null) {
                existingOrg.setCity(organizationDetails.getCity());
            }
            if (organizationDetails.getState() != null) {
                existingOrg.setState(organizationDetails.getState());
            }
            if (organizationDetails.getPostalCode() != null) {
                existingOrg.setPostalCode(organizationDetails.getPostalCode());
            }
            if (organizationDetails.getCountry() != null) {
                existingOrg.setCountry(organizationDetails.getCountry());
            }
            if (organizationDetails.getStatus() != null) {
                existingOrg.setStatus(organizationDetails.getStatus());
            }
            if (organizationDetails.getMaxUsers() != null) {
                existingOrg.setMaxUsers(organizationDetails.getMaxUsers());
            }
            if (organizationDetails.getMaxDevices() != null) {
                existingOrg.setMaxDevices(organizationDetails.getMaxDevices());
            }
            if (organizationDetails.getSubscriptionPlan() != null) {
                existingOrg.setSubscriptionPlan(organizationDetails.getSubscriptionPlan());
            }
            
            Organization updatedOrganization = organizationRepository.save(existingOrg);
            log.info("✅ Organization updated successfully: {} - {}", updatedOrganization.getId(), updatedOrganization.getName());
            
            return updatedOrganization;
            
        } catch (Exception e) {
            log.error("❌ Failed to update organization: {} - {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to update organization: " + e.getMessage(), e);
        }
    }

    /**
     * Delete organization
     * 
     * @param id The organization ID
     */
    @Transactional
    public void deleteOrganization(String id) {
        try {
            log.info("🗑️ Deleting organization: {}", id);
            
            if (!organizationRepository.existsById(id)) {
                throw new RuntimeException("Organization not found with ID: " + id);
            }
            
            organizationRepository.deleteById(id);
            log.info("✅ Organization deleted successfully: {}", id);
            
        } catch (Exception e) {
            log.error("❌ Failed to delete organization: {} - {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to delete organization: " + e.getMessage(), e);
        }
    }

    /**
     * Activate organization
     * 
     * @param id The organization ID
     * @return The activated organization
     */
    @Transactional
    public Organization activateOrganization(String id) {
        try {
            log.info("🟢 Activating organization: {}", id);
            
            Optional<Organization> existingOrgOpt = organizationRepository.findById(id);
            if (existingOrgOpt.isEmpty()) {
                throw new RuntimeException("Organization not found with ID: " + id);
            }
            
            Organization existingOrg = existingOrgOpt.get();
            existingOrg.setStatus(Organization.Status.ACTIVE);
            
            Organization activatedOrganization = organizationRepository.save(existingOrg);
            log.info("✅ Organization activated successfully: {} - {}", activatedOrganization.getId(), activatedOrganization.getName());
            
            return activatedOrganization;
            
        } catch (Exception e) {
            log.error("❌ Failed to activate organization: {} - {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to activate organization: " + e.getMessage(), e);
        }
    }

    /**
     * Deactivate organization
     * 
     * @param id The organization ID
     * @return The deactivated organization
     */
    @Transactional
    public Organization deactivateOrganization(String id) {
        try {
            log.info("🔴 Deactivating organization: {}", id);
            
            Optional<Organization> existingOrgOpt = organizationRepository.findById(id);
            if (existingOrgOpt.isEmpty()) {
                throw new RuntimeException("Organization not found with ID: " + id);
            }
            
            Organization existingOrg = existingOrgOpt.get();
            existingOrg.setStatus(Organization.Status.INACTIVE);
            
            Organization deactivatedOrganization = organizationRepository.save(existingOrg);
            log.info("✅ Organization deactivated successfully: {} - {}", deactivatedOrganization.getId(), deactivatedOrganization.getName());
            
            return deactivatedOrganization;
            
        } catch (Exception e) {
            log.error("❌ Failed to deactivate organization: {} - {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to deactivate organization: " + e.getMessage(), e);
        }
    }

    /**
     * Get organizations by subscription plan
     * 
     * @param plan The subscription plan
     * @return List of organizations with the specified plan
     */
    public java.util.List<Organization> getOrganizationsBySubscriptionPlan(Organization.SubscriptionPlan plan) {
        return organizationRepository.findBySubscriptionPlan(plan);
    }

    /**
     * Get total organization count
     * 
     * @return Total number of organizations
     */
    public long getOrganizationCount() {
        return organizationRepository.count();
    }

    /**
     * Get active organization count
     * 
     * @return Number of active organizations
     */
    public long getActiveOrganizationCount() {
        return organizationRepository.countByStatus(Organization.Status.ACTIVE);
    }

    /**
     * Get or create default organization
     * 
     * @return The default organization
     */
    public Organization getOrCreateDefaultOrganization() {
        String defaultOrganizationId = "shiftAIOT-org-2024";
        return ensureOrganizationExists(defaultOrganizationId);
    }
}