// Comprehensive authentication test script
// Run this in browser console to test authentication flow

async function testAuthentication() {
  console.log('🔐 Testing authentication flow...');
  
  // Step 1: Check current state
  console.log('\n📋 Step 1: Current State Check');
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log(`- Token exists: ${!!token}`);
  console.log(`- User exists: ${!!user}`);
  
  if (!token) {
    console.log('❌ No token found - user needs to login first');
    return;
  }
  
  console.log(`- Token preview: ${token.substring(0, 30)}...`);
  
  // Step 2: Test token validation
  console.log('\n🔍 Step 2: Token Validation Test');
  try {
    const validationResponse = await fetch('http://20.57.36.66:8100/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`- Validation status: ${validationResponse.status}`);
    if (validationResponse.ok) {
      const profile = await validationResponse.json();
      console.log(`- Token is valid for user: ${profile.email}`);
    } else {
      console.log(`- Token validation failed: ${validationResponse.statusText}`);
      const errorText = await validationResponse.text();
      console.log(`- Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`- Validation error: ${error.message}`);
  }
  
  // Step 3: Test API calls
  console.log('\n🌐 Step 3: API Call Tests');
  
  const endpoints = [
    '/api/devices',
    '/api/rules',
    '/api/notifications'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint}...`);
      const response = await fetch(`http://20.57.36.66:8100${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`- Status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`- Success: ${Array.isArray(data) ? data.length + ' items' : 'Data received'}`);
      } else {
        console.log(`- Failed: ${response.statusText}`);
        const errorText = await response.text();
        console.log(`- Error: ${errorText}`);
      }
    } catch (error) {
      console.log(`- Error: ${error.message}`);
    }
  }
  
  // Step 4: Test tokenService
  console.log('\n🔧 Step 4: TokenService Test');
  if (window.tokenService) {
    console.log(`- TokenService available: ${!!window.tokenService}`);
    console.log(`- hasToken(): ${window.tokenService.hasToken()}`);
    console.log(`- getToken(): ${window.tokenService.getToken() ? 'Token found' : 'No token'}`);
  } else {
    console.log('- TokenService not available in window object');
  }
  
  // Step 5: Test axios instance
  console.log('\n📡 Step 5: Axios Instance Test');
  if (window.axios) {
    try {
      const response = await window.axios.get('http://20.57.36.66:8100/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`- Axios status: ${response.status}`);
      console.log(`- Axios data: ${response.data.length} devices`);
    } catch (error) {
      console.log(`- Axios error: ${error.response?.status} - ${error.response?.statusText}`);
    }
  } else {
    console.log('- Axios not available in window object');
  }
  
  // Step 6: Check network requests
  console.log('\n🌍 Step 6: Network Request Analysis');
  console.log('- Check Network tab in DevTools for:');
  console.log('  * Request headers (Authorization should be present)');
  console.log('  * Response status codes');
  console.log('  * CORS errors');
  console.log('  * Network connectivity issues');
  
  // Step 7: Recommendations
  console.log('\n💡 Step 7: Recommendations');
  if (!token) {
    console.log('- User needs to login first');
  } else {
    console.log('- Token exists, check if it\'s valid');
    console.log('- Verify backend is running on http://20.57.36.66:8100');
    console.log('- Check CORS configuration on backend');
    console.log('- Verify JWT secret and token format');
  }
}

// Export for use in browser console
window.testAuthentication = testAuthentication;

console.log('🔐 Authentication test script loaded! Run testAuthentication() to debug auth issues.');
