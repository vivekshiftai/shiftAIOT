#!/bin/bash

# IoT Platform Build and Deploy Script for VM
# This script builds and deploys both backend and frontend

set -e

# Configuration
PROJECT_ROOT="/opt/iot-platform"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
LOG_DIR="/var/log/iot-platform"
BUILD_LOG="$LOG_DIR/build.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> $BUILD_LOG
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" >> $BUILD_LOG
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1" >> $BUILD_LOG
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1" >> $BUILD_LOG
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chown $USER:$USER $LOG_DIR

# Clear previous build log
> $BUILD_LOG

log "🚀 Starting IoT Platform Build and Deploy Process"

# Check prerequisites
log "📋 Checking prerequisites..."

# Check Java
if ! command -v java &> /dev/null; then
    error "Java is not installed"
    error "Please install Java 17+ first"
    exit 1
fi

JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
log "✅ Java version: $JAVA_VERSION"

# Check Maven
if ! command -v mvn &> /dev/null; then
    error "Maven is not installed"
    error "Please install Maven first"
    exit 1
fi

MAVEN_VERSION=$(mvn --version | head -n 1)
log "✅ Maven: $MAVEN_VERSION"

# Check Node.js
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
    error "Please install Node.js 18+ first"
    exit 1
fi

NODE_VERSION=$(node --version)
log "✅ Node.js version: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm --version)
log "✅ npm version: $NPM_VERSION"

# Create project directory structure
log "📁 Creating project directory structure..."
sudo mkdir -p $PROJECT_ROOT
sudo mkdir -p $BACKEND_DIR
sudo mkdir -p $FRONTEND_DIR
sudo chown -R $USER:$USER $PROJECT_ROOT

