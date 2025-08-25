# Quick API Reference - Most Commonly Used Endpoints

## 🔐 Authentication
```bash
# Login
POST /auth/signin
Body: {"email": "user@example.com", "password": "password"}

# Register
POST /auth/signup
Body: {"firstName": "John", "lastName": "Doe", "email": "user@example.com", "password": "password", "role": "USER"}

# Refresh Token
POST /auth/refresh
Body: {"token": "jwt_token_here"}
```

## 👥 User Management
```bash
# Get current user profile
GET /users/profile
Headers: Authorization: Bearer <token>

# Get all users
GET /users
Headers: Authorization: Bearer <token>

# Change password
POST /users/change-password
Headers: Authorization: Bearer <token>
Body: {"currentPassword": "old", "newPassword": "new", "confirmPassword": "new"}
```

## 📱 Device Management
```bash
# Get all devices
GET /api/devices
Headers: Authorization: Bearer <token>

# Get device by ID
GET /api/devices/{id}
Headers: Authorization: Bearer <token>

# Create device
POST /api/devices
Headers: Authorization: Bearer <token>
Body: {"name": "Device Name", "type": "SENSOR", ...}

# AI-powered device onboarding
POST /api/devices/onboard-with-ai
Headers: Authorization: Bearer <token>
Body: FormData with deviceData and files

# Get device PDF results
GET /api/devices/{id}/pdf-results
Headers: Authorization: Bearer <token>

# Health check
GET /api/devices/health

# Debug authentication
GET /api/devices/debug-auth
Headers: Authorization: Bearer <token>
```

## 🔧 Rules Management
```bash
# Get all rules
GET /api/rules
Headers: Authorization: Bearer <token>

# Create rule
POST /api/rules
Headers: Authorization: Bearer <token>
Body: {"name": "Rule Name", "condition": "...", "action": "..."}

# Get rules by device
GET /api/devices/{deviceId}/rules
Headers: Authorization: Bearer <token>

# Toggle rule
PATCH /api/rules/{id}/toggle
Headers: Authorization: Bearer <token>
```

## 🔧 Maintenance Management
```bash
# Get all maintenance items
GET /api/maintenance
Headers: Authorization: Bearer <token>

# Create maintenance item
POST /api/maintenance
Headers: Authorization: Bearer <token>
Body: {"title": "Maintenance Title", "description": "...", "dueDate": "2024-01-01"}

# Get maintenance by device
GET /api/devices/{deviceId}/maintenance
Headers: Authorization: Bearer <token>

# Get upcoming maintenance
GET /api/devices/maintenance/upcoming
Headers: Authorization: Bearer <token>
```

## 🛡️ Safety Precautions
```bash
# Get safety precautions by device
GET /api/device-safety-precautions/device/{deviceId}
Headers: Authorization: Bearer <token>

# Create safety precaution
POST /api/device-safety-precautions
Headers: Authorization: Bearer <token>
Body: {"title": "Safety Title", "description": "...", "severity": "HIGH"}
```

## 📄 PDF Processing
```bash
# Upload PDF
POST /api/pdf/upload
Headers: Authorization: Bearer <token>
Body: FormData with file

# Query PDF
POST /api/pdf/query
Headers: Authorization: Bearer <token>
Body: {"query": "What is the operating temperature?", "pdf_name": "manual.pdf"}

# List PDFs
GET /api/pdf/list
Headers: Authorization: Bearer <token>

# Generate rules from PDF
POST /api/pdf/generate-rules
Headers: Authorization: Bearer <token>
Body: {"pdf_name": "manual.pdf", "deviceId": "device_id"}

# Generate maintenance from PDF
POST /api/pdf/generate-maintenance
Headers: Authorization: Bearer <token>
Body: {"pdf_name": "manual.pdf", "deviceId": "device_id"}

# Generate safety precautions from PDF
POST /api/pdf/generate-safety
Headers: Authorization: Bearer <token>
Body: {"pdf_name": "manual.pdf", "deviceId": "device_id"}
```

## 🔔 Notifications
```bash
# Get all notifications
GET /api/notifications
Headers: Authorization: Bearer <token>

# Mark as read
PATCH /api/notifications/{id}/read
Headers: Authorization: Bearer <token>

# Get unread count
GET /api/notifications/unread-count
Headers: Authorization: Bearer <token>
```

## 🔗 Device Connections
```bash
# Get all connections
GET /api/device-connections
Headers: Authorization: Bearer <token>

# Connect device
POST /api/device-connections/{deviceId}/connect
Headers: Authorization: Bearer <token>

# Disconnect device
POST /api/device-connections/{deviceId}/disconnect
Headers: Authorization: Bearer <token>
```

## ⚙️ Conversation Configs
```bash
# Get all configs
GET /api/conversation-configs
Headers: Authorization: Bearer <token>

# Get active config
GET /api/conversation-configs/active
Headers: Authorization: Bearer <token>
```

## 📚 Knowledge Management
```bash
# Get documents
GET /knowledge/documents
Headers: Authorization: Bearer <token>

# Get documents by device
GET /knowledge/documents/device/{deviceId}
Headers: Authorization: Bearer <token>
```

---

## 🚨 Common Error Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (invalid data)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found (endpoint doesn't exist)
- **500**: Internal Server Error

## 🔧 Testing with curl

```bash
# Test health check
curl -X GET http://20.57.36.66:8100/api/devices/health

# Test authentication
curl -X POST http://20.57.36.66:8100/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test protected endpoint
curl -X GET http://20.57.36.66:8100/api/devices \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Notes

- All endpoints except `/auth/*` and `/api/devices/health` require authentication
- Use the `Authorization: Bearer <token>` header for authenticated requests
- The backend is running on `http://20.57.36.66:8100`
- PDF uploads use `multipart/form-data` content type
- Most responses are in JSON format
