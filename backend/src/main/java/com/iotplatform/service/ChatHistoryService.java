package com.iotplatform.service;

import com.iotplatform.model.ChatHistory;
import com.iotplatform.repository.ChatHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing chat history and user feedback
 * Handles storing chat messages, user feedback, and retrieving chat history
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatHistoryService {
    
    private final ChatHistoryRepository chatHistoryRepository;
    
    /**
     * Save a chat message to history
     */
    @Transactional
    public ChatHistory saveMessage(ChatHistory chatHistory) {
        try {
            log.info("Saving chat message: user={}, type={}, device={}", 
                    chatHistory.getUserId(), chatHistory.getMessageType(), chatHistory.getDeviceId());
            
            if (chatHistory.getId() == null) {
                chatHistory.setId(UUID.randomUUID().toString());
            }
            
            if (chatHistory.getTimestamp() == null) {
                chatHistory.setTimestamp(LocalDateTime.now());
            }
            
            ChatHistory saved = chatHistoryRepository.save(chatHistory);
            
            log.info("✅ Chat message saved successfully: id={}, user={}, type={}", 
                    saved.getId(), saved.getUserId(), saved.getMessageType());
            
            return saved;
            
        } catch (Exception e) {
            log.error("❌ Failed to save chat message: user={}, type={}, error={}", 
                    chatHistory.getUserId(), chatHistory.getMessageType(), e.getMessage(), e);
            throw new RuntimeException("Failed to save chat message", e);
        }
    }
    
    /**
     * Save user message
     */
    @Transactional
    public ChatHistory saveUserMessage(String userId, String deviceId, String organizationId, 
                                     String content, String sessionId) {
        ChatHistory userMessage = ChatHistory.builder()
                .userId(userId)
                .deviceId(deviceId)
                .organizationId(organizationId)
                .messageType(ChatHistory.MessageType.USER)
                .content(content)
                .sessionId(sessionId)
                .timestamp(LocalDateTime.now())
                .build();
        
        return saveMessage(userMessage);
    }
    
    /**
     * Save assistant message
     */
    @Transactional
    public ChatHistory saveAssistantMessage(String userId, String deviceId, String organizationId, 
                                          String content, String sessionId, ChatHistory.QueryType queryType,
                                          String pdfName, String chunksUsed, String processingTime,
                                          String sqlQuery, String databaseResults, Integer rowCount) {
        ChatHistory assistantMessage = ChatHistory.builder()
                .userId(userId)
                .deviceId(deviceId)
                .organizationId(organizationId)
                .messageType(ChatHistory.MessageType.ASSISTANT)
                .content(content)
                .sessionId(sessionId)
                .queryType(queryType)
                .pdfName(pdfName)
                .chunksUsed(chunksUsed)
                .processingTime(processingTime)
                .sqlQuery(sqlQuery)
                .databaseResults(databaseResults)
                .rowCount(rowCount)
                .timestamp(LocalDateTime.now())
                .build();
        
        return saveMessage(assistantMessage);
    }
    
    /**
     * Add user feedback to a message
     */
    @Transactional
    public void addUserFeedback(String messageId, ChatHistory.UserFeedback feedback) {
        try {
            log.info("Adding user feedback: messageId={}, feedback={}", messageId, feedback);
            
            Optional<ChatHistory> messageOpt = chatHistoryRepository.findById(messageId);
            if (messageOpt.isPresent()) {
                ChatHistory message = messageOpt.get();
                message.addFeedback(feedback);
                chatHistoryRepository.save(message);
                
                log.info("✅ User feedback added successfully: messageId={}, feedback={}", messageId, feedback);
            } else {
                log.warn("⚠️ Message not found for feedback: messageId={}", messageId);
                throw new RuntimeException("Message not found: " + messageId);
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to add user feedback: messageId={}, feedback={}, error={}", 
                    messageId, feedback, e.getMessage(), e);
            throw new RuntimeException("Failed to add user feedback", e);
        }
    }
    
    /**
     * Regenerate a message (create a new assistant message based on parent)
     */
    @Transactional
    public ChatHistory regenerateMessage(String parentMessageId, String newContent, 
                                       String newChunksUsed, String newProcessingTime) {
        try {
            log.info("Regenerating message: parentMessageId={}", parentMessageId);
            
            Optional<ChatHistory> parentOpt = chatHistoryRepository.findById(parentMessageId);
            if (parentOpt.isPresent()) {
                ChatHistory parent = parentOpt.get();
                
                ChatHistory regeneratedMessage = ChatHistory.builder()
                        .userId(parent.getUserId())
                        .deviceId(parent.getDeviceId())
                        .organizationId(parent.getOrganizationId())
                        .messageType(ChatHistory.MessageType.ASSISTANT)
                        .content(newContent)
                        .sessionId(parent.getSessionId())
                        .queryType(parent.getQueryType())
                        .pdfName(parent.getPdfName())
                        .chunksUsed(newChunksUsed)
                        .processingTime(newProcessingTime)
                        .sqlQuery(parent.getSqlQuery())
                        .databaseResults(parent.getDatabaseResults())
                        .rowCount(parent.getRowCount())
                        .parentMessageId(parentMessageId)
                        .isRegenerated(true)
                        .timestamp(LocalDateTime.now())
                        .build();
                
                ChatHistory saved = saveMessage(regeneratedMessage);
                
                log.info("✅ Message regenerated successfully: parentId={}, newId={}", 
                        parentMessageId, saved.getId());
                
                return saved;
            } else {
                log.warn("⚠️ Parent message not found for regeneration: parentMessageId={}", parentMessageId);
                throw new RuntimeException("Parent message not found: " + parentMessageId);
            }
            
        } catch (Exception e) {
            log.error("❌ Failed to regenerate message: parentMessageId={}, error={}", 
                    parentMessageId, e.getMessage(), e);
            throw new RuntimeException("Failed to regenerate message", e);
        }
    }
    
    /**
     * Get chat history for a user
     */
    public Page<ChatHistory> getUserChatHistory(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatHistoryRepository.findByUserIdOrderByTimestampDesc(userId, pageable);
    }
    
    /**
     * Get chat history for a device
     */
    public Page<ChatHistory> getDeviceChatHistory(String deviceId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatHistoryRepository.findByDeviceIdOrderByTimestampDesc(deviceId, pageable);
    }
    
    /**
     * Get chat history for an organization
     */
    public Page<ChatHistory> getOrganizationChatHistory(String organizationId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatHistoryRepository.findByOrganizationIdOrderByTimestampDesc(organizationId, pageable);
    }
    
    /**
     * Get recent chat history for a user (last N messages)
     */
    public List<ChatHistory> getRecentUserChatHistory(String userId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return chatHistoryRepository.findRecentByUserId(userId, pageable);
    }
    
    /**
     * Get recent chat history for a device (last N messages)
     */
    public List<ChatHistory> getRecentDeviceChatHistory(String deviceId, int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return chatHistoryRepository.findRecentByDeviceId(deviceId, pageable);
    }
    
    /**
     * Get chat history by session ID
     */
    public List<ChatHistory> getChatHistoryBySession(String sessionId) {
        return chatHistoryRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
    
    /**
     * Get messages with feedback
     */
    public Page<ChatHistory> getMessagesWithFeedback(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatHistoryRepository.findMessagesWithFeedback(pageable);
    }
    
    /**
     * Get messages with specific feedback type
     */
    public Page<ChatHistory> getMessagesByFeedback(ChatHistory.UserFeedback feedback, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return chatHistoryRepository.findByUserFeedback(feedback, pageable);
    }
    
    /**
     * Get messages with specific feedback type for a user
     */
    public List<ChatHistory> getUserMessagesByFeedback(String userId, ChatHistory.UserFeedback feedback) {
        return chatHistoryRepository.findByUserIdAndUserFeedback(userId, feedback);
    }
    
    /**
     * Get messages with specific feedback type for a device
     */
    public List<ChatHistory> getDeviceMessagesByFeedback(String deviceId, ChatHistory.UserFeedback feedback) {
        return chatHistoryRepository.findByDeviceIdAndUserFeedback(deviceId, feedback);
    }
    
    /**
     * Get messages with specific feedback type for an organization
     */
    public List<ChatHistory> getOrganizationMessagesByFeedback(String organizationId, ChatHistory.UserFeedback feedback) {
        return chatHistoryRepository.findByOrganizationIdAndUserFeedback(organizationId, feedback);
    }
    
    /**
     * Get feedback statistics for a user
     */
    public FeedbackStats getUserFeedbackStats(String userId) {
        long totalMessages = chatHistoryRepository.countMessagesWithFeedbackByUserId(userId);
        long likes = chatHistoryRepository.countMessagesByUserIdAndFeedback(userId, ChatHistory.UserFeedback.LIKE);
        long dislikes = chatHistoryRepository.countMessagesByUserIdAndFeedback(userId, ChatHistory.UserFeedback.DISLIKE);
        long regenerates = chatHistoryRepository.countMessagesByUserIdAndFeedback(userId, ChatHistory.UserFeedback.REGENERATE);
        
        return new FeedbackStats(totalMessages, likes, dislikes, regenerates);
    }
    
    /**
     * Get feedback statistics for a device
     */
    public FeedbackStats getDeviceFeedbackStats(String deviceId) {
        long likes = chatHistoryRepository.countMessagesByDeviceIdAndFeedback(deviceId, ChatHistory.UserFeedback.LIKE);
        long dislikes = chatHistoryRepository.countMessagesByDeviceIdAndFeedback(deviceId, ChatHistory.UserFeedback.DISLIKE);
        long regenerates = chatHistoryRepository.countMessagesByDeviceIdAndFeedback(deviceId, ChatHistory.UserFeedback.REGENERATE);
        long totalMessages = likes + dislikes + regenerates;
        
        return new FeedbackStats(totalMessages, likes, dislikes, regenerates);
    }
    
    /**
     * Get feedback statistics for an organization
     */
    public FeedbackStats getOrganizationFeedbackStats(String organizationId) {
        long likes = chatHistoryRepository.countMessagesByOrganizationIdAndFeedback(organizationId, ChatHistory.UserFeedback.LIKE);
        long dislikes = chatHistoryRepository.countMessagesByOrganizationIdAndFeedback(organizationId, ChatHistory.UserFeedback.DISLIKE);
        long regenerates = chatHistoryRepository.countMessagesByOrganizationIdAndFeedback(organizationId, ChatHistory.UserFeedback.REGENERATE);
        long totalMessages = likes + dislikes + regenerates;
        
        return new FeedbackStats(totalMessages, likes, dislikes, regenerates);
    }
    
    /**
     * Get messages within a date range
     */
    public List<ChatHistory> getMessagesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return chatHistoryRepository.findByTimestampBetween(startDate, endDate);
    }
    
    /**
     * Get messages within a date range for a user
     */
    public List<ChatHistory> getUserMessagesByDateRange(String userId, LocalDateTime startDate, LocalDateTime endDate) {
        return chatHistoryRepository.findByUserIdAndTimestampBetween(userId, startDate, endDate);
    }
    
    /**
     * Get messages within a date range for a device
     */
    public List<ChatHistory> getDeviceMessagesByDateRange(String deviceId, LocalDateTime startDate, LocalDateTime endDate) {
        return chatHistoryRepository.findByDeviceIdAndTimestampBetween(deviceId, startDate, endDate);
    }
    
    /**
     * Get messages within a date range for an organization
     */
    public List<ChatHistory> getOrganizationMessagesByDateRange(String organizationId, LocalDateTime startDate, LocalDateTime endDate) {
        return chatHistoryRepository.findByOrganizationIdAndTimestampBetween(organizationId, startDate, endDate);
    }
    
    /**
     * Soft delete messages by user ID
     */
    @Transactional
    public void deleteUserMessages(String userId) {
        try {
            log.info("Soft deleting messages for user: {}", userId);
            chatHistoryRepository.softDeleteByUserId(userId);
            log.info("✅ Messages soft deleted for user: {}", userId);
        } catch (Exception e) {
            log.error("❌ Failed to soft delete messages for user: {}, error={}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete user messages", e);
        }
    }
    
    /**
     * Soft delete messages by device ID
     */
    @Transactional
    public void deleteDeviceMessages(String deviceId) {
        try {
            log.info("Soft deleting messages for device: {}", deviceId);
            chatHistoryRepository.softDeleteByDeviceId(deviceId);
            log.info("✅ Messages soft deleted for device: {}", deviceId);
        } catch (Exception e) {
            log.error("❌ Failed to soft delete messages for device: {}, error={}", deviceId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete device messages", e);
        }
    }
    
    /**
     * Soft delete messages by organization ID
     */
    @Transactional
    public void deleteOrganizationMessages(String organizationId) {
        try {
            log.info("Soft deleting messages for organization: {}", organizationId);
            chatHistoryRepository.softDeleteByOrganizationId(organizationId);
            log.info("✅ Messages soft deleted for organization: {}", organizationId);
        } catch (Exception e) {
            log.error("❌ Failed to soft delete messages for organization: {}, error={}", organizationId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete organization messages", e);
        }
    }
    
    /**
     * Feedback statistics record
     */
    public record FeedbackStats(long totalMessages, long likes, long dislikes, long regenerates) {
        public double getLikePercentage() {
            return totalMessages > 0 ? (double) likes / totalMessages * 100 : 0;
        }
        
        public double getDislikePercentage() {
            return totalMessages > 0 ? (double) dislikes / totalMessages * 100 : 0;
        }
        
        public double getRegeneratePercentage() {
            return totalMessages > 0 ? (double) regenerates / totalMessages * 100 : 0;
        }
    }
}
