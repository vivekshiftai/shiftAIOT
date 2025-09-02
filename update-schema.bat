@echo off
echo ========================================
echo Updating shiftAIOT Database Schema
echo ========================================
echo.

echo This script will update your existing database schema to include
echo all required columns for the notifications table.
echo.

echo Please ensure your PostgreSQL database is running and accessible.
echo.

set /p DB_HOST="Enter database host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Enter database port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Enter database name: "
if "%DB_NAME%"=="" (
    echo Database name is required!
    pause
    exit /b 1
)

set /p DB_USER="Enter database username: "
if "%DB_USER%"=="" (
    echo Database username is required!
    pause
    exit /b 1
)

echo.
echo Updating database schema...
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f "backend/src/main/resources/schema.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ Schema update completed successfully!
    echo ========================================
    echo.
    echo Your database now has the complete schema including:
    echo - All required notifications table columns
    echo - Proper indexes for optimal performance
    echo - Device deletion should now work properly
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ Schema update failed!
    echo ========================================
    echo.
    echo Please check the error messages above and try again.
    echo.
)

pause
