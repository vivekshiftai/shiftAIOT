#!/bin/bash

# IoT Platform One-Command Deployment Script for VM
# This script handles everything: prerequisites, build, deploy, and start services

set -e

# Configuration
PROJECT_ROOT="/opt/iot-platform"
LOG_DIR="/var/log/iot-platform"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"
BUILD_LOG="$LOG_DIR/build.log"
DEPLOY_LOG="$LOG_DIR/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $DEPLOY_LOG
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> $DEPLOY_LOG
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> $DEPLOY_LOG
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1" >> $DEPLOY_LOG
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chown $USER:$USER $LOG_DIR

# Clear previous logs
> $DEPLOY_LOG
> $BUILD_LOG

log "🚀 Starting IoT Platform One-Command Deployment"
log "📁 Logs will be stored in: $LOG_DIR"

# Step 1: Check and Install Prerequisites
log "📋 Step 1: Checking prerequisites..."

# Check Java
if ! command -v java &> /dev/null; then
    error "Java is not installed. Please run: sudo ./deploy/install-prerequisites.sh"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
log "✅ Java version: $JAVA_VERSION"

# Check Maven
if ! command -v mvn &> /dev/null; then
    error "Maven is not installed. Please run: sudo ./deploy/install-prerequisites.sh"
    exit 1
fi

MAVEN_VERSION=$(mvn --version | head -n 1)
log "✅ Maven: $MAVEN_VERSION"

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Please run: sudo ./deploy/install-prerequisites.sh"
    exit 1
fi

NODE_VERSION=$(node --version)
log "✅ Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Please run: sudo ./deploy/install-prerequisites.sh"
    exit 1
fi

NPM_VERSION=$(npm --version)
log "✅ npm version: $NPM_VERSION"

# Check PostgreSQL
if ! systemctl is-active --quiet postgresql; then
    error "PostgreSQL is not running. Please run: sudo ./deploy/install-prerequisites.sh"
    exit 1
fi
log "✅ PostgreSQL is running"

# Step 2: Build Applications
log "🔨 Step 2: Building applications..."

# Build Backend
log "🏗️ Building backend..."
cd backend
mvn clean package -DskipTests >> $BUILD_LOG 2>&1

if [ $? -eq 0 ]; then
    log "✅ Backend build successful"
else
    error "❌ Backend build failed. Check: $BUILD_LOG"
    exit 1
fi

# Build Frontend
log "🏗️ Building frontend..."
cd ..
npm install >> $BUILD_LOG 2>&1
npm run build >> $BUILD_LOG 2>&1

if [ $? -eq 0 ]; then
    log "✅ Frontend build successful"
else
    error "❌ Frontend build failed. Check: $BUILD_LOG"
    exit 1
fi

# Step 3: Deploy Applications
log "📦 Step 3: Deploying applications..."

# Create deployment directory
sudo mkdir -p $PROJECT_ROOT
sudo chown $USER:$USER $PROJECT_ROOT

# Copy backend JAR
JAR_FILE=$(find backend/target -name "*.jar" -not -name "*sources.jar" -not -name "*javadoc.jar" | head -1)
if [ -n "$JAR_FILE" ]; then
    cp $JAR_FILE $PROJECT_ROOT/iot-platform-backend-0.0.1-SNAPSHOT.jar
    log "✅ Backend JAR deployed: $PROJECT_ROOT/iot-platform-backend-0.0.1-SNAPSHOT.jar"
else
    error "❌ Backend JAR file not found"
    exit 1
fi

