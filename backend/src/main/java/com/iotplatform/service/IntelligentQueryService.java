package com.iotplatform.service;

import com.iotplatform.dto.PDFQueryRequest;
import com.iotplatform.dto.PDFQueryResponse;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.model.UnifiedPDF;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

/**
 * Service for intelligent query processing that extracts device names and queries PDFs
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IntelligentQueryService {

    private final DeviceNameExtractionService deviceNameExtractionService;
    private final UnifiedPDFService unifiedPDFService;
    private final PDFProcessingService pdfProcessingService;

    /**
     * Process an intelligent query by extracting device name and querying the associated PDF
     * 
     * @param query The natural language query
     * @param organizationId The organization ID
     * @param userId The user ID
     * @return Query response with results
     */
    public Map<String, Object> processIntelligentQuery(String query, String organizationId, String userId) {
        log.info("🧠 Processing intelligent query for user: {} in organization: {}", userId, organizationId);
        log.info("📝 Query: {}", query);
        
        try {
            // Step 1: Extract device name and plain query from query using LLM
            log.info("🔍 Step 1: Extracting device name and plain query from query...");
            DeviceNameExtractionService.DeviceExtractionResult extractionResult = deviceNameExtractionService.extractDeviceName(query);
            
            String deviceName = extractionResult.getDeviceName();
            String plainQuery = extractionResult.getPlainQuery();
            
            if (deviceName == null) {
                log.warn("⚠️ No device name found in query: {}", query);
                return createNoDeviceResponse(query, "No specific device mentioned in the query");
            }
            
            log.info("✅ Device name extracted: '{}', Plain query: '{}'", deviceName, plainQuery);
            
            // Step 2: Find device documents in unified_pdfs table
            log.info("🔍 Step 2: Looking up device documents for device: '{}'", deviceName);
            List<UnifiedPDF> devicePDFs = unifiedPDFService.getPDFsByDeviceNameAndOrganization(deviceName, organizationId);
            
            if (devicePDFs.isEmpty()) {
                log.warn("⚠️ No PDF documents found for device: '{}' in organization: {}", deviceName, organizationId);
                return createNoDeviceResponse(query, "No PDF documents found for device: " + deviceName);
            }
            
            log.info("✅ Found {} PDF documents for device: '{}'", devicePDFs.size(), deviceName);
            
            // Step 3: Select the best PDF to query (prefer manual, then datasheet, then any)
            log.info("🔍 Step 3: Selecting best PDF document to query...");
            UnifiedPDF selectedPDF = selectBestPDF(devicePDFs);
            
            if (selectedPDF == null) {
                log.warn("⚠️ No suitable PDF found for querying device: '{}'", deviceName);
                return createNoDeviceResponse(query, "No suitable PDF document found for device: " + deviceName);
            }
            
            log.info("✅ Selected PDF: '{}' (type: {})", selectedPDF.getName(), selectedPDF.getDocumentType());
            
            // Step 4: Query the PDF using the existing PDF processing service with plain query
            log.info("🔍 Step 4: Querying PDF document with plain query...");
            PDFQueryRequest pdfRequest = new PDFQueryRequest();
            pdfRequest.setPdfName(selectedPDF.getName());
            pdfRequest.setQuery(plainQuery);  // Use plain query instead of original query
            pdfRequest.setOrganizationId(organizationId);
            
            PDFQueryResponse pdfResponse = pdfProcessingService.queryPDF(pdfRequest, userId, organizationId);
            
            log.info("✅ PDF query completed successfully");
            
            // Step 5: Create comprehensive response
            return createSuccessResponse(query, deviceName, selectedPDF, pdfResponse);
            
        } catch (PDFProcessingException e) {
            log.error("❌ PDF processing failed for query: {}", query, e);
            return createErrorResponse(query, "PDF processing failed: " + e.getMessage());
        } catch (Exception e) {
            log.error("❌ Unexpected error processing intelligent query: {}", query, e);
            return createErrorResponse(query, "Unexpected error: " + e.getMessage());
        }
    }
    
    /**
     * Select the best PDF document for querying based on document type priority
     */
    private UnifiedPDF selectBestPDF(List<UnifiedPDF> pdfs) {
        // Priority order: manual > datasheet > certificate > general
        Optional<UnifiedPDF> manual = pdfs.stream()
            .filter(pdf -> "manual".equalsIgnoreCase(pdf.getDocumentType().toString()))
            .findFirst();
        
        if (manual.isPresent()) {
            log.info("📖 Selected manual document: {}", manual.get().getName());
            return manual.get();
        }
        
        Optional<UnifiedPDF> datasheet = pdfs.stream()
            .filter(pdf -> "datasheet".equalsIgnoreCase(pdf.getDocumentType().toString()))
            .findFirst();
        
        if (datasheet.isPresent()) {
            log.info("📊 Selected datasheet document: {}", datasheet.get().getName());
            return datasheet.get();
        }
        
        Optional<UnifiedPDF> certificate = pdfs.stream()
            .filter(pdf -> "certificate".equalsIgnoreCase(pdf.getDocumentType().toString()))
            .findFirst();
        
        if (certificate.isPresent()) {
            log.info("📜 Selected certificate document: {}", certificate.get().getName());
            return certificate.get();
        }
        
        // Return the first available document
        if (!pdfs.isEmpty()) {
            log.info("📄 Selected first available document: {}", pdfs.get(0).getName());
            return pdfs.get(0);
        }
        
        return null;
    }
    
    /**
     * Create success response with comprehensive PDF processing information
     */
    private Map<String, Object> createSuccessResponse(String query, String deviceName, UnifiedPDF pdf, PDFQueryResponse pdfResponse) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("query", query);
        response.put("extractedDeviceName", deviceName);
        
        // PDF document information
        response.put("queriedPDF", Map.of(
            "name", pdf.getName(),
            "originalFilename", pdf.getOriginalFilename(),
            "documentType", pdf.getDocumentType().toString(),
            "fileSize", pdf.getFileSize(),
            "processingStatus", pdf.getProcessingStatus().toString()
        ));
        
        // Complete PDF processing response
        response.put("pdfProcessingResponse", Map.of(
            "success", pdfResponse.isSuccess(),
            "message", pdfResponse.getMessage(),
            "response", pdfResponse.getResponse(),
            "chunksUsed", pdfResponse.getChunksUsed() != null ? pdfResponse.getChunksUsed() : new String[0],
            "processingTime", pdfResponse.getProcessingTime(),
            "images", pdfResponse.getImages() != null ? pdfResponse.getImages() : List.of(),
            "tables", pdfResponse.getTables() != null ? pdfResponse.getTables() : List.of()
        ));
        
        // Main response (for backward compatibility)
        response.put("response", pdfResponse.getResponse());
        response.put("message", "Query processed successfully using device-specific PDF document");
        
        // Additional metadata
        response.put("processingMetadata", Map.of(
            "deviceExtractionSuccess", true,
            "pdfFound", true,
            "pdfQuerySuccess", pdfResponse.isSuccess(),
            "totalChunksUsed", pdfResponse.getChunksUsed() != null ? pdfResponse.getChunksUsed().length : 0,
            "hasImages", pdfResponse.getImages() != null && !pdfResponse.getImages().isEmpty(),
            "hasTables", pdfResponse.getTables() != null && !pdfResponse.getTables().isEmpty()
        ));
        
        log.info("✅ Intelligent query completed successfully for device: '{}' - PDF: '{}', Chunks: {}, Processing Time: {}", 
                deviceName, pdf.getName(), 
                pdfResponse.getChunksUsed() != null ? pdfResponse.getChunksUsed().length : 0,
                pdfResponse.getProcessingTime());
        
        return response;
    }
    
    /**
     * Create no device found response
     */
    private Map<String, Object> createNoDeviceResponse(String query, String reason) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("query", query);
        response.put("extractedDeviceName", null);
        response.put("queriedPDF", null);
        response.put("pdfProcessingResponse", null);
        response.put("response", null);
        response.put("message", reason);
        response.put("suggestion", "Please specify a device name in your query (e.g., 'What is the maintenance schedule for Rondo s-40?')");
        
        // No device metadata
        response.put("processingMetadata", Map.of(
            "deviceExtractionSuccess", false,
            "pdfFound", false,
            "pdfQuerySuccess", false,
            "totalChunksUsed", 0,
            "hasImages", false,
            "hasTables", false,
            "errorType", "NO_DEVICE_FOUND"
        ));
        
        return response;
    }
    
    /**
     * Create error response with detailed error information
     */
    private Map<String, Object> createErrorResponse(String query, String error) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("query", query);
        response.put("extractedDeviceName", null);
        response.put("queriedPDF", null);
        response.put("pdfProcessingResponse", null);
        response.put("response", null);
        response.put("message", "Query processing failed");
        response.put("error", error);
        
        // Error metadata
        response.put("processingMetadata", Map.of(
            "deviceExtractionSuccess", false,
            "pdfFound", false,
            "pdfQuerySuccess", false,
            "totalChunksUsed", 0,
            "hasImages", false,
            "hasTables", false,
            "errorType", "PROCESSING_ERROR"
        ));
        
        return response;
    }
}
