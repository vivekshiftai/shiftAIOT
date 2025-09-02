#!/bin/bash

echo "========================================"
echo "Fixing Notifications Table Schema"
echo "========================================"
echo

echo "This script will fix the notifications table schema by adding missing columns."
echo "This is required to resolve device deletion errors."
echo

echo "Please ensure your PostgreSQL database is running and accessible."
echo

# Get database connection details
read -p "Enter database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Enter database name: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo "Database name is required!"
    exit 1
fi

read -p "Enter database username: " DB_USER
if [ -z "$DB_USER" ]; then
    echo "Database username is required!"
    exit 1
fi

echo
echo "Running database migration..."
echo

# Run the migration
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "backend/src/main/resources/db-migration-fix-notifications-schema.sql"

if [ $? -eq 0 ]; then
    echo
    echo "========================================"
    echo "✅ Schema fix completed successfully!"
    echo "========================================"
    echo
    echo "The notifications table has been updated with all required columns."
    echo "Device deletion should now work properly."
    echo
else
    echo
    echo "========================================"
    echo "❌ Schema fix failed!"
    echo "========================================"
    echo
    echo "Please check the error messages above and try again."
    echo
    exit 1
fi
