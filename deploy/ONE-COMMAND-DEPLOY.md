# 🚀 IoT Platform One-Command Deployment

## Quick Start

### 1. Make Script Executable
```bash
chmod +x deploy/one-command-deploy.sh
```

### 2. Run One-Command Deployment
```bash
./deploy/one-command-deploy.sh
```

That's it! The script will:
- ✅ Check all prerequisites
- ✅ Build backend and frontend
- ✅ Deploy to `/opt/iot-platform/`
- ✅ Create systemd services
- ✅ Start services automatically
- ✅ Configure logging in `/var/log/iot-platform/`

## 📁 Log Files

All logs are stored in `/var/log/iot-platform/`:

- **Backend Log**: `/var/log/iot-platform/backend.log`
- **Frontend Log**: `/var/log/iot-platform/frontend.log`
- **Build Log**: `/var/log/iot-platform/build.log`
- **Deploy Log**: `/var/log/iot-platform/deploy.log`

## 🔧 Management Commands

After deployment, use these commands:

```bash
# Start services
sudo /opt/iot-platform/start.sh

# Stop services
sudo /opt/iot-platform/stop.sh

# Check status
sudo /opt/iot-platform/status.sh

# View logs
sudo /opt/iot-platform/logs.sh
```

## 🌐 Access URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8100
- **Health Check**: http://localhost:8100/actuator/health

## 📊 Systemd Commands

```bash
# Check service status
sudo systemctl status iot-platform-backend iot-platform-frontend

# Restart services
sudo systemctl restart iot-platform-backend iot-platform-frontend

# View logs
sudo journalctl -u iot-platform-backend -f
sudo journalctl -u iot-platform-frontend -f
```

## 🚨 Troubleshooting

If deployment fails:

1. **Check prerequisites**:
   ```bash
   java -version
   mvn --version
   node --version
   sudo systemctl status postgresql
   ```

2. **Check logs**:
   ```bash
   tail -f /var/log/iot-platform/deploy.log
   tail -f /var/log/iot-platform/build.log
   ```

3. **Manual deployment**:
   ```bash
   # Install prerequisites first
   sudo ./deploy/install-prerequisites.sh
   
   # Then run deployment
   ./deploy/one-command-deploy.sh
   ```

## 🎯 What Gets Deployed

- **Backend**: Spring Boot JAR with all dependencies
- **Frontend**: React build with optimized assets
- **Services**: Systemd services for auto-start
- **Logging**: Centralized logging configuration
- **Management**: Helper scripts for easy management

## 🔒 Security

- Services run as non-root user
- Logs are properly secured
- Database connections are configured
- JWT secrets are set up

## 📈 Monitoring

- Health checks are configured
- Service status monitoring
- Log rotation is set up
- Performance metrics available

## 🗄️ Database

- **PostgreSQL**: Main database for application data
- **Database**: iotplatform
- **Username**: postgres
- **Password**: 123

## 📡 MQTT Broker

- **Mosquitto**: MQTT broker for IoT device communication
- **Port**: 1883 (default)

Your IoT Platform is now running as a production-ready background service! 🎉
