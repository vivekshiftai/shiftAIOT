# Unified PDF Storage System

## Overview

The IoT Platform has been upgraded to use a **single unified PDF storage system** that consolidates all PDF operations into one table (`unified_pdfs`) instead of the previous three separate tables (`device_documentation`, `knowledge_documents`, `pdf_documents`).

## 🎯 **Key Benefits**

- **Single Source of Truth**: All PDF data stored in one table
- **Simplified Queries**: No more complex joins across multiple tables
- **Better Device Association**: Device names stored directly with PDFs for easy display
- **Unified API**: Single service handles all PDF operations
- **Easier Maintenance**: One table to manage instead of three
- **Better Performance**: Optimized indexes and queries

## 🏗️ **New Database Schema**

### **Unified PDFs Table (`unified_pdfs`)**

```sql
CREATE TABLE unified_pdfs (
    id VARCHAR(255) PRIMARY KEY,                    -- UUID primary key
    name VARCHAR(255) NOT NULL,                     -- PDF name from external service
    original_filename VARCHAR(255) NOT NULL,         -- Original uploaded filename
    title VARCHAR(255),                             -- Document title/description
    document_type VARCHAR(50) NOT NULL,             -- 'MANUAL', 'DATASHEET', 'CERTIFICATE', 'GENERAL'
    file_size BIGINT NOT NULL,                      -- File size in bytes
    file_path VARCHAR(500) NOT NULL,                -- Path or 'external_service'
    
    -- Processing and AI Integration
    processing_status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
    processing_summary TEXT,                        -- Summary of processing results
    total_pages INTEGER,                            -- Total pages in PDF
    processed_chunks INTEGER,                       -- Number of AI chunks processed
    processing_time VARCHAR(100),                   -- Processing time as string
    collection_name VARCHAR(255),                   -- Vector database collection name
    vectorized BOOLEAN DEFAULT false,               -- Whether PDF is AI-ready
    
    -- Device Association
    device_id VARCHAR(255),                         -- Associated device ID (nullable)
    device_name VARCHAR(255),                       -- Stored device name for display
    
    -- Organization and User Context
    organization_id VARCHAR(255) NOT NULL,          -- Organization for data isolation
    uploaded_by VARCHAR(255),                       -- User who uploaded the PDF
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Upload timestamp
    processed_at TIMESTAMP,                         -- Processing completion timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Last modification timestamp
    
    -- Soft Delete
    deleted BOOLEAN DEFAULT false,                  -- Soft delete flag
    deleted_at TIMESTAMP,                           -- Deletion timestamp
    
    -- Foreign Keys and Indexes
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
```

### **Updated PDF Queries Table (`pdf_queries`)**

```sql
CREATE TABLE pdf_queries (
    id VARCHAR(255) PRIMARY KEY,                    -- UUID primary key
    pdf_document_id VARCHAR(255) NOT NULL,          -- Reference to unified_pdfs.id
    user_id VARCHAR(255) NOT NULL,                  -- User who made the query
    device_id VARCHAR(255),                         -- Device context for the query
    organization_id VARCHAR(255) NOT NULL,          -- Organization for data isolation
    user_query TEXT NOT NULL,                       -- User's query text
    ai_response TEXT NOT NULL,                      -- AI-generated response
    chunks_used TEXT,                               -- Chunks used for response
    processing_time VARCHAR(100),                   -- Query processing time
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',  -- Query status
    error_message TEXT,                             -- Error message if failed
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (pdf_document_id) REFERENCES unified_pdfs(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

## 🔄 **Migration Process**

### **Step 1: Run New Schema**
The new schema is automatically applied when the application starts. It includes:
- Creation of `unified_pdfs` table
- Updates to `pdf_queries` table
- Migration of existing data

### **Step 2: Data Migration**
Run the migration script to move existing data:

```bash
# Execute the migration script
psql -d your_database -f backend/src/main/resources/migration-unified-pdfs.sql
```

### **Step 3: Verify Migration**
Check migration results:
```sql
-- Verify record counts
SELECT 'unified_pdfs' as table_name, COUNT(*) as record_count FROM unified_pdfs
UNION ALL
SELECT 'pdf_queries' as table_name, COUNT(*) as record_count FROM pdf_queries;

