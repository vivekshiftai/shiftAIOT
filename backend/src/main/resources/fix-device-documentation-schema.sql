-- Fix Device Documentation Table Schema
-- This script adds the missing title column to the device_documentation table
-- Run this script to fix the "null value in column title violates not-null constraint" error

-- Step 1: Add missing title column to device_documentation table if it doesn't exist
DO $$ 
BEGIN
    -- Add title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'title') THEN
        ALTER TABLE device_documentation ADD COLUMN title VARCHAR(255);
        RAISE NOTICE 'Added title column to device_documentation table';
    ELSE
        RAISE NOTICE 'Title column already exists in device_documentation table';
    END IF;
    
    -- Add any other missing columns that might be needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'document_type') THEN
        ALTER TABLE device_documentation ADD COLUMN document_type VARCHAR(50);
        RAISE NOTICE 'Added document_type column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'filename') THEN
        ALTER TABLE device_documentation ADD COLUMN filename VARCHAR(255);
        RAISE NOTICE 'Added filename column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'original_filename') THEN
        ALTER TABLE device_documentation ADD COLUMN original_filename VARCHAR(255);
        RAISE NOTICE 'Added original_filename column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'file_size') THEN
        ALTER TABLE device_documentation ADD COLUMN file_size BIGINT;
        RAISE NOTICE 'Added file_size column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'file_path') THEN
        ALTER TABLE device_documentation ADD COLUMN file_path VARCHAR(500);
        RAISE NOTICE 'Added file_path column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'processing_status') THEN
        ALTER TABLE device_documentation ADD COLUMN processing_status VARCHAR(50) DEFAULT 'PENDING';
        RAISE NOTICE 'Added processing_status column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'processing_summary') THEN
        ALTER TABLE device_documentation ADD COLUMN processing_summary TEXT;
        RAISE NOTICE 'Added processing_summary column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'total_pages') THEN
        ALTER TABLE device_documentation ADD COLUMN total_pages INTEGER;
        RAISE NOTICE 'Added total_pages column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'processed_chunks') THEN
        ALTER TABLE device_documentation ADD COLUMN processed_chunks INTEGER;
        RAISE NOTICE 'Added processed_chunks column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'processing_time') THEN
        ALTER TABLE device_documentation ADD COLUMN processing_time VARCHAR(100);
        RAISE NOTICE 'Added processing_time column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'collection_name') THEN
        ALTER TABLE device_documentation ADD COLUMN collection_name VARCHAR(255);
        RAISE NOTICE 'Added collection_name column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'pdf_name') THEN
        ALTER TABLE device_documentation ADD COLUMN pdf_name VARCHAR(255);
        RAISE NOTICE 'Added pdf_name column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'created_at') THEN
        ALTER TABLE device_documentation ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to device_documentation table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'device_documentation' AND column_name = 'updated_at') THEN
        ALTER TABLE device_documentation ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added updated_at column to device_documentation table';
    END IF;
    
END $$;

-- Step 2: Update existing records to set default title values
UPDATE device_documentation 
SET title = COALESCE(filename, 'Untitled Document') 
WHERE title IS NULL;

-- Step 3: Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_device_documentation_device ON device_documentation(device_id);
CREATE INDEX IF NOT EXISTS idx_device_documentation_title ON device_documentation(title);
CREATE INDEX IF NOT EXISTS idx_device_documentation_type ON device_documentation(document_type);

-- Step 4: Verify the fix
SELECT 
    'Schema fix completed successfully' as status,
    COUNT(*) as total_documents,
    COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as documents_with_title,
    COUNT(CASE WHEN document_type IS NOT NULL THEN 1 END) as documents_with_type
FROM device_documentation;

-- Step 5: Show table structure
\d device_documentation;

