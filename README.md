# IoT Platform - Full Stack Application

A comprehensive IoT platform built with React TypeScript frontend and Java Spring Boot backend.

## Features

### Frontend (React TypeScript)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔐 JWT-based authentication with role-based access control
- 📊 Real-time dashboards with interactive charts
- 🏭 Device management with status monitoring
- ⚡ Visual rule engine for automation
- 🧠 AI-powered knowledge base with document search
- 🔔 Multi-channel notification system
- 🌙 Dark/light theme support

### Backend (Java Spring Boot)
- 🚀 RESTful API with Spring Boot 3.2
- 🔒 JWT authentication with Spring Security
- 🗄️ JPA/Hibernate with H2 database (dev) / PostgreSQL (prod)
- 📈 InfluxDB integration for time-series data
- 🔄 Real-time telemetry processing
- 📧 Multi-channel notifications (Email, Slack, Teams)
- 🤖 AI integration with OpenAI API
- 📝 Comprehensive API documentation with Swagger

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │  Spring Boot    │    │   Databases     │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│                 │
│                 │    │                 │    │ • H2/PostgreSQL │
│ • Dashboard     │    │ • REST API      │    │ • InfluxDB      │
│ • Device Mgmt   │    │ • Authentication│    │ • Redis         │
│ • Rule Engine   │    │ • Rule Engine   │    │ • Vector DB     │
│ • Knowledge Base│    │ • Notifications │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.6+

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd iot-platform
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Start the development servers**
```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately:
# Frontend (http://localhost:5173)
npm run dev

# Backend (http://localhost:8080)
cd backend && mvn spring-boot:run
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8080/api
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console

### Default Login Credentials
- Email: `admin@iot.com`
- Password: `admin`

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create device
- `PUT /api/devices/{id}` - Update device
- `DELETE /api/devices/{id}` - Delete device
- `PATCH /api/devices/{id}/status` - Update device status
- `POST /api/devices/{id}/telemetry` - Post telemetry data
- `GET /api/devices/{id}/telemetry` - Get telemetry data

### Rules
- `GET /api/rules` - Get all rules
- `POST /api/rules` - Create rule
- `PUT /api/rules/{id}` - Update rule
- `DELETE /api/rules/{id}` - Delete rule
- `PATCH /api/rules/{id}/toggle` - Toggle rule status

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications/{id}/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read

## Database Schema

### Core Entities
- **Users** - Authentication and RBAC
- **Devices** - IoT device management
- **Rules** - Automation rules with conditions and actions
- **Notifications** - Multi-channel notification system
- **Knowledge Documents** - AI-powered document storage

## Configuration

### Backend Configuration (application.yml)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:mem:iotdb
    username: sa
    password: password
  
  jpa:
    hibernate:
      ddl-auto: create-drop

jwt:
  secret: mySecretKey123456789012345678901234567890
  expiration: 86400000

influxdb:
  url: http://localhost:8086
  token: my-token
  org: iot-platform
  bucket: telemetry
```

### Frontend Configuration
The frontend automatically connects to the backend API at `http://localhost:8080/api`.

## Deployment

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Production Deployment
1. Build the frontend: `npm run build`
2. Build the backend: `cd backend && mvn clean package`
3. Deploy the JAR file and static assets to your server
4. Configure production database (PostgreSQL)
5. Set up InfluxDB for time-series data
6. Configure environment variables for production

## Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
cd backend && mvn test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.