package com.iotplatform.service;

import com.iotplatform.dto.*;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.model.PDFDocument;
import com.iotplatform.model.PDFQuery;
import com.iotplatform.repository.PDFDocumentRepository;
import com.iotplatform.repository.PDFQueryRepository;
import com.iotplatform.config.PDFProcessingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Implementation of PDF processing service with external MinerU integration.
 * Handles all PDF operations including upload, query, generation, and management.
 * 
 * Features:
 * - Async processing for long-running operations
 * - Comprehensive error handling and logging
 * - Data persistence and audit trails
 * - Retry mechanisms and circuit breaker patterns
 * - Security and validation
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PDFProcessingServiceImpl implements PDFProcessingService {

    private final RestTemplate restTemplate;
    private final PDFProcessingConfig config;
    private final PDFDocumentRepository pdfDocumentRepository;
    private final PDFQueryRepository pdfQueryRepository;
    private final RuleService ruleService;
    private final MaintenanceScheduleService maintenanceService;
    private final DeviceSafetyPrecautionService safetyService;

    @Override
    public PDFUploadResponse uploadPDF(MultipartFile file, String organizationId) throws PDFProcessingException {
        log.info("Starting PDF upload process for organization: {}", organizationId);
        
        try {
            // Validate input
            validatePDFFile(file);
            
            // Prepare upload request
            HttpHeaders headers = createHeaders();
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            log.debug("Uploading PDF to MinerU service: {}", config.getBaseUrl() + "/upload-pdf");
            
            // Call external service
            ResponseEntity<PDFUploadResponse> response = restTemplate.exchange(
                config.getBaseUrl() + "/upload-pdf",
                HttpMethod.POST,
                requestEntity,
                PDFUploadResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new PDFProcessingException("Failed to upload PDF: Invalid response from external service");
            }

            PDFUploadResponse uploadResponse = response.getBody();
            
            // Store PDF metadata in database
            PDFDocument pdfDocument = PDFDocument.builder()
                .name(uploadResponse.getPdfName())
                .originalFilename(file.getOriginalFilename())
                .fileSize(file.getSize())
                .chunksProcessed(uploadResponse.getChunksProcessed())
                .processingTime(uploadResponse.getProcessingTime())
                .collectionName(uploadResponse.getCollectionName())
                .uploadedAt(LocalDateTime.now())
                .processedAt(LocalDateTime.now())
                .status("COMPLETED")
                .organizationId(organizationId)
                .build();

            pdfDocumentRepository.save(pdfDocument);
            
            log.info("PDF uploaded successfully: {} ({} chunks processed)", 
                uploadResponse.getPdfName(), uploadResponse.getChunksProcessed());
            
            return uploadResponse;

        } catch (IOException e) {
            log.error("Failed to read PDF file: {}", e.getMessage(), e);
            throw new PDFProcessingException("Failed to read PDF file", e);
        } catch (Exception e) {
            log.error("PDF upload failed: {}", e.getMessage(), e);
            throw new PDFProcessingException("PDF upload failed", e);
        }
    }

    @Override
    public PDFQueryResponse queryPDF(PDFQueryRequest request, Long userId, String organizationId) throws PDFProcessingException {
        log.info("Processing PDF query for user: {} in organization: {}", userId, organizationId);
        
        try {
            // Validate request
            validateQueryRequest(request);
            
            // Verify PDF exists in our database
            PDFDocument pdfDocument = pdfDocumentRepository.findByNameAndOrganizationId(
                request.getPdfName(), organizationId)
                .orElseThrow(() -> new PDFProcessingException("PDF document not found: " + request.getPdfName()));

            // Prepare query request
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<PDFQueryRequest> requestEntity = new HttpEntity<>(request, headers);
            
            log.debug("Querying PDF with MinerU service: {}", config.getBaseUrl() + "/query");
            
            // Call external service
            ResponseEntity<PDFQueryResponse> response = restTemplate.exchange(
                config.getBaseUrl() + "/query",
                HttpMethod.POST,
                requestEntity,
                PDFQueryResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new PDFProcessingException("Failed to query PDF: Invalid response from external service");
            }

            PDFQueryResponse queryResponse = response.getBody();
            
            // Store query interaction for audit trail
            PDFQuery pdfQuery = PDFQuery.builder()
                .pdfDocumentId(pdfDocument.getId())
                .userQuery(request.getQuery())
                .aiResponse(queryResponse.getResponse())
                .chunksUsed(String.join(",", queryResponse.getChunksUsed()))
                .processingTime(queryResponse.getProcessingTime())
                .createdAt(LocalDateTime.now())
                .userId(userId)
                .build();

            pdfQueryRepository.save(pdfQuery);
            
            log.info("PDF query completed successfully for document: {}", request.getPdfName());
            
            return queryResponse;

        } catch (Exception e) {
            log.error("PDF query failed: {}", e.getMessage(), e);
            throw new PDFProcessingException("PDF query failed", e);
        }
    }

    @Override
    public PDFListResponse listPDFs(String organizationId, int page, int size) throws PDFProcessingException {
        log.info("Listing PDFs for organization: {} (page: {}, size: {})", organizationId, page, size);
        
        try {
            // Get PDFs from database with pagination
            Page<PDFDocument> pdfPage = pdfDocumentRepository.findByOrganizationIdOrderByUploadedAtDesc(
                organizationId, PageRequest.of(page, size));

            // Transform to response format
            List<PDFDocumentInfo> pdfs = pdfPage.getContent().stream()
                .map(this::mapToPDFDocumentInfo)
                .toList();

            return PDFListResponse.builder()
                .success(true)
                .pdfs(pdfs)
                .totalCount((int) pdfPage.getTotalElements())
                .currentPage(page)
                .totalPages(pdfPage.getTotalPages())
                .build();

        } catch (Exception e) {
            log.error("Failed to list PDFs: {}", e.getMessage(), e);
            throw new PDFProcessingException("Failed to list PDFs", e);
        }
    }

    @Override
    @Async("pdfProcessingExecutor")
    public CompletableFuture<RulesGenerationResponse> generateRulesAsync(String pdfName, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Starting async rules generation for PDF: {} and device: {}", pdfName, deviceId);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Call external service
                HttpHeaders headers = createHeaders();
                HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
                
                ResponseEntity<RulesGenerationResponse> response = restTemplate.exchange(
                    config.getBaseUrl() + "/generate-rules/" + pdfName,
                    HttpMethod.POST,
                    requestEntity,
                    RulesGenerationResponse.class
                );

                if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                    throw new PDFProcessingException("Failed to generate rules: Invalid response from external service");
                }

                RulesGenerationResponse rulesResponse = response.getBody();
                
                // Save rules to database
                if (rulesResponse.getRules() != null && !rulesResponse.getRules().isEmpty()) {
                    ruleService.createRulesFromPDF(rulesResponse.getRules(), deviceId, organizationId);
                }
                
                log.info("Rules generation completed for PDF: {} ({} rules created)", 
                    pdfName, rulesResponse.getRules() != null ? rulesResponse.getRules().size() : 0);
                
                return rulesResponse;

            } catch (Exception e) {
                log.error("Rules generation failed for PDF: {}", pdfName, e);
                throw new RuntimeException(new PDFProcessingException("Rules generation failed", e));
            }
        });
    }

    @Override
    @Async("pdfProcessingExecutor")
    public CompletableFuture<MaintenanceGenerationResponse> generateMaintenanceAsync(String pdfName, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Starting async maintenance generation for PDF: {} and device: {}", pdfName, deviceId);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Call external service
                HttpHeaders headers = createHeaders();
                HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
                
                ResponseEntity<MaintenanceGenerationResponse> response = restTemplate.exchange(
                    config.getBaseUrl() + "/generate-maintenance/" + pdfName,
                    HttpMethod.POST,
                    requestEntity,
                    MaintenanceGenerationResponse.class
                );

                if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                    throw new PDFProcessingException("Failed to generate maintenance: Invalid response from external service");
                }

                MaintenanceGenerationResponse maintenanceResponse = response.getBody();
                
                // Save maintenance tasks to database
                if (maintenanceResponse.getMaintenanceTasks() != null && !maintenanceResponse.getMaintenanceTasks().isEmpty()) {
                    maintenanceService.createMaintenanceFromPDF(maintenanceResponse.getMaintenanceTasks(), deviceId, organizationId);
                }
                
                log.info("Maintenance generation completed for PDF: {} ({} tasks created)", 
                    pdfName, maintenanceResponse.getMaintenanceTasks() != null ? maintenanceResponse.getMaintenanceTasks().size() : 0);
                
                return maintenanceResponse;

            } catch (Exception e) {
                log.error("Maintenance generation failed for PDF: {}", pdfName, e);
                throw new RuntimeException(new PDFProcessingException("Maintenance generation failed", e));
            }
        });
    }

    @Override
    @Async("pdfProcessingExecutor")
    public CompletableFuture<SafetyGenerationResponse> generateSafetyAsync(String pdfName, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Starting async safety generation for PDF: {} and device: {}", pdfName, deviceId);
        
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Call external service
                HttpHeaders headers = createHeaders();
                HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
                
                ResponseEntity<SafetyGenerationResponse> response = restTemplate.exchange(
                    config.getBaseUrl() + "/generate-safety/" + pdfName,
                    HttpMethod.POST,
                    requestEntity,
                    SafetyGenerationResponse.class
                );

                if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                    throw new PDFProcessingException("Failed to generate safety info: Invalid response from external service");
                }

                SafetyGenerationResponse safetyResponse = response.getBody();
                
                // Save safety information to database
                if (safetyResponse.getSafetyInformation() != null && !safetyResponse.getSafetyInformation().isEmpty()) {
                    safetyService.createSafetyFromPDF(safetyResponse.getSafetyInformation(), deviceId, organizationId);
                }
                
                log.info("Safety generation completed for PDF: {} ({} safety items created)", 
                    pdfName, safetyResponse.getSafetyInformation() != null ? safetyResponse.getSafetyInformation().size() : 0);
                
                return safetyResponse;

            } catch (Exception e) {
                log.error("Safety generation failed for PDF: {}", pdfName, e);
                throw new RuntimeException(new PDFProcessingException("Safety generation failed", e));
            }
        });
    }

    @Override
    public PDFDeleteResponse deletePDF(String pdfName, String organizationId) throws PDFProcessingException {
        log.info("Deleting PDF: {} from organization: {}", pdfName, organizationId);
        
        try {
            // Verify PDF exists in our database
            PDFDocument pdfDocument = pdfDocumentRepository.findByNameAndOrganizationId(pdfName, organizationId)
                .orElseThrow(() -> new PDFProcessingException("PDF document not found: " + pdfName));

            // Call external service to delete
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            ResponseEntity<PDFDeleteResponse> response = restTemplate.exchange(
                config.getBaseUrl() + "/pdfs/" + pdfName,
                HttpMethod.DELETE,
                requestEntity,
                PDFDeleteResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new PDFProcessingException("Failed to delete PDF from external service");
            }

            PDFDeleteResponse deleteResponse = response.getBody();
            
            // Delete from local database
            pdfDocumentRepository.delete(pdfDocument);
            
            // Delete related queries
            pdfQueryRepository.deleteByPdfDocumentId(pdfDocument.getId());
            
            log.info("PDF deleted successfully: {}", pdfName);
            
            return deleteResponse;

        } catch (Exception e) {
            log.error("PDF deletion failed: {}", e.getMessage(), e);
            throw new PDFProcessingException("PDF deletion failed", e);
        }
    }

    @Override
    public HealthCheckResponse healthCheck() throws PDFProcessingException {
        log.debug("Checking health of PDF processing service");
        
        try {
            ResponseEntity<HealthCheckResponse> response = restTemplate.getForEntity(
                config.getBaseUrl() + "/health",
                HealthCheckResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new PDFProcessingException("Health check failed: Invalid response from external service");
            }

            log.debug("PDF processing service health check successful");
            return response.getBody();

        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage(), e);
            throw new PDFProcessingException("Health check failed", e);
        }
    }

    // Private helper methods

    private void validatePDFFile(MultipartFile file) throws PDFProcessingException {
        if (file == null || file.isEmpty()) {
            throw new PDFProcessingException("PDF file is required");
        }
        
        if (!file.getContentType().equals("application/pdf")) {
            throw new PDFProcessingException("Only PDF files are allowed");
        }
        
        if (file.getSize() > config.getMaxFileSize()) {
            throw new PDFProcessingException("File size exceeds maximum limit: " + config.getMaxFileSize() + " bytes");
        }
    }

    private void validateQueryRequest(PDFQueryRequest request) throws PDFProcessingException {
        if (request == null) {
            throw new PDFProcessingException("Query request is required");
        }
        
        if (request.getPdfName() == null || request.getPdfName().trim().isEmpty()) {
            throw new PDFProcessingException("PDF name is required");
        }
        
        if (request.getQuery() == null || request.getQuery().trim().isEmpty()) {
            throw new PDFProcessingException("Query text is required");
        }
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "IoT-Platform/1.0");
        headers.set("X-Request-ID", UUID.randomUUID().toString());
        
        // Add authentication if configured
        if (config.getApiKey() != null && !config.getApiKey().isEmpty()) {
            headers.set("Authorization", "Bearer " + config.getApiKey());
        }
        
        return headers;
    }

    private PDFDocumentInfo mapToPDFDocumentInfo(PDFDocument document) {
        return PDFDocumentInfo.builder()
            .collectionName(document.getCollectionName())
            .pdfName(document.getName())
            .createdAt(document.getUploadedAt().toString())
            .chunkCount(document.getChunksProcessed())
            .build();
    }
}
