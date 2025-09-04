package com.iotplatform.controller;

import com.iotplatform.dto.MaintenanceGenerationResponse.MaintenanceTask;
import com.iotplatform.service.JiraTaskAssignmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Controller for bulk Jira task operations
 * Provides endpoints for creating multiple Jira issues at once
 */
@RestController
@RequestMapping("/api/jira/bulk")
@CrossOrigin(origins = "*")
public class JiraBulkController {

    private static final Logger logger = LoggerFactory.getLogger(JiraBulkController.class);

    @Autowired
    private JiraTaskAssignmentService jiraTaskAssignmentService;

    /**
     * Creates multiple Jira issues in bulk
     * 
     * @param request Bulk task creation request
     * @return Response with created issue keys
     */
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createBulkTasks(@RequestBody BulkTaskRequest request) {
        try {
            logger.info("🚀 Creating {} Jira tasks in bulk", request.getTasks().size());

            List<String> issueKeys = jiraTaskAssignmentService.assignBulkMaintenanceTasks(request.getTasks());

            Map<String, Object> response = new HashMap<>();
            response.put("success", !issueKeys.isEmpty());
            response.put("message", issueKeys.isEmpty() ? "No tasks were created" : "Tasks created successfully");
            response.put("issueKeys", issueKeys);
            response.put("createdCount", issueKeys.size());
            response.put("requestedCount", request.getTasks().size());

            if (!issueKeys.isEmpty()) {
                logger.info("✅ Successfully created {} Jira tasks in bulk", issueKeys.size());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ No Jira tasks were created");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("❌ Error creating bulk Jira tasks: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error creating bulk tasks: " + e.getMessage());
            errorResponse.put("issueKeys", List.of());
            errorResponse.put("createdCount", 0);
            errorResponse.put("requestedCount", request.getTasks().size());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Creates bulk tasks from onboarding process
     * 
     * @param request Onboarding bulk task request
     * @return Response with created issue keys
     */
    @PostMapping("/onboarding")
    public ResponseEntity<Map<String, Object>> createBulkTasksFromOnboarding(@RequestBody OnboardingBulkTaskRequest request) {
        try {
            logger.info("🚀 Creating {} onboarding Jira tasks in bulk for device: {}", 
                       request.getTasks().size(), request.getDeviceName());

            List<String> issueKeys = jiraTaskAssignmentService.assignBulkTasksFromOnboarding(
                request.getTasks(), 
                request.getUserEmail(), 
                request.getDeviceName()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", !issueKeys.isEmpty());
            response.put("message", issueKeys.isEmpty() ? "No onboarding tasks were created" : "Onboarding tasks created successfully");
            response.put("issueKeys", issueKeys);
            response.put("createdCount", issueKeys.size());
            response.put("requestedCount", request.getTasks().size());
            response.put("deviceName", request.getDeviceName());
            response.put("userEmail", request.getUserEmail());

            if (!issueKeys.isEmpty()) {
                logger.info("✅ Successfully created {} onboarding Jira tasks in bulk", issueKeys.size());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ No onboarding Jira tasks were created");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("❌ Error creating bulk onboarding Jira tasks: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error creating bulk onboarding tasks: " + e.getMessage());
            errorResponse.put("issueKeys", List.of());
            errorResponse.put("createdCount", 0);
            errorResponse.put("requestedCount", request.getTasks().size());
            errorResponse.put("deviceName", request.getDeviceName());
            errorResponse.put("userEmail", request.getUserEmail());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Test endpoint to verify Jira configuration
     * 
     * @return Response with Jira configuration status
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, Object>> testJiraConfiguration() {
        try {
            logger.info("🔍 Testing Jira configuration...");
            
            Map<String, Object> response = new HashMap<>();
            
            // Test if Jira is configured
            boolean isConfigured = jiraTaskAssignmentService.isJiraConfigured();
            response.put("configured", isConfigured);
            response.put("message", isConfigured ? "Jira is properly configured" : "Jira configuration is missing");
            
            if (isConfigured) {
                response.put("status", "ready");
                logger.info("✅ Jira configuration test passed");
            } else {
                response.put("status", "not_configured");
                response.put("required_variables", List.of(
                    "JIRA_BASE_URL",
                    "JIRA_USERNAME", 
                    "JIRA_API_TOKEN",
                    "JIRA_PROJECT_KEY"
                ));
                logger.warn("⚠️ Jira configuration test failed - missing environment variables");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("❌ Error testing Jira configuration: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("configured", false);
            errorResponse.put("status", "error");
            errorResponse.put("message", "Error testing Jira configuration: " + e.getMessage());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Creates simple bulk tasks with basic information
     * 
     * @param request Simple bulk task request
     * @return Response with created issue keys
     */
    @PostMapping("/simple")
    public ResponseEntity<Map<String, Object>> createSimpleBulkTasks(@RequestBody SimpleBulkTaskRequest request) {
        try {
            logger.info("🚀 Creating {} simple Jira tasks in bulk", request.getTaskNames().size());

            // Convert simple task names to MaintenanceTask objects
            List<MaintenanceTask> tasks = request.getTaskNames().stream()
                .map(taskName -> JiraTaskAssignmentService.createSimpleTask(
                    taskName, 
                    request.getDescription(), 
                    request.getFrequency(), 
                    request.getPriority()
                ))
                .toList();

            List<String> issueKeys = jiraTaskAssignmentService.assignBulkMaintenanceTasks(tasks);

            Map<String, Object> response = new HashMap<>();
            response.put("success", !issueKeys.isEmpty());
            response.put("message", issueKeys.isEmpty() ? "No simple tasks were created" : "Simple tasks created successfully");
            response.put("issueKeys", issueKeys);
            response.put("createdCount", issueKeys.size());
            response.put("requestedCount", request.getTaskNames().size());

            if (!issueKeys.isEmpty()) {
                logger.info("✅ Successfully created {} simple Jira tasks in bulk", issueKeys.size());
                return ResponseEntity.ok(response);
            } else {
                logger.warn("⚠️ No simple Jira tasks were created");
                return ResponseEntity.badRequest().body(response);
            }

        } catch (Exception e) {
            logger.error("❌ Error creating simple bulk Jira tasks: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error creating simple bulk tasks: " + e.getMessage());
            errorResponse.put("issueKeys", List.of());
            errorResponse.put("createdCount", 0);
            errorResponse.put("requestedCount", request.getTaskNames().size());
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * Request DTO for bulk task creation
     */
    public static class BulkTaskRequest {
        private List<MaintenanceTask> tasks;

        public List<MaintenanceTask> getTasks() {
            return tasks;
        }

        public void setTasks(List<MaintenanceTask> tasks) {
            this.tasks = tasks;
        }
    }

    /**
     * Request DTO for onboarding bulk task creation
     */
    public static class OnboardingBulkTaskRequest {
        private List<MaintenanceTask> tasks;
        private String userEmail;
        private String deviceName;

        public List<MaintenanceTask> getTasks() {
            return tasks;
        }

        public void setTasks(List<MaintenanceTask> tasks) {
            this.tasks = tasks;
        }

        public String getUserEmail() {
            return userEmail;
        }

        public void setUserEmail(String userEmail) {
            this.userEmail = userEmail;
        }

        public String getDeviceName() {
            return deviceName;
        }

        public void setDeviceName(String deviceName) {
            this.deviceName = deviceName;
        }
    }

    /**
     * Request DTO for simple bulk task creation
     */
    public static class SimpleBulkTaskRequest {
        private List<String> taskNames;
        private String description;
        private String frequency;
        private String priority;

        public List<String> getTaskNames() {
            return taskNames;
        }

        public void setTaskNames(List<String> taskNames) {
            this.taskNames = taskNames;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getFrequency() {
            return frequency;
        }

        public void setFrequency(String frequency) {
            this.frequency = frequency;
        }

        public String getPriority() {
            return priority;
        }

        public void setPriority(String priority) {
            this.priority = priority;
        }
    }
}
