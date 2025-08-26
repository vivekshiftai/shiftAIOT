package com.iotplatform.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.iotplatform.model.Organization;
import com.iotplatform.model.Organization.Status;
import com.iotplatform.model.Organization.SubscriptionPlan;
import com.iotplatform.repository.OrganizationRepository;

@Service
public class OrganizationService {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationService.class);

    @Autowired
    private OrganizationRepository organizationRepository;

    public List<Organization> getAllOrganizations() {
        logger.info("Fetching all organizations");
        return organizationRepository.findAll();
    }

    public List<Organization> getActiveOrganizations() {
        logger.info("Fetching active organizations");
        return organizationRepository.findByStatus(Status.ACTIVE);
    }

    public Optional<Organization> getOrganizationById(String id) {
        logger.info("Fetching organization by ID: {}", id);
        return organizationRepository.findById(id);
    }

    public Optional<Organization> getOrganizationByName(String name) {
        logger.info("Fetching organization by name: {}", name);
        return organizationRepository.findByName(name);
    }

    public Organization createOrganization(Organization organization) {
        logger.info("Creating new organization: {}", organization.getName());
        
        // Generate ID if not provided
        if (organization.getId() == null || organization.getId().trim().isEmpty()) {
            organization.setId(UUID.randomUUID().toString());
        }
        
        // Set default values
        if (organization.getStatus() == null) {
            organization.setStatus(Status.ACTIVE);
        }
        
        if (organization.getSubscriptionPlan() == null) {
            organization.setSubscriptionPlan(SubscriptionPlan.BASIC);
        }
        
        Organization savedOrganization = organizationRepository.save(organization);
        logger.info("Organization created successfully with ID: {}", savedOrganization.getId());
        
        return savedOrganization;
    }

    public Organization updateOrganization(String id, Organization organizationDetails) {
        logger.info("Updating organization with ID: {}", id);
        
        return organizationRepository.findById(id)
            .map(existingOrganization -> {
                // Update fields
                if (organizationDetails.getName() != null) {
                    existingOrganization.setName(organizationDetails.getName());
                }
                if (organizationDetails.getDescription() != null) {
                    existingOrganization.setDescription(organizationDetails.getDescription());
                }
                if (organizationDetails.getContactEmail() != null) {
                    existingOrganization.setContactEmail(organizationDetails.getContactEmail());
                }
                if (organizationDetails.getContactPhone() != null) {
                    existingOrganization.setContactPhone(organizationDetails.getContactPhone());
                }
                if (organizationDetails.getAddress() != null) {
                    existingOrganization.setAddress(organizationDetails.getAddress());
                }
                if (organizationDetails.getCity() != null) {
                    existingOrganization.setCity(organizationDetails.getCity());
                }
                if (organizationDetails.getState() != null) {
                    existingOrganization.setState(organizationDetails.getState());
                }
                if (organizationDetails.getPostalCode() != null) {
                    existingOrganization.setPostalCode(organizationDetails.getPostalCode());
                }
                if (organizationDetails.getCountry() != null) {
                    existingOrganization.setCountry(organizationDetails.getCountry());
                }
                if (organizationDetails.getStatus() != null) {
                    existingOrganization.setStatus(organizationDetails.getStatus());
                }
                if (organizationDetails.getMaxUsers() != null) {
                    existingOrganization.setMaxUsers(organizationDetails.getMaxUsers());
                }
                if (organizationDetails.getMaxDevices() != null) {
                    existingOrganization.setMaxDevices(organizationDetails.getMaxDevices());
                }
                if (organizationDetails.getSubscriptionPlan() != null) {
                    existingOrganization.setSubscriptionPlan(organizationDetails.getSubscriptionPlan());
                }
                
                existingOrganization.setUpdatedAt(LocalDateTime.now());
                
                Organization updatedOrganization = organizationRepository.save(existingOrganization);
                logger.info("Organization updated successfully: {}", updatedOrganization.getName());
                
                return updatedOrganization;
            })
            .orElseThrow(() -> {
                logger.error("Organization not found with ID: {}", id);
                return new RuntimeException("Organization not found with ID: " + id);
            });
    }

    public void deleteOrganization(String id) {
        logger.info("Deleting organization with ID: {}", id);
        
        if (organizationRepository.existsById(id)) {
            organizationRepository.deleteById(id);
            logger.info("Organization deleted successfully with ID: {}", id);
        } else {
            logger.error("Organization not found with ID: {}", id);
            throw new RuntimeException("Organization not found with ID: " + id);
        }
    }

    public Organization deactivateOrganization(String id) {
        logger.info("Deactivating organization with ID: {}", id);
        
        return organizationRepository.findById(id)
            .map(organization -> {
                organization.setStatus(Status.INACTIVE);
                organization.setUpdatedAt(LocalDateTime.now());
                
                Organization deactivatedOrganization = organizationRepository.save(organization);
                logger.info("Organization deactivated successfully: {}", deactivatedOrganization.getName());
                
                return deactivatedOrganization;
            })
            .orElseThrow(() -> {
                logger.error("Organization not found with ID: {}", id);
                return new RuntimeException("Organization not found with ID: " + id);
            });
    }

    public Organization activateOrganization(String id) {
        logger.info("Activating organization with ID: {}", id);
        
        return organizationRepository.findById(id)
            .map(organization -> {
                organization.setStatus(Status.ACTIVE);
                organization.setUpdatedAt(LocalDateTime.now());
                
                Organization activatedOrganization = organizationRepository.save(organization);
                logger.info("Organization activated successfully: {}", activatedOrganization.getName());
                
                return activatedOrganization;
            })
            .orElseThrow(() -> {
                logger.error("Organization not found with ID: {}", id);
                return new RuntimeException("Organization not found with ID: " + id);
            });
    }

    public List<Organization> getOrganizationsBySubscriptionPlan(SubscriptionPlan plan) {
        logger.info("Fetching organizations with subscription plan: {}", plan);
        return organizationRepository.findBySubscriptionPlan(plan);
    }

    public long getOrganizationCount() {
        return organizationRepository.count();
    }

    public long getActiveOrganizationCount() {
        return organizationRepository.countByStatus(Status.ACTIVE);
    }

    public boolean organizationExists(String id) {
        return organizationRepository.existsById(id);
    }

    public boolean organizationNameExists(String name) {
        return organizationRepository.existsByName(name);
    }

    // Get or create default organization
    public Organization getOrCreateDefaultOrganization() {
        String defaultOrgId = "shiftAIOT-org-2024";
        String defaultOrgName = "ShiftAIOT Organization";
        
        return organizationRepository.findById(defaultOrgId)
            .orElseGet(() -> {
                logger.info("Creating default organization: {}", defaultOrgName);
                
                Organization defaultOrg = new Organization();
                defaultOrg.setId(defaultOrgId);
                defaultOrg.setName(defaultOrgName);
                defaultOrg.setDescription("Default organization for ShiftAIOT platform");
                defaultOrg.setStatus(Status.ACTIVE);
                defaultOrg.setSubscriptionPlan(SubscriptionPlan.ENTERPRISE);
                defaultOrg.setMaxUsers(1000);
                defaultOrg.setMaxDevices(10000);
                
                return organizationRepository.save(defaultOrg);
            });
    }
}
