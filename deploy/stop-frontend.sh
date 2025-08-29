#!/bin/bash

# IoT Platform Frontend Stop Script for VM
# This script stops the React frontend service

set -e

# Configuration
APP_NAME="iot-platform-frontend"
PID_FILE="/var/run/iot-platform-frontend.pid"
LOG_DIR="/var/log/iot-platform"

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

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
    warn "PID file not found: $PID_FILE"
    warn "Application may not be running"
    exit 0
fi

# Read PID from file
PID=$(cat $PID_FILE)

# Check if process is running
if ! ps -p $PID > /dev/null 2>&1; then
    warn "Process with PID $PID is not running"
    warn "Removing stale PID file"
    rm -f $PID_FILE
    exit 0
fi

# Stop the application gracefully
log "Stopping $APP_NAME (PID: $PID)..."

# Send SIGTERM signal
kill $PID

# Wait for graceful shutdown (up to 30 seconds)
TIMEOUT=30
COUNTER=0

while ps -p $PID > /dev/null 2>&1 && [ $COUNTER -lt $TIMEOUT ]; do
    sleep 1
    COUNTER=$((COUNTER + 1))
    if [ $((COUNTER % 5)) -eq 0 ]; then
        log "Waiting for graceful shutdown... ($COUNTER/$TIMEOUT seconds)"
    fi
done

# Check if process is still running
if ps -p $PID > /dev/null 2>&1; then
    warn "Process did not stop gracefully, force killing..."
    kill -9 $PID
    sleep 2
    
    if ps -p $PID > /dev/null 2>&1; then
        error "❌ Failed to stop process with PID: $PID"
        exit 1
    fi
fi

# Remove PID file
rm -f $PID_FILE

log "✅ $APP_NAME stopped successfully"
log "📁 Logs are available at: $LOG_DIR/"
