# IoT Platform API Endpoints Documentation

## Base URL
- **Backend Server**: `http://20.75.50.202:8100`
- **Frontend Base URL**: `http://20.75.50.202:8100` (configured in `src/config/api.ts`)
- **External PDF Processing Service**: `http://20.75.50.202:8000`

---

## 🔐 Authentication Endpoints (`/auth`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| POST | `/auth/signin` | User login | ✅ `authAPI.login()` |
| POST | `/auth/signup` | User registration | ✅ `authAPI.register()` |
| POST | `/auth/refresh` | Refresh JWT token | ✅ `authAPI.refresh()` |

---

## 👥 User Management Endpoints (`/users`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/users` | Get all users | ✅ `userAPI.getAll()` |
| GET | `/users/{id}` | Get user by ID | ✅ `userAPI.getById()` |
| PUT | `/users/{id}` | Update user | ✅ `userAPI.update()` |
| DELETE | `/users/{id}` | Delete user | ✅ `userAPI.delete()` |
| GET | `/users/profile` | Get current user profile | ✅ `userAPI.getProfile()` |
| POST | `/users/change-password` | Change password | ✅ `userAPI.changePassword()` |

### User Preferences (`/user-preferences`)
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/user-preferences` | Get user preferences | ✅ `userAPI.getPreferences()` |
| POST | `/user-preferences` | Save user preferences | ✅ `userAPI.savePreferences()` |

---

## 📱 Device Management Endpoints (`/api/devices`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/devices` | Get all devices | ✅ `deviceAPI.getAll()` |
| GET | `/api/devices/{id}` | Get device by ID | ✅ `deviceAPI.getById()` |
| POST | `/api/devices` | Create device | ✅ `deviceAPI.create()` |
| POST | `/api/devices/simple` | Create simple device | ✅ `deviceAPI.createSimple()` |
| POST | `/api/devices/with-files` | Create device with files | ❌ Not used |
| PUT | `/api/devices/{id}` | Update device | ✅ `deviceAPI.update()` |
| DELETE | `/api/devices/{id}` | Delete device | ✅ `deviceAPI.delete()` |
| PATCH | `/api/devices/{id}/status` | Update device status | ✅ `deviceAPI.updateStatus()` |
| POST | `/api/devices/{id}/telemetry` | Send telemetry data | ❌ Not used |
| GET | `/api/devices/{id}/telemetry` | Get device telemetry | ✅ `deviceAPI.getTelemetry()` |
| GET | `/api/devices/stats` | Get device statistics | ❌ Not used |
| GET | `/api/devices/{id}/documentation/{type}` | Get device documentation by type | ❌ Not used |
| GET | `/api/devices/{id}/documentation` | Get all device documentation | ✅ `deviceAPI.getDocumentation()` |
| GET | `/api/devices/debug-db` | Debug database | ❌ Not used |
| GET | `/api/devices/health` | Health check | ✅ Used in onboarding |
| GET | `/api/devices/debug-auth` | Debug authentication | ✅ Used in onboarding |
| POST | `/api/devices/onboard-with-ai` | AI-powered device onboarding | ✅ `deviceAPI.onboardWithAI()` |
| GET | `/api/devices/{id}/pdf-results` | Get PDF processing results | ✅ `deviceAPI.getDevicePDFResults()` |
| GET | `/api/devices/{id}/maintenance` | Get device maintenance | ❌ Not used |
| GET | `/api/devices/{id}/safety-precautions` | Get device safety precautions | ❌ Not used |
| GET | `/api/devices/{id}/rules` | Get device rules | ❌ Not used |
| GET | `/api/devices/{id}/test-data` | Get test data | ❌ Not used |
| GET | `/api/devices/{id}/debug-data` | Get debug data | ✅ `deviceAPI.getDebugData()` |
| GET | `/api/devices/auth-test` | Test authentication | ✅ `deviceAPI.testAuth()` |
| GET | `/api/devices/{id}/onboarding-progress` | Get onboarding progress | ❌ Not used |
| GET | `/api/devices/{id}/onboarding-status` | Get onboarding status | ❌ Not used |
| GET | `/api/devices/maintenance/upcoming` | Get upcoming maintenance | ✅ `maintenanceAPI.getUpcoming()` |

