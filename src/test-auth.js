// Test authentication flow
const testAuth = async () => {
  console.log('Testing authentication flow...');
  
  // Check if we have stored credentials
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Stored token:', token ? 'exists' : 'not found');
  console.log('Stored user:', user ? 'exists' : 'not found');
  
  if (token && user) {
    console.log('User data:', JSON.parse(user));
    
    // Test API call with token
    try {
      const response = await fetch('/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API call successful:', data);
      } else {
        console.log('API call failed:', response.statusText);
        const errorText = await response.text();
        console.log('Error details:', errorText);
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  } else {
    console.log('No stored credentials found');
  }
};

// Run test when page loads
if (typeof window !== 'undefined') {
  window.testAuth = testAuth;
  console.log('Auth test function available as window.testAuth()');
}
