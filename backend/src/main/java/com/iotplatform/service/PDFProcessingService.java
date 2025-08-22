package com.iotplatform.service;

import com.iotplatform.dto.*;
import com.iotplatform.exception.PDFProcessingException;
import com.iotplatform.model.Rule;
import com.iotplatform.model.DeviceMaintenance;
import com.iotplatform.model.DeviceSafetyPrecaution;
import com.iotplatform.model.PDFQuery;
import com.iotplatform.model.Device;
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
     * Queries a PDF document with device context and stores the interaction.
     * 
     * @param request The query request containing PDF name and query text
     * @param userId The user ID for audit trail
     * @param deviceId The device ID for context
     * @param organizationId The organization ID for data isolation
     * @return Query response with AI-generated answer
     * @throws PDFProcessingException if query fails
     */
    PDFQueryResponse queryPDFWithDeviceContext(PDFQueryRequest request, Long userId, String deviceId, String organizationId) throws PDFProcessingException;
    
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
     * Generates IoT rules from a PDF document synchronously.
     * 
     * @param pdfName The name of the PDF to process
     * @param deviceId The device ID to associate rules with
     * @param organizationId The organization ID for data isolation
     * @return Rules generation response
     * @throws PDFProcessingException if generation fails
     */
    RulesGenerationResponse generateRules(String pdfName, String deviceId, String organizationId) throws PDFProcessingException;
    
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
     * Generates maintenance schedule from a PDF document synchronously.
     * 
     * @param pdfName The name of the PDF to process
     * @param deviceId The device ID to associate maintenance with
     * @param organizationId The organization ID for data isolation
     * @return Maintenance generation response
     * @throws PDFProcessingException if generation fails
     */
    MaintenanceGenerationResponse generateMaintenance(String pdfName, String deviceId, String organizationId) throws PDFProcessingException;
    
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
     * Generates safety information from a PDF document synchronously.
     * 
     * @param pdfName The name of the PDF to process
     * @param deviceId The device ID to associate safety info with
     * @param organizationId The organization ID for data isolation
     * @return Safety generation response
     * @throws PDFProcessingException if generation fails
     */
    SafetyGenerationResponse generateSafety(String pdfName, String deviceId, String organizationId) throws PDFProcessingException;
    
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
    
    /**
     * Gets rules generated for a device.
     * 
     * @param deviceId The device ID
     * @return List of rules for the device
     */
    List<Rule> getDeviceRules(String deviceId);
    
    /**
     * Gets maintenance tasks generated for a device.
     * 
     * @param deviceId The device ID
     * @return List of maintenance tasks for the device
     */
    List<DeviceMaintenance> getDeviceMaintenance(String deviceId);
    
    /**
     * Gets safety precautions generated for a device.
     * 
     * @param deviceId The device ID
     * @return List of safety precautions for the device
     */
    List<DeviceSafetyPrecaution> getDeviceSafetyPrecautions(String deviceId);

    /**
     * Gets chat history for a user in an organization.
     * 
     * @param userId The user ID
     * @param organizationId The organization ID
     * @param limit Maximum number of messages to return
     * @return List of chat messages
     */
    List<PDFQuery> getChatHistory(Long userId, String organizationId, int limit);

    /**
     * Gets chat history for a user and device in an organization.
     * 
     * @param userId The user ID
     * @param deviceId The device ID
     * @param organizationId The organization ID
     * @param limit Maximum number of messages to return
     * @return List of chat messages
     */
    List<PDFQuery> getDeviceChatHistory(Long userId, String deviceId, String organizationId, int limit);

    /**
     * Gets chat history for a specific PDF document.
     * 
     * @param pdfName The PDF document name
     * @param organizationId The organization ID
     * @param limit Maximum number of messages to return
     * @return List of chat messages
     */
    List<PDFQuery> getPDFChatHistory(String pdfName, String organizationId, int limit);
    
    /**
     * Saves PDF processing results for a device.
     * 
     * @param device The device to associate results with
     * @param pdfResults The PDF processing results
     * @throws PDFProcessingException if saving fails
     */
    void savePDFProcessingResults(Device device, DeviceCreateWithFileRequest.PDFResults pdfResults) throws PDFProcessingException;
    
    /**
     * Gets upcoming maintenance for a device.
     * 
     * @param deviceId The device ID
     * @return List of upcoming maintenance tasks
     */
    List<DeviceMaintenance> getUpcomingMaintenance(String deviceId);
    
    /**
     * Gets maintenance count for a device.
     * 
     * @param deviceId The device ID
     * @return Count of maintenance tasks
     */
    long getMaintenanceCount(String deviceId);
}
