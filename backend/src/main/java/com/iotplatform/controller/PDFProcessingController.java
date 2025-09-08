package com.iotplatform.controller;

import com.iotplatform.dto.*;
import com.iotplatform.dto.PDFProcessingDTOs.PDFStatusResponse;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.service.PDFProcessingService;
import com.iotplatform.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.CompletableFuture;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Collections;
import java.util.HashMap;
import java.util.Optional;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import org.springframework.web.client.RestTemplate;
import com.iotplatform.config.PDFProcessingConfig;
import com.iotplatform.dto.PDFProcessingResponse;
import com.iotplatform.model.UnifiedPDF;
import com.iotplatform.service.UnifiedPDFService;

import java.util.UUID;
import java.time.LocalDateTime;
import com.iotplatform.dto.ProcessingStatusResponse;
import com.iotplatform.dto.HealthCheckResponse;

/**
 * REST Controller for PDF processing operations.
 * Provides endpoints for uploading, querying, and managing PDF documents.
 * 
 * Features:
 * - File upload with validation
 * - Natural language querying
 * - Async content generation
 * - Comprehensive error handling
 * - Security and audit trails
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", maxAge = 3600)
public class PDFProcessingController {
    
    private static final Logger log = LoggerFactory.getLogger(PDFProcessingController.class);

    private final PDFProcessingService pdfProcessingService;
    private final PDFProcessingConfig config;
    private final RestTemplate restTemplate;
    private final UnifiedPDFService unifiedPDFService;

    /**
     * Upload a PDF file for processing and storage (Authenticated endpoint).
     * This endpoint requires authentication and uses the user's organization ID.
     * 
     * @param file The PDF file to upload
     * @param userDetails The authenticated user details
     * @return PDF upload response with processing details
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPDF(
            @RequestParam("file") MultipartFile file,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Authenticated PDF upload request received from user: {} for file: {} ({} bytes)", 
            userDetails.getUsername(), file.getOriginalFilename(), file.getSize());
        
        try {
            // Use authenticated user's organization ID
            String organizationId = userDetails.getUser().getOrganizationId();
            PDFUploadResponse response = pdfProcessingService.uploadPDF(file, organizationId);
            
            log.info("Authenticated PDF upload completed successfully for user: {} - {} ({} chunks processed)", 
                userDetails.getUsername(), response.getPdfName(), response.getChunksProcessed());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("Authenticated PDF upload failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            
            // Return specific error responses
            if (e.getMessage().contains("Only PDF files are allowed")) {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Only PDF files are allowed"));
            } else if (e.getMessage().contains("File size exceeds maximum limit")) {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("File too large. Maximum size: 52428800 bytes"));
            } else if (e.getMessage().contains("Invalid PDF file")) {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Invalid PDF file - please ensure the file is a valid PDF document"));
            } else {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of(e.getMessage()));
            }
            
        } catch (Exception e) {
            log.error("Unexpected error during authenticated PDF upload for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Internal server error during PDF processing"));
        }
    }

    /**
     * Upload a PDF file for processing and storage (Public endpoint).
     * This endpoint matches the specification provided for port 8000.
     * 
     * @param file The PDF file to upload
     * @return PDF upload response with processing details
     */
    @PostMapping(value = "/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPDFPublic(
            @RequestParam("file") MultipartFile file) {
        
        log.info("Public PDF upload request received for file: {} ({} bytes)", 
            file.getOriginalFilename(), file.getSize());
        
        try {
            // Use default organization for public uploads
            String organizationId = "public";
            PDFUploadResponse response = pdfProcessingService.uploadPDF(file, organizationId);
            
            log.info("Public PDF upload completed successfully: {} ({} chunks processed)", 
                response.getPdfName(), response.getChunksProcessed());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("Public PDF upload failed for file: {} - {}", file.getOriginalFilename(), e.getMessage());
            
            // Return specific error responses as per specification
            if (e.getMessage().contains("Only PDF files are allowed")) {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Only PDF files are allowed"));
            } else if (e.getMessage().contains("File size exceeds maximum limit")) {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("File too large. Maximum size: 52428800 bytes"));
            } else if (e.getMessage().contains("Invalid PDF file")) {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of("Invalid PDF file - please ensure the file is a valid PDF document"));
            } else {
                return ResponseEntity.badRequest()
                    .body(ErrorResponse.of(e.getMessage()));
            }
            
        } catch (Exception e) {
            log.error("Unexpected error during public PDF upload for file: {}", file.getOriginalFilename(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Internal server error during PDF processing"));
        }
    }

    /**
     * Query a PDF document with natural language.
     * 
     * @param request The query request containing PDF name and query text
     * @param userDetails The authenticated user details
     * @return Query response with AI-generated answer
     */
            @PostMapping("/query")
    public ResponseEntity<PDFQueryResponse> queryPDF(
                        @Valid @RequestBody PDFQueryRequest request,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF query request received from user: {} for document: {}", 
            userDetails.getUsername(), request.getPdfName());
        
        try {
            // Set organization ID from authenticated user
            String organizationId = userDetails.getUser().getOrganizationId();
            request.setOrganizationId(organizationId);
            
            log.info("PDF query request processed with organization ID: {}", organizationId);
            
            PDFQueryResponse response = pdfProcessingService.queryPDF(
                request, 
                userDetails.getUser().getId(), 
                organizationId
            );
            
            log.info("PDF query completed successfully for user: {} on document: {}", 
                userDetails.getUsername(), request.getPdfName());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("PDF query failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF query for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * List PDF documents with pagination.
     * 
     * @param page Page number (1-based)
     * @param size Page size
     * @param userDetails The authenticated user details
     * @return Paginated list of PDF documents
     */
            @GetMapping("/list")
    public ResponseEntity<PDFListResponse> listPDFs(
            @RequestParam(defaultValue = "1") int page,
            
                        @RequestParam(defaultValue = "10") int size,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF list request received from user: {} (page: {}, size: {})", 
            userDetails.getUsername(), page, size);
        
        try {
            PDFListResponse response = pdfProcessingService.listPDFs(
                userDetails.getUser().getOrganizationId(), 
                page, 
                size
            );
            
            log.info("PDF list retrieved successfully for user: {} ({} documents)", 
                userDetails.getUsername(), response.getTotalCount());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("PDF list failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF list for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{pdfName}/generate-rules")
        public ResponseEntity<?> generateRules(
            @PathVariable String pdfName,
            @RequestBody PDFGenerationRequest request) {
        
        log.info("Rules generation request received for: {}", pdfName);
        
        try {
            CompletableFuture<RulesGenerationResponse> future = pdfProcessingService.generateRulesAsync(
                pdfName, request.getDeviceId(), request.getOrganizationId());
            
            AsyncResponse<RulesGenerationResponse> asyncResponse = AsyncResponse.<RulesGenerationResponse>builder()
                .taskId(UUID.randomUUID().toString())
                .status("PENDING")
                .createdAt(LocalDateTime.now().toString())
                .build();
            
            return ResponseEntity.accepted().body(asyncResponse);
            
        } catch (Exception e) {
            log.error("Rules generation failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to start rules generation"));
        }
    }

    @PostMapping("/{pdfName}/generate-maintenance")
        public ResponseEntity<?> generateMaintenance(
            @PathVariable String pdfName,
            @RequestBody PDFGenerationRequest request) {
        
        log.info("Maintenance generation request received for: {}", pdfName);
        
        try {
            CompletableFuture<MaintenanceGenerationResponse> future = pdfProcessingService.generateMaintenanceAsync(
                pdfName, request.getDeviceId(), request.getOrganizationId());
            
            AsyncResponse<MaintenanceGenerationResponse> asyncResponse = AsyncResponse.<MaintenanceGenerationResponse>builder()
                .taskId(UUID.randomUUID().toString())
                .status("PENDING")
                .createdAt(LocalDateTime.now().toString())
                .build();
            
            return ResponseEntity.accepted().body(asyncResponse);
            
        } catch (Exception e) {
            log.error("Maintenance generation failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to start maintenance generation"));
        }
    }

    @PostMapping("/{pdfName}/generate-safety")
        public ResponseEntity<?> generateSafety(
            @PathVariable String pdfName,
            @RequestBody PDFGenerationRequest request) {
        
        log.info("Safety generation request received for: {}", pdfName);
        
        try {
            CompletableFuture<SafetyGenerationResponse> future = pdfProcessingService.generateSafetyAsync(
                pdfName, request.getDeviceId(), request.getOrganizationId());
            
            AsyncResponse<SafetyGenerationResponse> asyncResponse = AsyncResponse.<SafetyGenerationResponse>builder()
                .taskId(UUID.randomUUID().toString())
                .status("PENDING")
                .createdAt(LocalDateTime.now().toString())
                .build();
            
            return ResponseEntity.accepted().body(asyncResponse);
            
        } catch (Exception e) {
            log.error("Safety generation failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to start safety generation"));
        }
    }

    @GetMapping("/{pdfName}/status")
        public ResponseEntity<ProcessingStatusResponse> getProcessingStatus(@PathVariable String pdfName) {
        log.info("Processing status request received for: {}", pdfName);
        
        try {
            // Since we don't have organizationId in this simplified controller, 
            // we'll return a basic status response
            ProcessingStatusResponse status = ProcessingStatusResponse.builder()
                .success(true)
                .message("Status check not available without organization context")
                .operationId(pdfName)
                .status("UNKNOWN")
                .progress(0)
                .build();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Failed to get processing status for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{pdfName}")
        public ResponseEntity<PDFDeleteResponse> deletePDF(@PathVariable String pdfName) {
        log.info("PDF deletion request received for: {}", pdfName);
        
        try {
            // Since we don't have organizationId in this simplified controller,
            // we'll return a basic delete response
            PDFDeleteResponse response = PDFDeleteResponse.builder()
                .success(true)
                .message("PDF deletion not available without organization context")
                .deletedPdf(pdfName)
                .processingTime("0ms")
                .build();
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to delete PDF {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/health")
        public ResponseEntity<HealthCheckResponse> healthCheck() {
        log.info("Health check request received");
        
        try {
            HealthCheckResponse health = pdfProcessingService.healthCheck();
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ===== EXTERNAL SERVICE COMPATIBILITY ENDPOINTS =====

    /**
     * List PDFs in external service format.
     * 
     * @param page Page number
     * @param limit Items per page
     * @return PDF list in external service format
     */
        @GetMapping("/pdfs")
    public ResponseEntity<?> listPDFsExternal(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit) {
        
        log.info("External PDF list request received (page: {}, limit: {})", page, limit);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/pdfs?page=" + page + "&limit=" + limit;
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("External PDF list completed successfully");
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("External PDF list failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to list PDFs from external service"));
        }
    }

    /**
     * Delete PDF using external service format.
     * 
     * @param pdfName The name of the PDF to delete
     * @return Deletion response
     */
        @DeleteMapping("/pdfs/{pdfName}")
    public ResponseEntity<?> deletePDFExternal(@PathVariable String pdfName) {
        
        log.info("External PDF deletion request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/pdfs/" + pdfName;
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.DELETE, null, Object.class);
            
            log.info("External PDF deletion completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("External PDF deletion failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to delete PDF from external service"));
        }
    }

    /**
     * Generate rules using external service format.
     * 
     * @param pdfName The name of the PDF
     * @return Rules generation response
     */
        @PostMapping("/generate-rules/{pdfName}")
    public ResponseEntity<?> generateRulesExternal(@PathVariable String pdfName) {
        
        log.info("External rules generation request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/generate-rules/" + pdfName;
            ResponseEntity<Object> response = restTemplate.postForEntity(url, null, Object.class);
            
            log.info("External rules generation completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("External rules generation failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to generate rules from external service"));
        }
    }

    /**
     * Generate maintenance using external service format.
     * 
     * @param pdfName The name of the PDF
     * @return Maintenance generation response
     */
        @PostMapping("/generate-maintenance/{pdfName}")
    public ResponseEntity<?> generateMaintenanceExternal(@PathVariable String pdfName) {
        
        log.info("External maintenance generation request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/generate-maintenance/" + pdfName;
            ResponseEntity<Object> response = restTemplate.postForEntity(url, null, Object.class);
            
            log.info("External maintenance generation completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("External maintenance generation failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to generate maintenance from external service"));
        }
    }

    /**
     * Generate safety using external service format.
     * 
     * @param pdfName The name of the PDF
     * @return Safety generation response
     */
        @PostMapping("/generate-safety/{pdfName}")
    public ResponseEntity<?> generateSafetyExternal(@PathVariable String pdfName) {
        
        log.info("External safety generation request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/generate-safety/" + pdfName;
            ResponseEntity<Object> response = restTemplate.postForEntity(url, null, Object.class);
            
            log.info("External safety generation completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("External safety generation failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to generate safety from external service"));
        }
    }

    // ===== DEBUG ENDPOINTS =====

    /**
     * Debug collection analysis.
     * 
     * @param pdfName The name of the PDF
     * @return Collection analysis
     */
        @GetMapping("/debug/collection/{pdfName}")
    public ResponseEntity<?> debugCollection(@PathVariable String pdfName) {
        
        log.info("Debug collection analysis request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/debug/collection/" + pdfName;
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("Debug collection analysis completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Debug collection analysis failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to analyze collection from external service"));
        }
    }

    /**
     * Test query pipeline.
     * 
     * @param pdfName The name of the PDF
     * @param request The test query request
     * @return Test query response
     */
        @PostMapping("/debug/test-query/{pdfName}")
    public ResponseEntity<?> testQueryPipeline(
            @PathVariable String pdfName,
            @RequestBody Map<String, Object> request) {
        
        log.info("Test query pipeline request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/debug/test-query/" + pdfName;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Object> response = restTemplate.postForEntity(url, entity, Object.class);
            
            log.info("Test query pipeline completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Test query pipeline failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to test query pipeline from external service"));
        }
    }

    /**
     * List all collections.
     * 
     * @return All collections
     */
        @GetMapping("/collections")
    public ResponseEntity<?> listAllCollections() {
        
        log.info("List all collections request received");
        
        try {
            // Call external service directly - use same endpoint as PDF list
            // Note: External service requires page >= 1 and limit <= 100
            String url = config.getBaseUrl() + "/pdfs?page=1&limit=100";
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("List all collections completed successfully");
            return ResponseEntity.ok(response.getBody());
            
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.warn("External PDF service not available (404) - returning empty collections list");
                // Return empty collections list instead of error
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "collections", new ArrayList<>(),
                    "totalCount", 0
                ));
            } else {
                log.error("HTTP client error when listing collections: {}", e.getMessage());
                return ResponseEntity.status(e.getStatusCode())
                    .body(ErrorResponse.of("External service error: " + e.getMessage()));
            }
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.warn("External PDF service unavailable - returning empty collections list");
            // Return empty collections list instead of error
            return ResponseEntity.ok(Map.of(
                "success", true,
                "collections", new ArrayList<>(),
                "totalCount", 0
            ));
        } catch (Exception e) {
            log.error("Unexpected error when listing collections: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to list collections from external service: " + e.getMessage()));
        }
    }

    /**
     * Global health check.
     * 
     * @return Global health check response
     */
        @GetMapping("/health/global")
    public ResponseEntity<?> globalHealthCheck() {
        
        log.info("Global health check request received");
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/health";
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("Global health check completed successfully");
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Global health check failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to perform global health check from external service"));
        }
    }

    /**
     * Root endpoint.
     * 
     * @return Service information
     */
        @GetMapping("/info")
    public ResponseEntity<?> getServiceInfo() {
        
        log.info("Service info request received");
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/";
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("Service info completed successfully");
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Service info failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to get service info from external service"));
        }
    }

    /**
     * Callback endpoint to receive PDF processing results from external service
     * This endpoint should be called by the external PDF processing service
     */
    @PostMapping("/callback")
    public ResponseEntity<?> handlePDFProcessingCallback(@RequestBody PDFProcessingResponse response) {
        try {
            log.info("📄 Received PDF processing callback: {}", response);
            
            if (response.getSuccess() == null || !response.getSuccess()) {
                log.error("❌ PDF processing failed: {}", response.getMessage());
                return ResponseEntity.badRequest().body(createErrorResponse("PDF processing failed", response.getMessage()));
            }
            
            // Extract PDF name from response
            String pdfName = response.getPdfName();
            if (pdfName == null || pdfName.trim().isEmpty()) {
                log.error("❌ PDF name is missing in processing response");
                return ResponseEntity.badRequest().body(createErrorResponse("PDF name is missing", "PDF name is required"));
            }
            
            // Find device documentation by PDF name
            // Note: You might need to implement a more sophisticated lookup mechanism
            // Find PDF by name in the unified system
            Optional<UnifiedPDF> pdfOpt = unifiedPDFService.getPDFByName(pdfName, "public");
            
            if (pdfOpt.isPresent()) {
                UnifiedPDF pdf = pdfOpt.get();
                
                // Update the PDF with processing results
                UnifiedPDF updated = unifiedPDFService.updateProcessingResponse(
                    pdf.getId(),
                    response.getPdfName(),
                    response.getChunksProcessed(),
                    response.getProcessingTime(),
                    response.getCollectionName()
                );
                
                log.info("✅ Successfully updated PDF: {} for device: {}", 
                           updated.getId(), updated.getDeviceId());
                
                Map<String, Object> successResponse = new HashMap<>();
                successResponse.put("success", true);
                successResponse.put("message", "PDF updated successfully");
                successResponse.put("pdfId", updated.getId());
                successResponse.put("deviceId", updated.getDeviceId());
                
                return ResponseEntity.ok(successResponse);
                
            } else {
                log.warn("⚠️ No device documentation found for PDF: {}", pdfName);
                
                // You might want to create a new device documentation entry
                // or handle this case differently based on your requirements
                Map<String, Object> warningResponse = new HashMap<>();
                warningResponse.put("success", false);
                warningResponse.put("message", "No device documentation found for PDF: " + pdfName);
                warningResponse.put("pdfName", pdfName);
                
                return ResponseEntity.ok(warningResponse);
            }
            
        } catch (Exception e) {
            log.error("❌ Error handling PDF processing callback", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Internal server error", e.getMessage()));
        }
    }
    
    /**
     * Endpoint to manually trigger PDF processing status update
     * This can be used for testing or manual updates
     */
    @PostMapping("/update-status")
    public ResponseEntity<?> updateProcessingStatus(@RequestBody Map<String, Object> request) {
        try {
            String documentationId = (String) request.get("documentationId");
            String pdfName = (String) request.get("pdfName");
            Integer chunksProcessed = (Integer) request.get("chunksProcessed");
            String processingTime = (String) request.get("processingTime");
            String collectionName = (String) request.get("collectionName");
            
            if (documentationId == null || documentationId.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("Missing documentationId", "Documentation ID is required"));
            }
            
            Optional<UnifiedPDF> pdfOpt = unifiedPDFService.getPDFById(documentationId);
            if (pdfOpt.isPresent()) {
                UnifiedPDF updated = unifiedPDFService.updateProcessingResponse(
                    documentationId, pdfName, chunksProcessed, processingTime, collectionName
                );
                
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "Processing status updated successfully");
                response.put("pdf", updated);
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (Exception e) {
            log.error("❌ Error updating processing status", e);
            return ResponseEntity.internalServerError().body(createErrorResponse("Internal server error", e.getMessage()));
        }
    }
    
    /**
     * Helper method to find PDF by name in the unified system
     * This is a simple implementation - you might need to enhance this based on your requirements
     */
    private Optional<UnifiedPDF> findPDFByName(String pdfName) {
        // Try to find by PDF name
        Optional<UnifiedPDF> pdfOpt = unifiedPDFService.getPDFByName(pdfName, "public");
        if (pdfOpt.isPresent()) {
            return pdfOpt;
        }
        
        // If not found by name, try to find by original filename
        // This is a fallback mechanism - you might need to implement a more sophisticated lookup
        List<UnifiedPDF> allPdfs = unifiedPDFService.getPDFsByStatus("public", UnifiedPDF.ProcessingStatus.PENDING);
        for (UnifiedPDF pdf : allPdfs) {
            if (pdfName.equals(pdf.getName()) || pdfName.equals(pdf.getOriginalFilename())) {
                return Optional.of(pdf);
            }
        }
        
        return Optional.empty();
    }
    
    /**
     * Helper method to create error response
     */
    private Map<String, Object> createErrorResponse(String error, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("error", error);
        response.put("message", message);
        return response;
    }
}
