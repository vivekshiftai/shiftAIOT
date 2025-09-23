package com.iotplatform.repository;

import com.iotplatform.model.ChatHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for ChatHistory entity
 * Provides methods to interact with chat history data
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Repository
public interface ChatHistoryRepository extends JpaRepository<ChatHistory, String> {
    
    /**
     * Find chat history by user ID with pagination
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userId = :userId AND ch.deleted = false ORDER BY ch.timestamp DESC")
    Page<ChatHistory> findByUserIdOrderByTimestampDesc(@Param("userId") String userId, Pageable pageable);
    
    /**
     * Find chat history by device ID with pagination
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.deviceId = :deviceId AND ch.deleted = false ORDER BY ch.timestamp DESC")
    Page<ChatHistory> findByDeviceIdOrderByTimestampDesc(@Param("deviceId") String deviceId, Pageable pageable);
    
    /**
     * Find chat history by organization ID with pagination
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.organizationId = :organizationId AND ch.deleted = false ORDER BY ch.timestamp DESC")
    Page<ChatHistory> findByOrganizationIdOrderByTimestampDesc(@Param("organizationId") String organizationId, Pageable pageable);
    
    /**
     * Find chat history by session ID
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.sessionId = :sessionId AND ch.deleted = false ORDER BY ch.timestamp ASC")
    List<ChatHistory> findBySessionIdOrderByTimestampAsc(@Param("sessionId") String sessionId);
    
    /**
     * Find recent chat history for a user (last N messages)
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userId = :userId AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findRecentByUserId(@Param("userId") String userId, Pageable pageable);
    
    /**
     * Find recent chat history for a device (last N messages)
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.deviceId = :deviceId AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findRecentByDeviceId(@Param("deviceId") String deviceId, Pageable pageable);
    
    /**
     * Find messages with feedback
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userFeedback IS NOT NULL AND ch.deleted = false ORDER BY ch.feedbackTimestamp DESC")
    Page<ChatHistory> findMessagesWithFeedback(Pageable pageable);
    
    /**
     * Find messages with specific feedback type
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userFeedback = :feedback AND ch.deleted = false ORDER BY ch.feedbackTimestamp DESC")
    Page<ChatHistory> findByUserFeedback(@Param("feedback") ChatHistory.UserFeedback feedback, Pageable pageable);
    
    /**
     * Find messages by feedback type for a specific user
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userId = :userId AND ch.userFeedback = :feedback AND ch.deleted = false ORDER BY ch.feedbackTimestamp DESC")
    List<ChatHistory> findByUserIdAndUserFeedback(@Param("userId") String userId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Find messages by feedback type for a specific device
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.deviceId = :deviceId AND ch.userFeedback = :feedback AND ch.deleted = false ORDER BY ch.feedbackTimestamp DESC")
    List<ChatHistory> findByDeviceIdAndUserFeedback(@Param("deviceId") String deviceId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Find messages by feedback type for a specific organization
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.organizationId = :organizationId AND ch.userFeedback = :feedback AND ch.deleted = false ORDER BY ch.feedbackTimestamp DESC")
    List<ChatHistory> findByOrganizationIdAndUserFeedback(@Param("organizationId") String organizationId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Count messages with feedback for a user
     */
    @Query("SELECT COUNT(ch) FROM ChatHistory ch WHERE ch.userId = :userId AND ch.userFeedback IS NOT NULL AND ch.deleted = false")
    long countMessagesWithFeedbackByUserId(@Param("userId") String userId);
    
