package com.iotplatform.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.iotplatform.model.Organization;
import com.iotplatform.model.Organization.Status;
import com.iotplatform.model.Organization.SubscriptionPlan;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.OrganizationService;

import jakarta.validation.Valid;

@CrossOrigin(originPatterns = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private static final Logger logger = LoggerFactory.getLogger(OrganizationController.class);

    @Autowired
    private OrganizationService organizationService;

    @GetMapping
    public ResponseEntity<List<Organization>> getAllOrganizations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Fetching all organizations for user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        List<Organization> organizations = organizationService.getAllOrganizations();
        return ResponseEntity.ok(organizations);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Organization>> getActiveOrganizations(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Fetching active organizations for user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        List<Organization> organizations = organizationService.getActiveOrganizations();
        return ResponseEntity.ok(organizations);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Organization> getOrganizationById(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Fetching organization by ID: {} for user: {}", id, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        return organizationService.getOrganizationById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Organization> createOrganization(
            @Valid @RequestBody Organization organization,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Creating organization: {} for user: {}", organization.getName(), 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        try {
            Organization createdOrganization = organizationService.createOrganization(organization);
            return ResponseEntity.ok(createdOrganization);
        } catch (Exception e) {
            logger.error("Error creating organization: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Organization> updateOrganization(
            @PathVariable String id,
            @Valid @RequestBody Organization organizationDetails,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Updating organization with ID: {} for user: {}", id, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        try {
            Organization updatedOrganization = organizationService.updateOrganization(id, organizationDetails);
            return ResponseEntity.ok(updatedOrganization);
        } catch (RuntimeException e) {
            logger.error("Error updating organization: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error updating organization: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteOrganization(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Deleting organization with ID: {} for user: {}", id, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        try {
            organizationService.deleteOrganization(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            logger.error("Error deleting organization: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deleting organization: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<Organization> activateOrganization(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Activating organization with ID: {} for user: {}", id, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        try {
            Organization activatedOrganization = organizationService.activateOrganization(id);
            return ResponseEntity.ok(activatedOrganization);
        } catch (RuntimeException e) {
            logger.error("Error activating organization: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error activating organization: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<Organization> deactivateOrganization(
            @PathVariable String id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Deactivating organization with ID: {} for user: {}", id, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        try {
            Organization deactivatedOrganization = organizationService.deactivateOrganization(id);
            return ResponseEntity.ok(deactivatedOrganization);
        } catch (RuntimeException e) {
            logger.error("Error deactivating organization: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error deactivating organization: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/by-plan")
    public ResponseEntity<List<Organization>> getOrganizationsBySubscriptionPlan(
            @RequestParam SubscriptionPlan plan,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Fetching organizations by subscription plan: {} for user: {}", plan, 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        List<Organization> organizations = organizationService.getOrganizationsBySubscriptionPlan(plan);
        return ResponseEntity.ok(organizations);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getOrganizationStats(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Fetching organization stats for user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        Map<String, Object> stats = Map.of(
            "totalOrganizations", organizationService.getOrganizationCount(),
            "activeOrganizations", organizationService.getActiveOrganizationCount()
        );
        
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/default")
    public ResponseEntity<Organization> getDefaultOrganization(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        logger.info("Fetching default organization for user: {}", 
                   userDetails != null ? userDetails.getUsername() : "unknown");
        
        Organization defaultOrg = organizationService.getOrCreateDefaultOrganization();
        return ResponseEntity.ok(defaultOrg);
    }
}
