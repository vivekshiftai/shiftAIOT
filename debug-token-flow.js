// Debug script to check token flow and authentication issues
// Run this in browser console to diagnose authentication problems

async function debugTokenFlow() {
  console.log('🔍 Debugging token flow...');
  
  // Check localStorage
  console.log('\n📦 LocalStorage Check:');
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  console.log(`- Token exists: ${!!token}`);
  console.log(`- User exists: ${!!user}`);
  
  if (token) {
    console.log(`- Token length: ${token.length}`);
    console.log(`- Token preview: ${token.substring(0, 20)}...`);
  }
  
  if (user) {
    try {
      const userData = JSON.parse(user);
      console.log(`- User email: ${userData.email}`);
      console.log(`- User role: ${userData.role}`);
    } catch (e) {
      console.log('- User data is invalid JSON');
    }
  }
  
  // Check tokenService
  console.log('\n🔧 TokenService Check:');
  console.log(`- TokenService hasToken(): ${window.tokenService?.hasToken() || 'tokenService not available'}`);
  console.log(`- TokenService getToken(): ${window.tokenService?.getToken() ? 'Token found' : 'No token'}`);
  
  // Test API calls
  console.log('\n🌐 API Call Test:');
  
  if (!token) {
    console.log('❌ No token found - cannot test API calls');
    return;
  }
  
  try {
    // Test with fetch directly
    console.log('Testing with fetch...');
    const response = await fetch('/api/devices', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`- Fetch response status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log(`- Fetch response data: ${data.length} devices found`);
    } else {
      console.log(`- Fetch response error: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`- Fetch error: ${error.message}`);
  }
  
  // Test with axios if available
  if (window.axios) {
    try {
      console.log('Testing with axios...');
      const response = await window.axios.get('/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`- Axios response status: ${response.status}`);
      console.log(`- Axios response data: ${response.data.length} devices found`);
    } catch (error) {
      console.log(`- Axios error: ${error.response?.status} - ${error.response?.statusText}`);
    }
  }
  
  // Check current page authentication state
  console.log('\n📄 Current Page State:');
  console.log(`- Current URL: ${window.location.href}`);
  console.log(`- Is authenticated page: ${window.location.pathname !== '/login' && window.location.pathname !== '/signup'}`);
  
  // Check if there are any authentication errors in console
  console.log('\n⚠️ Authentication Issues:');
  console.log('- Check browser console for 401/403 errors');
  console.log('- Check Network tab for failed requests');
  
  // Test token validation
  console.log('\n🔐 Token Validation Test:');
  try {
    const validationResponse = await fetch('/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`- Token validation status: ${validationResponse.status}`);
    if (validationResponse.ok) {
      const profile = await validationResponse.json();
      console.log(`- Token is valid for user: ${profile.email}`);
    } else {
      console.log(`- Token validation failed: ${validationResponse.statusText}`);
    }
  } catch (error) {
    console.log(`- Token validation error: ${error.message}`);
  }
}

// Export for use in browser console
window.debugTokenFlow = debugTokenFlow;

console.log('🧪 Token flow debug script loaded! Run debugTokenFlow() to diagnose authentication issues.');
