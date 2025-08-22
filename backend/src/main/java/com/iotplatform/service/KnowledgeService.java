package com.iotplatform.service;

import java.io.IOException;
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
import com.iotplatform.repository.KnowledgeDocumentRepository;

@Service
public class KnowledgeService {

    @Autowired
    private KnowledgeDocumentRepository knowledgeDocumentRepository;

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
        
        // Create document record
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
        
        // Save to database
        KnowledgeDocument savedDocument = knowledgeDocumentRepository.save(document);
        
        // Simulate processing (in a real implementation, this would be async)
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
            status.put("progress", 50); // Mock progress
        }
        
        return status;
    }

    public List<Map<String, Object>> searchDocuments(String query, int limit, String organizationId) {
        List<KnowledgeDocument> documents = knowledgeDocumentRepository.findByOrganizationIdAndVectorizedTrue(organizationId);
        
        // Mock search implementation
        return documents.stream()
            .filter(doc -> doc.getName().toLowerCase().contains(query.toLowerCase()))
            .limit(limit)
            .map(doc -> {
                Map<String, Object> result = new HashMap<>();
                result.put("documentId", doc.getId().toString());
                result.put("documentName", doc.getName());
                result.put("excerpt", "Mock excerpt from " + doc.getName() + " containing '" + query + "'");
                result.put("relevance", Math.random() * 0.3 + 0.7); // Mock relevance score
                return result;
            })
            .collect(Collectors.toList());
    }

    public String processChatMessage(String message, List<String> documentIds, String organizationId) {
        // Mock AI response based on message content
        String lowerMessage = message.toLowerCase();
        
        if (lowerMessage.contains("temperature") || lowerMessage.contains("sensor")) {
            return "Based on the temperature sensor documentation in your knowledge base, I can help you with calibration procedures, operating ranges, and troubleshooting steps. What specific aspect would you like to know more about?";
        } else if (lowerMessage.contains("maintenance") || lowerMessage.contains("hvac")) {
            return "I found relevant maintenance information in your HVAC documentation. The guides cover routine maintenance procedures, troubleshooting steps, and preventive measures. Would you like specific guidance on any particular maintenance task?";
        } else if (lowerMessage.contains("installation") || lowerMessage.contains("setup")) {
            return "The installation manuals in your knowledge base provide comprehensive setup instructions. They cover hardware installation, network configuration, and initial calibration. Which part of the installation process do you need help with?";
        } else {
            return "I understand you're asking about \"" + message + "\". I can search through your uploaded documents to find relevant information. You have " + 
                   knowledgeDocumentRepository.countByOrganizationIdAndVectorizedTrue(organizationId) + 
                   " documents indexed and ready for AI search. Would you like me to search for specific information or help you with a particular topic?";
        }
    }

    public List<Map<String, Object>> getChatHistory(String organizationId) {
        // Mock chat history
        List<Map<String, Object>> history = new ArrayList<>();
        
        Map<String, Object> message1 = new HashMap<>();
        message1.put("id", "1");
        message1.put("type", "assistant");
        message1.put("content", "Hello! I'm your AI assistant for the IoT knowledge base. How can I help you today?");
        message1.put("timestamp", LocalDateTime.now().minusMinutes(5));
        history.add(message1);
        
        return history;
    }

    public Map<String, Object> getStatistics(String organizationId) {
        long totalDocuments = knowledgeDocumentRepository.countByOrganizationId(organizationId);
        long processedDocuments = knowledgeDocumentRepository.countByOrganizationIdAndVectorizedTrue(organizationId);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDocuments", totalDocuments);
        stats.put("processedDocuments", processedDocuments);
        stats.put("totalSize", totalDocuments * 1024 * 1024); // Mock size
        stats.put("lastUpdated", LocalDateTime.now());
        
        return stats;
    }

    private void processDocumentAsync(KnowledgeDocument document) {
        // Process with external PDF API
        new Thread(() -> {
            try {
                // Upload to external PDF processing API
                RestTemplate restTemplate = new RestTemplate();
                
                // Create multipart request
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                
                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                
                // Read the file and create a resource
                Path filePath = Paths.get(document.getFilePath());
                org.springframework.core.io.Resource fileResource = new UrlResource(filePath.toUri());
                
                body.add("file", fileResource);
                
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
                
                // Upload to external API using correct endpoint
                String uploadUrl = pdfProcessingUrl + "/upload-pdf"; // Fixed endpoint
                System.out.println("Uploading to MinerU service: " + uploadUrl);
                
                ResponseEntity<Map> response = restTemplate.postForEntity(uploadUrl, requestEntity, Map.class);
                
                if (response.getStatusCode().is2xxSuccessful()) {
                    Map<String, Object> result = response.getBody();
                    System.out.println("PDF uploaded to MinerU successfully: " + result);
                    
                    // Update document status
                    document.setStatus("completed");
                    document.setVectorized(true);
                    document.setProcessedAt(LocalDateTime.now());
                    
                    knowledgeDocumentRepository.save(document);
                } else {
                    throw new RuntimeException("MinerU API upload failed: " + response.getStatusCode());
                }
                
            } catch (Exception e) {
                System.err.println("Error processing document with MinerU API: " + e.getMessage());
                e.printStackTrace();
                document.setStatus("error");
                knowledgeDocumentRepository.save(document);
            }
        }).start();
    }
}
