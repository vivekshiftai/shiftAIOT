#!/bin/bash

# IoT Platform Frontend Startup Script for VM
# This script starts the React frontend as a background service

set -e

# Configuration
APP_NAME="iot-platform-frontend"
APP_DIR="/opt/iot-platform/frontend"
LOG_DIR="/var/log/iot-platform"
FRONTEND_LOG="$LOG_DIR/frontend.log"
PID_FILE="/var/run/iot-platform/iot-platform-frontend.pid"
PORT=3000
NODE_ENV="production"

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
    error "Please install Node.js 18+ first"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    error "npm is not installed"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version)
log "Using Node.js version: $NODE_VERSION"

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    error "Application directory not found: $APP_DIR"
    error "Please build and deploy the frontend first"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$APP_DIR/package.json" ]; then
    error "package.json not found in $APP_DIR"
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

# Check if port is available
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    error "Port $PORT is already in use"
    error "Please stop the service using the port or change the port configuration"
    exit 1
fi

# Navigate to application directory
cd $APP_DIR

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm install --production >> $LOG_DIR/npm-install.log 2>&1
fi

# Set environment variables
export NODE_ENV=$NODE_ENV
export PORT=$PORT

# Start the application
log "Starting $APP_NAME on port $PORT..."
nohup npm run preview > $FRONTEND_LOG 2>&1 &

# Save PID
echo $! > $PID_FILE

# Wait a moment and check if started successfully
sleep 5

if [ -f "$PID_FILE" ]; then
    PID=$(cat $PID_FILE)
    if ps -p $PID > /dev/null 2>&1; then
        log "✅ $APP_NAME started successfully with PID: $PID"
        log "📁 Logs available at: $LOG_DIR/frontend.log"
        log "🌐 Application URL: http://localhost:$PORT"
        log "📝 Frontend log: $FRONTEND_LOG"
        
        # Check if application is responding
        sleep 3
        if curl -s http://localhost:$PORT > /dev/null 2>&1; then
            log "✅ Application is responding on port $PORT"
        else
            warn "⚠️ Application may not be fully started yet"
            log "Check logs: tail -f $FRONTEND_LOG"
        fi
    else
        error "❌ Failed to start $APP_NAME"
        error "Check logs at: $FRONTEND_LOG"
        rm -f $PID_FILE
        exit 1
    fi
else
    error "❌ PID file not created"
    exit 1
fi
