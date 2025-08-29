# IoT Platform VM Deployment Guide

This guide provides comprehensive instructions for deploying the IoT Platform as a background task in a Virtual Machine (VM).

## 🚀 Quick Start

### 1. Prerequisites Installation
```bash
# Run as root
sudo ./deploy/install-prerequisites.sh
```

### 2. Build and Deploy
```bash
# Switch to application user
su - iotuser

# Clone your repository and run build script
./deploy/build-and-deploy.sh
```

### 3. Start Services
```bash
# Start all services
sudo systemctl start iot-platform-backend iot-platform-frontend

# Enable auto-start
sudo systemctl enable iot-platform-backend iot-platform-frontend
```

## 📋 Detailed Instructions

### Step 1: VM Setup

#### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Rocky Linux 8+
- **RAM**: Minimum 4GB (8GB recommended)
- **Storage**: Minimum 20GB free space
- **CPU**: 2+ cores
- **Network**: Internet access for package installation

#### VM Creation
1. Create a new VM with the above specifications
2. Install your preferred Linux distribution
3. Ensure SSH access is enabled
4. Update the system: `sudo apt update && sudo apt upgrade -y`

### Step 2: Install Prerequisites

The prerequisites script installs all required software:

```bash
# Download the deployment scripts
git clone <your-repo-url>
cd <your-repo>

# Run prerequisites installation (as root)
sudo ./deploy/install-prerequisites.sh
```

**What gets installed:**
- Java 17 (OpenJDK)
- Maven 3.8+
- Node.js 18+
- PostgreSQL 13+
- Redis 6+
- InfluxDB 2.7+
- MQTT Broker (Mosquitto)
- Nginx (Reverse Proxy)
- Monitoring tools (htop, iotop, nethogs)

### Step 3: Build and Deploy

```bash
# Switch to application user
su - iotuser

# Navigate to project directory
cd /path/to/your/project

# Run build and deploy script
./deploy/build-and-deploy.sh
```

**What happens during build:**
1. Copies backend and frontend files to `/opt/iot-platform/`
2. Builds backend JAR file using Maven
3. Builds frontend using npm
4. Creates systemd service files
5. Sets up environment configuration
6. Creates management scripts

### Step 4: Configure Environment

Edit the environment file:
```bash
sudo nano /opt/iot-platform/.env
```

**Key configurations:**
```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=123
DB_URL=jdbc:postgresql://localhost:5432/iotplatform

# JWT
JWT_SECRET=your-secure-jwt-secret

# Email (for notifications)
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# InfluxDB
INFLUX_URL=http://localhost:8086
INFLUX_TOKEN=my-token
INFLUX_ORG=iot-platform
INFLUX_BUCKET=telemetry

# MQTT
MQTT_BROKER_URL=tcp://localhost:1883
MQTT_USERNAME=
MQTT_PASSWORD=
```

### Step 5: Start Services

#### Manual Start
```bash
# Start all services
sudo /opt/iot-platform/start-all.sh

# Or start individually
sudo systemctl start iot-platform-backend
sudo systemctl start iot-platform-frontend
```

#### Enable Auto-Start
```bash
# Enable services to start on boot
sudo systemctl enable iot-platform-backend
sudo systemctl enable iot-platform-frontend
```

### Step 6: Verify Deployment

```bash
# Check service status
sudo /opt/iot-platform/status.sh

# Or check individually
sudo systemctl status iot-platform-backend
sudo systemctl status iot-platform-frontend

# Check logs
tail -f /var/log/iot-platform/iot-platform-backend.log
tail -f /var/log/iot-platform/frontend.log
```

## 🔧 Management Commands

### Service Management
```bash
# Start services
sudo systemctl start iot-platform-backend iot-platform-frontend

# Stop services
sudo systemctl stop iot-platform-backend iot-platform-frontend

# Restart services
sudo systemctl restart iot-platform-backend iot-platform-frontend

# Check status
sudo systemctl status iot-platform-backend iot-platform-frontend

# View logs
sudo journalctl -u iot-platform-backend -f
sudo journalctl -u iot-platform-frontend -f
```

### Application Scripts
```bash
# Start all services
sudo /opt/iot-platform/start-all.sh

# Stop all services
sudo /opt/iot-platform/stop-all.sh

# Check status
sudo /opt/iot-platform/status.sh

# Individual service scripts
sudo /opt/iot-platform/start-backend.sh
sudo /opt/iot-platform/stop-backend.sh
sudo /opt/iot-platform/start-frontend.sh
sudo /opt/iot-platform/stop-frontend.sh
```

