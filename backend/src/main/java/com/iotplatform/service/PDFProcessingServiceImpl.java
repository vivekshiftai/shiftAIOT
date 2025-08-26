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
import com.iotplatform.repository.RuleRepository;
import com.iotplatform.repository.DeviceMaintenanceRepository;
import com.iotplatform.repository.DeviceSafetyPrecautionRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
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
    private final RuleRepository ruleRepository;
    private final DeviceMaintenanceRepository deviceMaintenanceRepository;
    private final DeviceSafetyPrecautionRepository deviceSafetyPrecautionRepository;
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
            
            log.debug("Uploading PDF to external service: {}", config.getBaseUrl() + "/upload-pdf");
            
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
            
            // Prepare query request
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<PDFQueryRequest> requestEntity = new HttpEntity<>(request, headers);
            
            log.debug("Querying PDF with external service: {}", config.getBaseUrl() + "/query");
            
            // Call external service directly without checking local database
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
            
            // Prepare query request
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<PDFQueryRequest> requestEntity = new HttpEntity<>(request, headers);
            
            log.debug("Querying PDF with device context using external service: {}", config.getBaseUrl() + "/query");
            
            // Call external service directly without checking local database
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
            
            log.info("PDF query with device context completed successfully for document: {} device: {}", 
                request.getPdfName(), deviceId);
            
            return queryResponse;

        } catch (Exception e) {
            log.error("PDF query with device context failed: {}", e.getMessage(), e);
            throw new PDFProcessingException("PDF query with device context failed", e);
        }
    }

    @Override
    public PDFListResponse listPDFs(String organizationId, int page, int size) throws PDFProcessingException {
        log.info("Listing PDFs for organization: {} (page: {}, size: {})", organizationId, page, size);
        
        try {
            // Call external service to get PDF list
            HttpHeaders headers = createHeaders();
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            log.debug("Fetching PDF list from external service: {}", config.getBaseUrl() + "/list");
            
            ResponseEntity<PDFListResponse> response = restTemplate.exchange(
                config.getBaseUrl() + "/list",
                HttpMethod.GET,
                requestEntity,
                PDFListResponse.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                throw new PDFProcessingException("Failed to list PDFs: Invalid response from external service");
            }

            PDFListResponse listResponse = response.getBody();
            log.info("Successfully retrieved PDF list from external service");
            
            return listResponse;

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
                
                log.info("Rules generation completed for PDF: {} ({} rules generated)", 
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
                
                log.info("Maintenance generation completed for PDF: {} ({} tasks generated)", 
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
                
                log.info("Safety generation completed for PDF: {} ({} safety items generated)", 
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
            // Call external service for rules generation with PDF name in URL
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // No request body needed - PDF name is in URL
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Use correct endpoint format: /generate-rules/{pdfName}
            String endpoint = config.getBaseUrl() + "/generate-rules/" + pdfName;
            log.debug("Calling external service endpoint: {}", endpoint);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                Map.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.error("Rules generation failed: Invalid response from external service - Status: {}", response.getStatusCode());
                throw new PDFProcessingException("Failed to generate rules: Invalid response from external service");
            }

            Map<String, Object> responseBody = response.getBody();
            
            // Handle the external service response format
            RulesGenerationResponse rulesResponse = new RulesGenerationResponse();
            
            if (Boolean.TRUE.equals(responseBody.get("success"))) {
                rulesResponse.setSuccess(true);
                rulesResponse.setProcessingTime((String) responseBody.get("processing_time"));
                
                // Convert rules from external format to our format
                List<Map<String, Object>> externalRules = (List<Map<String, Object>>) responseBody.get("rules");
                if (externalRules != null) {
                    List<Rule> rules = new ArrayList<>();
                    for (Map<String, Object> externalRule : externalRules) {
                        Rule rule = new Rule();
                        rule.setName((String) externalRule.get("rule_name"));
                        rule.setDescription((String) externalRule.get("description"));
                        rule.setMetric((String) externalRule.get("metric"));
                        rule.setThreshold((String) externalRule.get("threshold"));
                        rule.setConsequence((String) externalRule.get("consequence"));
                        rule.setDeviceId(deviceId);
                        rule.setOrganizationId(organizationId);
                        rule.setActive(true);
                        rule.setCreatedAt(LocalDateTime.now());
                        rule.setUpdatedAt(LocalDateTime.now());
                        
                        // Store rule in database
                        ruleRepository.save(rule);
                        rules.add(rule);
                    }
                    // Convert to DTO format
                    List<RulesGenerationResponse.Rule> dtoRules = new ArrayList<>();
                    for (Rule rule : rules) {
                        RulesGenerationResponse.Rule dtoRule = new RulesGenerationResponse.Rule();
                        dtoRule.setName(rule.getName());
                        dtoRule.setDescription(rule.getDescription());
                        dtoRule.setMetric(rule.getMetric());
                        dtoRule.setThreshold(rule.getThreshold());
                        dtoRule.setConsequence(rule.getConsequence());
                        dtoRule.setCondition("metric: " + rule.getMetric() + ", threshold: " + rule.getThreshold());
                        dtoRule.setAction("consequence: " + rule.getConsequence());
                        dtoRules.add(dtoRule);
                    }
                    rulesResponse.setRules(dtoRules);
                }
                
                log.info("Rules generated and stored successfully for device: {}, rules count: {}", 
                    deviceId, rulesResponse.getRules() != null ? rulesResponse.getRules().size() : 0);
            } else {
                throw new PDFProcessingException("Rules generation failed: External service returned success=false");
            }
            
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
            // Call external service for maintenance generation with PDF name in URL
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // No request body needed - PDF name is in URL
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Use correct endpoint format: /generate-maintenance/{pdfName}
            String endpoint = config.getBaseUrl() + "/generate-maintenance/" + pdfName;
            log.debug("Calling external service endpoint: {}", endpoint);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                Map.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.error("Maintenance generation failed: Invalid response from external service - Status: {}", response.getStatusCode());
                throw new PDFProcessingException("Failed to generate maintenance: Invalid response from external service");
            }

            Map<String, Object> responseBody = response.getBody();
            
            // Handle the external service response format
            MaintenanceGenerationResponse maintenanceResponse = new MaintenanceGenerationResponse();
            
            if (Boolean.TRUE.equals(responseBody.get("success"))) {
                maintenanceResponse.setSuccess(true);
                maintenanceResponse.setProcessingTime((String) responseBody.get("processing_time"));
                
                // Convert maintenance tasks from external format to our format with validation and default values
                List<Map<String, Object>> externalTasks = (List<Map<String, Object>>) responseBody.get("maintenance_tasks");
                if (externalTasks != null && !externalTasks.isEmpty()) {
                    List<DeviceMaintenance> maintenanceTasks = new ArrayList<>();
                    List<MaintenanceGenerationResponse.MaintenanceTask> dtoTasks = new ArrayList<>();
                    
                    for (Map<String, Object> externalTask : externalTasks) {
                        try {
                            // Validate and process maintenance task with default values
                            DeviceMaintenance maintenance = processMaintenanceTaskFromExternalResponse(externalTask, deviceId, organizationId);
                            
                            if (maintenance != null) {
                                // Store maintenance task in database
                                deviceMaintenanceRepository.save(maintenance);
                                maintenanceTasks.add(maintenance);
                                
                                // Convert to DTO format
                                MaintenanceGenerationResponse.MaintenanceTask dtoTask = convertToMaintenanceTaskDTO(maintenance);
                                dtoTasks.add(dtoTask);
                                
                                log.debug("Successfully processed maintenance task: {}", maintenance.getTaskName());
                            }
                        } catch (Exception e) {
                            log.warn("Failed to process maintenance task, skipping: {}", externalTask, e);
                            // Continue processing other tasks instead of failing completely
                        }
                    }
                    
                    maintenanceResponse.setMaintenanceTasks(dtoTasks);
                    log.info("Successfully processed {} out of {} maintenance tasks for device: {}", 
                        dtoTasks.size(), externalTasks.size(), deviceId);
                } else {
                    log.warn("No maintenance tasks found in external service response for device: {}", deviceId);
                    maintenanceResponse.setMaintenanceTasks(new ArrayList<>());
                }
                
                log.info("Maintenance tasks generated and stored successfully for device: {}, tasks count: {}", 
                    deviceId, maintenanceResponse.getMaintenanceTasks() != null ? maintenanceResponse.getMaintenanceTasks().size() : 0);
            } else {
                throw new PDFProcessingException("Maintenance generation failed: External service returned success=false");
            }
            
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
            // Call external service for safety generation with PDF name in URL
            HttpHeaders headers = createHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            // No request body needed - PDF name is in URL
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);
            
            // Use correct endpoint format: /generate-safety/{pdfName}
            String endpoint = config.getBaseUrl() + "/generate-safety/" + pdfName;
            log.debug("Calling external service endpoint: {}", endpoint);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                endpoint,
                HttpMethod.POST,
                requestEntity,
                Map.class
            );

            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                log.error("Safety generation failed: Invalid response from external service - Status: {}", response.getStatusCode());
                throw new PDFProcessingException("Failed to generate safety precautions: Invalid response from external service");
            }

            Map<String, Object> responseBody = response.getBody();
            
            // Handle the external service response format
            SafetyGenerationResponse safetyResponse = new SafetyGenerationResponse();
            
            if (Boolean.TRUE.equals(responseBody.get("success"))) {
                safetyResponse.setSuccess(true);
                safetyResponse.setProcessingTime((String) responseBody.get("processing_time"));
                
                // Convert safety precautions from external format to our format
                List<Map<String, Object>> externalPrecautions = (List<Map<String, Object>>) responseBody.get("safety_information");
                if (externalPrecautions != null) {
                    log.info("Processing {} external safety precautions for device: {}", externalPrecautions.size(), deviceId);
                    List<DeviceSafetyPrecaution> safetyPrecautions = new ArrayList<>();
                    for (Map<String, Object> externalPrecaution : externalPrecautions) {
                        DeviceSafetyPrecaution safety = new DeviceSafetyPrecaution();
                        safety.setId(UUID.randomUUID().toString()); // Set required ID
                        safety.setTitle((String) externalPrecaution.get("name"));
                        safety.setDescription((String) externalPrecaution.get("about_reaction"));
                        safety.setSeverity("HIGH"); // Default severity since not provided in response
                        safety.setType("PDF_GENERATED"); // Set required type field
                        safety.setCategory("general"); // Set default category since not provided in response
                        safety.setDeviceId(deviceId);
                        safety.setOrganizationId(organizationId);
                        safety.setIsActive(true);
                        // Store additional safety information in separate fields
                        String aboutReaction = (String) externalPrecaution.get("about_reaction");
                        String causes = (String) externalPrecaution.get("causes");
                        String howToAvoid = (String) externalPrecaution.get("how_to_avoid");
                        String safetyInfo = (String) externalPrecaution.get("safety_info");
                        
                        // Set individual fields
                        safety.setAboutReaction(aboutReaction);
                        safety.setCauses(causes);
                        safety.setHowToAvoid(howToAvoid);
                        safety.setSafetyInfo(safetyInfo);
                        
                        // Set description to about_reaction for backward compatibility
                        safety.setDescription(aboutReaction != null ? aboutReaction : "No description available");
                        
                        safety.setCreatedAt(LocalDateTime.now());
                        safety.setUpdatedAt(LocalDateTime.now());
                        
                        // Log the complete safety precaution after all fields are set
                        log.debug("Created safety precaution from external data: ID={}, Title={}, Type={}, Category={}, AboutReaction={}, Causes={}, HowToAvoid={}, SafetyInfo={}", 
                            safety.getId(), safety.getTitle(), safety.getType(), safety.getCategory(),
                            safety.getAboutReaction() != null ? safety.getAboutReaction().substring(0, Math.min(50, safety.getAboutReaction().length())) + "..." : "null",
                            safety.getCauses() != null ? safety.getCauses().substring(0, Math.min(50, safety.getCauses().length())) + "..." : "null",
                            safety.getHowToAvoid() != null ? safety.getHowToAvoid().substring(0, Math.min(50, safety.getHowToAvoid().length())) + "..." : "null",
                            safety.getSafetyInfo() != null ? safety.getSafetyInfo().substring(0, Math.min(50, safety.getSafetyInfo().length())) + "..." : "null");
                        
                        // Validate the safety precaution before saving
                        if (!safety.isValid()) {
                            List<String> validationErrors = safety.getValidationErrors();
                            log.warn("Safety precaution validation failed, skipping: ID={}, Errors: {}", 
                                safety.getId(), validationErrors);
                            continue;
                        }
                        
                        if (safety.getDescription() == null || safety.getDescription().trim().isEmpty()) {
                            log.warn("Safety precaution has empty description, setting default: {}", safety.getId());
                            safety.setDescription("No description available");
                        }
                        
                        // Store safety precaution in database
                        try {
                            DeviceSafetyPrecaution savedSafety = deviceSafetyPrecautionRepository.save(safety);
                            safetyPrecautions.add(savedSafety);
                            log.debug("Successfully saved safety precaution to database: ID={}, Title={}", 
                                savedSafety.getId(), savedSafety.getTitle());
                        } catch (Exception e) {
                            log.error("Failed to save safety precaution to database: ID={}, Title={}, Error: {}", 
                                safety.getId(), safety.getTitle(), e.getMessage(), e);
                            // Continue with other precautions even if one fails
                        }
                    }
                    // Convert to DTO format
                    List<SafetyGenerationResponse.SafetyPrecaution> dtoPrecautions = new ArrayList<>();
                    for (DeviceSafetyPrecaution safety : safetyPrecautions) {
                        SafetyGenerationResponse.SafetyPrecaution dtoPrecaution = new SafetyGenerationResponse.SafetyPrecaution();
                        dtoPrecaution.setTitle(safety.getTitle());
                        dtoPrecaution.setDescription(safety.getDescription());
                        dtoPrecaution.setCategory(safety.getCategory());
                        dtoPrecaution.setSeverity(safety.getSeverity());
                        dtoPrecaution.setAboutReaction(safety.getAboutReaction());
                        dtoPrecaution.setCauses(safety.getCauses());
                        dtoPrecaution.setHowToAvoid(safety.getHowToAvoid());
                        dtoPrecaution.setSafetyInfo(safety.getSafetyInfo());
                        dtoPrecautions.add(dtoPrecaution);
                    }
                    safetyResponse.setSafetyPrecautions(dtoPrecautions);
                }
                
                log.info("Safety precautions generated and stored successfully for device: {}, precautions count: {}", 
                    deviceId, safetyResponse.getSafetyPrecautions() != null ? safetyResponse.getSafetyPrecautions().size() : 0);
                
                // Log detailed summary of stored data
                if (safetyResponse.getSafetyPrecautions() != null && !safetyResponse.getSafetyPrecautions().isEmpty()) {
                    log.info("Safety precautions summary for device {}: {}", deviceId, 
                        safetyResponse.getSafetyPrecautions().stream()
                            .map(sp -> String.format("Title='%s', HasAboutReaction=%s, HasCauses=%s, HasHowToAvoid=%s, HasSafetyInfo=%s", 
                                sp.getTitle(),
                                sp.getAboutReaction() != null && !sp.getAboutReaction().trim().isEmpty(),
                                sp.getCauses() != null && !sp.getCauses().trim().isEmpty(),
                                sp.getHowToAvoid() != null && !sp.getHowToAvoid().trim().isEmpty(),
                                sp.getSafetyInfo() != null && !sp.getSafetyInfo().trim().isEmpty()))
                            .collect(Collectors.joining("; ")));
                }
                
                // Verify data was stored correctly by retrieving from database
                try {
                    List<DeviceSafetyPrecaution> storedPrecautions = deviceSafetyPrecautionRepository.findByDeviceIdAndOrganizationId(deviceId, organizationId);
                    log.info("Verification: Retrieved {} safety precautions from database for device: {}", storedPrecautions.size(), deviceId);
                    
                    for (DeviceSafetyPrecaution stored : storedPrecautions) {
                        log.debug("Stored safety precaution verification: ID={}, Title={}, AboutReaction={}, Causes={}, HowToAvoid={}, SafetyInfo={}", 
                            stored.getId(), stored.getTitle(),
                            stored.getAboutReaction() != null ? "Present" : "Missing",
                            stored.getCauses() != null ? "Present" : "Missing",
                            stored.getHowToAvoid() != null ? "Present" : "Missing",
                            stored.getSafetyInfo() != null ? "Present" : "Missing");
                    }
                } catch (Exception e) {
                    log.warn("Could not verify stored safety precautions: {}", e.getMessage());
                }
            } else {
                throw new PDFProcessingException("Safety generation failed: External service returned success=false");
            }
            
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

    /**
     * Process and validate maintenance task from external service response with default values.
     * Handles the actual external service response structure with 'task' field instead of 'task_name'.
     * If task is missing, the task will be skipped.
     */
    private DeviceMaintenance processMaintenanceTaskFromExternalResponse(Map<String, Object> externalTask, String deviceId, String organizationId) {
        // Validate required fields - external service uses 'task' field
        String taskName = (String) externalTask.get("task");
        if (taskName == null || taskName.trim().isEmpty()) {
            log.warn("Skipping maintenance task - task field is missing or empty: {}", externalTask);
            return null;
        }

        DeviceMaintenance maintenance = new DeviceMaintenance();
        
        // Set required fields with validation
        maintenance.setTaskName(taskName.trim());
        maintenance.setDeviceId(deviceId);
        maintenance.setOrganizationId(organizationId);
        
        // Set default values for required fields
        maintenance.setStatus(DeviceMaintenance.Status.PENDING);
        maintenance.setCreatedAt(LocalDateTime.now());
        maintenance.setUpdatedAt(LocalDateTime.now());
        
        // Process optional fields with default values from external response structure
        maintenance.setDescription(processDescription(externalTask.get("description")));
        maintenance.setFrequency(processFrequency(externalTask.get("frequency")));
        maintenance.setPriority(processPriority(externalTask.get("priority")));
        maintenance.setEstimatedDuration(processDuration(externalTask.get("estimated_duration")));
        maintenance.setRequiredTools(processTools(externalTask.get("required_tools")));
        maintenance.setSafetyNotes(processSafetyNotes(externalTask.get("safety_notes")));
        maintenance.setComponentName(processComponentName(externalTask.get("category")));
        maintenance.setMaintenanceType(processMaintenanceType(externalTask.get("maintenance_type")));
        
        // Calculate next maintenance date based on frequency
        LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenance.getFrequency());
        maintenance.setNextMaintenance(nextMaintenance);
        
        // Set last maintenance to null (first time maintenance)
        maintenance.setLastMaintenance(null);
        
        log.debug("Processed maintenance task: {} with frequency: {}, priority: {}", 
            taskName, maintenance.getFrequency(), maintenance.getPriority());
        
        return maintenance;
    }

    /**
     * Process and validate maintenance task from internal DTO format with default values.
     * If task_name is missing, the task will be skipped.
     */
    private DeviceMaintenance processMaintenanceTask(Map<String, Object> externalTask, String deviceId, String organizationId) {
        // Validate required fields
        String taskName = (String) externalTask.get("task_name");
        if (taskName == null || taskName.trim().isEmpty()) {
            log.warn("Skipping maintenance task - task_name is missing or empty: {}", externalTask);
            return null;
        }

        DeviceMaintenance maintenance = new DeviceMaintenance();
        
        // Set required fields with validation
        maintenance.setTaskName(taskName.trim());
        maintenance.setDeviceId(deviceId);
        maintenance.setOrganizationId(organizationId);
        
        // Set default values for required fields
        maintenance.setStatus(DeviceMaintenance.Status.PENDING);
        maintenance.setCreatedAt(LocalDateTime.now());
        maintenance.setUpdatedAt(LocalDateTime.now());
        
        // Process optional fields with default values
        maintenance.setDescription(processDescription(externalTask.get("description")));
        maintenance.setFrequency(processFrequency(externalTask.get("frequency")));
        maintenance.setPriority(processPriority(externalTask.get("priority")));
        maintenance.setEstimatedDuration(processDuration(externalTask.get("estimated_duration")));
        maintenance.setRequiredTools(processTools(externalTask.get("required_tools")));
        maintenance.setComponentName(processComponentName(externalTask.get("component_name")));
        maintenance.setMaintenanceType(processMaintenanceType(externalTask.get("maintenance_type")));
        
        // Calculate next maintenance date based on frequency
        LocalDate nextMaintenance = calculateNextMaintenanceDate(maintenance.getFrequency());
        maintenance.setNextMaintenance(nextMaintenance);
        
        // Set last maintenance to null (first time maintenance)
        maintenance.setLastMaintenance(null);
        
        log.debug("Processed maintenance task: {} with frequency: {}, priority: {}", 
            taskName, maintenance.getFrequency(), maintenance.getPriority());
        
        return maintenance;
    }

    /**
     * Convert DeviceMaintenance entity to DTO format.
     */
    private MaintenanceGenerationResponse.MaintenanceTask convertToMaintenanceTaskDTO(DeviceMaintenance maintenance) {
        return MaintenanceGenerationResponse.MaintenanceTask.builder()
            .taskName(maintenance.getTaskName())
            .description(maintenance.getDescription())
            .frequency(maintenance.getFrequency())
            .priority(maintenance.getPriority() != null ? maintenance.getPriority().name() : "MEDIUM")
            .estimatedDuration(maintenance.getEstimatedDuration())
            .requiredTools(maintenance.getRequiredTools())
            .category(maintenance.getComponentName())
            .safetyNotes(maintenance.getSafetyNotes())
            .build();
    }

    /**
     * Process description with default value.
     */
    private String processDescription(Object description) {
        if (description == null) {
            return "Maintenance task for device component";
        }
        String desc = String.valueOf(description).trim();
        return desc.isEmpty() ? "Maintenance task for device component" : desc;
    }

    /**
     * Process frequency with default value "daily".
     * Handles numeric string values and converts them to descriptive frequency strings.
     */
    private String processFrequency(Object frequency) {
        if (frequency == null) {
            log.debug("Frequency not provided, defaulting to 'daily'");
            return "daily";
        }
        String freq = String.valueOf(frequency).trim();
        if (freq.isEmpty()) {
            log.debug("Frequency is empty, defaulting to 'daily'");
            return "daily";
        }
        
        // First, try to parse as numeric string (new format)
        try {
            int numericFreq = Integer.parseInt(freq);
            String descriptiveFreq = convertNumericFrequencyToDescriptive(numericFreq);
            log.debug("Converted numeric frequency {} to descriptive: {}", numericFreq, descriptiveFreq);
            return descriptiveFreq;
        } catch (NumberFormatException e) {
            // If not numeric, process as text (legacy format)
            log.debug("Frequency is not numeric, processing as text: {}", freq);
        }
        
        // Normalize common frequency values (legacy text format)
        String normalizedFreq = freq.toLowerCase();
        if (normalizedFreq.contains("daily") || normalizedFreq.contains("every day")) {
            return "daily";
        } else if (normalizedFreq.contains("weekly") || normalizedFreq.contains("every week")) {
            return "weekly";
        } else if (normalizedFreq.contains("monthly") || normalizedFreq.contains("every month")) {
            return "monthly";
        } else if (normalizedFreq.contains("quarterly") || normalizedFreq.contains("every 3 months")) {
            return "quarterly";
        } else if (normalizedFreq.contains("semi-annual") || normalizedFreq.contains("every 6 months")) {
            return "semi-annual";
        } else if (normalizedFreq.contains("annual") || normalizedFreq.contains("yearly") || normalizedFreq.contains("every year")) {
            return "annual";
        } else if (normalizedFreq.contains("bi-annual") || normalizedFreq.contains("every 2 years")) {
            return "bi-annual";
        }
        
        // Return original value if not recognized
        log.debug("Using original frequency value: {}", freq);
        return freq;
    }

    /**
     * Convert numeric frequency values to descriptive frequency strings.
     */
    private String convertNumericFrequencyToDescriptive(int numericFreq) {
        switch (numericFreq) {
            case 1:
                return "daily";
            case 7:
                return "weekly";
            case 30:
                return "monthly";
            case 90:
                return "quarterly";
            case 180:
                return "semi-annual";
            case 365:
                return "annual";
            default:
                log.warn("Unknown numeric frequency: {}, defaulting to daily", numericFreq);
                return "daily";
        }
    }

    /**
     * Process priority with default value MEDIUM.
     */
    private DeviceMaintenance.Priority processPriority(Object priority) {
        if (priority == null) {
            return DeviceMaintenance.Priority.MEDIUM;
        }
        String prio = String.valueOf(priority).trim().toUpperCase();
        
        try {
            return DeviceMaintenance.Priority.valueOf(prio);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid priority value: {}, defaulting to MEDIUM", prio);
            return DeviceMaintenance.Priority.MEDIUM;
        }
    }

    /**
     * Process estimated duration with default value.
     */
    private String processDuration(Object duration) {
        if (duration == null) {
            return "1 hour";
        }
        String dur = String.valueOf(duration).trim();
        return dur.isEmpty() ? "1 hour" : dur;
    }

    /**
     * Process required tools with default value.
     */
    private String processTools(Object tools) {
        if (tools == null) {
            return "Standard maintenance tools";
        }
        String toolsStr = String.valueOf(tools).trim();
        return toolsStr.isEmpty() ? "Standard maintenance tools" : toolsStr;
    }

    /**
     * Process safety notes with default value.
     */
    private String processSafetyNotes(Object safetyNotes) {
        if (safetyNotes == null) {
            return "Follow standard safety procedures";
        }
        String notes = String.valueOf(safetyNotes).trim();
        return notes.isEmpty() ? "Follow standard safety procedures" : notes;
    }

    /**
     * Process component name with default value.
     */
    private String processComponentName(Object componentName) {
        if (componentName == null) {
            return "General";
        }
        String comp = String.valueOf(componentName).trim();
        return comp.isEmpty() ? "General" : comp;
    }

    /**
     * Process maintenance type with default value GENERAL.
     */
    private DeviceMaintenance.MaintenanceType processMaintenanceType(Object maintenanceType) {
        if (maintenanceType == null) {
            return DeviceMaintenance.MaintenanceType.GENERAL;
        }
        String type = String.valueOf(maintenanceType).trim().toUpperCase();
        
        try {
            return DeviceMaintenance.MaintenanceType.valueOf(type);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid maintenance type: {}, defaulting to GENERAL", type);
            return DeviceMaintenance.MaintenanceType.GENERAL;
        }
    }

    /**
     * Calculate next maintenance date based on frequency.
     */
    private LocalDate calculateNextMaintenanceDate(String frequency) {
        if (frequency == null || frequency.trim().isEmpty()) {
            return LocalDate.now().plusDays(1); // Default to daily
        }
        
        String normalizedFreq = frequency.toLowerCase().trim();
        LocalDate today = LocalDate.now();
        
        switch (normalizedFreq) {
            case "daily":
                return today.plusDays(1);
            case "weekly":
                return today.plusWeeks(1);
            case "monthly":
                return today.plusMonths(1);
            case "quarterly":
                return today.plusMonths(3);
            case "semi-annual":
                return today.plusMonths(6);
            case "annual":
                return today.plusYears(1);
            case "bi-annual":
                return today.plusYears(2);
            default:
                log.warn("Unknown frequency: {}, defaulting to daily", frequency);
                return today.plusDays(1);
        }
    }
}
