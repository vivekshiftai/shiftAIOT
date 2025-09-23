package com.iotplatform.dto;

import com.iotplatform.model.ChatHistory;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for chat message requests
 * Used when saving chat messages to history
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageRequest {
    
    @NotBlank(message = "User ID is required")
    private String userId;
    
    private String deviceId;
    
    @NotBlank(message = "Organization ID is required")
    private String organizationId;
    
    @NotBlank(message = "Content is required")
    private String content;
    
    @NotBlank(message = "Session ID is required")
    private String sessionId;
    
    // Optional fields for assistant messages
    private ChatHistory.MessageType messageType;
    private ChatHistory.QueryType queryType;
    private String pdfName;
    private String chunksUsed;
    private String processingTime;
    private String sqlQuery;
    private String databaseResults;
    private Integer rowCount;
}
