package com.iotplatform.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
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
            @RequestParam(value = "deviceName", required = false) String deviceName,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            
            // Validate file type
            if (!file.getContentType().equals("application/pdf")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Only PDF files are allowed"
                ));
            }
            
            // Validate file size (10MB limit)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "File size must be less than 10MB"
                ));
            }
            
            KnowledgeDocument document = knowledgeService.uploadDocument(file, organizationId, deviceId, deviceName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "pdf_filename", file.getOriginalFilename(),
                "processing_status", "uploaded",
                "document_id", document.getId(),
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

    @GetMapping("/documents")
    public ResponseEntity<?> getDocuments(
            @RequestParam(value = "deviceId", required = false) String deviceId,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            List<KnowledgeDocument> documents;
            
            if (deviceId != null && !deviceId.trim().isEmpty()) {
                documents = knowledgeService.getDocumentsByDevice(organizationId, deviceId);
            } else {
                documents = knowledgeService.getDocuments(organizationId);
            }
            
            List<Map<String, Object>> response = documents.stream()
                .map(doc -> Map.of(
                    "id", doc.getId(),
                    "name", doc.getName(),
                    "type", doc.getType(),
                    "size", doc.getSize(),
                    "status", doc.getStatus(),
                    "vectorized", doc.getVectorized(),
                    "uploadedAt", doc.getUploadedAt(),
                    "processedAt", doc.getProcessedAt(),
                    "deviceId", doc.getDeviceId(),
                    "deviceName", doc.getDeviceName()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "documents", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/documents/device/{deviceId}")
    public ResponseEntity<?> getDocumentsByDevice(@PathVariable String deviceId, Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            List<KnowledgeDocument> documents = knowledgeService.getDocumentsByDevice(organizationId, deviceId);
            
            List<Map<String, Object>> response = documents.stream()
                .map(doc -> Map.of(
                    "id", doc.getId(),
                    "name", doc.getName(),
                    "type", doc.getType(),
                    "size", doc.getSize(),
                    "status", doc.getStatus(),
                    "vectorized", doc.getVectorized(),
                    "uploadedAt", doc.getUploadedAt(),
                    "processedAt", doc.getProcessedAt(),
                    "deviceId", doc.getDeviceId(),
                    "deviceName", doc.getDeviceName()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "documents", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }
    
    @GetMapping("/documents/general")
    public ResponseEntity<?> getGeneralDocuments(Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            List<KnowledgeDocument> documents = knowledgeService.getGeneralDocuments(organizationId);
            
            List<Map<String, Object>> response = documents.stream()
                .map(doc -> Map.of(
                    "id", doc.getId(),
                    "name", doc.getName(),
                    "type", doc.getType(),
                    "size", doc.getSize(),
                    "status", doc.getStatus(),
                    "vectorized", doc.getVectorized(),
                    "uploadedAt", doc.getUploadedAt(),
                    "processedAt", doc.getProcessedAt(),
                    "deviceId", doc.getDeviceId(),
                    "deviceName", doc.getDeviceName()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "documents", response
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/documents/{documentId}")
    public ResponseEntity<?> deleteDocument(
            @PathVariable String documentId,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
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
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable String documentId,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
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
    public ResponseEntity<?> getDocumentStatus(
            @PathVariable String documentId,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            Map<String, Object> status = knowledgeService.getDocumentStatus(documentId, organizationId);
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/search")
    public ResponseEntity<?> searchDocuments(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
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
    public ResponseEntity<?> sendChatMessage(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
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
    public ResponseEntity<?> getChatHistory(Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            List<Map<String, Object>> messages = knowledgeService.getChatHistory(organizationId);
            return ResponseEntity.ok(Map.of("messages", messages));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    public ResponseEntity<?> getStatistics(Authentication authentication) {
        try {
            String organizationId = getOrganizationId(authentication);
            Map<String, Object> stats = knowledgeService.getStatistics(organizationId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private String getOrganizationId(Authentication authentication) {
        // Extract organization ID from authentication
        // This is a placeholder - implement based on your authentication structure
        return "default-org";
    }
}
