package com.iotplatform.service;

import com.iotplatform.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.concurrent.CompletableFuture;

/**
 * Service interface for PDF processing operations.
 * Handles all interactions with the external MinerU PDF processing service.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
public interface PDFProcessingService {
    
    /**
     * Uploads a PDF file to the processing service and stores metadata.
     * 
     * @param file The PDF file to upload
     * @param organizationId The organization ID for data isolation
     * @return PDF upload response with processing details
     * @throws PDFProcessingException if upload fails
     */
    PDFUploadResponse uploadPDF(MultipartFile file, String organizationId) throws PDFProcessingException;
    
    /**
     * Queries a PDF document with natural language and stores the interaction.
     * 
     * @param request The query request containing PDF name and query text
     * @param userId The user ID for audit trail
     * @param organizationId The organization ID for data isolation
     * @return Query response with AI-generated answer
     * @throws PDFProcessingException if query fails
     */
    PDFQueryResponse queryPDF(PDFQueryRequest request, Long userId, String organizationId) throws PDFProcessingException;
    
    /**
     * Lists all PDF documents for an organization with pagination.
     * 
     * @param organizationId The organization ID for data isolation
     * @param page Page number (0-based)
     * @param size Page size
     * @return Paginated list of PDF documents
     * @throws PDFProcessingException if listing fails
     */
    PDFListResponse listPDFs(String organizationId, int page, int size) throws PDFProcessingException;
    
    /**
     * Generates IoT rules from a PDF document asynchronously.
     * 
     * @param pdfName The name of the PDF to process
     * @param deviceId The device ID to associate rules with
     * @param organizationId The organization ID for data isolation
     * @return CompletableFuture for async processing
     * @throws PDFProcessingException if generation fails
     */
    CompletableFuture<RulesGenerationResponse> generateRulesAsync(String pdfName, String deviceId, String organizationId) throws PDFProcessingException;
    
    /**
     * Generates maintenance schedule from a PDF document asynchronously.
     * 
     * @param pdfName The name of the PDF to process
     * @param deviceId The device ID to associate maintenance with
     * @param organizationId The organization ID for data isolation
     * @return CompletableFuture for async processing
     * @throws PDFProcessingException if generation fails
     */
    CompletableFuture<MaintenanceGenerationResponse> generateMaintenanceAsync(String pdfName, String deviceId, String organizationId) throws PDFProcessingException;
    
    /**
     * Generates safety information from a PDF document asynchronously.
     * 
     * @param pdfName The name of the PDF to process
     * @param deviceId The device ID to associate safety info with
     * @param organizationId The organization ID for data isolation
     * @return CompletableFuture for async processing
     * @throws PDFProcessingException if generation fails
     */
    CompletableFuture<SafetyGenerationResponse> generateSafetyAsync(String pdfName, String deviceId, String organizationId) throws PDFProcessingException;
    
    /**
     * Deletes a PDF document from both external service and local database.
     * 
     * @param pdfName The name of the PDF to delete
     * @param organizationId The organization ID for data isolation
     * @return Deletion confirmation response
     * @throws PDFProcessingException if deletion fails
     */
    PDFDeleteResponse deletePDF(String pdfName, String organizationId) throws PDFProcessingException;
    
    /**
     * Checks the health status of the external PDF processing service.
     * 
     * @return Health check response with service status
     * @throws PDFProcessingException if health check fails
     */
    HealthCheckResponse healthCheck() throws PDFProcessingException;
    
    /**
     * Gets processing status for async operations.
     * 
     * @param operationId The operation ID to check
     * @param organizationId The organization ID for data isolation
     * @return Processing status response
     * @throws PDFProcessingException if status check fails
     */
    ProcessingStatusResponse getProcessingStatus(String operationId, String organizationId) throws PDFProcessingException;
}
