@echo off
echo ========================================
echo shiftAIOT Backend Startup Script
echo ========================================

echo.
echo Step 1: Checking for existing Java processes...
tasklist | findstr java
if %errorlevel% equ 0 (
    echo Found Java processes. Stopping them...
    taskkill /f /im java.exe
    timeout /t 3 /nobreak >nul
)

echo.
echo Step 2: Checking PostgreSQL connection...
echo Please ensure PostgreSQL is running on localhost:5432
echo Database: iotplatform
echo Username: root
echo Password: 123

echo.
echo Step 3: Starting Spring Boot application...
cd backend
echo Current directory: %CD%
echo Starting on port 8100...

mvn spring-boot:run

pause
