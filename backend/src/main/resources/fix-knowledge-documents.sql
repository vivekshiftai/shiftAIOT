-- Fix knowledge_documents table schema
-- This script fixes the mismatch between the database schema and JPA entity

-- Drop the existing table if it exists
DROP TABLE IF EXISTS knowledge_documents CASCADE;

-- Recreate the table with the correct schema
CREATE TABLE knowledge_documents (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    size BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'processing',
    vectorized BOOLEAN DEFAULT false,
    organization_id VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_organization ON knowledge_documents(organization_id);
