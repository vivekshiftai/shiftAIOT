// Comprehensive Backend Connectivity Test Script
const fetch = require('node-fetch');

const BACKEND_URL = 'http://20.57.36.66:8100';

// Test credentials (you may need to update these)
const TEST_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

let authToken = null;

async function testEndpoint(method, endpoint, data = null, requiresAuth = false) {
  const url = `${BACKEND_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (requiresAuth && authToken) {
    options.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`\n🔍 Testing: ${method} ${endpoint}`);
    const response = await fetch(url, options);
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const responseData = await response.json();
      console.log(`   ✅ Success: ${JSON.stringify(responseData).substring(0, 100)}...`);
      return responseData;
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Network Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Backend Connectivity Tests...\n');
  console.log(`📍 Backend URL: ${BACKEND_URL}\n`);

  // Test 1: Health Check
  console.log('📋 Test 1: Health Check');
  await testEndpoint('GET', '/api/devices/health');

  // Test 2: Authentication
  console.log('\n📋 Test 2: Authentication');
  const authResponse = await testEndpoint('POST', '/auth/signin', TEST_CREDENTIALS);
  if (authResponse && authResponse.token) {
    authToken = authResponse.token;
    console.log(`   🔐 Token received: ${authToken.substring(0, 20)}...`);
  } else {
    console.log('   ⚠️ Authentication failed - some tests will be skipped');
  }

  // Test 3: User Profile (requires auth)
  console.log('\n📋 Test 3: User Profile');
  await testEndpoint('GET', '/users/profile', null, true);

  // Test 4: Debug Authentication
  console.log('\n📋 Test 4: Debug Authentication');
  await testEndpoint('GET', '/api/devices/debug-auth', null, true);

  // Test 5: Get Devices (requires auth)
  console.log('\n📋 Test 5: Get Devices');
  await testEndpoint('GET', '/api/devices', null, true);

  // Test 6: Get Rules (requires auth)
  console.log('\n📋 Test 6: Get Rules');
  await testEndpoint('GET', '/api/rules', null, true);

  // Test 7: Get Maintenance (requires auth)
  console.log('\n📋 Test 7: Get Maintenance');
  await testEndpoint('GET', '/api/maintenance', null, true);

  // Test 8: Get Notifications (requires auth)
  console.log('\n📋 Test 8: Get Notifications');
  await testEndpoint('GET', '/api/notifications', null, true);

  // Test 9: PDF List (requires auth)
  console.log('\n📋 Test 9: PDF List');
  await testEndpoint('GET', '/api/pdf/list', null, true);

  // Test 10: Device Connections (requires auth)
  console.log('\n📋 Test 10: Device Connections');
  await testEndpoint('GET', '/api/device-connections', null, true);

  // Test 11: Conversation Configs (requires auth)
  console.log('\n📋 Test 11: Conversation Configs');
  await testEndpoint('GET', '/api/conversation-configs', null, true);

  // Test 12: Knowledge Documents (requires auth)
  console.log('\n📋 Test 12: Knowledge Documents');
  await testEndpoint('GET', '/knowledge/documents', null, true);

  // Test 13: Test endpoints that don't exist (should return 404)
  console.log('\n📋 Test 13: Non-existent Endpoints (should return 404)');
  await testEndpoint('GET', '/api/analytics', null, true);
  await testEndpoint('GET', '/api/logs', null, true);

  console.log('\n✅ Backend connectivity tests completed!');
  console.log('\n📊 Summary:');
  console.log('- If most endpoints return 200/401 (not 404), the backend is running');
  console.log('- 401 errors are expected if authentication fails');
  console.log('- 404 errors indicate missing endpoints');
  console.log('- Network errors indicate connectivity issues');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run the tests
runTests().catch(console.error);
