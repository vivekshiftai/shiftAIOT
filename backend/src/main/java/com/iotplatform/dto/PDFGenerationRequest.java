package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request for generating content from PDF (rules, maintenance, safety).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PDFGenerationRequest {
    @NotBlank(message = "PDF name is required")
    @Size(max = 255, message = "PDF name must not exceed 255 characters")
    @JsonProperty("pdf_name")
    private String pdfName;
    
    @NotBlank(message = "Device ID is required")
    @Size(max = 255, message = "Device ID must not exceed 255 characters")
    @JsonProperty("device_id")
    private String deviceId;
    
    @JsonProperty("organization_id")
    private String organizationId; // Optional - will be set from authenticated user
    
    // Additional getter methods for compatibility
    public String getPdfName() {
        return pdfName;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }
}
