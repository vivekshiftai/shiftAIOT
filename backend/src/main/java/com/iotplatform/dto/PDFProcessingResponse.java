package com.iotplatform.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class PDFProcessingResponse {
    
    @JsonProperty("success")
    private Boolean success;
    
    @JsonProperty("message")
    private String message;
    
    @JsonProperty("pdf_name")
    private String pdfName;
    
    @JsonProperty("chunks_processed")
    private Integer chunksProcessed;
    
    @JsonProperty("processing_time")
    private String processingTime;
    
    @JsonProperty("collection_name")
    private String collectionName;
    
    // Constructors
    public PDFProcessingResponse() {}
    
    public PDFProcessingResponse(Boolean success, String message, String pdfName, 
                               Integer chunksProcessed, String processingTime, String collectionName) {
        this.success = success;
        this.message = message;
        this.pdfName = pdfName;
        this.chunksProcessed = chunksProcessed;
        this.processingTime = processingTime;
        this.collectionName = collectionName;
    }
    
    // Getters and Setters
    public Boolean getSuccess() {
        return success;
    }
    
    public void setSuccess(Boolean success) {
        this.success = success;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getPdfName() {
        return pdfName;
    }
    
    public void setPdfName(String pdfName) {
        this.pdfName = pdfName;
    }
    
    public Integer getChunksProcessed() {
        return chunksProcessed;
    }
    
    public void setChunksProcessed(Integer chunksProcessed) {
        this.chunksProcessed = chunksProcessed;
    }
    
    public String getProcessingTime() {
        return processingTime;
    }
    
    public void setProcessingTime(String processingTime) {
        this.processingTime = processingTime;
    }
    
    public String getCollectionName() {
        return collectionName;
    }
    
    public void setCollectionName(String collectionName) {
        this.collectionName = collectionName;
    }
    
    @Override
    public String toString() {
        return "PDFProcessingResponse{" +
                "success=" + success +
                ", message='" + message + '\'' +
                ", pdfName='" + pdfName + '\'' +
                ", chunksProcessed=" + chunksProcessed +
                ", processingTime='" + processingTime + '\'' +
                ", collectionName='" + collectionName + '\'' +
                '}';
    }
}