---

## 🔧 Rules Management Endpoints (`/api/rules`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/rules` | Get all rules | ✅ `ruleAPI.getAll()` |
| GET | `/api/rules/{id}` | Get rule by ID | ✅ `ruleAPI.getById()` |
| POST | `/api/rules` | Create rule | ✅ `ruleAPI.create()` |
| POST | `/api/rules/bulk` | Create multiple rules | ✅ `ruleAPI.createBulk()` |
| PUT | `/api/rules/{id}` | Update rule | ✅ `ruleAPI.update()` |
| DELETE | `/api/rules/{id}` | Delete rule | ✅ `ruleAPI.delete()` |
| PATCH | `/api/rules/{id}/toggle` | Toggle rule | ✅ `ruleAPI.toggle()` |
| GET | `/api/rules/active` | Get active rules | ❌ Not used |
| GET | `/api/rules/stats` | Get rule statistics | ❌ Not used |
| GET | `/api/devices/{deviceId}/rules` | Get rules by device | ✅ `ruleAPI.getByDevice()` |
| POST | `/api/rules/generate-rules` | Generate rules | ❌ Not used |

---

## 🔧 Maintenance Management Endpoints (`/api/maintenance`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/maintenance` | Get all maintenance items | ✅ `maintenanceAPI.getAll()` |
| GET | `/api/maintenance/{id}` | Get maintenance by ID | ✅ `maintenanceAPI.getById()` |
| POST | `/api/maintenance` | Create maintenance item | ✅ `maintenanceAPI.create()` |
| POST | `/api/maintenance/bulk` | Create multiple maintenance items | ✅ `maintenanceAPI.createBulk()` |
| PUT | `/api/maintenance/{id}` | Update maintenance item | ✅ `maintenanceAPI.update()` |
| DELETE | `/api/maintenance/{id}` | Delete maintenance item | ✅ `maintenanceAPI.delete()` |
| GET | `/api/devices/{deviceId}/maintenance` | Get maintenance by device | ✅ `maintenanceAPI.getByDevice()` |

---

## 🛡️ Device Safety Precautions Endpoints (`/api/device-safety-precautions`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/device-safety-precautions/device/{deviceId}` | Get safety precautions by device | ✅ `deviceSafetyPrecautionsAPI.getAllByDevice()` |
| GET | `/api/device-safety-precautions/device/{deviceId}/active` | Get active safety precautions | ✅ `deviceSafetyPrecautionsAPI.getActiveByDevice()` |
| GET | `/api/device-safety-precautions/{id}` | Get safety precaution by ID | ✅ `deviceSafetyPrecautionsAPI.getById()` |
| POST | `/api/device-safety-precautions` | Create safety precaution | ✅ `deviceSafetyPrecautionsAPI.create()` |
| POST | `/api/device-safety-precautions/bulk` | Create multiple safety precautions | ✅ `deviceSafetyPrecautionsAPI.createBulk()` |
| PUT | `/api/device-safety-precautions/{id}` | Update safety precaution | ✅ `deviceSafetyPrecautionsAPI.update()` |
| DELETE | `/api/device-safety-precautions/{id}` | Delete safety precaution | ✅ `deviceSafetyPrecautionsAPI.delete()` |
| DELETE | `/api/device-safety-precautions/device/{deviceId}` | Delete all safety precautions for device | ✅ `deviceSafetyPrecautionsAPI.deleteByDevice()` |
| GET | `/api/device-safety-precautions/device/{deviceId}/type/{type}` | Get by type | ✅ `deviceSafetyPrecautionsAPI.getByType()` |
| GET | `/api/device-safety-precautions/device/{deviceId}/category/{category}` | Get by category | ✅ `deviceSafetyPrecautionsAPI.getByCategory()` |
| GET | `/api/device-safety-precautions/device/{deviceId}/severity/{severity}` | Get by severity | ✅ `deviceSafetyPrecautionsAPI.getBySeverity()` |
| GET | `/api/device-safety-precautions/device/{deviceId}/count` | Get count | ✅ `deviceSafetyPrecautionsAPI.getCount()` |

