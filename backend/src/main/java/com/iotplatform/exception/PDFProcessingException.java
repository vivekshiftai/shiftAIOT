package com.iotplatform.exception;

/**
 * Custom exception for PDF processing operations.
 * Used to handle errors specific to PDF upload, query, and generation operations.
 * 
 * @author IoT Platform Team
 * @version 1.0
 */
public class PDFProcessingException extends RuntimeException {

    private final ErrorCode errorCode;
    private final String operation;

    /**
     * Error codes for different types of PDF processing failures
     */
    public enum ErrorCode {
        UPLOAD_FAILED("PDF_UPLOAD_001", "Failed to upload PDF file"),
        QUERY_FAILED("PDF_QUERY_001", "Failed to query PDF document"),
        GENERATION_FAILED("PDF_GEN_001", "Failed to generate content from PDF"),
        FILE_TOO_LARGE("PDF_VALIDATION_001", "PDF file size exceeds maximum limit"),
        INVALID_FILE_TYPE("PDF_VALIDATION_002", "Invalid file type. Only PDF files are allowed"),
        DOCUMENT_NOT_FOUND("PDF_NOT_FOUND_001", "PDF document not found"),
        EXTERNAL_SERVICE_UNAVAILABLE("PDF_EXTERNAL_001", "External PDF processing service is unavailable"),
        PROCESSING_TIMEOUT("PDF_TIMEOUT_001", "PDF processing operation timed out"),
        INVALID_REQUEST("PDF_VALIDATION_003", "Invalid request parameters"),
        STORAGE_ERROR("PDF_STORAGE_001", "Failed to store PDF metadata"),
        DELETION_FAILED("PDF_DELETE_001", "Failed to delete PDF document"),
        HEALTH_CHECK_FAILED("PDF_HEALTH_001", "Health check failed for PDF processing service");

        private final String code;
        private final String defaultMessage;

        ErrorCode(String code, String defaultMessage) {
            this.code = code;
            this.defaultMessage = defaultMessage;
        }

        public String getCode() {
            return code;
        }

        public String getDefaultMessage() {
            return defaultMessage;
        }
    }

    /**
     * Constructor with error code and operation
     */
    public PDFProcessingException(ErrorCode errorCode, String operation) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
        this.operation = operation;
    }

    /**
     * Constructor with error code, operation, and custom message
     */
    public PDFProcessingException(ErrorCode errorCode, String operation, String message) {
        super(message);
        this.errorCode = errorCode;
        this.operation = operation;
    }

    /**
     * Constructor with error code, operation, and cause
     */
    public PDFProcessingException(ErrorCode errorCode, String operation, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
        this.operation = operation;
    }

    /**
     * Constructor with error code, operation, custom message, and cause
     */
    public PDFProcessingException(ErrorCode errorCode, String operation, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.operation = operation;
    }

    /**
     * Get the error code
     */
    public ErrorCode getErrorCode() {
        return errorCode;
    }

    /**
     * Get the operation that failed
     */
    public String getOperation() {
        return operation;
    }

    /**
     * Get the full error message with context
     */
    public String getFullErrorMessage() {
        return String.format("[%s] %s: %s", errorCode.getCode(), operation, getMessage());
    }

    /**
     * Check if the error is due to external service unavailability
     */
    public boolean isExternalServiceError() {
        return errorCode == ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE;
    }

    /**
     * Check if the error is due to validation issues
     */
    public boolean isValidationError() {
        return errorCode == ErrorCode.FILE_TOO_LARGE ||
               errorCode == ErrorCode.INVALID_FILE_TYPE ||
               errorCode == ErrorCode.INVALID_REQUEST;
    }

    /**
     * Check if the error is due to timeout
     */
    public boolean isTimeoutError() {
        return errorCode == ErrorCode.PROCESSING_TIMEOUT;
    }

    /**
     * Check if the error is due to file not found
     */
    public boolean isNotFoundError() {
        return errorCode == ErrorCode.DOCUMENT_NOT_FOUND;
    }

    /**
     * Check if the error is recoverable (can be retried)
     */
    public boolean isRecoverable() {
        return errorCode == ErrorCode.EXTERNAL_SERVICE_UNAVAILABLE ||
               errorCode == ErrorCode.PROCESSING_TIMEOUT ||
               errorCode == ErrorCode.HEALTH_CHECK_FAILED;
    }

    /**
     * Get a user-friendly error message
     */
    public String getUserFriendlyMessage() {
        switch (errorCode) {
            case UPLOAD_FAILED:
                return "Failed to upload your PDF file. Please try again.";
            case QUERY_FAILED:
                return "Failed to process your question. Please try again.";
            case GENERATION_FAILED:
                return "Failed to generate content from your PDF. Please try again.";
            case FILE_TOO_LARGE:
                return "Your PDF file is too large. Please upload a smaller file.";
            case INVALID_FILE_TYPE:
                return "Please upload a valid PDF file.";
            case DOCUMENT_NOT_FOUND:
                return "The requested PDF document was not found.";
            case EXTERNAL_SERVICE_UNAVAILABLE:
                return "PDF processing service is temporarily unavailable. Please try again later.";
            case PROCESSING_TIMEOUT:
                return "PDF processing is taking longer than expected. Please try again.";
            case INVALID_REQUEST:
                return "Invalid request. Please check your input and try again.";
            case STORAGE_ERROR:
                return "Failed to save PDF information. Please try again.";
            case DELETION_FAILED:
                return "Failed to delete the PDF document. Please try again.";
            case HEALTH_CHECK_FAILED:
                return "PDF processing service is not responding. Please try again later.";
            default:
                return "An unexpected error occurred. Please try again.";
        }
    }
}
