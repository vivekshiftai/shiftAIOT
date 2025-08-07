package com.iotplatform.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "device_documentation")
public class DeviceDocumentation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @ManyToOne
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;
    
    @NotBlank
    @Size(max = 100)
    @Column(name = "title", nullable = false)
    private String title;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;
    
    @NotBlank
    @Size(max = 500)
    @Column(name = "file_path", nullable = false)
    private String filePath;
    
    @Size(max = 100)
    @Column(name = "file_name")
    private String fileName;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @Size(max = 50)
    @Column(name = "file_type")
    private String fileType;
    
    @Size(max = 1000)
    @Column(name = "description")
    private String description;
    
    @Size(max = 200)
    @Column(name = "version")
    private String version;
    
    @Column(name = "upload_date", nullable = false)
    private LocalDateTime uploadDate;
    
    @Column(name = "is_public")
    private Boolean isPublic = false;
    
    @Size(max = 200)
    @Column(name = "uploaded_by")
    private String uploadedBy;
    
    public enum DocumentType {
        MANUAL,
        DATASHEET,
        CERTIFICATE,
        INSTALLATION_GUIDE,
        MAINTENANCE_GUIDE,
        TROUBLESHOOTING_GUIDE,
        SAFETY_GUIDE,
        WARRANTY_CARD,
        QUICK_START_GUIDE,
        API_DOCUMENTATION,
        FIRMWARE_UPDATE_NOTES,
        COMPLIANCE_CERTIFICATE,
        OTHER
    }
    
    // Constructors
    public DeviceDocumentation() {}
    
    public DeviceDocumentation(Device device, String title, DocumentType documentType, String filePath) {
        this.device = device;
        this.title = title;
        this.documentType = documentType;
        this.filePath = filePath;
        this.uploadDate = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public Device getDevice() { return device; }
    public void setDevice(Device device) { this.device = device; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public DocumentType getDocumentType() { return documentType; }
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    
    public LocalDateTime getUploadDate() { return uploadDate; }
    public void setUploadDate(LocalDateTime uploadDate) { this.uploadDate = uploadDate; }
    
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    
    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }
}