### Database Management
```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database (if needed)
sudo -u postgres createdb iotplatform

# Backup database
sudo -u postgres pg_dump iotplatform > backup.sql

# Restore database
sudo -u postgres psql iotplatform < backup.sql
```

## 🌐 Access URLs

After successful deployment, access your application at:

- **Frontend**: http://your-vm-ip
- **Backend API**: http://your-vm-ip/api
- **Health Check**: http://your-vm-ip/api/actuator/health
- **InfluxDB**: http://your-vm-ip:8086
- **MQTT Broker**: tcp://your-vm-ip:1883

## 📊 Monitoring

### System Monitoring
```bash
# CPU and memory usage
htop

# Disk I/O
iotop

# Network usage
nethogs

# System resources
free -h
df -h
```

### Application Monitoring
```bash
# Check application logs
tail -f /var/log/iot-platform/iot-platform-backend.log
tail -f /var/log/iot-platform/frontend.log

# Check service status
sudo systemctl status iot-platform-backend iot-platform-frontend

# Check port usage
netstat -tuln | grep -E ':(3000|8100|1883|6379|8086)'
```

### Database Monitoring
```bash
# PostgreSQL status
sudo systemctl status postgresql

# Redis status
sudo systemctl status redis

# InfluxDB status
sudo systemctl status influxdb
```

## 🔒 Security Considerations

### Firewall Configuration
The installation script configures basic firewall rules:
- SSH (22)
- HTTP (80)
- HTTPS (443)
- Application ports (3000, 8100)
- Database ports (5432, 6379, 8086)
- MQTT (1883)

### SSL/TLS Setup (Recommended for Production)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Database Security
```bash
# Change default passwords
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'strong-password';"

# Configure PostgreSQL for remote access (if needed)
sudo nano /etc/postgresql/*/main/postgresql.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
sudo journalctl -u iot-platform-backend -n 50
sudo journalctl -u iot-platform-frontend -n 50

# Check dependencies
sudo systemctl status postgresql redis nginx
```

#### Port Already in Use
```bash
# Find process using port
sudo lsof -i :8100
sudo lsof -i :3000

# Kill process
sudo kill -9 <PID>
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "\l"

# Check logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Increase swap if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Log Locations
- **Application logs**: `/var/log/iot-platform/`
- **System logs**: `/var/log/syslog`
- **Service logs**: `sudo journalctl -u <service-name>`
- **Database logs**: `/var/log/postgresql/`
- **Nginx logs**: `/var/log/nginx/`

## 📈 Performance Optimization

### JVM Tuning
Edit the backend startup script to optimize JVM settings:
```bash
JAVA_OPTS="-Xms1g -Xmx2g -XX:+UseG1GC -XX:+UseStringDeduplication"
```

### Database Optimization
```bash
# PostgreSQL tuning
sudo nano /etc/postgresql/*/main/postgresql.conf
# Adjust: shared_buffers, effective_cache_size, work_mem
```

### Nginx Optimization
```bash
# Enable gzip compression
sudo nano /etc/nginx/nginx.conf
# Add gzip settings
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Stop services
sudo systemctl stop iot-platform-backend iot-platform-frontend

# Backup current version
sudo cp -r /opt/iot-platform /opt/iot-platform-backup

# Deploy new version
./deploy/build-and-deploy.sh

# Start services
sudo systemctl start iot-platform-backend iot-platform-frontend
```

### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Restart services if needed
sudo systemctl restart iot-platform-backend iot-platform-frontend
```

### Backup Strategy
```bash
# Database backup
sudo -u postgres pg_dump iotplatform > /backup/iotplatform-$(date +%Y%m%d).sql

# Application backup
sudo tar -czf /backup/iot-platform-$(date +%Y%m%d).tar.gz /opt/iot-platform

# Log rotation
sudo logrotate /etc/logrotate.d/iot-platform
```

## 📞 Support

For issues and support:
1. Check the troubleshooting section above
2. Review application logs
3. Check system resources
4. Verify network connectivity
5. Contact your system administrator

## 📝 License

This deployment guide is part of the IoT Platform project. Please refer to the main project license for usage terms.
