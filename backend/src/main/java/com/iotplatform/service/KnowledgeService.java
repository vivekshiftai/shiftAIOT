package com.iotplatform.service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.iotplatform.model.KnowledgeDocument;
import com.iotplatform.model.Notification;
import com.iotplatform.repository.KnowledgeDocumentRepository;
import com.iotplatform.service.NotificationService;
import com.iotplatform.service.PDFProcessingService;
import com.iotplatform.dto.PDFUploadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;

@Slf4j
@Service
public class KnowledgeService {

    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private PDFProcessingService pdfProcessingService;

    @Value("${pdf.processing.base-url}")
    private String pdfProcessingUrl;

    private final Path uploadPath = Paths.get("uploads/knowledge");

    public KnowledgeService() {
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public KnowledgeDocument uploadDocument(MultipartFile file, String organizationId, String deviceId, String deviceName) throws IOException {
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        String filename = UUID.randomUUID().toString() + fileExtension;
        
        // Save file to disk
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Create document record with "processing" status
        KnowledgeDocument document = new KnowledgeDocument(
            originalFilename,
            fileExtension.substring(1).toLowerCase(),
            filePath.toString(),
            file.getSize(),
            organizationId
        );
        
        // Set device association if provided
        if (deviceId != null && !deviceId.trim().isEmpty()) {
            document.setDeviceId(deviceId);
            document.setDeviceName(deviceName);
        }
        
        // Set initial status as "processing"
        document.setStatus("processing");
        document.setVectorized(false);
        
        // Save to database immediately
        KnowledgeDocument savedDocument = knowledgeDocumentRepository.save(document);
        
        // Start background processing
        processDocumentAsync(savedDocument);
        
        return savedDocument;
    }
    
    public KnowledgeDocument uploadDocument(MultipartFile file, String organizationId) throws IOException {
        return uploadDocument(file, organizationId, null, null);
    }

    public List<KnowledgeDocument> getDocuments(String organizationId) {
        return knowledgeDocumentRepository.findByOrganizationIdOrderByUploadedAtDesc(organizationId);
    }
    
    public List<KnowledgeDocument> getAllDocuments(String organizationId) {
        return knowledgeDocumentRepository.findByOrganizationIdOrderByUploadedAtDesc(organizationId);
    }
    
    public List<KnowledgeDocument> getDocumentsByDevice(String deviceId, String organizationId) {
        if (deviceId == null || deviceId.trim().isEmpty()) {
            return getDocuments(organizationId);
        }
        return knowledgeDocumentRepository.findByOrganizationIdAndDeviceIdOrderByUploadedAtDesc(organizationId, deviceId);
    }
    
    public List<KnowledgeDocument> getGeneralDocuments(String organizationId) {
        return knowledgeDocumentRepository.findByOrganizationIdAndDeviceIdIsNullOrderByUploadedAtDesc(organizationId);
    }

    public void deleteDocument(String documentId, String organizationId) {
        KnowledgeDocument document = knowledgeDocumentRepository.findByIdAndOrganizationId(
            Long.parseLong(documentId), organizationId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        // Delete file from disk
        try {
            Files.deleteIfExists(Paths.get(document.getFilePath()));
        } catch (IOException e) {
            // Log error but continue with database deletion
            System.err.println("Failed to delete file: " + e.getMessage());
        }
        
        // Delete from database
        knowledgeDocumentRepository.delete(document);
    }

    public Resource downloadDocument(String documentId, String organizationId) throws IOException {
        KnowledgeDocument document = knowledgeDocumentRepository.findByIdAndOrganizationId(
            Long.parseLong(documentId), organizationId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        Path filePath = Paths.get(document.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());
        
        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("File not found or not readable");
        }
    }

    public Map<String, Object> getDocumentStatus(String documentId, String organizationId) {
        KnowledgeDocument document = knowledgeDocumentRepository.findByIdAndOrganizationId(
            Long.parseLong(documentId), organizationId)
            .orElseThrow(() -> new RuntimeException("Document not found"));
        
        Map<String, Object> status = new HashMap<>();
        status.put("status", document.getStatus());
        status.put("vectorized", document.getVectorized());
        
        if ("processing".equals(document.getStatus())) {
            // TODO: Implement actual progress tracking from PDF processing service
            status.put("progress", 0); // Will be updated by actual processing service
        }
        
        return status;
    }

    public List<Map<String, Object>> searchDocuments(String query, int limit, String organizationId) {
        List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByOrganizationIdAndVectorizedTrue(organizationId);
        
        // TODO: Implement actual vector search using the PDF processing service
        // This should use the vectorized embeddings to perform semantic search
        return documents.stream()
            .filter(doc -> doc.getName().toLowerCase().contains(query.toLowerCase()))
            .limit(limit)
            .map(doc -> {
                Map<String, Object> result = new HashMap<>();
                result.put("documentId", doc.getId().toString());
                result.put("documentName", doc.getName());
                result.put("excerpt", "Search functionality requires vector search implementation");
                result.put("relevance", 0.0); // Will be calculated by actual search service
                return result;
            })
            .collect(Collectors.toList());
    }

    public String processChatMessage(String message, List<String> documentIds, String organizationId) {
        // TODO: Implement actual AI chat processing using the PDF processing service
        // This should use the vectorized documents to provide context-aware responses
        
        return "AI chat functionality requires integration with a language model service. Please implement the actual AI processing logic.";
    }

    public List<Map<String, Object>> getChatHistory(String organizationId) {
        // TODO: Implement actual chat history retrieval from database
        // This should query a chat_history table or similar storage
        
        List<Map<String, Object>> history = new ArrayList<>();
        // Return empty history until database implementation is complete
        return history;
    }

    public Map<String, Object> getStatistics(String organizationId) {
        long totalDocuments = knowledgeDocumentRepository.countByOrganizationId(organizationId);
        long processedDocuments = knowledgeDocumentRepository.countByOrganizationIdAndVectorizedTrue(organizationId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDocuments", totalDocuments);
        stats.put("processedDocuments", processedDocuments);
        stats.put("totalSize", 0L); // TODO: Calculate actual total file size
        stats.put("lastUpdated", LocalDateTime.now());
        
        return stats;
    }

    @Async
    private void processDocumentAsync(KnowledgeDocument document) {
        try {
            log.info("🚀 Starting background processing for document: {}", document.getName());
            
            // Read the file and create a multipart file for processing
            Path filePath = Paths.get(document.getFilePath());
            org.springframework.core.io.Resource fileResource = new UrlResource(filePath.toUri());
            
            // Create a MultipartFile from the resource
            MultipartFile multipartFile = new MultipartFile() {
                @Override
                public String getName() {
                    return document.getName();
                }

                @Override
                public String getOriginalFilename() {
                    return document.getName();
                }

                @Override
                public String getContentType() {
                    return "application/pdf";
                }

                @Override
                public boolean isEmpty() {
                    return false;
                }

                @Override
                public long getSize() {
                    return document.getSize();
                }

                @Override
                public byte[] getBytes() throws IOException {
                    return Files.readAllBytes(filePath);
                }

                @Override
                public InputStream getInputStream() throws IOException {
                    return fileResource.getInputStream();
                }

                @Override
                public void transferTo(File dest) throws IOException, IllegalStateException {
                    Files.copy(filePath, dest.toPath(), StandardCopyOption.REPLACE_EXISTING);
                }
            };
            
            // Use the PDF processing service to upload and process
            PDFUploadResponse response = pdfProcessingService.uploadPDF(multipartFile, document.getOrganizationId());
            
            log.info("✅ PDF processing completed successfully for document: {}", document.getName());
            
            // Update document status
            document.setStatus("completed");
            document.setVectorized(true);
            document.setProcessedAt(LocalDateTime.now());
            
            // Save updated document
            knowledgeDocumentRepository.save(document);
            
            // Send notification to user
            sendProcessingCompleteNotification(document);
            
        } catch (Exception e) {
            log.error("❌ Error processing document: {}", document.getName(), e);
            
            // Update document status to error
            document.setStatus("error");
            knowledgeDocumentRepository.save(document);
            
            // Send error notification
            sendProcessingErrorNotification(document, e.getMessage());
        }
    }
    
    private void sendProcessingCompleteNotification(KnowledgeDocument document) {
        try {
            String title = "PDF Processing Complete";
            String message;
            
            if (document.getDeviceId() != null && document.getDeviceName() != null) {
                message = String.format(
                    "🎉 Your knowledge base for device '%s' is ready! The PDF '%s' has been processed and is now available for AI chat queries.",
                    document.getDeviceName(),
                    document.getName()
                );
            } else {
                message = String.format(
                    "🎉 Your PDF '%s' has been processed successfully and is now available in the knowledge base for AI queries.",
                    document.getName()
                );
            }
            
            // Create notification
            Notification notification = new Notification();
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(Notification.NotificationType.INFO);
            notification.setOrganizationId(document.getOrganizationId());
            notification.setCreatedAt(LocalDateTime.now());
            notification.setRead(false);
            
            // If device is associated, set the device info
            if (document.getDeviceId() != null) {
                notification.setDeviceId(document.getDeviceId());
            }
            
            // Save notification
            notificationService.createNotification(notification);
            
            log.info("📧 Processing complete notification sent for document: {}", document.getName());
            
        } catch (Exception e) {
            log.error("Failed to send processing complete notification for document: {}", document.getName(), e);
        }
    }
    
    private void sendProcessingErrorNotification(KnowledgeDocument document, String errorMessage) {
        try {
            String title = "PDF Processing Failed";
            String message = String.format(
                "❌ Failed to process PDF '%s'. Please try uploading again or contact support if the issue persists.",
                document.getName()
            );
            
            // Create notification
            Notification notification = new Notification();
            notification.setTitle(title);
            notification.setMessage(message);
            notification.setType(Notification.NotificationType.ERROR);
            notification.setOrganizationId(document.getOrganizationId());
            notification.setCreatedAt(LocalDateTime.now());
            
            // If device is associated, set the device info
            if (document.getDeviceId() != null) {
                notification.setDeviceId(document.getDeviceId());
            }
            
            // Save notification
            notificationService.createNotification(notification);
            
            log.info("📧 Processing error notification sent for document: {}", document.getName());
            
        } catch (Exception e) {
            log.error("Failed to send processing error notification for document: {}", document.getName(), e);
        }
    }
}
