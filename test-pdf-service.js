// Simple test script to verify PDF processing service
const testPDFService = async () => {
  const baseUrl = 'http://20.57.36.66:8000';
  
  console.log('Testing PDF Processing Service...');
  console.log('Base URL:', baseUrl);
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    console.log('Health Status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health Data:', healthData);
    }
    
    // Test 2: Service info
    console.log('\n2. Testing service info...');
    const infoResponse = await fetch(`${baseUrl}/`);
    console.log('Info Status:', infoResponse.status);
    if (infoResponse.ok) {
      const infoData = await infoResponse.json();
      console.log('Service Info:', infoData);
    }
    
    // Test 3: List PDFs
    console.log('\n3. Testing list PDFs...');
    const listResponse = await fetch(`${baseUrl}/pdfs?page=1&limit=5`);
    console.log('List Status:', listResponse.status);
    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log('PDF List:', listData);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
};

// Run the test
testPDFService();
