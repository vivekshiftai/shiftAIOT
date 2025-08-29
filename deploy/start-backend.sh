#!/bin/bash

# IoT Platform Backend Startup Script for VM
# This script starts the Spring Boot backend as a background service

set -e

# Configuration
APP_NAME="iot-platform-backend"
JAR_FILE="iot-platform-backend-0.0.1-SNAPSHOT.jar"
APP_DIR="/opt/iot-platform"
LOG_DIR="/var/log/iot-platform"
BACKEND_LOG="$LOG_DIR/backend.log"
PID_FILE="/var/run/iot-platform/iot-platform-backend.pid"
JAVA_OPTS="-Xms512m -Xmx2g -XX:+UseG1GC -XX:+UseStringDeduplication"
SPRING_PROFILES="prod"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root"
   exit 1
fi

# Create directories if they don't exist
log "Creating necessary directories..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $LOG_DIR
sudo mkdir -p /var/run/iot-platform
sudo chown $USER:$USER $APP_DIR
sudo chown $USER:$USER $LOG_DIR
sudo chown $USER:$USER /var/run/iot-platform

# Check if JAR file exists
if [ ! -f "$APP_DIR/$JAR_FILE" ]; then
    error "JAR file not found: $APP_DIR/$JAR_FILE"
    error "Please build the application first using: mvn clean package"
    exit 1
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null 2>&1; then
        warn "Application is already running with PID: $PID"
        read -p "Do you want to stop it and restart? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "Stopping existing process..."
            kill $PID
            sleep 5
            rm -f $PID_FILE
        else
            log "Exiting..."
            exit 0
        fi
    else
        warn "PID file exists but process is not running. Removing stale PID file."
        rm -f $PID_FILE
    fi
fi

# Set environment variables
export JAVA_HOME=${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk}
export PATH=$JAVA_HOME/bin:$PATH

# Check Java version
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
log "Using Java version: $JAVA_VERSION"

# Start the application
log "Starting $APP_NAME..."
nohup java $JAVA_OPTS \
    -Dspring.profiles.active=$SPRING_PROFILES \
    -Dserver.port=8100 \
    -Dlogging.file.path=$LOG_DIR \
    -Dlogging.file.name=$BACKEND_LOG \
    -jar $APP_DIR/$JAR_FILE > $LOG_DIR/startup.log 2>&1 &

# Save PID
echo $! > $PID_FILE

# Wait a moment and check if started successfully
sleep 5

if [ -f "$PID_FILE" ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null 2>&1; then
        log "✅ $APP_NAME started successfully with PID: $PID"
        log "📁 Logs available at: $LOG_DIR/"
        log "🌐 Application URL: http://localhost:8100"
        log "📊 Health check: http://localhost:8100/actuator/health"
        log "📝 Backend log: $BACKEND_LOG"
    else
        error "❌ Failed to start $APP_NAME"
        error "Check logs at: $LOG_DIR/startup.log"
        rm -f $PID_FILE
        exit 1
    fi
else
    error "❌ PID file not created"
    exit 1
fi
