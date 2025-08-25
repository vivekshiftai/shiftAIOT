// Simple test script to check backend connectivity
const fetch = require('node-fetch');

const BACKEND_URL = 'http://20.57.36.66:8100';

async function testBackend() {
  console.log('Testing backend connectivity...');
  
  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BACKEND_URL}/api/devices/health`);
    console.log(`   Health status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   Health data:', healthData);
    }
    
    // Test auth endpoint
    console.log('2. Testing auth endpoint...');
    const authResponse = await fetch(`${BACKEND_URL}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      })
    });
    console.log(`   Auth status: ${authResponse.status} ${authResponse.statusText}`);
    
    // Test devices endpoint (should require auth)
    console.log('3. Testing devices endpoint (should require auth)...');
    const devicesResponse = await fetch(`${BACKEND_URL}/api/devices`);
    console.log(`   Devices status: ${devicesResponse.status} ${devicesResponse.statusText}`);
    
  } catch (error) {
    console.error('Error testing backend:', error.message);
  }
}

testBackend();
