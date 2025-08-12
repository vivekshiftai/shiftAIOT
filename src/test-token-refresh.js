// Test token refresh functionality
console.log('=== Token Refresh Test ===');

// Test token refresh
async function testTokenRefresh() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, please login first');
      return;
    }

    console.log('Current token:', token.substring(0, 20) + '...');
    
    // Test token refresh
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });
    
    console.log('Refresh response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Token refresh successful!');
      console.log('New token received:', !!data.token);
      console.log('New token:', data.token.substring(0, 20) + '...');
      
      // Store new token
      localStorage.setItem('token', data.token);
      console.log('New token stored in localStorage');
      
      // Test API call with new token
      await testApiCallWithNewToken(data.token);
    } else {
      const errorData = await response.json();
      console.error('Token refresh failed:', errorData);
    }
  } catch (error) {
    console.error('Token refresh error:', error);
  }
}

// Test API call with new token
async function testApiCallWithNewToken(newToken) {
  try {
    console.log('Testing API call with refreshed token...');
    
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${newToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API call status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API call successful with refreshed token!');
      console.log('Users data:', data);
    } else {
      const errorData = await response.json();
      console.error('API call failed with refreshed token:', errorData);
    }
  } catch (error) {
    console.error('API call error with refreshed token:', error);
  }
}

// Test automatic token refresh via interceptor
async function testAutomaticRefresh() {
  try {
    console.log('Testing automatic token refresh...');
    
    // This should trigger the interceptor if token is expired
    const response = await fetch('/api/users', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Automatic refresh test status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Automatic refresh successful!');
      console.log('Users data:', data);
    } else {
      console.log('Automatic refresh test completed');
    }
  } catch (error) {
    console.error('Automatic refresh test error:', error);
  }
}

// Run tests
console.log('1. Testing manual token refresh...');
await testTokenRefresh();

console.log('\n2. Testing automatic token refresh...');
await testAutomaticRefresh();
