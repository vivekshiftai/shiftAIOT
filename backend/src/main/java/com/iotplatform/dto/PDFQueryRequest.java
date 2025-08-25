package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request DTO for PDF query operations.
 * Contains the PDF name and query text for AI processing.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
public class PDFQueryRequest {
    
    @JsonProperty("pdf_name")
    @NotBlank(message = "PDF name is required")
    private String pdfName;
    
    @JsonProperty("query")
    @NotBlank(message = "Query text is required")
    private String query;
    
    @JsonProperty("top_k")
    @Positive(message = "Top K must be positive")
    private Integer topK = 5; // Default value
    
    @JsonProperty("organization_id")
    private String organizationId; // Optional - will be set from authenticated user
    
    // Default constructor for JSON deserialization
    public PDFQueryRequest() {}
    
    // Constructor with required fields
    public PDFQueryRequest(String pdfName, String query, String organizationId) {
        this.pdfName = pdfName;
        this.query = query;
        this.organizationId = organizationId;
    }
    
    // Constructor with all fields
    public PDFQueryRequest(String pdfName, String query, Integer topK, String organizationId) {
        this.pdfName = pdfName;
        this.query = query;
        this.topK = topK != null ? topK : 5;
        this.organizationId = organizationId;
    }
    
    // Getters and Setters
    public String getPdfName() {
        return pdfName;
    }
    
    public void setPdfName(String pdfName) {
        this.pdfName = pdfName;
    }
    
    public String getQuery() {
        return query;
    }
    
    public void setQuery(String query) {
        this.query = query;
    }
    
    public Integer getTopK() {
        return topK;
    }
    
    public void setTopK(Integer topK) {
        this.topK = topK != null ? topK : 5;
    }
    
    public String getOrganizationId() {
        return organizationId;
    }
    
    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }
    
    @Override
    public String toString() {
        return "PDFQueryRequest{" +
                "pdfName='" + pdfName + '\'' +
                ", query='" + query + '\'' +
                ", topK=" + topK +
                ", organizationId='" + organizationId + '\'' +
                '}';
    }
}
