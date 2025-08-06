package com.iotplatform.dto;

import java.time.LocalDateTime;
import java.util.Map;

public class TelemetryDataRequest {
    private String deviceId;
    private LocalDateTime timestamp;
    private Map<String, Double> metrics;

    // Constructors
    public TelemetryDataRequest() {}

    public TelemetryDataRequest(String deviceId, LocalDateTime timestamp, Map<String, Double> metrics) {
        this.deviceId = deviceId;
        this.timestamp = timestamp;
        this.metrics = metrics;
    }

    // Getters and Setters
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public Map<String, Double> getMetrics() { return metrics; }
    public void setMetrics(Map<String, Double> metrics) { this.metrics = metrics; }
}