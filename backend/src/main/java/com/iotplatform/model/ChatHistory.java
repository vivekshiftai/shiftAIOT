package com.iotplatform.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * ChatHistory entity to store all chat messages and user feedback
 * This table stores the complete conversation history including user queries,
 * AI responses, and user feedback (like, dislike, regenerate)
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Entity
@Table(name = "chat_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistory {
    
    @Id
    @Column(name = "id", nullable = false)
    private String id;
    
    @NotBlank
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "device_id")
    private String deviceId;
    
    @NotBlank
    @Column(name = "organization_id", nullable = false)
    private String organizationId;
    
    @NotBlank
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType messageType;
    
    @NotBlank
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;
    
    @NotNull
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;
    
    // Query context fields (for assistant messages)
    @Enumerated(EnumType.STRING)
    @Column(name = "query_type")
    private QueryType queryType;
    
    @Size(max = 255)
    @Column(name = "pdf_name")
    private String pdfName;
    
    @Column(name = "chunks_used", columnDefinition = "TEXT")
    private String chunksUsed; // JSON array of chunks used
    
    @Size(max = 100)
    @Column(name = "processing_time")
    private String processingTime;
    
    @Column(name = "sql_query", columnDefinition = "TEXT")
    private String sqlQuery;
    
    @Column(name = "database_results", columnDefinition = "TEXT")
    private String databaseResults; // JSON array of database results
    
    @Column(name = "row_count")
    private Integer rowCount;
    
    // User feedback fields
    @Enumerated(EnumType.STRING)
    @Column(name = "user_feedback")
    private UserFeedback userFeedback;
    
    @Column(name = "feedback_timestamp")
    private LocalDateTime feedbackTimestamp;
    
    // Metadata fields
    @Size(max = 255)
    @Column(name = "session_id")
    private String sessionId;
    
    @Column(name = "parent_message_id")
    private String parentMessageId;
    
    @Builder.Default
    @Column(name = "is_regenerated")
    private Boolean isRegenerated = false;
    
    // Soft delete fields
    @Builder.Default
    @Column(name = "deleted")
    private Boolean deleted = false;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    // Enums
    public enum MessageType {
        USER, ASSISTANT
    }
    
    public enum QueryType {
        DATABASE, PDF, MIXED, LLM_ANSWER, UNKNOWN
    }
    
    public enum UserFeedback {
        LIKE, DISLIKE, REGENERATE
    }
    
    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", insertable = false, updatable = false)
    private Device device;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", insertable = false, updatable = false)
    private Organization organization;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_message_id", insertable = false, updatable = false)
    private ChatHistory parentMessage;
    
    // Helper methods
    public void markAsDeleted() {
        this.deleted = true;
        this.deletedAt = LocalDateTime.now();
    }
    
    public void addFeedback(UserFeedback feedback) {
        this.userFeedback = feedback;
        this.feedbackTimestamp = LocalDateTime.now();
    }
    
    public boolean hasFeedback() {
        return this.userFeedback != null;
    }
    
    public boolean isUserMessage() {
        return MessageType.USER.equals(this.messageType);
    }
    
    public boolean isAssistantMessage() {
        return MessageType.ASSISTANT.equals(this.messageType);
    }
}