# Copy frontend files
sudo mkdir -p $PROJECT_ROOT/frontend
sudo chown $USER:$USER $PROJECT_ROOT/frontend
cp -r dist/* $PROJECT_ROOT/frontend/
cp package.json $PROJECT_ROOT/frontend/
log "✅ Frontend files deployed to: $PROJECT_ROOT/frontend/"

# Step 4: Create Service Files
log "🔧 Step 4: Creating service files..."

# Create backend service
sudo tee /etc/systemd/system/iot-platform-backend.service > /dev/null <<EOF
[Unit]
Description=IoT Platform Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=/usr/bin/java -Xms512m -Xmx2g -Dspring.profiles.active=prod -Dlogging.file.path=$LOG_DIR -Dlogging.file.name=$BACKEND_LOG -jar iot-platform-backend-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create frontend service
sudo tee /etc/systemd/system/iot-platform-frontend.service > /dev/null <<EOF
[Unit]
Description=IoT Platform Frontend
After=network.target iot-platform-backend.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_ROOT/frontend
ExecStart=/usr/bin/npm run preview
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload
log "✅ Systemd services created"

# Step 5: Create Environment Configuration
log "⚙️ Step 5: Creating environment configuration..."

sudo tee $PROJECT_ROOT/application.yml > /dev/null <<EOF
server:
  port: 8100

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/iotplatform
    username: postgres
    password: 123
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: false

jwt:
  secret: shiftAIOT_secure_jwt_secret_key_2025
  expiration: 86400000

logging:
  level:
    com.iotplatform: INFO
    org.springframework: WARN
  file:
    path: $LOG_DIR
    name: $BACKEND_LOG
EOF

# Step 6: Create Management Scripts
log "📜 Step 6: Creating management scripts..."

# Create start script
sudo tee $PROJECT_ROOT/start.sh > /dev/null <<EOF
#!/bin/bash
echo "🚀 Starting IoT Platform..."
sudo systemctl start iot-platform-backend
sleep 10
sudo systemctl start iot-platform-frontend
sleep 5
echo "✅ IoT Platform started!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:8100"
echo "📊 Health: http://localhost:8100/actuator/health"
echo "📁 Logs: $LOG_DIR"
EOF

# Create stop script
sudo tee $PROJECT_ROOT/stop.sh > /dev/null <<EOF
#!/bin/bash
echo "🛑 Stopping IoT Platform..."
sudo systemctl stop iot-platform-frontend
sudo systemctl stop iot-platform-backend
echo "✅ IoT Platform stopped!"
EOF

# Create status script
sudo tee $PROJECT_ROOT/status.sh > /dev/null <<EOF
#!/bin/bash
echo "📊 IoT Platform Status"
echo "======================"
echo ""
echo "Backend Status:"
sudo systemctl status iot-platform-backend --no-pager -l
echo ""
echo "Frontend Status:"
sudo systemctl status iot-platform-frontend --no-pager -l
echo ""
echo "Port Status:"
echo "Backend (8100): \$(netstat -tuln | grep :8100 | wc -l) connections"
echo "Frontend (5173): \$(netstat -tuln | grep :5173 | wc -l) connections"
echo ""
echo "Log Files:"
echo "Backend: $BACKEND_LOG"
echo "Frontend: $FRONTEND_LOG"
echo "Build: $BUILD_LOG"
echo "Deploy: $DEPLOY_LOG"
EOF

# Create logs script
sudo tee $PROJECT_ROOT/logs.sh > /dev/null <<EOF
#!/bin/bash
echo "📁 IoT Platform Logs"
echo "==================="
echo ""
echo "Backend Log (last 50 lines):"
echo "============================"
tail -50 $BACKEND_LOG
echo ""
echo "Frontend Log (last 50 lines):"
echo "============================="
tail -50 $FRONTEND_LOG
echo ""
echo "Build Log (last 20 lines):"
echo "=========================="
tail -20 $BUILD_LOG
EOF

# Make scripts executable
chmod +x $PROJECT_ROOT/*.sh

# Step 7: Start Services
log "🚀 Step 7: Starting services..."

# Start backend
sudo systemctl start iot-platform-backend
sleep 10

# Check if backend started successfully
if systemctl is-active --quiet iot-platform-backend; then
    log "✅ Backend service started successfully"
else
    error "❌ Backend service failed to start"
    sudo journalctl -u iot-platform-backend -n 20
    exit 1
fi

# Start frontend
sudo systemctl start iot-platform-frontend
sleep 5

# Check if frontend started successfully
if systemctl is-active --quiet iot-platform-frontend; then
    log "✅ Frontend service started successfully"
else
    error "❌ Frontend service failed to start"
    sudo journalctl -u iot-platform-frontend -n 20
    exit 1
fi

# Enable services for auto-start
sudo systemctl enable iot-platform-backend
sudo systemctl enable iot-platform-frontend

# Step 8: Verify Deployment
log "🔍 Step 8: Verifying deployment..."

# Wait a bit for services to fully start
sleep 10

# Check if ports are listening
if netstat -tuln | grep -q ":8100 "; then
    log "✅ Backend is listening on port 8100"
else
    warn "⚠️ Backend is not listening on port 8100"
fi

if netstat -tuln | grep -q ":5173 "; then
    log "✅ Frontend is listening on port 5173"
else
    warn "⚠️ Frontend is not listening on port 5173"
fi

# Test backend health
if curl -s http://localhost:8100/actuator/health > /dev/null 2>&1; then
    log "✅ Backend health check passed"
else
    warn "⚠️ Backend health check failed"
fi

# Final Summary
log "🎉 IoT Platform Deployment Completed Successfully!"
echo ""
log "📋 Deployment Summary:"
log "✅ Backend: Built and deployed"
log "✅ Frontend: Built and deployed"
log "✅ Services: Started and enabled"
log "✅ Logs: Configured in $LOG_DIR"
echo ""
log "🌐 Access URLs:"
log "   Frontend: http://localhost:5173"
log "   Backend API: http://localhost:8100"
log "   Health Check: http://localhost:8100/actuator/health"
echo ""
log "📁 Management Commands:"
log "   Start: $PROJECT_ROOT/start.sh"
log "   Stop: $PROJECT_ROOT/stop.sh"
log "   Status: $PROJECT_ROOT/status.sh"
log "   Logs: $PROJECT_ROOT/logs.sh"
echo ""
log "📁 Log Files:"
log "   Backend: $BACKEND_LOG"
log "   Frontend: $FRONTEND_LOG"
log "   Build: $BUILD_LOG"
log "   Deploy: $DEPLOY_LOG"
echo ""
log "🔧 Systemd Commands:"
log "   Status: sudo systemctl status iot-platform-backend iot-platform-frontend"
log "   Restart: sudo systemctl restart iot-platform-backend iot-platform-frontend"
log "   Logs: sudo journalctl -u iot-platform-backend -f"
echo ""
log "🚀 Your IoT Platform is now running as a background service!"
