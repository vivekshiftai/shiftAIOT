package com.iotplatform.controller;

import com.iotplatform.dto.*;
import com.iotplatform.dto.PDFProcessingDTOs.PDFStatusResponse;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.service.PDFProcessingService;
import com.iotplatform.security.CustomUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.CompletableFuture;
import java.util.Map;
import java.util.Collections;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;
import com.iotplatform.config.PDFProcessingConfig;

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
@Slf4j
@RestController
@RequestMapping("/api/pdf")
@RequiredArgsConstructor
@Tag(name = "PDF Processing", description = "PDF document processing and management operations")
public class PDFProcessingController {

    private final PDFProcessingService pdfProcessingService;
    private final PDFProcessingConfig config;
    private final RestTemplate restTemplate;

    /**
     * Upload a PDF file for processing and storage (Public endpoint).
     * This endpoint matches the specification provided for port 8000.
     * 
     * @param file The PDF file to upload
     * @return PDF upload response with processing details
     */
    @Operation(
        summary = "Upload PDF Document (Public)",
        description = "Upload a PDF file to the processing service for analysis and storage. Public endpoint matching port 8000 specification."
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF uploaded successfully",
            content = @Content(schema = @Schema(implementation = PDFUploadResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid file type, size, or corrupted PDF"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(value = "/upload-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPDFPublic(
            @Parameter(description = "PDF file to upload", required = true)
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
    @Operation(
        summary = "Query PDF Document",
        description = "Query a PDF document using natural language and receive AI-generated responses"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Query processed successfully",
            content = @Content(schema = @Schema(implementation = PDFQueryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid query request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/query")
    public ResponseEntity<PDFQueryResponse> queryPDF(
            @Parameter(description = "Query request", required = true)
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
     * @param page Page number (0-based)
     * @param size Page size
     * @param userDetails The authenticated user details
     * @return Paginated list of PDF documents
     */
    @Operation(
        summary = "List PDF Documents",
        description = "Retrieve a paginated list of PDF documents for the organization"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF list retrieved successfully",
            content = @Content(schema = @Schema(implementation = PDFListResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/list")
    public ResponseEntity<PDFListResponse> listPDFs(
            @Parameter(description = "Page number (0-based)", example = "0")
            @RequestParam(defaultValue = "0") int page,
            
            @Parameter(description = "Page size", example = "10")
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

    /**
     * Generate IoT rules from a PDF document asynchronously.
     * 
     * @param request The generation request
     * @param userDetails The authenticated user details
     * @return Async response with task ID
     */
    @Operation(
        summary = "Generate IoT Rules from PDF",
        description = "Asynchronously generate IoT automation rules from PDF content"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "202", description = "Rule generation started",
            content = @Content(schema = @Schema(implementation = AsyncResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/generate-rules")
    public ResponseEntity<AsyncResponse<RulesGenerationResponse>> generateRules(
            @Parameter(description = "Generation request", required = true)
            @Valid @RequestBody PDFGenerationRequest request,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Rules generation request received from user: {} for PDF: {} and device: {}", 
            userDetails.getUsername(), request.getPdfName(), request.getDeviceId());
        
        try {
            // Set organization ID from authenticated user
            String organizationId = userDetails.getUser().getOrganizationId();
            request.setOrganizationId(organizationId);
            
            log.info("Rules generation request processed with organization ID: {}", organizationId);
            
            CompletableFuture<RulesGenerationResponse> future = pdfProcessingService.generateRulesAsync(
                request.getPdfName(), 
                request.getDeviceId(), 
                organizationId
            );
            
            // Create async response
            AsyncResponse<RulesGenerationResponse> asyncResponse = AsyncResponse.<RulesGenerationResponse>builder()
                .taskId(java.util.UUID.randomUUID().toString())
                .status("PENDING")
                .createdAt(java.time.LocalDateTime.now().toString())
                .build();
            
            log.info("Rules generation started for user: {} with task ID: {}", 
                userDetails.getUsername(), asyncResponse.getTaskId());
            
            return ResponseEntity.accepted().body(asyncResponse);
            
        } catch (PDFProcessingException e) {
            log.error("Rules generation failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during rules generation for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generate maintenance schedule from a PDF document asynchronously.
     * 
     * @param request The generation request
     * @param userDetails The authenticated user details
     * @return Async response with task ID
     */
    @Operation(
        summary = "Generate Maintenance Schedule from PDF",
        description = "Asynchronously generate maintenance tasks from PDF content"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "202", description = "Maintenance generation started",
            content = @Content(schema = @Schema(implementation = AsyncResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/generate-maintenance")
    public ResponseEntity<AsyncResponse<MaintenanceGenerationResponse>> generateMaintenance(
            @Parameter(description = "Generation request", required = true)
            @Valid @RequestBody PDFGenerationRequest request,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Maintenance generation request received from user: {} for PDF: {} and device: {}", 
            userDetails.getUsername(), request.getPdfName(), request.getDeviceId());
        
        try {
            // Set organization ID from authenticated user
            String organizationId = userDetails.getUser().getOrganizationId();
            request.setOrganizationId(organizationId);
            
            log.info("Maintenance generation request processed with organization ID: {}", organizationId);
            
            CompletableFuture<MaintenanceGenerationResponse> future = pdfProcessingService.generateMaintenanceAsync(
                request.getPdfName(), 
                request.getDeviceId(), 
                organizationId
            );
            
            // Create async response
            AsyncResponse<MaintenanceGenerationResponse> asyncResponse = AsyncResponse.<MaintenanceGenerationResponse>builder()
                .taskId(java.util.UUID.randomUUID().toString())
                .status("PENDING")
                .createdAt(java.time.LocalDateTime.now().toString())
                .build();
            
            log.info("Maintenance generation started for user: {} with task ID: {}", 
                userDetails.getUsername(), asyncResponse.getTaskId());
            
            return ResponseEntity.accepted().body(asyncResponse);
            
        } catch (PDFProcessingException e) {
            log.error("Maintenance generation failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during maintenance generation for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Generate safety information from a PDF document asynchronously.
     * 
     * @param request The generation request
     * @param userDetails The authenticated user details
     * @return Async response with task ID
     */
    @Operation(
        summary = "Generate Safety Information from PDF",
        description = "Asynchronously generate safety precautions from PDF content"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "202", description = "Safety generation started",
            content = @Content(schema = @Schema(implementation = AsyncResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping("/generate-safety")
    public ResponseEntity<AsyncResponse<SafetyGenerationResponse>> generateSafety(
            @Parameter(description = "Generation request", required = true)
            @Valid @RequestBody PDFGenerationRequest request,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("Safety generation request received from user: {} for PDF: {} and device: {}", 
            userDetails.getUsername(), request.getPdfName(), request.getDeviceId());
        
        try {
            // Set organization ID from authenticated user
            String organizationId = userDetails.getUser().getOrganizationId();
            request.setOrganizationId(organizationId);
            
            log.info("Safety generation request processed with organization ID: {}", organizationId);
            
            CompletableFuture<SafetyGenerationResponse> future = pdfProcessingService.generateSafetyAsync(
                request.getPdfName(), 
                request.getDeviceId(), 
                organizationId
            );
            
            // Create async response
            AsyncResponse<SafetyGenerationResponse> asyncResponse = AsyncResponse.<SafetyGenerationResponse>builder()
                .taskId(java.util.UUID.randomUUID().toString())
                .status("PENDING")
                .createdAt(java.time.LocalDateTime.now().toString())
                .build();
            
            log.info("Safety generation started for user: {} with task ID: {}", 
                userDetails.getUsername(), asyncResponse.getTaskId());
            
            return ResponseEntity.accepted().body(asyncResponse);
            
        } catch (PDFProcessingException e) {
            log.error("Safety generation failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during safety generation for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a PDF document.
     * 
     * @param pdfName The name of the PDF to delete
     * @param userDetails The authenticated user details
     * @return Deletion confirmation response
     */
    @Operation(
        summary = "Delete PDF Document",
        description = "Delete a PDF document from both external service and local database"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF deleted successfully",
            content = @Content(schema = @Schema(implementation = PDFDeleteResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/{pdfName}")
    public ResponseEntity<PDFDeleteResponse> deletePDF(
            @Parameter(description = "Name of the PDF to delete", required = true)
            @PathVariable String pdfName,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF deletion request received from user: {} for document: {}", 
            userDetails.getUsername(), pdfName);
        
        try {
            PDFDeleteResponse response = pdfProcessingService.deletePDF(
                pdfName, 
                userDetails.getUser().getOrganizationId()
            );
            
            log.info("PDF deleted successfully: {} by user: {}", pdfName, userDetails.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("PDF deletion failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF deletion for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Delete a PDF document (with /delete/ path for frontend compatibility).
     * 
     * @param pdfName The name of the PDF to delete
     * @param userDetails The authenticated user details
     * @return PDF deletion response
     */
    @Operation(
        summary = "Delete PDF Document (Frontend Compatible)",
        description = "Delete a PDF document from both external service and local database - frontend compatible endpoint"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF deleted successfully",
            content = @Content(schema = @Schema(implementation = PDFDeleteResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @DeleteMapping("/delete/{pdfName}")
    public ResponseEntity<PDFDeleteResponse> deletePDFWithPath(
            @Parameter(description = "Name of the PDF to delete", required = true)
            @PathVariable String pdfName,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF deletion request (with path) received from user: {} for document: {}", 
            userDetails.getUsername(), pdfName);
        
        try {
            PDFDeleteResponse response = pdfProcessingService.deletePDF(
                pdfName, 
                userDetails.getUser().getOrganizationId()
            );
            
            log.info("PDF deleted successfully (with path): {} by user: {}", pdfName, userDetails.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("PDF deletion failed (with path) for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF deletion (with path) for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Download a PDF document.
     * 
     * @param pdfName The name of the PDF to download
     * @param userDetails The authenticated user details
     * @return PDF file as byte array
     */
    @Operation(
        summary = "Download PDF Document",
        description = "Download a PDF document from the processing service"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF downloaded successfully",
            content = @Content(mediaType = "application/pdf")),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/download/{pdfName}")
    public ResponseEntity<byte[]> downloadPDF(
            @Parameter(description = "Name of the PDF to download", required = true)
            @PathVariable String pdfName,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF download request received from user: {} for document: {}", 
            userDetails.getUsername(), pdfName);
        
        try {
            byte[] pdfContent = pdfProcessingService.downloadPDF(
                pdfName, 
                userDetails.getUser().getOrganizationId()
            );
            
            log.info("PDF downloaded successfully: {} by user: {}", pdfName, userDetails.getUsername());
            
            return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"" + pdfName + "\"")
                .header("Content-Type", "application/pdf")
                .body(pdfContent);
            
        } catch (PDFProcessingException e) {
            log.error("PDF download failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF download for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get the processing status of a PDF document.
     * 
     * @param pdfName The name of the PDF to check status
     * @param userDetails The authenticated user details
     * @return PDF processing status
     */
    @Operation(
        summary = "Get PDF Processing Status",
        description = "Get the current processing status of a PDF document"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Status retrieved successfully",
            content = @Content(schema = @Schema(implementation = PDFStatusResponse.class))),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "404", description = "PDF document not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/status/{pdfName}")
    public ResponseEntity<PDFStatusResponse> getPDFStatus(
            @Parameter(description = "Name of the PDF to check status", required = true)
            @PathVariable String pdfName,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF status request received from user: {} for document: {}", 
            userDetails.getUsername(), pdfName);
        
        try {
            PDFStatusResponse response = pdfProcessingService.getPDFStatus(
                pdfName, 
                userDetails.getUser().getOrganizationId()
            );
            
            log.info("PDF status retrieved successfully: {} by user: {}", pdfName, userDetails.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("PDF status retrieval failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF status retrieval for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Check the health status of the PDF processing service.
     * 
     * @return Health check response
     */
    @Operation(
        summary = "Health Check",
        description = "Check the health status of the external PDF processing service"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Health check successful",
            content = @Content(schema = @Schema(implementation = HealthCheckResponse.class))),
        @ApiResponse(responseCode = "503", description = "Service unavailable"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @GetMapping("/health")
    public ResponseEntity<HealthCheckResponse> healthCheck() {
        log.debug("Health check request received");
        
        try {
            HealthCheckResponse response = pdfProcessingService.healthCheck();
            
            log.debug("Health check completed successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("Health check failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build();
        } catch (Exception e) {
            log.error("Unexpected error during health check", e);
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
    @Operation(
        summary = "List PDFs (External Format)",
        description = "List PDFs in the format expected by external service"
    )
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
    @Operation(
        summary = "Delete PDF (External Format)",
        description = "Delete PDF using external service endpoint format"
    )
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
    @Operation(
        summary = "Generate Rules (External Format)",
        description = "Generate rules using external service endpoint format"
    )
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
    @Operation(
        summary = "Generate Maintenance (External Format)",
        description = "Generate maintenance using external service endpoint format"
    )
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
    @Operation(
        summary = "Generate Safety (External Format)",
        description = "Generate safety using external service endpoint format"
    )
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
    @Operation(
        summary = "Debug Collection Analysis",
        description = "Analyze a specific PDF collection"
    )
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
    @Operation(
        summary = "Test Query Pipeline",
        description = "Test the query pipeline step by step"
    )
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
    @Operation(
        summary = "List All Collections",
        description = "List all available collections"
    )
    @GetMapping("/debug/collections")
    public ResponseEntity<?> listAllCollections() {
        
        log.info("List all collections request received");
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/debug/collections";
            log.info("Calling external service: {}", url);
            
            // Add headers for better compatibility
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<Object> response = restTemplate.exchange(url, HttpMethod.GET, entity, Object.class);
            
            log.info("List all collections completed successfully. Response status: {}", response.getStatusCode());
            log.debug("Response body: {}", response.getBody());
            
            return ResponseEntity.ok(response.getBody());
            
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            log.error("HTTP client error when listing collections: {} - {}", e.getStatusCode(), e.getMessage());
            return ResponseEntity.status(e.getStatusCode())
                .body(ErrorResponse.of("External service error: " + e.getMessage()));
        } catch (org.springframework.web.client.HttpServerErrorException e) {
            log.error("HTTP server error when listing collections: {} - {}", e.getStatusCode(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("External service error: " + e.getMessage()));
        } catch (org.springframework.web.client.ResourceAccessException e) {
            log.error("Resource access error when listing collections: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(ErrorResponse.of("External service unavailable: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error when listing collections: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to list collections from external service: " + e.getMessage()));
        }
    }

    /**
     * Debug health check.
     * 
     * @return Debug health check response
     */
    @Operation(
        summary = "Debug Health Check",
        description = "Comprehensive health check"
    )
    @GetMapping("/debug/health")
    public ResponseEntity<?> debugHealthCheck() {
        
        log.info("Debug health check request received");
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/debug/health";
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("Debug health check completed successfully");
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Debug health check failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to perform debug health check from external service"));
        }
    }

    /**
     * Test images.
     * 
     * @param pdfName The name of the PDF
     * @return Test images response
     */
    @Operation(
        summary = "Test Images",
        description = "Test image storage and retrieval"
    )
    @GetMapping("/debug/test-images/{pdfName}")
    public ResponseEntity<?> testImages(@PathVariable String pdfName) {
        
        log.info("Test images request received for: {}", pdfName);
        
        try {
            // Call external service directly
            String url = config.getBaseUrl() + "/debug/test-images/" + pdfName;
            ResponseEntity<Object> response = restTemplate.getForEntity(url, Object.class);
            
            log.info("Test images completed successfully: {}", pdfName);
            return ResponseEntity.ok(response.getBody());
            
        } catch (Exception e) {
            log.error("Test images failed for {}: {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("Failed to test images from external service"));
        }
    }

    /**
     * Global health check.
     * 
     * @return Global health check response
     */
    @Operation(
        summary = "Global Health Check",
        description = "Global health check for all services"
    )
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
    @Operation(
        summary = "Root Endpoint",
        description = "Get service information and available endpoints"
    )
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
}
