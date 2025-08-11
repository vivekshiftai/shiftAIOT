# IoT Platform - Enhanced Device Management & Knowledge Base

A comprehensive IoT platform with enhanced device management capabilities and an AI-powered knowledge base system.

## 🚀 New Features

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

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for modern, responsive styling
- **Lucide React** for consistent iconography
- **Axios** for API communication

### Backend
- **Spring Boot 3** with Java 17
- **Spring Security** for authentication
- **Spring Data JPA** for database operations
- **PostgreSQL** for data persistence

## 📋 Features

### Device Management
- ✅ Real-time device monitoring
- ✅ Device onboarding and configuration
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

### Security
- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Organization-based data isolation
- ✅ Secure file upload handling

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
npm run dev:all
```

**Start frontend only:**
```bash
npm run dev
```

**Start backend only:**
```bash
npm run backend:dev
```

**Backend API**: http://localhost:8100/api

## 📁 Project Structure

```
shiftAIOT/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── Devices/
│   │   │   └── DeviceDetails.tsx # Tabbed device interface
│   │   └── ...
│   ├── sections/
│   │   └── KnowledgeSection.tsx  # ChatGPT-style knowledge base
│   └── services/
│       └── knowledgeApiService.ts # Knowledge base API client
├── backend/                      # Spring Boot backend
│   ├── src/main/java/com/iotplatform/
│   │   ├── controller/
│   │   │   └── KnowledgeController.java
│   │   ├── model/
│   │   │   └── KnowledgeDocument.java
│   │   ├── repository/
│   │   │   └── KnowledgeDocumentRepository.java
│   │   └── service/
│   │       └── KnowledgeService.java
│   └── ...
└── ...
```

## 🔧 API Endpoints

### Knowledge Base API
- `POST /api/knowledge/upload` - Upload document
- `GET /api/knowledge/documents` - Get all documents
- `DELETE /api/knowledge/documents/{id}` - Delete document
- `GET /api/knowledge/documents/{id}/download` - Download document
- `POST /api/knowledge/search` - Search documents
- `POST /api/knowledge/chat` - Send chat message
- `GET /api/knowledge/chat/history` - Get chat history
- `GET /api/knowledge/statistics` - Get knowledge base statistics

## 🎨 UI Components

### Device Details Tabs
- **Modern tabbed interface** with smooth transitions
- **Responsive design** that works on all screen sizes
- **Loading states** and placeholder content
- **Interactive elements** with hover effects

### Knowledge Base Chat
- **ChatGPT-style interface** with message bubbles
- **Real-time typing indicators**
- **Quick action buttons** for common queries
- **Document context** in chat responses
- **File upload** with drag-and-drop support

## 🔒 Security Features

- **JWT Authentication** for all API endpoints
- **File upload validation** and virus scanning
- **Organization-based access control**
- **Secure document storage** with proper file permissions

## 📈 Performance

- **Lazy loading** for device details tabs
- **Optimized file uploads** with progress tracking
- **Caching** for frequently accessed documents
- **Async processing** for document vectorization

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
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

---

**Built with ❤️ for the IoT community**