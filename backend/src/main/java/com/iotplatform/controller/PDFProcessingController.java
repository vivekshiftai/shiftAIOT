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

    /**
     * Upload a PDF file for processing and storage.
     * 
     * @param file The PDF file to upload
     * @param organizationId The organization ID for data isolation
     * @param userDetails The authenticated user details
     * @return PDF upload response with processing details
     */
    @Operation(
        summary = "Upload PDF Document",
        description = "Upload a PDF file to the processing service for analysis and storage"
    )
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF uploaded successfully",
            content = @Content(schema = @Schema(implementation = PDFUploadResponse.class))),
        @ApiResponse(responseCode = "400", description = "Invalid file or request"),
        @ApiResponse(responseCode = "401", description = "Unauthorized"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PDFUploadResponse> uploadPDF(
            @Parameter(description = "PDF file to upload", required = true)
            @RequestParam("file") MultipartFile file,
            
            @Parameter(description = "Organization ID for data isolation", required = true)
            @RequestParam("organizationId") String organizationId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        log.info("PDF upload request received from user: {} for organization: {}", 
            userDetails.getUsername(), organizationId);
        
        try {
            PDFUploadResponse response = pdfProcessingService.uploadPDF(file, organizationId);
            
            log.info("PDF upload completed successfully: {} by user: {}", 
                response.getPdfName(), userDetails.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (PDFProcessingException e) {
            log.error("PDF upload failed for user: {} - {}", userDetails.getUsername(), e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Unexpected error during PDF upload for user: {}", userDetails.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
            PDFQueryResponse response = pdfProcessingService.queryPDF(
                request, 
                Long.parseLong(userDetails.getUser().getId()), 
                userDetails.getUser().getOrganizationId()
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
            CompletableFuture<RulesGenerationResponse> future = pdfProcessingService.generateRulesAsync(
                request.getPdfName(), 
                request.getDeviceId(), 
                request.getOrganizationId()
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
            CompletableFuture<MaintenanceGenerationResponse> future = pdfProcessingService.generateMaintenanceAsync(
                request.getPdfName(), 
                request.getDeviceId(), 
                request.getOrganizationId()
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
            CompletableFuture<SafetyGenerationResponse> future = pdfProcessingService.generateSafetyAsync(
                request.getPdfName(), 
                request.getDeviceId(), 
                request.getOrganizationId()
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
}
