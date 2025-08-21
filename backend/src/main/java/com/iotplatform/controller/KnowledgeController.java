package com.iotplatform.controller;

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

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/knowledge")
public class KnowledgeController {

    @Autowired
    private KnowledgeService knowledgeService;

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
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "pdf_filename", file.getOriginalFilename(),
                "processing_status", "uploaded",
                "pdfId", document.getId().toString(),
                "device_id", document.getDeviceId(),
                "device_name", document.getDeviceName(),
                "message", "PDF uploaded successfully"
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
            
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Query is required"
                ));
            }
            
            // Enhanced AI response with images, tables, and context chunks
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Query processed successfully");
            response.put("query", query);
            response.put("pdf_name", pdfName);
            response.put("response", "The LLM's text answer to the user's query. Based on the analysis of the PDF document, here's what I found regarding your question about " + query + ". The document contains relevant information that addresses your specific inquiry.");
            response.put("chunks_used", List.of(
                "Section 1: Introduction - Contains overview information",
                "Section 3: Installation Guide - Provides step-by-step instructions",
                "Section 5: Troubleshooting - Addresses common issues and solutions"
            ));
            response.put("images", List.of(
                Map.of(
                    "filename", "diagram1.png",
                    "data", "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", // 1x1 transparent PNG
                    "mime_type", "image/png",
                    "size", 95
                ),
                Map.of(
                    "filename", "installation-diagram.jpg",
                    "data", "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=", // 1x1 JPEG
                    "mime_type", "image/jpeg",
                    "size", 125
                ),
                Map.of(
                    "filename", "component-layout.svg",
                    "data", "PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==", // Simple SVG
                    "mime_type", "image/svg+xml",
                    "size", 89
                )
            ));
            response.put("tables", List.of(
                "<table class='table-auto w-full'><thead><tr><th class='px-4 py-2'>Component</th><th class='px-4 py-2'>Specification</th><th class='px-4 py-2'>Value</th></tr></thead><tbody><tr><td class='border px-4 py-2'>Temperature Range</td><td class='border px-4 py-2'>Operating</td><td class='border px-4 py-2'>-40°C to +85°C</td></tr><tr><td class='border px-4 py-2'>Power Supply</td><td class='border px-4 py-2'>Voltage</td><td class='border px-4 py-2'>24V DC</td></tr></tbody></table>"
            ));
            response.put("processing_time", "2.5 seconds");
            
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
            response.put("pdfs", paginatedDocuments.stream().map(doc -> Map.of(
                "id", doc.getId().toString(),
                "filename", doc.getName(),
                "size_bytes", doc.getSize(),
                "uploaded_at", doc.getUploadedAt(),
                "status", doc.getStatus(),
                "device_id", doc.getDeviceId(),
                "device_name", doc.getDeviceName(),
                "vectorized", doc.getVectorized()
            )).collect(Collectors.toList()));
            response.put("pagination", Map.of(
                "page", page,
                "limit", limit,
                "total", documents.size(),
                "total_pages", (int) Math.ceil((double) documents.size() / limit)
            ));
            
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
            
            // Mock rules generation from technical documentation
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("pdf_name", pdfName);
            response.put("device_id", deviceId);
            response.put("rules", List.of(
                Map.of(
                    "id", "rule_001",
                    "name", "Temperature Threshold Alert",
                    "condition", "temperature > 25°C",
                    "action", "send_alert",
                    "description", "Alert when temperature exceeds 25°C",
                    "severity", "medium"
                ),
                Map.of(
                    "id", "rule_002", 
                    "name", "Humidity Monitoring",
                    "condition", "humidity < 30% OR humidity > 70%",
                    "action", "log_event",
                    "description", "Log humidity events outside normal range",
                    "severity", "low"
                )
            ));
            response.put("total_rules_generated", 2);
            response.put("processing_time_ms", 2100);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }


}
