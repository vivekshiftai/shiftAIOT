# Integration Test Plan for PDF Processing and Database Storage

## Overview
This document outlines the integration testing for the PDF processing feature, database storage, and frontend-backend communication.

## Test Environment Setup

### 1. Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```

### 3. Database Setup
```sql
-- Verify database connection
SELECT version();

-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('devices', 'device_maintenance', 'device_safety_precautions', 'rules', 'rule_conditions', 'rule_actions');
```

## Test Scenarios

### Test 1: PDF Service Health Check
**Objective**: Verify external PDF service is accessible

**Steps**:
1. Test health endpoint:
```bash
curl -X GET "http://20.75.50.202:8000/health"
```

**Expected Result**:
```json
{
  "status": "healthy",
  "service": "PDF Intelligence Platform",
  "version": "1.0.0"
}
```

### Test 2: Device Creation with PDF Processing
**Objective**: Verify complete flow from frontend to database

**Steps**:
1. Open frontend application
2. Navigate to Devices section
3. Click "Add Device"
4. Fill in device information:
   - Name: "Test IoT Device"
   - Type: "SENSOR"
   - Location: "Test Location"
   - Protocol: "HTTP"
5. Upload a PDF file in step 4
6. Verify AI processing completes
7. Select rules and confirm
8. Submit device creation

**Expected Results**:
- Device is created in database
- PDF processing results are saved
- Rules, maintenance, and safety data are stored

### Test 3: Database Verification
**Objective**: Verify data is correctly stored in database

**SQL Queries to Run**:
```sql
-- Check device creation
SELECT id, name, type, status, organization_id, created_at 
FROM devices 
WHERE name = 'Test IoT Device';

-- Check maintenance data
SELECT dm.id, dm.task_name, dm.device_id, dm.frequency, dm.status
FROM device_maintenance dm
JOIN devices d ON dm.device_id = d.id
WHERE d.name = 'Test IoT Device';

-- Check safety precautions
SELECT dsp.id, dsp.title, dsp.severity, dsp.category
FROM device_safety_precautions dsp
JOIN devices d ON dsp.device_id = d.id
WHERE d.name = 'Test IoT Device';

-- Check rules
SELECT r.id, r.name, r.active, r.organization_id
FROM rules r
WHERE r.organization_id = 'default';

-- Check rule conditions
SELECT rc.id, rc.type, rc.metric, rc.value
FROM rule_conditions rc
JOIN rules r ON rc.rule_id = r.id
WHERE r.organization_id = 'default';

-- Check rule actions
SELECT ra.id, ra.type, ra.action_data
FROM rule_actions ra
JOIN rules r ON ra.rule_id = r.id
WHERE r.organization_id = 'default';
```

### Test 4: API Endpoint Testing
**Objective**: Verify all API endpoints work correctly

**Endpoints to Test**:
```bash
# 1. Get device PDF results
curl -X GET "http://localhost:8080/api/devices/{device-id}/pdf-results" \
  -H "Authorization: Bearer {token}"

# 2. Get device maintenance
curl -X GET "http://localhost:8080/api/devices/{device-id}/maintenance" \
  -H "Authorization: Bearer {token}"

# 3. Get device safety precautions
curl -X GET "http://localhost:8080/api/devices/{device-id}/safety-precautions" \
  -H "Authorization: Bearer {token}"

# 4. Get device rules
curl -X GET "http://localhost:8080/api/devices/{device-id}/rules" \
  -H "Authorization: Bearer {token}"
```

### Test 5: Frontend Component Testing
**Objective**: Verify PDF results are displayed correctly

**Steps**:
1. Navigate to device details
2. Check if "PDF Results" tab exists
3. Verify data is displayed in tabs:
   - Rules tab
   - Maintenance tab
   - Safety tab
4. Test tab switching
5. Verify loading states

### Test 6: Error Handling
**Objective**: Verify error handling works correctly

