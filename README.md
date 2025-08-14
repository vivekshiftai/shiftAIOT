# IoT Platform - Enhanced Device Management & Knowledge Base

A comprehensive IoT platform with enhanced device management capabilities and an AI-powered knowledge base system.

## 🚀 New Features

### 📱 Refactored Device Onboarding Flow
The device onboarding process has been completely redesigned with the following improvements:

- **Clean, Uniform Spacing**: Consistent 24px (6 in Tailwind) margins and padding throughout all forms, cards, and sections
- **Equipment Intelligence Agent Workflow**: Redesigned loading screen with animated cards, prominent progress bar, and sequential steps
- **Embedded Chat Interface**: AI-powered chat window integrated into the onboarding flow for querying uploaded PDFs
- **Streamlined Success Screen**: Concise, celebratory design focusing on essential information
- **Real-time Validation**: Instant field validation with visual feedback for key form fields
- **Responsive Design**: Mobile-optimized layouts that adapt to different screen sizes

### 📱 Tabbed Device Details Interface
The device details view now features a modern tabbed interface with the following sections:

- **Profile**: Basic device information, status, telemetry data, and tags
- **Maintenance Details**: Maintenance schedule, history, and warranty information
- **Rules**: Device automation rules management
- **Connection Details**: Network configuration and MQTT settings
- **Chat History**: Interactive chat interface for device-specific queries
- **Specifications**: Technical specifications and documentation

### 🤖 ChatGPT-Style Knowledge Base
A powerful AI-powered knowledge base with:

- **Document Library**: Upload and manage PDFs, DOCX, and text files
- **AI Chat Interface**: ChatGPT-style conversation interface for document queries
- **Smart Search**: AI-powered document search with relevance scoring
- **Document Processing**: Automatic document vectorization for AI search
- **Real-time Chat**: Interactive chat with contextual responses

### 🎨 Enhanced UI/UX Design
Recent improvements include:

- **Light Theme Consistency**: All forms and components now use a consistent light color palette
- **Improved Form Styling**: Enhanced input fields, buttons, and modal designs across all components
- **Better Visual Hierarchy**: Clear typography and spacing for improved readability
- **Responsive Design**: Mobile-first approach with adaptive layouts

### 🔐 Robust Authentication System
Enhanced security features:

- **JWT Token Management**: Secure token-based authentication with automatic refresh
- **Role-Based Access Control**: Admin and User roles with specific permissions
- **Maintenance Permissions**: Granular access control for maintenance operations
- **Organization Isolation**: Multi-tenant architecture with data separation

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive styling
- **Lucide React** for consistent iconography
- **Axios** for API communication with interceptors

### Backend
- **Spring Boot 3** with Java 17
- **Spring Security** for authentication and authorization
- **Spring Data JPA** for database operations
- **PostgreSQL** for data persistence
- **JWT** for secure token-based authentication

## 📋 Features

### Device Management
- ✅ Real-time device monitoring
- ✅ Enhanced device onboarding with AI integration
- ✅ Telemetry data visualization
- ✅ Device status management
- ✅ Tabbed device details interface
- ✅ Device-specific chat interface

### Knowledge Base
- ✅ Document upload and management
- ✅ AI-powered document search
- ✅ ChatGPT-style chat interface
- ✅ Document processing and vectorization
- ✅ Chat history and context
- ✅ Quick action buttons for common queries

### Maintenance Management
- ✅ Maintenance schedule creation and management
- ✅ Task assignment and tracking
- ✅ Priority-based task organization
- ✅ Maintenance history and reporting

### Rules & Automation
- ✅ Rule creation and management
- ✅ Condition-based automation
- ✅ Action execution and monitoring
- ✅ Rule validation and testing

### Security
- ✅ JWT-based authentication
- ✅ Role-based access control (ADMIN/USER)
- ✅ Organization-based data isolation
- ✅ Secure file upload handling
- ✅ Token refresh mechanism
- ✅ Granular permissions for maintenance operations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Java 17+
- PostgreSQL 13+
- Maven 3.6+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shiftAIOT
   ```

2. **Backend Setup**
   ```bash
   cd backend
   mvn clean install
   mvn spring-boot:run
   ```

3. **Frontend Setup**
   ```bash
   npm install
   npm run dev
   ```

4. **Database Setup**
   - Create a PostgreSQL database
   - Update `application.yml` with your database credentials
   - The application will automatically create tables on startup

### Development

**Start all services:**
```bash
# Terminal 1 - Backend
cd backend && mvn spring-boot:run

