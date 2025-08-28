# Device Status Update Functionality

## Overview
This document describes the real-time device status update functionality that allows users to change device status (Online/Offline/Warning/Error) directly from the device cards with immediate backend updates and real-time synchronization.

## Features

### Frontend Features
- **Quick Status Dropdown**: Available on device cards for admin users
- **Real-time Updates**: Status changes are immediately reflected in the UI
- **WebSocket Integration**: Real-time synchronization across all connected clients
- **Error Handling**: Proper error handling with user feedback
- **Logging**: Comprehensive logging for debugging

### Backend Features
- **Dedicated API Endpoint**: `PATCH /api/devices/{id}/status`
- **Database Updates**: Status changes are persisted to the database
- **WebSocket Broadcasting**: Real-time notifications to all connected clients
- **Security**: Proper authentication and authorization checks
- **Logging**: Detailed logging for monitoring and debugging

## API Endpoints

### Update Device Status
```
PATCH /api/devices/{id}/status
Content-Type: application/json
Authorization: Bearer <token>

Body: "ONLINE" | "OFFLINE" | "WARNING" | "ERROR"
```

**Response:**
```json
{
  "id": "device-id",
  "name": "Device Name",
  "status": "ONLINE",
  "updatedAt": "2024-01-01T12:00:00Z",
  ...
}
```

## WebSocket Events

### Device Status Update
```json
{
  "type": "DEVICE_STATUS_UPDATE",
  "deviceId": "device-id",
  "status": "ONLINE",
  "updatedAt": "2024-01-01T12:00:00Z",
  "deviceName": "Device Name",
  "organizationId": "org-id"
}
```

## Implementation Details

### Frontend Components
1. **DeviceCard**: Contains the status dropdown for admin users
2. **IoTContext**: Manages device state and WebSocket connections
3. **WebSocketService**: Handles real-time communication with backend

### Backend Services
1. **DeviceController**: Handles the status update API endpoint
2. **DeviceService**: Business logic for status updates
3. **DeviceWebSocketService**: Broadcasts updates to connected clients

### Database Changes
- Device status is stored in the `devices` table
- `updatedAt` timestamp is automatically updated
- Status changes are logged for audit purposes

## Usage

### For Admin Users
1. Navigate to the Devices section
2. Find the device card you want to update
3. Use the "Quick Status" dropdown to change the status
4. The change is immediately applied and synchronized across all clients

### For Regular Users
- Status changes are visible in real-time
- No ability to modify device status

## Security
- Only admin users can change device status
- Authentication required for all API calls
- Organization-based access control
- Input validation on both frontend and backend

## Logging
- All status changes are logged with detailed information
- WebSocket events are logged for debugging
- Error conditions are logged with stack traces

## Error Handling
- Network errors are handled gracefully
- Failed updates revert the UI state
- User-friendly error messages
- Automatic retry mechanisms for WebSocket connections

## Testing
To test the functionality:
1. Start the backend server
2. Start the frontend application
3. Login as an admin user
4. Navigate to Devices section
5. Try changing device status using the dropdown
6. Verify the change appears in real-time
7. Check backend logs for confirmation
