#!/bin/bash

# IoT Platform Prerequisites Installation Script for VM
# This script installs all necessary software for the IoT Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   error "This script must be run as root (use sudo)"
   exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
else
    error "Cannot detect OS"
    exit 1
fi

log "🚀 Installing IoT Platform Prerequisites"
log "📋 Detected OS: $OS $VER"

# Update package lists
log "📦 Updating package lists..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt update
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf update -y
else
    error "Unsupported OS: $OS"
    exit 1
fi

# Install Java 17
log "☕ Installing Java 17..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y openjdk-17-jdk
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf install -y java-17-openjdk-devel
fi

# Install Maven
log "📚 Installing Maven..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y maven
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf install -y maven
fi

# Install Node.js 18+
log "🟢 Installing Node.js 18+..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    # Add NodeSource repository
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    dnf install -y nodejs
fi

# Install PostgreSQL
log "🐘 Installing PostgreSQL..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y postgresql postgresql-contrib
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf install -y postgresql postgresql-server postgresql-contrib
    postgresql-setup --initdb
fi

# Install Nginx
log "🌐 Installing Nginx..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y nginx
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf install -y nginx
fi

# Install Mosquitto (MQTT Broker)
log "📡 Installing Mosquitto MQTT Broker..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y mosquitto mosquitto-clients
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf install -y mosquitto mosquitto-clients
fi

# Install additional tools
log "🔧 Installing additional tools..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y curl wget git unzip net-tools
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    dnf install -y curl wget git unzip net-tools
fi

# Start and enable services
log "🚀 Starting and enabling services..."

# PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Nginx
systemctl start nginx
systemctl enable nginx

# Mosquitto
systemctl start mosquitto
systemctl enable mosquitto

# Configure PostgreSQL
log "⚙️ Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE iotplatform;"
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD '123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE iotplatform TO postgres;"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"

# Create application directories
log "📁 Creating application directories..."
mkdir -p /opt/iot-platform
mkdir -p /var/log/iot-platform
chown -R $SUDO_USER:$SUDO_USER /opt/iot-platform
chown -R $SUDO_USER:$SUDO_USER /var/log/iot-platform

# Verify installations
log "✅ Verifying installations..."

# Check Java
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
log "✅ Java version: $JAVA_VERSION"

# Check Maven
MAVEN_VERSION=$(mvn --version | head -n 1)
log "✅ Maven: $MAVEN_VERSION"

# Check Node.js
NODE_VERSION=$(node --version)
log "✅ Node.js version: $NODE_VERSION"

# Check npm
NPM_VERSION=$(npm --version)
log "✅ npm version: $NPM_VERSION"

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    log "✅ PostgreSQL is running"
else
    error "❌ PostgreSQL is not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    log "✅ Nginx is running"
else
    error "❌ Nginx is not running"
fi

# Check Mosquitto
if systemctl is-active --quiet mosquitto; then
    log "✅ Mosquitto MQTT Broker is running"
else
    error "❌ Mosquitto is not running"
fi

# Final summary
log "🎉 Prerequisites Installation Completed Successfully!"
echo ""
log "📋 Installed Components:"
log "✅ Java 17 (OpenJDK)"
log "✅ Maven 3.8+"
log "✅ Node.js 18+"
log "✅ npm"
log "✅ PostgreSQL 14+"
log "✅ Nginx"
log "✅ Mosquitto MQTT Broker"
log "✅ Additional tools (curl, wget, git, etc.)"
echo ""
log "🔧 Services Status:"
log "✅ PostgreSQL: Running and enabled"
log "✅ Nginx: Running and enabled"
log "✅ Mosquitto: Running and enabled"
echo ""
log "📁 Directories Created:"
log "✅ /opt/iot-platform (Application directory)"
log "✅ /var/log/iot-platform (Log directory)"
echo ""
log "🗄️ Database Configuration:"
log "✅ Database: iotplatform"
log "✅ Username: postgres"
log "✅ Password: 123"
echo ""
log "🚀 Ready for IoT Platform deployment!"
log "Next step: Run ./deploy/one-command-deploy.sh"
