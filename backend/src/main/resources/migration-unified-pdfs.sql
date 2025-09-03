-- Migration Script: Transition to Unified PDF Storage System
-- This script helps migrate data from the old PDF storage tables to the new unified_pdfs table
-- Run this after the new schema is in place

-- Step 1: Migrate device_documentation data to unified_pdfs
INSERT INTO unified_pdfs (
    id, name, original_filename, title, document_type, file_size, file_path,
    processing_status, processing_summary, total_pages, processed_chunks, processing_time,
    collection_name, vectorized, device_id, device_name, organization_id, uploaded_by,
    uploaded_at, processed_at, updated_at, deleted
)
SELECT 
    id,
    COALESCE(pdf_name, filename) as name,
    original_filename,
    COALESCE(title, document_type) as title,
    CASE 
        WHEN document_type = 'manual' THEN 'MANUAL'
        WHEN document_type = 'datasheet' THEN 'DATASHEET'
        WHEN document_type = 'certificate' THEN 'CERTIFICATE'
        ELSE 'MANUAL'
    END as document_type,
    file_size,
    file_path,
    CASE 
        WHEN processing_status = 'PENDING' THEN 'PENDING'
        WHEN processing_status = 'PROCESSING' THEN 'PROCESSING'
        WHEN processing_status = 'COMPLETED' THEN 'COMPLETED'
        WHEN processing_status = 'FAILED' THEN 'FAILED'
        ELSE 'PENDING'
    END as processing_status,
    processing_summary,
    total_pages,
    processed_chunks,
    processing_time,
    collection_name,
    CASE WHEN processing_status = 'COMPLETED' THEN true ELSE false END as vectorized,
    device_id,
    (SELECT name FROM devices WHERE id = device_id) as device_name,
    (SELECT organization_id FROM devices WHERE id = device_id) as organization_id,
    NULL as uploaded_by,
    created_at as uploaded_at,
    updated_at as processed_at,
    updated_at,
    false as deleted
FROM device_documentation
WHERE id NOT IN (SELECT id FROM unified_pdfs);

-- Step 2: Migrate knowledge_documents data to unified_pdfs (for non-device documents)
INSERT INTO unified_pdfs (
    id, name, original_filename, title, document_type, file_size, file_path,
    processing_status, vectorized, device_id, device_name, organization_id, uploaded_by,
    uploaded_at, processed_at, updated_at, deleted
)
SELECT 
    id::text,
    name,
    name as original_filename,
    name as title,
    'GENERAL' as document_type,
    size as file_size,
    file_path,
    CASE 
        WHEN status = 'processing' THEN 'PENDING'
        WHEN status = 'completed' THEN 'COMPLETED'
        WHEN status = 'error' THEN 'FAILED'
        ELSE 'PENDING'
    END as processing_status,
    vectorized,
    device_id,
    device_name,
    organization_id,
    NULL as uploaded_by,
    uploaded_at,
    processed_at,
    updated_at,
    false as deleted
FROM knowledge_documents
WHERE id::text NOT IN (SELECT id FROM unified_pdfs)
AND (device_id IS NULL OR device_id = '');

-- Step 3: Migrate pdf_documents data to unified_pdfs (for general documents)
INSERT INTO unified_pdfs (
    id, name, original_filename, title, document_type, file_size, file_path,
    processing_status, processed_chunks, processing_time, collection_name, vectorized,
    device_id, device_name, organization_id, uploaded_by, uploaded_at, processed_at, updated_at, deleted
)
SELECT 
    id::text,
    name,
    original_filename,
    name as title,
    'GENERAL' as document_type,
    file_size,
    'external_service' as file_path,
    CASE 
        WHEN status = 'UPLOADING' THEN 'PENDING'
        WHEN status = 'PROCESSING' THEN 'PROCESSING'
        WHEN status = 'COMPLETED' THEN 'COMPLETED'
        WHEN status = 'FAILED' THEN 'FAILED'
        ELSE 'PENDING'
    END as processing_status,
    chunks_processed as processed_chunks,
    processing_time,
    collection_name,
    CASE WHEN status = 'COMPLETED' THEN true ELSE false END as vectorized,
    NULL as device_id,
    NULL as device_name,
    organization_id,
    NULL as uploaded_by,
    uploaded_at,
    processed_at,
    updated_at,
    deleted
FROM pdf_documents
WHERE id::text NOT IN (SELECT id FROM unified_pdfs);

-- Step 4: Update pdf_queries to reference the new unified_pdfs table
-- First, add a temporary column to store the old pdf_document_id
ALTER TABLE pdf_queries ADD COLUMN IF NOT EXISTS old_pdf_document_id BIGINT;

-- Copy the old ID for reference
UPDATE pdf_queries SET old_pdf_document_id = pdf_document_id WHERE old_pdf_document_id IS NULL;

-- Update pdf_document_id to reference unified_pdfs
UPDATE pdf_queries 
SET pdf_document_id = (
    SELECT up.id 
    FROM unified_pdfs up 
    WHERE up.name = (
        SELECT pd.name 
        FROM pdf_documents pd 
        WHERE pd.id = pdf_queries.old_pdf_document_id
    )
    LIMIT 1
)
WHERE old_pdf_document_id IS NOT NULL;

-- Clean up temporary column
ALTER TABLE pdf_queries DROP COLUMN old_pdf_document_id;

-- Step 5: Update organization_id in pdf_queries if it's still 'default'
UPDATE pdf_queries 
SET organization_id = (
    SELECT up.organization_id 
    FROM unified_pdfs up 
    WHERE up.id = pdf_queries.pdf_document_id
)
WHERE organization_id = 'default';

-- Step 6: Add device_id to pdf_queries based on the PDF document
UPDATE pdf_queries 
SET device_id = (
    SELECT up.device_id 
    FROM unified_pdfs up 
    WHERE up.id = pdf_queries.pdf_document_id
)
WHERE device_id IS NULL;

-- Step 7: Verify migration results
SELECT 
    'unified_pdfs' as table_name,
    COUNT(*) as record_count
FROM unified_pdfs
UNION ALL
SELECT 
    'pdf_queries' as table_name,
    COUNT(*) as record_count
FROM pdf_queries
UNION ALL
SELECT 
    'device_documentation (old)' as table_name,
    COUNT(*) as record_count
FROM device_documentation
UNION ALL
SELECT 
    'knowledge_documents (old)' as table_name,
    COUNT(*) as record_count
FROM knowledge_documents
UNION ALL
SELECT 
    'pdf_documents (old)' as table_name,
    COUNT(*) as record_count
FROM pdf_documents;

-- Step 8: Show device-associated PDFs
SELECT 
    up.device_name,
    up.original_filename,
    up.document_type,
    up.processing_status,
    up.vectorized
FROM unified_pdfs up
WHERE up.device_id IS NOT NULL
ORDER BY up.device_name, up.uploaded_at DESC;

-- Step 9: Show general PDFs
SELECT 
    up.original_filename,
    up.document_type,
    up.processing_status,
    up.vectorized,
    up.organization_id
FROM unified_pdfs up
WHERE up.device_id IS NULL
ORDER BY up.uploaded_at DESC;

-- Migration complete! 
-- You can now safely drop the old tables after verifying the data migration:
-- DROP TABLE IF EXISTS device_documentation CASCADE;
-- DROP TABLE IF EXISTS knowledge_documents CASCADE;
-- DROP TABLE IF EXISTS pdf_documents CASCADE;