---

## 📄 PDF Processing Endpoints (`/api/pdf`)

### Core Backend Endpoints:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| POST | `/api/pdf/upload` | Upload PDF file (authenticated) | ✅ `pdfAPI.uploadPDF()` |
| POST | `/api/pdf/upload-pdf` | Upload PDF file (public) | ✅ `pdfAPI.uploadPDFPublic()` |
| POST | `/api/pdf/query` | Query PDF content | ✅ `pdfAPI.queryPDF()` |
| GET | `/api/pdf/list` | List all PDFs | ✅ `pdfAPI.listPDFs()` |
| POST | `/api/pdf/generate-rules` | Generate rules from PDF | ✅ `pdfAPI.generateRules()` |
| POST | `/api/pdf/generate-maintenance` | Generate maintenance from PDF | ✅ `pdfAPI.generateMaintenance()` |
| POST | `/api/pdf/generate-safety` | Generate safety precautions from PDF | ✅ `pdfAPI.generateSafety()` |
| DELETE | `/api/pdf/{pdfName}` | Delete PDF | ✅ `pdfAPI.deletePDF()` |
| GET | `/api/pdf/download/{pdfName}` | Download PDF | ✅ `pdfAPI.downloadPDF()` |
| GET | `/api/pdf/status/{pdfName}` | Get PDF processing status | ✅ `pdfAPI.getPDFStatus()` |
| GET | `/api/pdf/health` | PDF service health check | ✅ `pdfAPI.healthCheck()` |

### External Service Compatibility Endpoints:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/pdf/pdfs` | List PDFs (external format) | ✅ `pdfAPI.listPDFsExternal()` |
| DELETE | `/api/pdf/pdfs/{pdfName}` | Delete PDF (external format) | ✅ `pdfAPI.deletePDFExternal()` |
| POST | `/api/pdf/generate-rules/{pdfName}` | Generate rules (external format) | ✅ `pdfAPI.generateRulesExternal()` |
| POST | `/api/pdf/generate-maintenance/{pdfName}` | Generate maintenance (external format) | ✅ `pdfAPI.generateMaintenanceExternal()` |
| POST | `/api/pdf/generate-safety/{pdfName}` | Generate safety (external format) | ✅ `pdfAPI.generateSafetyExternal()` |

### Debug & Utility Endpoints:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/pdf/debug/collection/{pdfName}` | Debug collection analysis | ✅ `pdfAPI.debug.collectionAnalysis()` |
| POST | `/api/pdf/debug/test-query/{pdfName}` | Test query pipeline | ✅ `pdfAPI.debug.testQueryPipeline()` |
| GET | `/api/pdf/debug/collections` | List all collections | ✅ `pdfAPI.debug.listAllCollections()` |
| GET | `/api/pdf/debug/health` | Debug health check | ✅ `pdfAPI.debug.healthCheck()` |
| GET | `/api/pdf/debug/test-images/{pdfName}` | Test images | ✅ `pdfAPI.debug.testImages()` |
| GET | `/api/pdf/health/global` | Global health check | ✅ `pdfAPI.globalHealthCheck()` |
| GET | `/api/pdf/info` | Service information | ✅ `pdfAPI.getServiceInfo()` |

**Note**: The Knowledge Section now uses the external collections endpoint (`/api/pdf/debug/collections`) as the primary source for PDF documents, with fallback to backend PDF API and knowledge API.

---

