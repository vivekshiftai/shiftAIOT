# shiftAIOT Platform - Full Stack IoT Application

A comprehensive IoT platform built with React TypeScript frontend and Java Spring Boot backend for managing IoT devices, automation rules, and real-time monitoring.

## 🚀 Features

### Frontend (React TypeScript + Vite)
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔐 JWT-based authentication with role-based access control
- 📊 Real-time dashboards with interactive charts
- 🏭 Device management with status monitoring
- ⚡ Visual rule engine for automation
- 🧠 AI-powered knowledge base with document search
- 🔔 Multi-channel notification system
- 🌙 Dark/light theme support
- 📱 Mobile-responsive design

### Backend (Java Spring Boot)
- 🚀 RESTful API with Spring Boot 3.2
- 🔒 JWT authentication with Spring Security
- 🗄️ JPA/Hibernate with H2 database (dev) / PostgreSQL (prod)
- 📈 InfluxDB integration for time-series data
- 🔄 Real-time telemetry processing
- 📧 Multi-channel notifications (Email, Slack, Teams)
- 🤖 AI integration with OpenAI API
- 📝 Comprehensive API documentation with Swagger

## 🏗️ Architecture

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

## 📁 Project Structure

```
shiftAIOT/
├── backend/                    # Java Spring Boot Backend
│   ├── src/main/java/com/iotplatform/
│   │   ├── config/            # Configuration classes
│   │   ├── controller/        # REST API controllers
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── model/            # Entity models
│   │   ├── repository/       # Data access layer
│   │   ├── security/         # JWT authentication
│   │   └── service/          # Business logic
│   ├── src/main/resources/
│   │   ├── application.yml   # Application configuration
│   │   └── schema.sql        # Database schema
│   └── pom.xml               # Maven dependencies
├── src/                       # React TypeScript Frontend
│   ├── components/           # Reusable UI components
│   │   ├── Auth/            # Authentication components
│   │   ├── Dashboard/       # Dashboard components
│   │   ├── Devices/         # Device management
│   │   ├── Layout/          # Layout components
│   │   └── Rules/           # Rule engine components
│   ├── contexts/            # React contexts
│   ├── sections/            # Main application sections
│   ├── services/            # API service layer
│   └── types/               # TypeScript type definitions
├── docker-compose.yml        # Docker orchestration
├── Dockerfile.frontend       # Frontend Docker image
└── package.json              # Frontend dependencies
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Java 17+
- Maven 3.6+
- Docker (optional)

### Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd shiftAIOT
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Start the development servers**

**Option 1: Start both frontend and backend**
```bash
# Start both frontend and backend
npm run dev:full
```

**Option 2: Start them separately**
```bash
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

## 📡 API Endpoints

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

### Knowledge Base
- `GET /api/knowledge` - Get knowledge documents
- `POST /api/knowledge` - Create knowledge document
- `PUT /api/knowledge/{id}` - Update knowledge document
- `DELETE /api/knowledge/{id}` - Delete knowledge document

## 🗄️ Database Schema

### Core Entities
- **Users** - Authentication and RBAC with roles (ADMIN, USER)
- **Devices** - IoT device management with types (SENSOR, ACTUATOR, GATEWAY)
- **Rules** - Automation rules with conditions and actions
- **Notifications** - Multi-channel notification system
- **Knowledge Documents** - AI-powered document storage and search

### Device Types
- **SENSOR** - Data collection devices
- **ACTUATOR** - Control devices
- **GATEWAY** - Communication hub devices

### Rule Components
- **Conditions** - Trigger conditions with operators (>, <, =, etc.)
- **Actions** - Automated responses (EMAIL, SLACK, WEBHOOK, etc.)

## ⚙️ Configuration

### Backend Configuration (application.yml)
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:h2:mem:testdb
    username: sa
    password: 
    driver-class-name: org.h2.Driver
  
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true

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

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Docker Build
```bash
# Build frontend
docker build -f Dockerfile.frontend -t shiftaiot-frontend .

# Build backend
cd backend
docker build -t shiftaiot-backend .
```

## 🚀 Production Deployment

1. **Build the frontend**
```bash
npm run build
```

2. **Build the backend**
```bash
cd backend && mvn clean package
```

3. **Deploy the application**
- Deploy the JAR file to your server
- Serve the frontend build files with a web server
- Configure production database (PostgreSQL)
- Set up InfluxDB for time-series data
- Configure environment variables for production

## 🧪 Testing

### Frontend Testing
```bash
npm run test
```

### Backend Testing
```bash
cd backend && mvn test
```

## 🔧 Development Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend Scripts
- `mvn spring-boot:run` - Start Spring Boot application
- `mvn test` - Run tests
- `mvn clean package` - Build JAR file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Built with ❤️ using React, TypeScript, Spring Boot, and modern web technologies**