-- Check device-associated PDFs
SELECT device_name, original_filename, document_type, processing_status 
FROM unified_pdfs 
WHERE device_id IS NOT NULL;
```

### **Step 4: Clean Up (After Verification)**
```sql
-- Drop old tables (only after verifying data migration)
DROP TABLE IF EXISTS device_documentation CASCADE;
DROP TABLE IF EXISTS knowledge_documents CASCADE;
DROP TABLE IF EXISTS pdf_documents CASCADE;
```

## 🚀 **New Services and Components**

### **UnifiedPDFService**
- **Single service** for all PDF operations
- **Device-specific PDF creation**: `createDevicePDF()`
- **General PDF creation**: `createGeneralPDF()`
- **Unified querying**: `getPDFsByDevice()`, `getPDFsByOrganization()`
- **Processing management**: `updateProcessingResponse()`, `updateProcessingStatus()`

### **UnifiedPDFRepository**
- **Comprehensive query methods** for all use cases
- **Device-specific queries**: `findByDeviceIdAndOrganizationIdAndDeletedFalseOrderByUploadedAtDesc()`
- **General PDF queries**: `findGeneralPDFsByOrganization()`
- **Search capabilities**: `findByOrganizationIdAndSearchTerm()`
- **Performance optimized** with proper indexes

## 📱 **Frontend Updates**

### **Knowledge Base Display**
- **Device names shown** alongside PDF names: `"Device Name - PDF Name"`
- **Device association indicators** with blue badges
- **Unified document list** showing all PDFs in one place

### **Device Details**
- **PDFs loaded from unified system** with fallback to old API
- **Device context preserved** in chat queries
- **Better error handling** and user feedback

### **Device Chat Interface**
- **Automatic PDF selection** from device-associated documents
- **Device context maintained** throughout conversations
- **Improved user experience** with clear device associations

## 🔍 **Query Examples**

### **Get PDFs by Device**
```java
List<UnifiedPDF> devicePDFs = unifiedPDFService.getPDFsByDevice(deviceId);
```

### **Get PDFs Ready for Queries**
```java
List<UnifiedPDF> readyPDFs = unifiedPDFService.getReadyPDFsByOrganization(organizationId);
```

### **Search PDFs by Device Name**
```java
List<UnifiedPDF> devicePDFs = unifiedPDFService.searchPDFsByDeviceName(organizationId, "Sensor-001");
```

### **Get PDFs by Type**
```java
List<UnifiedPDF> manuals = unifiedPDFService.getPDFsByType(organizationId, DocumentType.MANUAL);
```

## 📊 **Data Flow**

### **Device Onboarding with PDF**
1. **User uploads PDF** during device creation
2. **UnifiedPDF entry created** with device association
3. **PDF sent to external AI service** for processing
4. **Processing response stored** in unified table
5. **PDF ready for queries** with device context

### **General PDF Upload**
1. **User uploads PDF** to knowledge base
2. **UnifiedPDF entry created** without device association
3. **PDF processed and vectorized** for general queries
4. **Available for organization-wide** knowledge queries

### **PDF Queries**
1. **User queries PDF** with optional device context
2. **System finds relevant PDFs** from unified table
3. **Query sent to AI service** with proper context
4. **Response stored** with device association
5. **Chat history maintained** for future reference

## 🛠️ **Configuration**

### **Application Properties**
```yaml
# PDF Processing Configuration
pdf:
  processing:
    base-url: ${PDF_PROCESSING_URL:http://localhost:8081}
    api-key: ${PDF_PROCESSING_API_KEY:your-api-key}
    timeout: 30000
    retry-attempts: 3
```

### **Database Indexes**
The system automatically creates optimized indexes:
- `idx_unified_pdfs_org_id` - Organization-based queries
- `idx_unified_pdfs_device_id` - Device-specific queries
- `idx_unified_pdfs_name_org` - Name-based searches
- `idx_unified_pdfs_status` - Status-based filtering

## 🔒 **Security and Access Control**

- **Organization isolation** - Users only see their organization's PDFs
- **Device association** - Device-specific PDFs linked to device access
- **Soft delete** - PDFs can be removed without data loss
- **Audit trail** - Complete tracking of uploads, processing, and queries

## 📈 **Performance Improvements**

- **Reduced table joins** - Single table queries instead of complex joins
- **Optimized indexes** - Specific indexes for common query patterns
- **Efficient pagination** - Built-in support for large document collections
- **Caching ready** - Structure supports future caching implementations

## 🚨 **Breaking Changes**

### **API Changes**
- **PDF upload endpoints** now use unified service
- **Query endpoints** reference unified PDF IDs
- **Device PDF endpoints** return unified format

### **Database Changes**
- **Old tables deprecated** but preserved during migration
- **Foreign key relationships** updated to use new table
- **ID format changes** from BIGINT to VARCHAR(UUID)

### **Service Dependencies**
- **DeviceDocumentationService** replaced by UnifiedPDFService
- **KnowledgeService** updated to use unified system
- **PDFProcessingService** integrated with unified storage

## 🔮 **Future Enhancements**

- **Advanced search** with full-text search capabilities
- **PDF versioning** for document updates
- **Bulk operations** for multiple PDF management
- **Advanced analytics** for PDF usage and performance
- **Integration APIs** for external document systems

## 📞 **Support and Troubleshooting**

### **Common Issues**
1. **Migration failures** - Check database permissions and constraints
2. **PDF not found** - Verify PDF exists in unified table
3. **Device association lost** - Check device_id and device_name fields
4. **Performance issues** - Verify indexes are created properly

### **Debug Queries**
```sql
-- Check PDF status
SELECT id, original_filename, processing_status, vectorized, device_name 
FROM unified_pdfs 
WHERE organization_id = 'your-org-id';

-- Verify device associations
SELECT up.device_name, up.original_filename, d.name as device_name
FROM unified_pdfs up
JOIN devices d ON up.device_id = d.id
WHERE up.organization_id = 'your-org-id';
```

### **Logs and Monitoring**
- **Application logs** show all PDF operations
- **Database queries** logged for debugging
- **Performance metrics** available for monitoring
- **Error tracking** with detailed error messages

## 📝 **Conclusion**

The Unified PDF Storage System provides a **cleaner, more efficient, and maintainable** approach to PDF management in the IoT Platform. By consolidating all PDF operations into a single table and service, the system becomes easier to use, maintain, and extend while providing better performance and user experience.

The migration process is designed to be **safe and reversible**, allowing teams to verify data integrity before removing old tables. The new system maintains all existing functionality while adding new capabilities for better device association and unified management.
