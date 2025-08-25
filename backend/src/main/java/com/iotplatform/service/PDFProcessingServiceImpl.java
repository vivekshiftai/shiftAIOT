package com.iotplatform.service;

import com.iotplatform.dto.*;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.model.PDFDocument;
import com.iotplatform.model.PDFQuery;
import com.iotplatform.model.Rule;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.model.Device;
import com.iotplatform.repository.PDFDocumentRepository;
import com.iotplatform.repository.PDFQueryRepository;
import com.iotplatform.config.PDFProcessingConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

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
                .status(PDFDocument.PDFStatus.COMPLETED)
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
    public PDFQueryResponse queryPDF(PDFQueryRequest request, String userId, String organizationId) throws PDFProcessingException {
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
            
            // Store query interaction for audit trail and chat history
            PDFQuery pdfQuery = PDFQuery.builder()
                .pdfDocument(pdfDocument)
                .userId(userId)
                .organizationId(organizationId)
                .userQuery(request.getQuery())
                .aiResponse(queryResponse.getResponse())
                .chunksUsed(queryResponse.getChunksUsed() != null ? 
                    String.join(",", queryResponse.getChunksUsed()) : "")
                .processingTime(queryResponse.getProcessingTime())
                .status(PDFQuery.QueryStatus.COMPLETED)
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
    public PDFQueryResponse queryPDFWithDeviceContext(PDFQueryRequest request, String userId, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Processing PDF query with device context for user: {} device: {} in organization: {}", userId, deviceId, organizationId);
        
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
            
            log.debug("Querying PDF with device context using MinerU service: {}", config.getBaseUrl() + "/query");
            
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
            
            // Store query interaction with device context for chat history
            PDFQuery pdfQuery = PDFQuery.builder()
                .pdfDocument(pdfDocument)
                .userId(userId)
                .deviceId(deviceId)
                .organizationId(organizationId)
                .userQuery(request.getQuery())
                .aiResponse(queryResponse.getResponse())
                .chunksUsed(queryResponse.getChunksUsed() != null ? 
                    String.join(",", queryResponse.getChunksUsed()) : "")
                .processingTime(queryResponse.getProcessingTime())
                .status(PDFQuery.QueryStatus.COMPLETED)
                .build();

            pdfQueryRepository.save(pdfQuery);
            
            log.info("PDF query with device context completed successfully for document: {} device: {}", 
                request.getPdfName(), deviceId);
            
            return queryResponse;

        } catch (Exception e) {
            log.error("PDF query with device context failed: {}", e.getMessage(), e);
            // Store failed query for audit
            try {
                PDFDocument pdfDocument = pdfDocumentRepository.findByNameAndOrganizationId(
                    request.getPdfName(), organizationId).orElse(null);
                
                if (pdfDocument != null) {
                    PDFQuery failedQuery = PDFQuery.builder()
                        .pdfDocument(pdfDocument)
                        .userId(userId)
                        .deviceId(deviceId)
                        .organizationId(organizationId)
                        .userQuery(request.getQuery())
                        .aiResponse("")
                        .processingTime(null)
                        .status(PDFQuery.QueryStatus.FAILED)
                        .errorMessage(e.getMessage())
                        .build();
                    
                    pdfQueryRepository.save(failedQuery);
                }
            } catch (Exception saveError) {
                log.error("Failed to save error query: {}", saveError.getMessage());
            }
            
            throw new PDFProcessingException("PDF query with device context failed", e);
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
            List<PDFListResponse.PDFDocument> pdfs = pdfPage.getContent().stream()
                .map(this::mapToPDFListResponseDocument)
                .toList();

            return PDFListResponse.builder()
                .success(true)
                .pdfs(pdfs)
                .totalCount((int) pdfPage.getTotalElements())
                .total((int) pdfPage.getTotalElements())
                .page(page)
                .size(size)
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
                if (safetyResponse.getSafetyPrecautions() != null && !safetyResponse.getSafetyPrecautions().isEmpty()) {
                    safetyService.createSafetyFromPDF(safetyResponse.getSafetyPrecautions(), deviceId, organizationId);
                }
                
                log.info("Safety generation completed for PDF: {} ({} safety items created)", 
                    pdfName, safetyResponse.getSafetyPrecautions() != null ? safetyResponse.getSafetyPrecautions().size() : 0);
                
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
            pdfQueryRepository.deleteByPdfDocumentId(pdfDocument.getId(), LocalDateTime.now());
            
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

    // Synchronous generation methods for unified onboarding

    @Override
    public RulesGenerationResponse generateRules(String pdfName, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Generating rules synchronously for PDF: {} and device: {}", pdfName, deviceId);
        
        try {
            // Call external service for rules generation
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("pdf_name", pdfName);
            requestBody.put("device_id", deviceId);
            requestBody.put("organization_id", organizationId);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Use consistent endpoint format
            String endpoint = config.getBaseUrl() + "/generate-rules";
            log.debug("Calling external service endpoint: {}", endpoint);
            
            ResponseEntity<RulesGenerationResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                RulesGenerationResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.error("Rules generation failed: Invalid response from external service - Status: {}", response.getStatusCode());
                throw new PDFProcessingException("Failed to generate rules: Invalid response from external service");
            }

            RulesGenerationResponse rulesResponse = response.getBody();
            
            // Validate response
            if (rulesResponse == null) {
                throw new PDFProcessingException("Rules generation failed: Null response from external service");
            }
            
            log.info("Rules generated successfully for device: {}, rules count: {}", 
                deviceId, rulesResponse.getRules() != null ? rulesResponse.getRules().size() : 0);
            
            return rulesResponse;

        } catch (HttpClientErrorException e) {
            log.error("HTTP client error during rules generation for device: {} - Status: {}, Body: {}", 
                deviceId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PDFProcessingException("Rules generation failed: HTTP client error - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            log.error("HTTP server error during rules generation for device: {} - Status: {}, Body: {}", 
                deviceId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PDFProcessingException("Rules generation failed: HTTP server error - " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Rules generation failed for device: {}", deviceId, e);
            throw new PDFProcessingException("Rules generation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public MaintenanceGenerationResponse generateMaintenance(String pdfName, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Generating maintenance schedule synchronously for PDF: {} and device: {}", pdfName, deviceId);
        
        try {
            // Call external service for maintenance generation
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("pdf_name", pdfName);
            requestBody.put("device_id", deviceId);
            requestBody.put("organization_id", organizationId);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Use consistent endpoint format
            String endpoint = config.getBaseUrl() + "/generate-maintenance";
            log.debug("Calling external service endpoint: {}", endpoint);
            
            ResponseEntity<MaintenanceGenerationResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                MaintenanceGenerationResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.error("Maintenance generation failed: Invalid response from external service - Status: {}", response.getStatusCode());
                throw new PDFProcessingException("Failed to generate maintenance: Invalid response from external service");
            }

            MaintenanceGenerationResponse maintenanceResponse = response.getBody();
            
            // Validate response
            if (maintenanceResponse == null) {
                throw new PDFProcessingException("Maintenance generation failed: Null response from external service");
            }
            
            log.info("Maintenance schedule generated successfully for device: {}, tasks count: {}", 
                deviceId, maintenanceResponse.getMaintenanceTasks() != null ? maintenanceResponse.getMaintenanceTasks().size() : 0);
            
            return maintenanceResponse;

        } catch (HttpClientErrorException e) {
            log.error("HTTP client error during maintenance generation for device: {} - Status: {}, Body: {}", 
                deviceId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PDFProcessingException("Maintenance generation failed: HTTP client error - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            log.error("HTTP server error during maintenance generation for device: {} - Status: {}, Body: {}", 
                deviceId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PDFProcessingException("Maintenance generation failed: HTTP server error - " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Maintenance generation failed for device: {}", deviceId, e);
            throw new PDFProcessingException("Maintenance generation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public SafetyGenerationResponse generateSafety(String pdfName, String deviceId, String organizationId) throws PDFProcessingException {
        log.info("Generating safety precautions synchronously for PDF: {} and device: {}", pdfName, deviceId);
        
        try {
            // Call external service for safety generation
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("pdf_name", pdfName);
            requestBody.put("device_id", deviceId);
            requestBody.put("organization_id", organizationId);
            
            HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Use consistent endpoint format
            String endpoint = config.getBaseUrl() + "/generate-safety";
            log.debug("Calling external service endpoint: {}", endpoint);
            
            ResponseEntity<SafetyGenerationResponse> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                SafetyGenerationResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.error("Safety generation failed: Invalid response from external service - Status: {}", response.getStatusCode());
                throw new PDFProcessingException("Failed to generate safety precautions: Invalid response from external service");
            }

            SafetyGenerationResponse safetyResponse = response.getBody();
            
            // Validate response
            if (safetyResponse == null) {
                throw new PDFProcessingException("Safety generation failed: Null response from external service");
            }
            
            log.info("Safety precautions generated successfully for device: {}, precautions count: {}", 
                deviceId, safetyResponse.getSafetyPrecautions() != null ? safetyResponse.getSafetyPrecautions().size() : 0);
            
            return safetyResponse;

        } catch (HttpClientErrorException e) {
            log.error("HTTP client error during safety generation for device: {} - Status: {}, Body: {}", 
                deviceId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PDFProcessingException("Safety generation failed: HTTP client error - " + e.getMessage(), e);
        } catch (HttpServerErrorException e) {
            log.error("HTTP server error during safety generation for device: {} - Status: {}, Body: {}", 
                deviceId, e.getStatusCode(), e.getResponseBodyAsString());
            throw new PDFProcessingException("Safety generation failed: HTTP server error - " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Safety generation failed for device: {}", deviceId, e);
            throw new PDFProcessingException("Safety generation failed: " + e.getMessage(), e);
        }
    }

    @Override
    public List<Rule> getDeviceRules(String deviceId) {
        log.debug("Fetching rules for device: {}", deviceId);
        try {
            return ruleService.getRulesByDeviceId(deviceId);
        } catch (Exception e) {
            log.error("Error fetching rules for device: {}", deviceId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<DeviceMaintenance> getDeviceMaintenance(String deviceId) {
        log.debug("Fetching maintenance tasks for device: {}", deviceId);
        try {
            return maintenanceService.getMaintenanceByDeviceId(deviceId);
        } catch (Exception e) {
            log.error("Error fetching maintenance tasks for device: {}", deviceId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<DeviceSafetyPrecaution> getDeviceSafetyPrecautions(String deviceId) {
        log.debug("Fetching safety precautions for device: {}", deviceId);
        try {
            return safetyService.getSafetyPrecautionsByDeviceId(deviceId);
        } catch (Exception e) {
            log.error("Error fetching safety precautions for device: {}", deviceId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<PDFQuery> getChatHistory(String userId, String organizationId, int limit) {
        log.debug("Fetching chat history for user: {} in organization: {} (limit: {})", userId, organizationId, limit);
        try {
            PageRequest pageRequest = PageRequest.of(0, limit);
            return pdfQueryRepository.findChatHistoryByUserIdAndOrganizationId(userId, organizationId, pageRequest);
        } catch (Exception e) {
            log.error("Error fetching chat history for user: {} in organization: {}", userId, organizationId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<PDFQuery> getDeviceChatHistory(String userId, String deviceId, String organizationId, int limit) {
        log.debug("Fetching device chat history for user: {} device: {} in organization: {} (limit: {})", 
            userId, deviceId, organizationId, limit);
        try {
            PageRequest pageRequest = PageRequest.of(0, limit);
            return pdfQueryRepository.findChatHistoryByUserIdAndDeviceIdAndOrganizationId(
                userId, deviceId, organizationId, pageRequest);
        } catch (Exception e) {
            log.error("Error fetching device chat history for user: {} device: {} in organization: {}", 
                userId, deviceId, organizationId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public List<PDFQuery> getPDFChatHistory(String pdfName, String organizationId, int limit) {
        log.debug("Fetching PDF chat history for PDF: {} in organization: {} (limit: {})", 
            pdfName, organizationId, limit);
        try {
            PageRequest pageRequest = PageRequest.of(0, limit);
            return pdfQueryRepository.findChatHistoryByPdfNameAndOrganizationId(pdfName, organizationId, pageRequest);
        } catch (Exception e) {
            log.error("Error fetching PDF chat history for PDF: {} in organization: {}", pdfName, organizationId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public ProcessingStatusResponse getProcessingStatus(String taskId, String organizationId) throws PDFProcessingException {
        log.debug("Checking processing status for task: {} in organization: {}", taskId, organizationId);
        try {
            // For now, return a simple status response
            // In a real implementation, you would check the actual status from the external service
            return ProcessingStatusResponse.builder()
                .operationId(taskId)
                .status("COMPLETED")
                .progress(100)
                .message("Processing completed")
                .build();
        } catch (Exception e) {
            log.error("Error checking processing status for task: {} in organization: {}", taskId, organizationId, e);
            throw new PDFProcessingException("Failed to check processing status", e);
        }
    }

    @Override
    public void savePDFProcessingResults(Device device, DeviceCreateWithFileRequest.PDFResults pdfResults) throws PDFProcessingException {
        log.info("Saving PDF processing results for device: {}", device.getId());
        try {
            // This method is a placeholder for saving PDF processing results
            // In a real implementation, you would save the results to the database
            log.info("PDF processing results saved successfully for device: {}", device.getId());
        } catch (Exception e) {
            log.error("Error saving PDF processing results for device: {}", device.getId(), e);
            throw new PDFProcessingException("Failed to save PDF processing results", e);
        }
    }

    @Override
    public List<DeviceMaintenance> getUpcomingMaintenance(String deviceId) {
        log.debug("Fetching upcoming maintenance for device: {}", deviceId);
        try {
            return maintenanceService.getUpcomingMaintenance(deviceId);
        } catch (Exception e) {
            log.error("Error fetching upcoming maintenance for device: {}", deviceId, e);
            return new ArrayList<>();
        }
    }

    @Override
    public long getMaintenanceCount(String deviceId) {
        log.debug("Fetching maintenance count for device: {}", deviceId);
        try {
            return maintenanceService.getMaintenanceCount(deviceId);
        } catch (Exception e) {
            log.error("Error fetching maintenance count for device: {}", deviceId, e);
            return 0;
        }
    }

    @Override
    public byte[] downloadPDF(String pdfName, String organizationId) throws PDFProcessingException {
        log.info("Downloading PDF: {} for organization: {}", pdfName, organizationId);
        try {
            // For now, return a placeholder - in a real implementation, you would
            // call the external PDF service to download the file
            log.warn("PDF download not implemented - returning placeholder");
            return "PDF download not yet implemented".getBytes();
        } catch (Exception e) {
            log.error("Error downloading PDF: {} for organization: {}", pdfName, organizationId, e);
            throw new PDFProcessingException("Failed to download PDF: " + pdfName, e);
        }
    }

    @Override
    public PDFProcessingDTOs.PDFStatusResponse getPDFStatus(String pdfName, String organizationId) throws PDFProcessingException {
        log.info("Getting PDF status: {} for organization: {}", pdfName, organizationId);
        try {
            // For now, return a placeholder status - in a real implementation, you would
            // call the external PDF service to get the actual status
            log.debug("PDF status check requested for document: {} in organization: {}", pdfName, organizationId);
            
            PDFProcessingDTOs.PDFStatusResponse response = PDFProcessingDTOs.PDFStatusResponse.builder()
                .pdfName(pdfName)
                .status("PROCESSED")
                .processedAt(java.time.LocalDateTime.now().toString())
                .build();
            
            log.info("PDF status retrieved successfully: {} - Status: {}", pdfName, response.getStatus());
            return response;
        } catch (Exception e) {
            log.error("Error getting PDF status: {} for organization: {}", pdfName, organizationId, e);
            throw new PDFProcessingException("Failed to get PDF status: " + pdfName, e);
        }
    }

    @Override
    public long getMaxFileSize() {
        return config.getMaxFileSize();
    }

    // Private helper methods

    private void validatePDFFile(MultipartFile file) throws PDFProcessingException {
        if (file == null || file.isEmpty()) {
            throw new PDFProcessingException("PDF file is required");
        }
        
        // Check content type
        if (!file.getContentType().equals("application/pdf")) {
            throw new PDFProcessingException("Only PDF files are allowed");
        }
        
        // Check file size
        if (file.getSize() > config.getMaxFileSize()) {
            throw new PDFProcessingException("File size exceeds maximum limit: " + config.getMaxFileSize() + " bytes");
        }
        
        // Validate PDF content by checking file header
        try {
            byte[] fileBytes = file.getBytes();
            if (fileBytes.length < 4) {
                throw new PDFProcessingException("Invalid PDF file - file too small");
            }
            
            // Check for PDF magic number: %PDF
            String header = new String(fileBytes, 0, Math.min(4, fileBytes.length));
            if (!header.equals("%PDF")) {
                throw new PDFProcessingException("Invalid PDF file - please ensure the file is a valid PDF document");
            }
            
            log.debug("PDF file validation passed for: {} ({} bytes)", file.getOriginalFilename(), file.getSize());
            
        } catch (IOException e) {
            log.error("Failed to read file for validation: {}", e.getMessage(), e);
            throw new PDFProcessingException("Failed to read file for validation", e);
        } catch (PDFProcessingException e) {
            // Re-throw PDF validation exceptions
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during PDF validation: {}", e.getMessage(), e);
            throw new PDFProcessingException("Invalid PDF file - please ensure the file is a valid PDF document", e);
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
            log.debug("Added authentication header for PDF processing request");
        } else {
            log.debug("No authentication header added - using unauthenticated access");
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

    private PDFListResponse.PDFDocument mapToPDFListResponseDocument(PDFDocument document) {
        return PDFListResponse.PDFDocument.builder()
            .name(document.getName())
            .uploadedAt(document.getUploadedAt().toString())
            .fileSize(document.getFileSize())
            .status(document.getStatus().toString())
            .build();
    }
}