# Copy backend files
log "📦 Copying backend files..."
if [ -d "backend" ]; then
    cp -r backend/* $BACKEND_DIR/
    log "✅ Backend files copied"
else
    error "Backend directory not found in current location"
    exit 1
fi

# Copy frontend files
log "📦 Copying frontend files..."
if [ -d "src" ] && [ -f "package.json" ]; then
    cp -r * $FRONTEND_DIR/
    log "✅ Frontend files copied"
else
    error "Frontend files not found in current location"
    exit 1
fi

# Build Backend
log "🔨 Building backend..."
cd $BACKEND_DIR

# Clean and build
log "🧹 Cleaning previous builds..."
mvn clean >> $BUILD_LOG 2>&1

log "🏗️ Building backend JAR..."
mvn package -DskipTests >> $BUILD_LOG 2>&1

if [ $? -eq 0 ]; then
    log "✅ Backend build successful"
    
    # Copy JAR to deployment location
    JAR_FILE=$(find target -name "*.jar" -not -name "*sources.jar" -not -name "*javadoc.jar" | head -1)
    if [ -n "$JAR_FILE" ]; then
        cp $JAR_FILE $PROJECT_ROOT/iot-platform-backend-0.0.1-SNAPSHOT.jar
        log "✅ Backend JAR deployed: $PROJECT_ROOT/iot-platform-backend-0.0.1-SNAPSHOT.jar"
    else
        error "Backend JAR file not found"
        exit 1
    fi
else
    error "❌ Backend build failed"
    error "Check build log: $BUILD_LOG"
    exit 1
fi

# Build Frontend
log "🔨 Building frontend..."
cd $FRONTEND_DIR

# Install dependencies
log "📦 Installing frontend dependencies..."
npm install >> $BUILD_LOG 2>&1

if [ $? -ne 0 ]; then
    error "❌ Frontend dependency installation failed"
    error "Check build log: $BUILD_LOG"
    exit 1
fi

# Build frontend
log "🏗️ Building frontend..."
npm run build >> $BUILD_LOG 2>&1

if [ $? -eq 0 ]; then
    log "✅ Frontend build successful"
else
    error "❌ Frontend build failed"
    error "Check build log: $BUILD_LOG"
    exit 1
fi

# Copy deployment scripts
log "📜 Copying deployment scripts..."
if [ -d "deploy" ]; then
    cp deploy/*.sh $PROJECT_ROOT/
    chmod +x $PROJECT_ROOT/*.sh
    log "✅ Deployment scripts copied and made executable"
fi

# Create systemd service files
log "🔧 Creating systemd service files..."

# Backend service
sudo tee /etc/systemd/system/iot-platform-backend.service > /dev/null <<EOF
[Unit]
Description=IoT Platform Backend
After=network.target postgresql.service redis.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$PROJECT_ROOT
ExecStart=$PROJECT_ROOT/start-backend.sh
ExecStop=$PROJECT_ROOT/stop-backend.sh
PIDFile=/var/run/iot-platform-backend.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
sudo tee /etc/systemd/system/iot-platform-frontend.service > /dev/null <<EOF
[Unit]
Description=IoT Platform Frontend
After=network.target iot-platform-backend.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$FRONTEND_DIR
ExecStart=$PROJECT_ROOT/start-frontend.sh
ExecStop=$PROJECT_ROOT/stop-frontend.sh
PIDFile=/var/run/iot-platform-frontend.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

log "✅ Systemd service files created"

# Create environment file
log "⚙️ Creating environment configuration..."
sudo tee $PROJECT_ROOT/.env > /dev/null <<EOF
# Database Configuration
DB_USERNAME=postgres
DB_PASSWORD=123
DB_URL=jdbc:postgresql://localhost:5432/iotplatform

# JWT Configuration
JWT_SECRET=shiftAIOT_secure_jwt_secret_key_2024_should_be_at_least_256_bits_long_for_security

# Email Configuration
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# InfluxDB Configuration
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=my-token
INFLUX_ORG=iot-platform
INFLUX_BUCKET=telemetry

# MQTT Configuration
MQTT_BROKER_URL=tcp://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
EOF

log "✅ Environment configuration created"

# Create startup script
log "📜 Creating startup script..."
sudo tee $PROJECT_ROOT/start-all.sh > /dev/null <<EOF
#!/bin/bash
# IoT Platform Complete Startup Script

echo "🚀 Starting IoT Platform..."

# Start backend
echo "📡 Starting backend..."
sudo systemctl start iot-platform-backend
sleep 10

# Start frontend
echo "🖥️ Starting frontend..."
sudo systemctl start iot-platform-frontend
sleep 5

# Check status
echo "📊 Service Status:"
sudo systemctl status iot-platform-backend --no-pager -l
echo ""
sudo systemctl status iot-platform-frontend --no-pager -l

echo "✅ IoT Platform started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:8100"
echo "📊 Health: http://localhost:8100/actuator/health"
EOF

chmod +x $PROJECT_ROOT/start-all.sh

# Create shutdown script
sudo tee $PROJECT_ROOT/stop-all.sh > /dev/null <<EOF
#!/bin/bash
# IoT Platform Complete Shutdown Script

echo "🛑 Stopping IoT Platform..."

# Stop frontend
echo "🖥️ Stopping frontend..."
sudo systemctl stop iot-platform-frontend

# Stop backend
echo "📡 Stopping backend..."
sudo systemctl stop iot-platform-backend

echo "✅ IoT Platform stopped successfully!"
EOF

chmod +x $PROJECT_ROOT/stop-all.sh

# Create status script
sudo tee $PROJECT_ROOT/status.sh > /dev/null <<EOF
#!/bin/bash
# IoT Platform Status Script

echo "📊 IoT Platform Status"
echo "======================"

echo "Backend Status:"
sudo systemctl status iot-platform-backend --no-pager -l
echo ""

echo "Frontend Status:"
sudo systemctl status iot-platform-frontend --no-pager -l
echo ""

echo "Port Status:"
echo "Backend (8100): \$(lsof -i :8100 | wc -l) connections"
echo "Frontend (3000): \$(lsof -i :3000 | wc -l) connections"
echo ""

echo "Log Files:"
echo "Backend: /var/log/iot-platform/iot-platform-backend.log"
echo "Frontend: /var/log/iot-platform/frontend.log"
echo "Build: /var/log/iot-platform/build.log"
EOF

chmod +x $PROJECT_ROOT/status.sh

log "✅ Deployment scripts created"

# Final summary
log "🎉 Build and Deploy Process Completed Successfully!"
echo ""
log "📋 Next Steps:"
log "1. Configure your environment variables in: $PROJECT_ROOT/.env"
log "2. Ensure PostgreSQL and Redis are running"
log "3. Start the services:"
log "   - Manual: $PROJECT_ROOT/start-all.sh"
log "   - Systemd: sudo systemctl start iot-platform-backend iot-platform-frontend"
log "4. Enable auto-start: sudo systemctl enable iot-platform-backend iot-platform-frontend"
log "5. Check status: $PROJECT_ROOT/status.sh"
echo ""
log "🌐 Access URLs:"
log "   Frontend: http://localhost:3000"
log "   Backend: http://localhost:8100"
log "   Health: http://localhost:8100/actuator/health"
echo ""
log "📁 Important Directories:"
log "   Application: $PROJECT_ROOT"
log "   Logs: $LOG_DIR"
log "   Scripts: $PROJECT_ROOT/*.sh"
