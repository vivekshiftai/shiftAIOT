#!/bin/bash

# IoT Platform Prerequisites Installation Script for VM
# This script installs all required software for running the IoT platform

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
log "OS: $OS $VER"

# Update package manager
log "📦 Updating package manager..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt update
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum update -y
else
    error "Unsupported OS: $OS"
    exit 1
fi

# Install basic tools
log "🔧 Installing basic tools..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y curl wget git unzip build-essential software-properties-common
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y curl wget git unzip gcc gcc-c++ make
fi

# Install Java 17
log "☕ Installing Java 17..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Add repository for OpenJDK 17
    apt install -y openjdk-17-jdk openjdk-17-jre
    update-alternatives --set java /usr/lib/jvm/java-17-openjdk-amd64/bin/java
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y java-17-openjdk java-17-openjdk-devel
fi

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk' >> /etc/environment
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/environment
source /etc/environment

# Verify Java installation
JAVA_VERSION=$(java -version 2>&1 | head -n 1 | cut -d'"' -f2)
log "✅ Java version: $JAVA_VERSION"

# Install Maven
log "📚 Installing Maven..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y maven
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y maven
fi

# Verify Maven installation
MAVEN_VERSION=$(mvn --version | head -n 1)
log "✅ Maven: $MAVEN_VERSION"

# Install Node.js 18
log "🟢 Installing Node.js 18..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    # Add NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    # Add NodeSource repository
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
    yum install -y nodejs
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "✅ Node.js version: $NODE_VERSION"
log "✅ npm version: $NPM_VERSION"

# Install PostgreSQL
log "🐘 Installing PostgreSQL..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y postgresql postgresql-contrib
    systemctl enable postgresql
    systemctl start postgresql
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y postgresql postgresql-server postgresql-contrib
    postgresql-setup initdb
    systemctl enable postgresql
    systemctl start postgresql
fi

# Configure PostgreSQL
log "⚙️ Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER postgres WITH PASSWORD '123';"
sudo -u postgres psql -c "ALTER USER postgres WITH SUPERUSER;"
sudo -u postgres createdb iotplatform

# Install Redis
log "🔴 Installing Redis..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y redis-server
    systemctl enable redis-server
    systemctl start redis-server
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y redis
    systemctl enable redis
    systemctl start redis
fi

# Install InfluxDB (optional - for time-series data)
log "📊 Installing InfluxDB..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1-amd64.deb
    dpkg -i influxdb2-2.7.1-amd64.deb
    systemctl enable influxdb
    systemctl start influxdb
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    wget https://dl.influxdata.com/influxdb/releases/influxdb2-2.7.1.x86_64.rpm
    yum localinstall -y influxdb2-2.7.1.x86_64.rpm
    systemctl enable influxdb
    systemctl start influxdb
fi

# Install MQTT Broker (Mosquitto)
log "📡 Installing MQTT Broker (Mosquitto)..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y mosquitto mosquitto-clients
    systemctl enable mosquitto
    systemctl start mosquitto
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y mosquitto mosquitto-clients
    systemctl enable mosquitto
    systemctl start mosquitto
fi

# Install Nginx (for reverse proxy)
log "🌐 Installing Nginx..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y nginx
    systemctl enable nginx
    systemctl start nginx
fi

# Configure Nginx
log "⚙️ Configuring Nginx..."
cat > /etc/nginx/sites-available/iot-platform << 'EOF'
server {
    listen 80;
    server_name localhost;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws/ {
        proxy_pass http://localhost:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable the site
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    ln -sf /etc/nginx/sites-available/iot-platform /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
fi

# Test and reload Nginx
nginx -t && systemctl reload nginx

# Install monitoring tools
log "📈 Installing monitoring tools..."
if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    apt install -y htop iotop nethogs
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Rocky"* ]]; then
    yum install -y htop iotop nethogs
fi

# Create application user
log "👤 Creating application user..."
useradd -m -s /bin/bash iotuser || true
usermod -aG sudo iotuser || usermod -aG wheel iotuser

# Set up firewall
log "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 8100/tcp
    ufw allow 1883/tcp
    ufw allow 6379/tcp
    ufw allow 8086/tcp
    ufw --force enable
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-service=ssh
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --permanent --add-port=3000/tcp
    firewall-cmd --permanent --add-port=8100/tcp
    firewall-cmd --permanent --add-port=1883/tcp
    firewall-cmd --permanent --add-port=6379/tcp
    firewall-cmd --permanent --add-port=8086/tcp
    firewall-cmd --reload
fi

# Create log directories
log "📁 Creating log directories..."
mkdir -p /var/log/iot-platform
chown iotuser:iotuser /var/log/iot-platform

# Final verification
log "🔍 Verifying installations..."

# Check services
services=("postgresql" "redis" "nginx" "mosquitto")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        log "✅ $service is running"
    else
        warn "⚠️ $service is not running"
    fi
done

# Check ports
ports=(3000 8100 1883 6379 8086 80)
for port in "${ports[@]}"; do
    if netstat -tuln | grep -q ":$port "; then
        log "✅ Port $port is listening"
    else
        warn "⚠️ Port $port is not listening"
    fi
done

log "🎉 Prerequisites installation completed!"
echo ""
log "📋 Summary:"
log "✅ Java 17: $JAVA_VERSION"
log "✅ Maven: $MAVEN_VERSION"
log "✅ Node.js: $NODE_VERSION"
log "✅ npm: $NPM_VERSION"
log "✅ PostgreSQL: Running on port 5432"
log "✅ Redis: Running on port 6379"
log "✅ InfluxDB: Running on port 8086"
log "✅ MQTT Broker: Running on port 1883"
log "✅ Nginx: Running on port 80"
echo ""
log "📋 Next Steps:"
log "1. Switch to iotuser: su - iotuser"
log "2. Clone your IoT platform repository"
log "3. Run the build and deploy script: ./deploy/build-and-deploy.sh"
log "4. Configure environment variables"
log "5. Start the services"
echo ""
log "🌐 Access URLs:"
log "   Frontend: http://localhost"
log "   Backend API: http://localhost/api"
log "   InfluxDB: http://localhost:8086"
