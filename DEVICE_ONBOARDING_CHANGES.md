# Device Onboarding Changes - Connection Type Support

## Overview
This document summarizes the changes made to support three different connection types (MQTT, HTTP, COAP) in the device onboarding process. The changes include database schema updates, backend API modifications, and frontend form enhancements.

## Database Schema Changes

### Updated `devices` table in `schema.sql`
- **Made most fields nullable** to support minimal device creation
- **Added protocol-specific connection fields**:
  - **MQTT fields**: `mqtt_broker`, `mqtt_topic`, `mqtt_username`, `mqtt_password`
  - **HTTP fields**: `http_endpoint`, `http_method`, `http_headers`
  - **COAP fields**: `coap_host`, `coap_port`, `coap_path`
- **Kept legacy fields** for backward compatibility
- **Set default values** for required fields (`type`, `protocol`, `status`)

### Key Changes:
```sql
-- MQTT specific fields (nullable)
mqtt_broker VARCHAR(255),
mqtt_topic VARCHAR(255),
mqtt_username VARCHAR(100),
mqtt_password VARCHAR(255),

-- HTTP specific fields (nullable)
http_endpoint VARCHAR(500),
http_method VARCHAR(10) DEFAULT 'GET',
http_headers TEXT, -- JSON string

-- COAP specific fields (nullable)
coap_host VARCHAR(255),
coap_port INTEGER,
coap_path VARCHAR(255),
```

## Backend Changes

### 1. Updated Device Model (`Device.java`)
- **Added new fields** for each connection type
- **Made fields nullable** with appropriate annotations
- **Added getters and setters** for all new fields
- **Organized fields** by connection type for better maintainability

### 2. New DTO (`DeviceCreateRequest.java`)
- **Simplified request structure** with only essential fields
- **Protocol-specific fields** for MQTT, HTTP, and COAP
- **Proper validation annotations**
- **Default values** for optional fields

### 3. Updated DeviceService (`DeviceService.java`)
- **Added `createDeviceFromRequest()` method**
- **Protocol-specific field mapping** using switch statement
- **Handles all three connection types** appropriately

### 4. New API Endpoint (`DeviceController.java`)
- **Added `/api/devices/simple` endpoint**
- **Uses new `DeviceCreateRequest` DTO**
- **Proper error handling and logging**
- **Authentication and authorization support**

## Frontend Changes

### 1. Updated Onboarding Form (`EnhancedDeviceOnboardingForm.tsx`)
- **Enhanced `DeviceFormData` interface** with all connection fields
- **Dynamic form rendering** based on selected connection type
- **Protocol-specific validation** for required fields
- **Improved user experience** with clear field labels and placeholders

### 2. Connection Type Support
- **MQTT**: Broker URL, Topic, Username, Password
- **HTTP**: Endpoint URL, HTTP Method, Headers (JSON)
- **COAP**: Host, Port, Path

### 3. Updated API Service (`api.ts`)
- **Added `createSimple()` method** for new endpoint
- **Maintains backward compatibility** with existing methods

### 4. Updated Onboarding Service (`onboardingService.ts`)
- **Uses new simplified device creation**
- **Protocol-specific field mapping**
- **Dynamic field inclusion** based on connection type

## API Endpoints

### New Endpoint
```
POST /api/devices/simple
Content-Type: application/json
Authorization: Bearer <token>

Request Body:
{
  "name": "Device Name",
  "type": "SENSOR",
  "location": "Device Location",
  "protocol": "MQTT|HTTP|COAP",
  "manufacturer": "Manufacturer Name",
  "description": "Device Description",
  
  // MQTT specific fields
  "mqttBroker": "mqtt.broker.com",
  "mqttTopic": "sensors/temperature",
  "mqttUsername": "username",
  "mqttPassword": "password",
  
  // HTTP specific fields
  "httpEndpoint": "http://192.168.1.100:8080/api/data",
  "httpMethod": "GET",
  "httpHeaders": "{\"Content-Type\": \"application/json\"}",
  
  // COAP specific fields
  "coapHost": "192.168.1.101",
  "coapPort": 5683,
  "coapPath": "sensors/light"
}
```

## Validation Rules

### Required Fields (All Protocols)
- `name`: Device name (max 100 characters)
- `location`: Device location (max 200 characters)
- `protocol`: Connection protocol (MQTT, HTTP, or COAP)

### Protocol-Specific Required Fields
- **MQTT**: `mqttBroker`, `mqttTopic`
- **HTTP**: `httpEndpoint`
- **COAP**: `coapHost`

### Optional Fields
- All other fields are optional and can be null
- Default values are provided where appropriate

## Testing

### Test Script
Created `test-device-creation.js` to verify:
- Device creation with all three connection types
- Proper field mapping and storage
- API response validation
- Error handling

### Test Cases
1. **MQTT Device**: Tests broker URL, topic, username, password
2. **HTTP Device**: Tests endpoint URL, method, headers
3. **COAP Device**: Tests host, port, path

## Migration Notes

### Database Migration
- **No data loss**: Existing devices remain unchanged
- **Backward compatibility**: Legacy fields are preserved
- **Nullable fields**: New fields don't affect existing data

### API Compatibility
- **Existing endpoints**: Continue to work as before
- **New endpoint**: Provides simplified device creation
- **Gradual migration**: Can migrate existing code over time

## Benefits

1. **Simplified Onboarding**: Users only need to provide essential information
2. **Protocol Flexibility**: Support for three major IoT protocols
3. **Better UX**: Dynamic forms based on connection type
4. **Data Efficiency**: Only store relevant connection data
5. **Extensibility**: Easy to add new protocols in the future

## Future Enhancements

1. **Additional Protocols**: Support for WebSocket, TCP, UDP
2. **Connection Testing**: Validate connection settings before saving
3. **Templates**: Pre-configured connection templates
4. **Security**: Encrypt sensitive connection data
5. **Monitoring**: Real-time connection status monitoring