# Terminal 2 - Frontend
npm run dev
```

## 📁 Project Structure

```
shiftAIOT/
├── backend/                 # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/iotplatform/
│   │       ├── controller/  # REST API controllers
│   │       ├── service/     # Business logic
│   │       ├── model/       # Entity models
│   │       ├── security/    # Security configuration
│   │       └── repository/  # Data access layer
│   └── src/main/resources/
│       └── schema.sql      # Database schema
├── src/                    # React frontend
│   ├── components/
│   │   ├── Devices/        # Device management components
│   │   ├── Loading/        # Loading and progress components
│   │   ├── Layout/         # Layout components
│   │   ├── Rules/          # Rule management components
│   │   └── Settings/       # Settings and configuration
│   ├── sections/           # Page sections
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript type definitions
└── README.md
```

## 🔄 Device Onboarding Flow

The enhanced device onboarding process follows this sequence:

1. **Device Information Collection** (Step 1)
   - Collect device details, specifications, and connection settings
   - Real-time field validation with visual feedback
   - Clean, responsive form layout

2. **Connection Settings** (Step 2)
   - Configure network connection and authentication
   - Protocol selection (MQTT, HTTP, COAP, TCP, UDP)
   - Network configuration validation

3. **Documentation Upload** (Step 3)
   - PDF upload with drag-and-drop interface
   - File validation and processing status
   - AI analysis preview

4. **Equipment Intelligence Agent** (Loading)
   - Animated processing cards with progress indicators
   - Sequential steps: PDF Uploading → Rules Generation → Initializing Chat
   - Prominent progress bar and minimal status text

5. **AI Chat Interface** (New)
   - Embedded chat window for querying uploaded PDF
   - Quick action buttons for common queries
   - Real-time AI responses based on device documentation

6. **Success Confirmation** (Final)
   - Concise, celebratory design
   - Key metrics display (rules, maintenance, safety)
   - Clear next steps and actions

## 🎨 Design System

### Spacing
- **Base Unit**: 24px (6 in Tailwind)
- **Consistent Margins**: Applied throughout all components
- **Responsive Grid**: Adapts to mobile and desktop layouts

### Color Palette
- **Primary**: Blue (#3B82F6)
- **Secondary**: Light blue (#E0F2FE)
- **Success**: Green (#10B981)
- **Warning**: Orange (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray scale for text and backgrounds
- **Light Theme**: Consistent light backgrounds with dark text

### Typography
- **Headings**: Bold, clear hierarchy
- **Body Text**: Readable, appropriate line height
- **Labels**: Medium weight for form fields

## 🔧 API Endpoints

### Authentication
- `POST /auth/signin` - User sign in
- `POST /auth/signup` - User registration
- `POST /auth/refresh` - Refresh JWT token

### Device Management
- `GET /devices` - Get all devices
- `POST /devices` - Create new device
- `PUT /devices/{id}` - Update device
- `DELETE /devices/{id}` - Delete device

### Maintenance Management
- `GET /maintenance` - Get all maintenance tasks
- `POST /maintenance` - Create new maintenance task
- `PUT /maintenance/{id}` - Update maintenance task
- `DELETE /maintenance/{id}` - Delete maintenance task

### Rules Management
- `GET /rules` - Get all rules
- `POST /rules` - Create new rule
- `PUT /rules/{id}` - Update rule
- `DELETE /rules/{id}` - Delete rule

### Knowledge Base
- `POST /knowledge/upload-pdf` - Upload PDF for processing
- `GET /knowledge/documents` - Get all documents
- `POST /knowledge/search` - Search documents
- `POST /knowledge/chat` - Send chat message

## 🔐 Security Features

### Authentication Flow
1. **User Login**: JWT token generation with refresh token
2. **Token Validation**: Automatic token validation on API requests
3. **Token Refresh**: Automatic refresh when token expires
4. **Logout**: Token invalidation and cleanup

### Authorization
- **ADMIN Role**: Full access to all features including maintenance management
- **USER Role**: Limited access with maintenance read/write permissions
- **Organization Isolation**: Data separation by organization ID

## 🚀 Deployment

### Production Build
```bash
# Frontend
npm run build

# Backend
mvn clean package
```

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/iotplatform

# JWT Secret
JWT_SECRET=your-secret-key

# API Base URL
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation

---

**Built with ❤️ using React, Spring Boot, and AI-powered intelligence**