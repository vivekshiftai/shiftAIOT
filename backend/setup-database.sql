-- Database Setup Script for shiftAIOT Platform
-- Run this script as PostgreSQL superuser

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE iotplatform'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'iotplatform')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE iotplatform TO postgres;

-- Connect to the database
\c iotplatform;

-- The application will automatically create tables using schema.sql
-- No additional setup required
