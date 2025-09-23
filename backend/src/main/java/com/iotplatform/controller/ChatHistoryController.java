package com.iotplatform.controller;

import com.iotplatform.dto.ChatFeedbackRequest;
import com.iotplatform.dto.ChatHistoryResponse;
import com.iotplatform.dto.ChatMessageRequest;
import com.iotplatform.model.ChatHistory;
import com.iotplatform.service.ChatHistoryService;
import com.iotplatform.service.ChatHistoryService.FeedbackStats;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST Controller for Chat History and User Feedback
 * Handles chat message storage, user feedback, and chat history retrieval
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@RestController
@RequestMapping("/api/chat-history")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat History", description = "APIs for managing chat history and user feedback")
public class ChatHistoryController {
    
    private final ChatHistoryService chatHistoryService;
    
    /**
     * Save a chat message to history
     */
    @PostMapping("/messages")
    @Operation(summary = "Save chat message", description = "Save a chat message to history")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Message saved successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<ChatHistoryResponse> saveMessage(
            @Valid @RequestBody ChatMessageRequest request,
            Authentication authentication) {
        try {
            log.info("Saving chat message: user={}, type={}, device={}", 
                    request.getUserId(), request.getMessageType(), request.getDeviceId());
            
            ChatHistory.MessageType messageType = request.getMessageType() != null ? 
                    request.getMessageType() : ChatHistory.MessageType.USER;
            
            ChatHistory savedMessage;
            
            if (messageType == ChatHistory.MessageType.USER) {
                savedMessage = chatHistoryService.saveUserMessage(
                        request.getUserId(),
                        request.getDeviceId(),
                        request.getOrganizationId(),
                        request.getContent(),
                        request.getSessionId()
                );
            } else {
                savedMessage = chatHistoryService.saveAssistantMessage(
                        request.getUserId(),
                        request.getDeviceId(),
                        request.getOrganizationId(),
                        request.getContent(),
                        request.getSessionId(),
                        request.getQueryType(),
                        request.getPdfName(),
                        request.getChunksUsed(),
                        request.getProcessingTime(),
                        request.getSqlQuery(),
                        request.getDatabaseResults(),
                        request.getRowCount()
                );
            }
            
            ChatHistoryResponse response = convertToResponse(savedMessage);
            
            log.info("✅ Chat message saved successfully: id={}", savedMessage.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to save chat message: error={}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Add user feedback to a message
     */
    @PostMapping("/feedback")
    @Operation(summary = "Add user feedback", description = "Add user feedback (like, dislike, regenerate) to a chat message")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Feedback added successfully"),
        @ApiResponse(responseCode = "400", description = "Invalid request data"),
        @ApiResponse(responseCode = "404", description = "Message not found"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<String> addFeedback(
            @Valid @RequestBody ChatFeedbackRequest request,
            Authentication authentication) {
        try {
            log.info("Adding user feedback: messageId={}, feedback={}", 
                    request.getMessageId(), request.getFeedback());
            
            if (request.getFeedback() == ChatHistory.UserFeedback.REGENERATE) {
                // Handle regenerate functionality
                if (request.getNewContent() == null) {
                    return ResponseEntity.badRequest().body("New content is required for regenerate feedback");
                }
                
                ChatHistory regeneratedMessage = chatHistoryService.regenerateMessage(
                        request.getMessageId(),
                        request.getNewContent(),
                        request.getNewChunksUsed(),
                        request.getNewProcessingTime()
                );
                
                log.info("✅ Message regenerated successfully: parentId={}, newId={}", 
                        request.getMessageId(), regeneratedMessage.getId());
                
                return ResponseEntity.ok("Message regenerated successfully");
            } else {
                // Handle like/dislike feedback
                try {
                    chatHistoryService.addUserFeedback(request.getMessageId(), request.getFeedback());
                    
                    log.info("✅ User feedback added successfully: messageId={}, feedback={}", 
                            request.getMessageId(), request.getFeedback());
                    
                    return ResponseEntity.ok("Feedback added successfully");
                } catch (IllegalArgumentException e) {
                    log.warn("⚠️ Invalid feedback request: messageId={}, feedback={}, error={}", 
                            request.getMessageId(), request.getFeedback(), e.getMessage());
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to add user feedback: messageId={}, feedback={}, error={}", 
                    request.getMessageId(), request.getFeedback(), e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to add feedback");
        }
    }
    
    /**
     * Get chat history for a user
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user chat history", description = "Get paginated chat history for a specific user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Chat history retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<ChatHistoryResponse>> getUserChatHistory(
            @PathVariable String userId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        try {
            log.info("Getting chat history for user: {}, page={}, size={}", userId, page, size);
            
            Page<ChatHistory> chatHistory = chatHistoryService.getUserChatHistory(userId, page, size);
            Page<ChatHistoryResponse> response = chatHistory.map(this::convertToResponse);
            
            log.info("✅ Chat history retrieved for user: {}, totalElements={}", userId, chatHistory.getTotalElements());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get user chat history: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get chat history for a device
     */
    @GetMapping("/device/{deviceId}")
    @Operation(summary = "Get device chat history", description = "Get paginated chat history for a specific device")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Chat history retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<ChatHistoryResponse>> getDeviceChatHistory(
            @PathVariable String deviceId,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        try {
            log.info("Getting chat history for device: {}, page={}, size={}", deviceId, page, size);
            
            Page<ChatHistory> chatHistory = chatHistoryService.getDeviceChatHistory(deviceId, page, size);
            Page<ChatHistoryResponse> response = chatHistory.map(this::convertToResponse);
            
            log.info("✅ Chat history retrieved for device: {}, totalElements={}", deviceId, chatHistory.getTotalElements());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get device chat history: deviceId={}, error={}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get recent chat history for a user
     */
    @GetMapping("/user/{userId}/recent")
    @Operation(summary = "Get recent user chat history", description = "Get recent chat history for a specific user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Recent chat history retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<ChatHistoryResponse>> getRecentUserChatHistory(
            @PathVariable String userId,
            @Parameter(description = "Number of recent messages to retrieve") @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {
        try {
            log.info("Getting recent chat history for user: {}, limit={}", userId, limit);
            
            List<ChatHistory> chatHistory = chatHistoryService.getRecentUserChatHistory(userId, limit);
            List<ChatHistoryResponse> response = chatHistory.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
            
            log.info("✅ Recent chat history retrieved for user: {}, count={}", userId, chatHistory.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get recent user chat history: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get recent chat history for a device
     */
    @GetMapping("/device/{deviceId}/recent")
    @Operation(summary = "Get recent device chat history", description = "Get recent chat history for a specific device")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Recent chat history retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<ChatHistoryResponse>> getRecentDeviceChatHistory(
            @PathVariable String deviceId,
            @Parameter(description = "Number of recent messages to retrieve") @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {
        try {
            log.info("Getting recent chat history for device: {}, limit={}", deviceId, limit);
            
            List<ChatHistory> chatHistory = chatHistoryService.getRecentDeviceChatHistory(deviceId, limit);
            List<ChatHistoryResponse> response = chatHistory.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
            
            log.info("✅ Recent chat history retrieved for device: {}, count={}", deviceId, chatHistory.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get recent device chat history: deviceId={}, error={}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get chat history by session ID
     */
    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Get chat history by session", description = "Get chat history for a specific session")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Session chat history retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<ChatHistoryResponse>> getChatHistoryBySession(
            @PathVariable String sessionId,
            Authentication authentication) {
        try {
            log.info("Getting chat history for session: {}", sessionId);
            
            List<ChatHistory> chatHistory = chatHistoryService.getChatHistoryBySession(sessionId);
            List<ChatHistoryResponse> response = chatHistory.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
            
            log.info("✅ Session chat history retrieved: sessionId={}, count={}", sessionId, chatHistory.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get session chat history: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get feedback statistics for a user
     */
    @GetMapping("/user/{userId}/feedback-stats")
    @Operation(summary = "Get user feedback statistics", description = "Get feedback statistics for a specific user")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Feedback statistics retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<FeedbackStats> getUserFeedbackStats(
            @PathVariable String userId,
            Authentication authentication) {
        try {
            log.info("Getting feedback statistics for user: {}", userId);
            
            FeedbackStats stats = chatHistoryService.getUserFeedbackStats(userId);
            
            log.info("✅ Feedback statistics retrieved for user: {}, total={}, likes={}, dislikes={}, regenerates={}", 
                    userId, stats.totalMessages(), stats.likes(), stats.dislikes(), stats.regenerates());
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("❌ Failed to get user feedback statistics: userId={}, error={}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get feedback statistics for a device
     */
    @GetMapping("/device/{deviceId}/feedback-stats")
    @Operation(summary = "Get device feedback statistics", description = "Get feedback statistics for a specific device")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Feedback statistics retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<FeedbackStats> getDeviceFeedbackStats(
            @PathVariable String deviceId,
            Authentication authentication) {
        try {
            log.info("Getting feedback statistics for device: {}", deviceId);
            
            FeedbackStats stats = chatHistoryService.getDeviceFeedbackStats(deviceId);
            
            log.info("✅ Feedback statistics retrieved for device: {}, total={}, likes={}, dislikes={}, regenerates={}", 
                    deviceId, stats.totalMessages(), stats.likes(), stats.dislikes(), stats.regenerates());
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("❌ Failed to get device feedback statistics: deviceId={}, error={}", deviceId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get messages with feedback
     */
    @GetMapping("/feedback")
    @Operation(summary = "Get messages with feedback", description = "Get paginated list of messages that have user feedback")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Messages with feedback retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<ChatHistoryResponse>> getMessagesWithFeedback(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        try {
            log.info("Getting messages with feedback: page={}, size={}", page, size);
            
            Page<ChatHistory> chatHistory = chatHistoryService.getMessagesWithFeedback(page, size);
            Page<ChatHistoryResponse> response = chatHistory.map(this::convertToResponse);
            
            log.info("✅ Messages with feedback retrieved: totalElements={}", chatHistory.getTotalElements());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get messages with feedback: error={}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get messages by feedback type
     */
    @GetMapping("/feedback/{feedbackType}")
    @Operation(summary = "Get messages by feedback type", description = "Get paginated list of messages with specific feedback type")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Messages by feedback type retrieved successfully"),
        @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<Page<ChatHistoryResponse>> getMessagesByFeedback(
            @PathVariable ChatHistory.UserFeedback feedbackType,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        try {
            log.info("Getting messages by feedback type: feedbackType={}, page={}, size={}", feedbackType, page, size);
            
            Page<ChatHistory> chatHistory = chatHistoryService.getMessagesByFeedback(feedbackType, page, size);
            Page<ChatHistoryResponse> response = chatHistory.map(this::convertToResponse);
            
            log.info("✅ Messages by feedback type retrieved: feedbackType={}, totalElements={}", 
                    feedbackType, chatHistory.getTotalElements());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("❌ Failed to get messages by feedback type: feedbackType={}, error={}", 
                    feedbackType, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Convert ChatHistory entity to response DTO
     */
    private ChatHistoryResponse convertToResponse(ChatHistory chatHistory) {
        return ChatHistoryResponse.builder()
                .id(chatHistory.getId())
                .userId(chatHistory.getUserId())
                .deviceId(chatHistory.getDeviceId())
                .organizationId(chatHistory.getOrganizationId())
                .messageType(chatHistory.getMessageType())
                .content(chatHistory.getContent())
                .timestamp(chatHistory.getTimestamp())
                .queryType(chatHistory.getQueryType())
                .pdfName(chatHistory.getPdfName())
                .chunksUsed(chatHistory.getChunksUsed())
                .processingTime(chatHistory.getProcessingTime())
                .sqlQuery(chatHistory.getSqlQuery())
                .databaseResults(chatHistory.getDatabaseResults())
                .rowCount(chatHistory.getRowCount())
                .userFeedback(chatHistory.getUserFeedback())
                .feedbackTimestamp(chatHistory.getFeedbackTimestamp())
                .sessionId(chatHistory.getSessionId())
                .parentMessageId(chatHistory.getParentMessageId())
                .isRegenerated(chatHistory.getIsRegenerated())
                .createdAt(chatHistory.getCreatedAt())
                .updatedAt(chatHistory.getUpdatedAt())
                .build();
    }
}