**Test Cases**:
1. PDF service unavailable
2. Invalid PDF file
3. Database connection issues
4. Network timeouts

## Data Flow Verification

### Frontend to Backend Flow:
1. **Device Form** → `AddDeviceForm.tsx`
2. **PDF Processing** → `pdfApiService.ts`
3. **API Calls** → External PDF service (`http://20.75.50.202:8000`)
4. **Device Creation** → `DeviceController.createDeviceWithFiles()`
5. **PDF Results Processing** → `PDFProcessingService.savePDFProcessingResults()`
6. **Database Storage** → JPA repositories

### Backend to Frontend Flow:
1. **API Endpoints** → `DeviceController.getDevicePDFResults()`
2. **Data Retrieval** → `PDFProcessingService.getDevice*()`
3. **Frontend Display** → `DevicePDFResults.tsx`

## Schema Verification

### Required Tables:
- `devices` - Main device information
- `device_maintenance` - Maintenance schedules
- `device_safety_precautions` - Safety information
- `rules` - IoT rules
- `rule_conditions` - Rule conditions
- `rule_actions` - Rule actions

### Required Indexes:
- `idx_device_maintenance_device`
- `idx_device_maintenance_organization`
- `idx_device_safety_device`
- `idx_device_safety_active`
- `idx_rule_conditions_rule`
- `idx_rule_conditions_device`
- `idx_rule_actions_rule`

## Performance Testing

### Load Testing:
1. Create 10 devices with PDF processing
2. Monitor database performance
3. Check API response times
4. Verify memory usage

### Concurrent Testing:
1. Multiple users creating devices simultaneously
2. PDF processing queue handling
3. Database connection pooling

## Security Testing

### Authentication:
1. Verify JWT token validation
2. Test unauthorized access
3. Check organization isolation

### Data Validation:
1. SQL injection prevention
2. File upload validation
3. Input sanitization

## Monitoring and Logging

### Backend Logs:
```bash
# Check application logs
tail -f backend/logs/application.log

# Check for errors
grep "ERROR" backend/logs/application.log
```

### Database Logs:
```sql
-- Check for slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

## Troubleshooting Guide

### Common Issues:

1. **PDF Service Connection Failed**
   - Check if `http://20.75.50.202:8000` is accessible
   - Verify network connectivity
   - Check firewall settings

2. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check connection string in `application.yml`
   - Verify database credentials

3. **Frontend API Errors**
   - Check CORS configuration
   - Verify API base URL
   - Check authentication token

4. **Data Not Saving**
   - Check transaction rollback
   - Verify entity relationships
   - Check constraint violations

### Debug Commands:
```bash
# Test PDF service
curl -X GET "http://20.75.50.202:8000/health"

# Test backend API
curl -X GET "http://localhost:8080/api/devices" \
  -H "Authorization: Bearer {token}"

# Check database
psql -U postgres -d iotplatform -c "SELECT COUNT(*) FROM devices;"
```

## Success Criteria

### Functional Requirements:
- [ ] Device creation with PDF upload works
- [ ] AI processing generates rules, maintenance, and safety data
- [ ] Data is correctly stored in database
- [ ] Frontend displays PDF results correctly
- [ ] All API endpoints return correct data

### Performance Requirements:
- [ ] Device creation completes within 30 seconds
- [ ] PDF processing completes within 60 seconds
- [ ] API responses return within 2 seconds
- [ ] Database queries execute within 1 second

### Security Requirements:
- [ ] Authentication is enforced
- [ ] Data is isolated by organization
- [ ] File uploads are validated
- [ ] SQL injection is prevented

## Test Results Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| PDF Service Health | | |
| Device Creation | | |
| Database Storage | | |
| API Endpoints | | |
| Frontend Display | | |
| Error Handling | | |
| Performance | | |
| Security | | |

## Conclusion

This integration test plan ensures that the PDF processing feature works end-to-end, from frontend user interaction to database storage and back to frontend display. All components must be tested together to verify the complete data flow.
