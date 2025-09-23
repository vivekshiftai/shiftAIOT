package com.iotplatform.dto;

import com.iotplatform.model.ChatHistory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for chat feedback requests
 * Used when users provide feedback (like, dislike, regenerate) on chat messages
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatFeedbackRequest {
    
    @NotBlank(message = "Message ID is required")
    private String messageId;
    
    @NotNull(message = "Feedback type is required")
    private ChatHistory.UserFeedback feedback;
    
    // Optional fields for regenerate functionality
    private String newContent;
    private String newChunksUsed;
    private String newProcessingTime;
}
