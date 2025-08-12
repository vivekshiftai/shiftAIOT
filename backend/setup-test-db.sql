-- Create test database for shiftAIOT Platform
-- Run this script as a PostgreSQL superuser

-- Create test database
CREATE DATABASE iotplatform_test;

-- Connect to the test database
\c iotplatform_test;

-- Create schema (this will be handled by JPA with ddl-auto: create-drop)
-- The application will create all tables automatically when tests run

-- Grant permissions (adjust as needed for your PostgreSQL setup)
GRANT ALL PRIVILEGES ON DATABASE iotplatform_test TO root;
GRANT ALL PRIVILEGES ON SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO root;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO root;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO root;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO root;
