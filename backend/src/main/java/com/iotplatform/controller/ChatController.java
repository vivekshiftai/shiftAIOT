package com.iotplatform.controller;

import com.iotplatform.dto.PDFQueryRequest;
import com.iotplatform.dto.PDFQueryResponse;
import com.iotplatform.model.PDFQuery;
import com.iotplatform.security.CustomUserDetails;
import com.iotplatform.service.PDFProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST Controller for chat and PDF query operations.
 * Provides endpoints for querying PDFs and managing chat history.
 * 
 * Features:
 * - PDF document querying with device context
 * - Chat history management and retrieval
 * - User and device-specific conversations
 * - Comprehensive error handling and audit trails
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Slf4j
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final PDFProcessingService pdfProcessingService;

    /**
     * Query a PDF document with optional device context.
     */
            @PostMapping("/query")
    public ResponseEntity<?> queryPDF(
                        @Valid @RequestBody PDFQueryRequest request,
            
            @RequestParam(required = false) String deviceId,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            // Use String ID directly (UUID) - no conversion needed
            String userId = userDetails.getUser().getId();
            String organizationId = userDetails.getUser().getOrganizationId();
            
            log.info("PDF query request received from user: {} for PDF: {} (device: {})", 
                userId, request.getPdfName(), deviceId);
            
            PDFQueryResponse response;
            
            // Use device context if provided
            if (deviceId != null && !deviceId.trim().isEmpty()) {
                response = pdfProcessingService.queryPDFWithDeviceContext(
                    request, userId, deviceId.trim(), organizationId);
            } else {
                response = pdfProcessingService.queryPDF(request, userId, organizationId);
            }
            
            log.info("PDF query completed successfully for user: {} PDF: {}", userId, request.getPdfName());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("PDF query failed for user: {} - {}", userDetails.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "PDF query failed: " + e.getMessage()));
        }
    }

    /**
     * Get chat history for the current user.
     */
            @GetMapping("/history")
    public ResponseEntity<?> getChatHistory(
                        @RequestParam(defaultValue = "50") int limit,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            // Use String ID directly (UUID) - no conversion needed
            String userId = userDetails.getUser().getId();
            String organizationId = userDetails.getUser().getOrganizationId();
            
            log.debug("Fetching chat history for user: {} (limit: {})", userId, limit);
            
            List<PDFQuery> queries = pdfProcessingService.getChatHistory(userId, organizationId, limit);
            List<Map<String, Object>> messages = convertQueriesToMessages(queries);
            
            return ResponseEntity.ok(Map.of(
                "messages", messages,
                "total", messages.size()
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch chat history for user: {} - {}", userDetails.getUsername(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch chat history: " + e.getMessage()));
        }
    }

    /**
     * Get chat history for a specific device.
     */
            @GetMapping("/history/device/{deviceId}")
    public ResponseEntity<?> getDeviceChatHistory(
                        @PathVariable String deviceId,
            
                        @RequestParam(defaultValue = "50") int limit,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            // Use String ID directly (UUID) - no conversion needed
            String userId = userDetails.getUser().getId();
            String organizationId = userDetails.getUser().getOrganizationId();
            
            log.debug("Fetching device chat history for user: {} device: {} (limit: {})", 
                userId, deviceId, limit);
            
            List<PDFQuery> queries = pdfProcessingService.getDeviceChatHistory(
                userId, deviceId, organizationId, limit);
            List<Map<String, Object>> messages = convertQueriesToMessages(queries);
            
            return ResponseEntity.ok(Map.of(
                "messages", messages,
                "deviceId", deviceId,
                "total", messages.size()
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch device chat history for user: {} device: {} - {}", 
                userDetails.getUsername(), deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch device chat history: " + e.getMessage()));
        }
    }

    /**
     * Get chat history for a specific PDF document.
     */
            @GetMapping("/history/pdf/{pdfName}")
    public ResponseEntity<?> getPDFChatHistory(
                        @PathVariable String pdfName,
            
                        @RequestParam(defaultValue = "50") int limit,
            
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        
        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        try {
            String organizationId = userDetails.getUser().getOrganizationId();
            
            log.debug("Fetching PDF chat history for PDF: {} in organization: {} (limit: {})", 
                pdfName, organizationId, limit);
            
            List<PDFQuery> queries = pdfProcessingService.getPDFChatHistory(pdfName, organizationId, limit);
            List<Map<String, Object>> messages = convertQueriesToMessages(queries);
            
            return ResponseEntity.ok(Map.of(
                "messages", messages,
                "pdfName", pdfName,
                "total", messages.size()
            ));
            
        } catch (Exception e) {
            log.error("Failed to fetch PDF chat history for PDF: {} - {}", pdfName, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch PDF chat history: " + e.getMessage()));
        }
    }

    /**
     * Convert PDFQuery entities to chat message format for frontend.
     */
    private List<Map<String, Object>> convertQueriesToMessages(List<PDFQuery> queries) {
        List<Map<String, Object>> messages = new ArrayList<>();
        
        for (PDFQuery query : queries) {
            // Add user message
            Map<String, Object> userMessage = new HashMap<>();
            userMessage.put("id", "user_" + query.getId());
            userMessage.put("type", "user");
            userMessage.put("content", query.getUserQuery());
            userMessage.put("timestamp", query.getCreatedAt());
            userMessage.put("pdfName", query.getPdfDocument() != null ? query.getPdfDocument().getName() : null);
            userMessage.put("deviceId", query.getDeviceId());
            messages.add(userMessage);
            
            // Add assistant response if available
            if (query.getAiResponse() != null && !query.getAiResponse().trim().isEmpty()) {
                Map<String, Object> assistantMessage = new HashMap<>();
                assistantMessage.put("id", "assistant_" + query.getId());
                assistantMessage.put("type", "assistant");
                assistantMessage.put("content", query.getAiResponse());
                assistantMessage.put("timestamp", query.getCreatedAt());
                assistantMessage.put("pdfName", query.getPdfDocument() != null ? query.getPdfDocument().getName() : null);
                assistantMessage.put("deviceId", query.getDeviceId());
                assistantMessage.put("processingTime", query.getProcessingTime());
                assistantMessage.put("chunksUsed", query.getChunksUsed() != null ? 
                    List.of(query.getChunksUsed().split(",")) : List.of());
                assistantMessage.put("status", query.getStatus().toString());
                
                if (query.getStatus() == PDFQuery.QueryStatus.FAILED && query.getErrorMessage() != null) {
                    assistantMessage.put("error", query.getErrorMessage());
                }
                
                messages.add(assistantMessage);
            }
        }
        
        return messages;
    }
}
