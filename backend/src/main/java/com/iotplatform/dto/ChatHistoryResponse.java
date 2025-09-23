package com.iotplatform.dto;

import com.iotplatform.model.ChatHistory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO for chat history responses
 * Used when returning chat history data to the frontend
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatHistoryResponse {
    
    private String id;
    private String userId;
    private String deviceId;
    private String organizationId;
    private ChatHistory.MessageType messageType;
    private String content;
    private LocalDateTime timestamp;
    private ChatHistory.QueryType queryType;
    private String pdfName;
    private String chunksUsed;
    private String processingTime;
    private String sqlQuery;
    private String databaseResults;
    private Integer rowCount;
    private ChatHistory.UserFeedback userFeedback;
    private LocalDateTime feedbackTimestamp;
    private String sessionId;
    private String parentMessageId;
    private Boolean isRegenerated;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
