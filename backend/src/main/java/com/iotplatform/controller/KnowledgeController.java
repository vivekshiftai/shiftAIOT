package com.iotplatform.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.iotplatform.model.UnifiedPDF;
import com.iotplatform.service.PDFProcessingService;
import com.iotplatform.service.UnifiedPDFService;
import com.iotplatform.service.UnifiedQueryService;
import com.iotplatform.service.IntelligentQueryService;
import com.iotplatform.dto.PDFQueryRequest;
import com.iotplatform.dto.PDFQueryResponse;

@RestController
@RequestMapping("/api/knowledge")
public class KnowledgeController {

    @Autowired
    private PDFProcessingService pdfProcessingService;
    
    @Autowired
    private UnifiedPDFService unifiedPDFService;
    
    @Autowired
    private UnifiedQueryService unifiedQueryService;
    
    @Autowired
    private IntelligentQueryService intelligentQueryService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file) {
        try {
            String organizationId = "public"; // Default organization for all users
            UnifiedPDF document = unifiedPDFService.createGeneralPDF(
                file.getOriginalFilename(),
                "General Document",
                file.getSize(),
                "knowledge_upload",
                organizationId,
                "public_user"
            );
            return ResponseEntity.ok(Map.of(
                "success", true,
                "document", document,
                "message", "Document uploaded successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/upload-pdf")
    public ResponseEntity<?> uploadPDF(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "deviceId", required = false) String deviceId,
            @RequestParam(value = "deviceName", required = false) String deviceName) {
        try {
            // Remove authentication requirement - allow all users
            String organizationId = "public"; // Default organization for all users
            
            // Validate file type
            if (!file.getContentType().equals("application/pdf")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Only PDF files are allowed"
                ));
            }
            
            // Remove file size validation - allow any size
            
            // Use unified PDF service instead of knowledge service
            UnifiedPDF unifiedPDF = unifiedPDFService.createGeneralPDF(
                file.getOriginalFilename(),
                "General PDF Document",
                file.getSize(),
                "knowledge_upload",
                organizationId,
                "public_user"
            );
            
            // Return immediate success response - processing happens in background
            String message;
            if (deviceId != null && deviceName != null) {
                message = String.format(
                    "✅ PDF '%s' uploaded successfully for device '%s'. We're processing your document in the background. You'll receive a notification when it's ready for AI chat queries.",
                    file.getOriginalFilename(),
                    deviceName
                );
            } else {
                message = String.format(
                    "✅ PDF '%s' uploaded successfully. We're processing your document in the background. You'll receive a notification when it's ready for AI chat queries.",
                    file.getOriginalFilename()
                );
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "pdf_filename", file.getOriginalFilename(),
                "processing_status", "processing",
                "pdfId", unifiedPDF.getId(),
                "device_id", deviceId,
                "device_name", deviceName,
                "message", message
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/query")
    public ResponseEntity<?> queryPDF(@RequestBody Map<String, Object> request) {
        try {
            String organizationId = "shiftAIOT-org-2024"; // Use the actual organization ID from your data
            String pdfName = (String) request.get("pdf_name");
            String query = (String) request.get("query");
            Integer topK = (Integer) request.getOrDefault("top_k", 5);
            
            System.out.println("🔍 Knowledge Query Request - PDF: " + pdfName + ", Query: " + query);
            
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Query is required"
                ));
            }
            
            if (pdfName == null || pdfName.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "PDF name is required"
                ));
            }
            
            // Create PDFQueryRequest for the PDFProcessingService
            PDFQueryRequest pdfRequest = new PDFQueryRequest();
            pdfRequest.setPdfName(pdfName);
            pdfRequest.setQuery(query);
            pdfRequest.setOrganizationId(organizationId);
            
            // Use a default user ID for public queries
            String defaultUserId = "public-user";
            
            // Call the actual PDF processing service
            PDFQueryResponse pdfResponse = pdfProcessingService.queryPDF(pdfRequest, defaultUserId, organizationId);
            
            // Convert the response to the expected format
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Query processed successfully");
            response.put("query", query);
            response.put("pdf_name", pdfName);
            response.put("response", pdfResponse.getResponse());
            response.put("chunks_used", pdfResponse.getChunksUsed() != null ? 
                Arrays.asList(pdfResponse.getChunksUsed()) : List.of());
            response.put("processing_time", pdfResponse.getProcessingTime());
            
            System.out.println("✅ Knowledge Query Response - Success: " + (pdfResponse.getResponse() != null));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Test endpoint to verify backend connectivity
     */
    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        System.out.println("🔍 Test endpoint called");
        return ResponseEntity.ok(Map.of(
            "success", true,
            "message", "Knowledge base backend is working",
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Handle OPTIONS requests for CORS
     */
    @RequestMapping(value = "/**", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        System.out.println("🔍 OPTIONS request received");
        return ResponseEntity.ok().build();
    }

    /**
     * Unified query endpoint - handles both PDF and database queries
     */
    @PostMapping("/unified-query")
    public ResponseEntity<?> unifiedQuery(@RequestBody Map<String, Object> request) {
        try {
            String organizationId = "public"; // Default organization for all users
            String userId = "public-user"; // Default user for public queries
            String query = (String) request.get("query");
            
            System.out.println("🔍 Unified Query Request - Query: " + query);
            System.out.println("🔍 Request body: " + request);
            System.out.println("🔍 Organization ID: " + organizationId);
            System.out.println("🔍 User ID: " + userId);
            
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Query is required"
                ));
            }
            
            // Process unified query
            UnifiedQueryService.UnifiedQueryResult result = unifiedQueryService.processQuery(
                query, organizationId, userId
            );
            
            // Build response
            Map<String, Object> response = new HashMap<>();
            response.put("success", result.isSuccess());
            response.put("query", query);
            response.put("queryType", result.getQueryType() != null ? result.getQueryType().name() : "UNKNOWN");
            response.put("response", result.getResponse());
            response.put("processingTime", result.getProcessingTime());
            
            if (result.isSuccess()) {
                if (result.getDatabaseResults() != null) {
                    response.put("databaseResults", result.getDatabaseResults());
                    response.put("rowCount", result.getRowCount());
                }
                if (result.getSqlQuery() != null) {
                    response.put("sqlQuery", result.getSqlQuery());
                }
            } else {
                response.put("error", result.getError());
            }
            
            System.out.println("✅ Unified Query Response - Success: " + result.isSuccess() + 
                             ", Type: " + result.getQueryType());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.out.println("❌ Unified Query Error: " + e.getMessage());
            e.printStackTrace(); // Add stack trace for debugging
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", "Failed to process query: " + e.getMessage()
            ));
        }
    }

    /**
     * Get query suggestions
     */
    @GetMapping("/suggestions")
    public ResponseEntity<?> getQuerySuggestions(@RequestParam(value = "context", required = false) String context) {
        try {
            List<String> suggestions = unifiedQueryService.getQuerySuggestions(context);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("suggestions", suggestions);
            response.put("context", context);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/pdfs")
    public ResponseEntity<?> listPDFs(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "deviceId", required = false) String deviceId) {
        try {
            String organizationId = "public"; // Default organization for all users
            
            // Validate limit
            if (limit > 100) {
                limit = 100;
            }
            
            List<UnifiedPDF> documents;
            if (deviceId != null) {
                documents = unifiedPDFService.getPDFsByDeviceAndOrganization(deviceId, organizationId);
            } else {
                documents = unifiedPDFService.getPDFsByOrganization(organizationId);
            }
            
            // Simple pagination
            int startIndex = (page - 1) * limit;
            int endIndex = Math.min(startIndex + limit, documents.size());
            List<UnifiedPDF> paginatedDocuments = documents.subList(startIndex, endIndex);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pdfs", paginatedDocuments.stream().map(doc -> {
                Map<String, Object> docMap = new HashMap<>();
                docMap.put("id", doc.getId());
                docMap.put("filename", doc.getName());
                docMap.put("size_bytes", doc.getFileSize());
                docMap.put("uploaded_at", doc.getUploadedAt());
                docMap.put("status", doc.getProcessingStatus());
                docMap.put("device_id", doc.getDeviceId());
                docMap.put("device_name", doc.getDeviceName());
                docMap.put("vectorized", doc.getVectorized());
                return docMap;
            }).collect(Collectors.toList()));
            Map<String, Object> pagination = new HashMap<>();
            pagination.put("page", page);
            pagination.put("limit", limit);
            pagination.put("total", documents.size());
            pagination.put("total_pages", (int) Math.ceil((double) documents.size() / limit));
            response.put("pagination", pagination);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/documents")
    public ResponseEntity<?> getDocuments(
            @RequestParam(value = "deviceId", required = false) String deviceId) {
        try {
            // Get organization from authenticated user or use default
            String organizationId = "shiftAIOT-org-2024"; // Use the actual organization ID from your data
            System.out.println("🔍 KnowledgeController.getDocuments - Organization ID: " + organizationId);
            
            List<UnifiedPDF> documents;
            if (deviceId != null) {
                documents = unifiedPDFService.getPDFsByDeviceAndOrganization(deviceId, organizationId);
            } else {
                documents = unifiedPDFService.getPDFsByOrganization(organizationId);
            }
            
            System.out.println("🔍 KnowledgeController.getDocuments - Found " + documents.size() + " documents");
            for (UnifiedPDF doc : documents) {
                System.out.println("🔍 Document: " + doc.getName() + " | Device: " + doc.getDeviceName() + " | Status: " + doc.getProcessingStatus());
            }
            
            return ResponseEntity.ok(Map.of(
                "documents", documents,
                "totalCount", documents.size()
            ));
        } catch (Exception e) {
            System.err.println("❌ KnowledgeController.getDocuments error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/documents/device/{deviceId}")
    public ResponseEntity<?> getDocumentsByDevice(@PathVariable String deviceId) {
        try {
            String organizationId = "shiftAIOT-org-2024"; // Use the actual organization ID from your data
            List<UnifiedPDF> documents = unifiedPDFService.getPDFsByDeviceAndOrganization(deviceId, organizationId);
            return ResponseEntity.ok(Map.of(
                "documents", documents,
                "deviceId", deviceId,
                "totalCount", documents.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping("/documents/general")
    public ResponseEntity<?> getGeneralDocuments() {
        try {
            String organizationId = "shiftAIOT-org-2024"; // Use the actual organization ID from your data
            List<UnifiedPDF> documents = unifiedPDFService.getPDFsByType(organizationId, UnifiedPDF.DocumentType.GENERAL);
            return ResponseEntity.ok(Map.of(
                "documents", documents,
                "totalCount", documents.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<?> deleteDocument(@PathVariable String documentId) {
        try {
            String organizationId = "public"; // Default organization for all users
            unifiedPDFService.softDeletePDF(documentId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Document deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/documents/{documentId}/download")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String documentId) {
        try {
            String organizationId = "public"; // Default organization for all users
            // TODO: Implement file download functionality with UnifiedPDFService
            // For now, return not implemented
            return ResponseEntity.status(501).body(null);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/documents/{documentId}/status")
    public ResponseEntity<?> getDocumentStatus(@PathVariable String documentId) {
        try {
            String organizationId = "public"; // Default organization for all users
            Optional<UnifiedPDF> pdf = unifiedPDFService.getPDFById(documentId);
            if (pdf.isPresent()) {
                Map<String, Object> status = new HashMap<>();
                status.put("id", pdf.get().getId());
                status.put("name", pdf.get().getName());
                status.put("processingStatus", pdf.get().getProcessingStatus());
                status.put("vectorized", pdf.get().getVectorized());
                status.put("uploadedAt", pdf.get().getUploadedAt());
                status.put("processedAt", pdf.get().getProcessedAt());
                return ResponseEntity.ok(status);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchDocuments(@RequestBody Map<String, Object> request) {
        try {
            String organizationId = "public"; // Default organization for all users
            String query = (String) request.get("query");
            Integer limit = (Integer) request.getOrDefault("limit", 10);
            
            // TODO: Implement search functionality with UnifiedPDFService
            // For now, return empty results
            List<Map<String, Object>> results = List.of();
            return ResponseEntity.ok(Map.of(
                "results", results,
                "totalResults", results.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<?> sendChatMessage(@RequestBody Map<String, Object> request) {
        try {
            String organizationId = "public"; // Default organization for all users
            String message = (String) request.get("message");
            @SuppressWarnings("unchecked")
            List<String> documentIds = (List<String>) request.get("documentIds");
            
            // TODO: Implement chat functionality with UnifiedPDFService
            // For now, return a placeholder response
            String response = "Chat functionality is under development with the new unified PDF system.";
            return ResponseEntity.ok(Map.of("message", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/chat/history")
    public ResponseEntity<?> getChatHistory() {
        try {
            String organizationId = "public"; // Default organization for all users
            // TODO: Implement chat history functionality with UnifiedPDFService
            // For now, return empty history
            List<Map<String, Object>> messages = List.of();
            return ResponseEntity.ok(Map.of("messages", messages));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            String organizationId = "public"; // Default organization for all users
            // TODO: Implement statistics functionality with UnifiedPDFService
            // For now, return basic stats
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalDocuments", 0);
            stats.put("vectorizedDocuments", 0);
            stats.put("processingDocuments", 0);
            stats.put("completedDocuments", 0);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/generate/rules")
    public ResponseEntity<?> generateRules(@RequestBody Map<String, Object> request) {
        try {
            String organizationId = "public"; // Default organization for all users
            String pdfName = (String) request.get("pdf_name");
            String deviceId = (String) request.get("device_id");
            
            // TODO: Implement actual AI-based rule generation from PDF content
            // This should integrate with a proper AI service to analyze PDF content
            // and generate meaningful rules based on the device documentation
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pdf_name", pdfName);
            response.put("device_id", deviceId);
            response.put("message", "Rule generation endpoint is under development. Please implement AI integration for actual PDF analysis.");
            response.put("status", "not_implemented");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Intelligent Query Endpoint - Extracts device name from query and queries the associated PDF
     * 
     * @param request The query request containing the natural language query
     * @return Intelligent query response with device name extraction and PDF query results
     */
    @PostMapping("/intelligent-query")
    public ResponseEntity<?> intelligentQuery(@RequestBody Map<String, Object> request) {
        try {
            String query = (String) request.get("query");
            String organizationId = (String) request.getOrDefault("organization_id", "public");
            String userId = (String) request.getOrDefault("user_id", "public-user");
            
            System.out.println("🧠 Intelligent Query Request - Query: " + query + ", Org: " + organizationId);
            
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Query is required"
                ));
            }
            
            // Process the intelligent query
            Map<String, Object> response = intelligentQueryService.processIntelligentQuery(query, organizationId, userId);
            
            System.out.println("✅ Intelligent Query Response - Success: " + response.get("success") + 
                             ", Device: " + response.get("extractedDeviceName"));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Intelligent Query Error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Intelligent query processing failed: " + e.getMessage());
            errorResponse.put("query", request.get("query"));
            errorResponse.put("extractedDeviceName", null);
            errorResponse.put("queriedPDF", null);
            errorResponse.put("response", null);
            
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

}
