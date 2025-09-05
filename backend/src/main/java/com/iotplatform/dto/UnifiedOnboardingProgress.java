package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedOnboardingProgress {
    private String deviceId;
    private String stage; // 'upload', 'device', 'rules', 'maintenance', 'safety', 'complete'
    private int progress; // 0-100
    private String message;
    private String subMessage;
    private String error;
    private boolean retryable;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;
    
    private StepDetails stepDetails;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StepDetails {
        private int currentStep;
        private int totalSteps;
        private String stepName;
        private String status; // 'pending', 'processing', 'completed', 'failed'
        private Long startTime;
        private Long endTime;
        private Long duration;
    }
}