## 🔔 Notification Endpoints (`/api/notifications`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/notifications` | Get all notifications | ✅ `notificationAPI.getAll()` |
| POST | `/api/notifications` | Create notification | ✅ `notificationAPI.create()` |
| PATCH | `/api/notifications/{id}/read` | Mark as read | ✅ `notificationAPI.markAsRead()` |
| PATCH | `/api/notifications/read-all` | Mark all as read | ✅ `notificationAPI.markAllAsRead()` |
| GET | `/api/notifications/unread-count` | Get unread count | ✅ `notificationAPI.getUnreadCount()` |

---

## 💬 Chat Endpoints (`/api/chat`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| POST | `/api/chat/query` | Send chat query | ❌ Not used |
| GET | `/api/chat/history` | Get chat history | ❌ Not used |
| GET | `/api/chat/history/device/{deviceId}` | Get device chat history | ❌ Not used |
| GET | `/api/chat/history/pdf/{pdfName}` | Get PDF chat history | ❌ Not used |

---

## 🔗 Device Connection Endpoints (`/api/device-connections`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/device-connections` | Get all connections | ✅ `deviceConnectionAPI.getAll()` |
| GET | `/api/device-connections/{deviceId}` | Get connection by device ID | ✅ `deviceConnectionAPI.getById()` |
| POST | `/api/device-connections` | Create connection | ✅ `deviceConnectionAPI.create()` |
| PUT | `/api/device-connections/{deviceId}` | Update connection | ✅ `deviceConnectionAPI.update()` |
| DELETE | `/api/device-connections/{deviceId}` | Delete connection | ✅ `deviceConnectionAPI.delete()` |
| POST | `/api/device-connections/{deviceId}/connect` | Connect device | ✅ `deviceConnectionAPI.connect()` |
| POST | `/api/device-connections/{deviceId}/disconnect` | Disconnect device | ✅ `deviceConnectionAPI.disconnect()` |
| GET | `/api/device-connections/active` | Get active connections | ✅ `deviceConnectionAPI.getActive()` |
| GET | `/api/device-connections/stats` | Get connection statistics | ✅ `deviceConnectionAPI.getStats()` |

---

## ⚙️ Conversation Configuration Endpoints (`/api/conversation-configs`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| GET | `/api/conversation-configs` | Get all configs | ✅ `conversationConfigAPI.getAll()` |
| GET | `/api/conversation-configs/{id}` | Get config by ID | ✅ `conversationConfigAPI.getById()` |
| POST | `/api/conversation-configs` | Create config | ✅ `conversationConfigAPI.create()` |
| PUT | `/api/conversation-configs/{id}` | Update config | ✅ `conversationConfigAPI.update()` |
| DELETE | `/api/conversation-configs/{id}` | Delete config | ✅ `conversationConfigAPI.delete()` |
| GET | `/api/conversation-configs/active` | Get active config | ✅ `conversationConfigAPI.getActive()` |
| GET | `/api/conversation-configs/platform/{platformType}` | Get by platform type | ✅ `conversationConfigAPI.getByPlatformType()` |

---

## 📚 Knowledge Management Endpoints (`/knowledge`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| POST | `/knowledge/upload` | Upload document | ❌ Not used |
| POST | `/knowledge/upload-pdf` | Upload PDF document | ❌ Not used |
| POST | `/knowledge/query` | Query knowledge base | ❌ Not used |
| GET | `/knowledge/pdfs` | Get all PDFs | ❌ Not used |
| GET | `/knowledge/documents` | Get all documents | ❌ Not used |
| GET | `/knowledge/documents/device/{deviceId}` | Get documents by device | ❌ Not used |
| GET | `/knowledge/documents/general` | Get general documents | ❌ Not used |

---

## 🔔 Maintenance Notification Endpoints (`/api/maintenance-notifications`)