    /**
     * Count messages with specific feedback type for a user
     */
    @Query("SELECT COUNT(ch) FROM ChatHistory ch WHERE ch.userId = :userId AND ch.userFeedback = :feedback AND ch.deleted = false")
    long countMessagesByUserIdAndFeedback(@Param("userId") String userId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Count messages with specific feedback type for a device
     */
    @Query("SELECT COUNT(ch) FROM ChatHistory ch WHERE ch.deviceId = :deviceId AND ch.userFeedback = :feedback AND ch.deleted = false")
    long countMessagesByDeviceIdAndFeedback(@Param("deviceId") String deviceId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Count messages with specific feedback type for an organization
     */
    @Query("SELECT COUNT(ch) FROM ChatHistory ch WHERE ch.organizationId = :organizationId AND ch.userFeedback = :feedback AND ch.deleted = false")
    long countMessagesByOrganizationIdAndFeedback(@Param("organizationId") String organizationId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Find messages within a date range
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.timestamp BETWEEN :startDate AND :endDate AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByTimestampBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find messages within a date range for a specific user
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userId = :userId AND ch.timestamp BETWEEN :startDate AND :endDate AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByUserIdAndTimestampBetween(@Param("userId") String userId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find messages within a date range for a specific device
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.deviceId = :deviceId AND ch.timestamp BETWEEN :startDate AND :endDate AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByDeviceIdAndTimestampBetween(@Param("deviceId") String deviceId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find messages within a date range for a specific organization
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.organizationId = :organizationId AND ch.timestamp BETWEEN :startDate AND :endDate AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByOrganizationIdAndTimestampBetween(@Param("organizationId") String organizationId, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * Find parent message for regenerate functionality
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.id = :parentMessageId AND ch.deleted = false")
    Optional<ChatHistory> findParentMessage(@Param("parentMessageId") String parentMessageId);
    
    /**
     * Find regenerated messages for a parent message
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.parentMessageId = :parentMessageId AND ch.deleted = false ORDER BY ch.timestamp ASC")
    List<ChatHistory> findRegeneratedMessages(@Param("parentMessageId") String parentMessageId);
    
    /**
     * Soft delete messages by user ID
     */
    @Modifying
    @Query("UPDATE ChatHistory ch SET ch.deleted = true, ch.deletedAt = CURRENT_TIMESTAMP WHERE ch.userId = :userId")
    void softDeleteByUserId(@Param("userId") String userId);
    
    /**
     * Soft delete messages by device ID
     */
    @Modifying
    @Query("UPDATE ChatHistory ch SET ch.deleted = true, ch.deletedAt = CURRENT_TIMESTAMP WHERE ch.deviceId = :deviceId")
    void softDeleteByDeviceId(@Param("deviceId") String deviceId);
    
    /**
     * Soft delete messages by organization ID
     */
    @Modifying
    @Query("UPDATE ChatHistory ch SET ch.deleted = true, ch.deletedAt = CURRENT_TIMESTAMP WHERE ch.organizationId = :organizationId")
    void softDeleteByOrganizationId(@Param("organizationId") String organizationId);
    
    /**
     * Update user feedback for a message
     */
    @Modifying
    @Query("UPDATE ChatHistory ch SET ch.userFeedback = :feedback, ch.feedbackTimestamp = CURRENT_TIMESTAMP WHERE ch.id = :messageId")
    void updateUserFeedback(@Param("messageId") String messageId, @Param("feedback") ChatHistory.UserFeedback feedback);
    
    /**
     * Find messages by query type
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.queryType = :queryType AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByQueryType(@Param("queryType") ChatHistory.QueryType queryType);
    
    /**
     * Find messages by query type for a specific user
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.userId = :userId AND ch.queryType = :queryType AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByUserIdAndQueryType(@Param("userId") String userId, @Param("queryType") ChatHistory.QueryType queryType);
    
    /**
     * Find messages by query type for a specific device
     */
    @Query("SELECT ch FROM ChatHistory ch WHERE ch.deviceId = :deviceId AND ch.queryType = :queryType AND ch.deleted = false ORDER BY ch.timestamp DESC")
    List<ChatHistory> findByDeviceIdAndQueryType(@Param("deviceId") String deviceId, @Param("queryType") ChatHistory.QueryType queryType);
}
