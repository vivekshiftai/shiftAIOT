package com.iotplatform.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.iotplatform.model.KnowledgeDocument;
import com.iotplatform.service.KnowledgeService;
import com.iotplatform.service.PDFProcessingService;
import com.iotplatform.dto.PDFQueryRequest;
import com.iotplatform.dto.PDFQueryResponse;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/knowledge")
public class KnowledgeController {

    @Autowired
    private KnowledgeService knowledgeService;
    
    @Autowired
    private PDFProcessingService pdfProcessingService;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadDocument(
            @RequestParam("file") MultipartFile file) {
        try {
            String organizationId = "public"; // Default organization for all users
            KnowledgeDocument document = knowledgeService.uploadDocument(file, organizationId);
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
            
            KnowledgeDocument document = knowledgeService.uploadDocument(file, organizationId, deviceId, deviceName);
            
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
                "pdfId", document.getId().toString(),
                "device_id", document.getDeviceId(),
                "device_name", document.getDeviceName(),
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
            String organizationId = "public"; // Default organization for all users
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
            
            List<KnowledgeDocument> documents;
            if (deviceId != null) {
                documents = knowledgeService.getDocumentsByDevice(deviceId, organizationId);
            } else {
                documents = knowledgeService.getAllDocuments(organizationId);
            }
            
            // Simple pagination
            int startIndex = (page - 1) * limit;
            int endIndex = Math.min(startIndex + limit, documents.size());
            List<KnowledgeDocument> paginatedDocuments = documents.subList(startIndex, endIndex);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pdfs", paginatedDocuments.stream().map(doc -> {
                Map<String, Object> docMap = new HashMap<>();
                docMap.put("id", doc.getId().toString());
                docMap.put("filename", doc.getName());
                docMap.put("size_bytes", doc.getSize());
                docMap.put("uploaded_at", doc.getUploadedAt());
                docMap.put("status", doc.getStatus());
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
            String organizationId = "public"; // Default organization for all users
            List<KnowledgeDocument> documents;
            if (deviceId != null) {
                documents = knowledgeService.getDocumentsByDevice(deviceId, organizationId);
            } else {
                documents = knowledgeService.getAllDocuments(organizationId);
            }
            return ResponseEntity.ok(Map.of(
                "documents", documents,
                "totalCount", documents.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/documents/device/{deviceId}")
    public ResponseEntity<?> getDocumentsByDevice(@PathVariable String deviceId) {
        try {
            String organizationId = "public"; // Default organization for all users
            List<KnowledgeDocument> documents = knowledgeService.getDocumentsByDevice(deviceId, organizationId);
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
            String organizationId = "public"; // Default organization for all users
            List<KnowledgeDocument> documents = knowledgeService.getGeneralDocuments(organizationId);
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
            knowledgeService.deleteDocument(documentId, organizationId);
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
            Resource resource = knowledgeService.downloadDocument(documentId, organizationId);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/documents/{documentId}/status")
    public ResponseEntity<?> getDocumentStatus(@PathVariable String documentId) {
        try {
            String organizationId = "public"; // Default organization for all users
            Map<String, Object> status = knowledgeService.getDocumentStatus(documentId, organizationId);
            return ResponseEntity.ok(status);
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
            
            List<Map<String, Object>> results = knowledgeService.searchDocuments(query, limit, organizationId);
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
            
            String response = knowledgeService.processChatMessage(message, documentIds, organizationId);
            return ResponseEntity.ok(Map.of("message", response));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/chat/history")
    public ResponseEntity<?> getChatHistory() {
        try {
            String organizationId = "public"; // Default organization for all users
            List<Map<String, Object>> messages = knowledgeService.getChatHistory(organizationId);
            return ResponseEntity.ok(Map.of("messages", messages));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics() {
        try {
            String organizationId = "public"; // Default organization for all users
            Map<String, Object> stats = knowledgeService.getStatistics(organizationId);
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


}