### Backend Endpoints Available:
| Method | Endpoint | Description | Frontend Usage |
|--------|----------|-------------|----------------|
| POST | `/api/maintenance-notifications/trigger` | Trigger notification | ❌ Not used |
| GET | `/api/maintenance-notifications/status` | Get notification status | ❌ Not used |

---

## 📊 Analytics Endpoints (Not Implemented in Backend)

### Frontend API Calls (No Backend Implementation):
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/analytics` | Get all analytics | ❌ Not implemented |
| GET | `/api/analytics/{id}` | Get analytics by ID | ❌ Not implemented |
| POST | `/api/analytics` | Create analytics | ❌ Not implemented |
| PUT | `/api/analytics/{id}` | Update analytics | ❌ Not implemented |
| DELETE | `/api/analytics/{id}` | Delete analytics | ❌ Not implemented |
| GET | `/api/analytics/{deviceId}/realtime` | Get real-time analytics | ❌ Not implemented |
| GET | `/api/analytics/{deviceId}/historical` | Get historical analytics | ❌ Not implemented |

---

## 📝 Log Endpoints (Not Implemented in Backend)

### Frontend API Calls (No Backend Implementation):
| Method | Endpoint | Description | Status |
|--------|----------|-------------|--------|
| GET | `/api/logs` | Get all logs | ❌ Not implemented |
| GET | `/api/logs/{id}` | Get log by ID | ❌ Not implemented |
| POST | `/api/logs` | Create log | ❌ Not implemented |
| PUT | `/api/logs/{id}` | Update log | ❌ Not implemented |
| DELETE | `/api/logs/{id}` | Delete log | ❌ Not implemented |
| GET | `/api/logs/level/{level}` | Get logs by level | ❌ Not implemented |
| GET | `/api/logs/date-range` | Get logs by date range | ❌ Not implemented |
| GET | `/api/logs/{deviceId}/export` | Export logs | ❌ Not implemented |

---

## 🔍 Issues Found

### 1. **Missing Backend Endpoints**
- Analytics endpoints are not implemented in the backend
- Log endpoints are not implemented in the backend
- Some device endpoints are not being used in the frontend

### 2. **Endpoint Mismatches**
- Frontend calls `/api/users/profile` but backend has `/users/profile` ✅ **FIXED**
- Some knowledge endpoints use `/api/knowledge` but backend uses `/knowledge`

### 3. **Unused Backend Endpoints**
- Many device endpoints are not being used in the frontend
- Chat endpoints are not being used
- Some maintenance notification endpoints are not being used

### 4. **Authentication Issues**
- Some endpoints require authentication but frontend might not be sending proper tokens
- Token refresh mechanism needs to be tested

---

## 🚀 Recommendations

### 1. **Implement Missing Backend Endpoints**
```java
// Add these controllers to the backend:
- AnalyticsController
- LogController
```

### 2. **Fix Endpoint Mismatches**
```typescript
// Update frontend API calls to match backend:
- Change `/api/knowledge/*` to `/knowledge/*` for knowledge endpoints
```

### 3. **Add Missing Frontend API Methods**
```typescript
// Add these methods to the frontend API service:
- Chat API methods
- Device telemetry sending
- Device status updates
```

### 4. **Test Authentication Flow**
```bash
# Test the authentication endpoints:
curl -X POST http://20.57.36.66:8100/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 5. **Add Health Check Endpoints**
```typescript
// Add health check to frontend:
const healthCheck = () => api.get('/api/devices/health');
```

---

## 📋 Summary

- **Total Backend Endpoints**: ~80 endpoints
- **Frontend API Methods**: ~60 methods
- **Matching Endpoints**: ~50 endpoints
- **Missing Backend**: ~20 endpoints (Analytics, Logs)
- **Unused Backend**: ~15 endpoints
- **Authentication Issues**: Need to verify token handling

The main issue causing the 401 errors was the URL configuration (localhost vs VM IP) and endpoint mismatches, which have been fixed. The authentication flow should now work properly.
