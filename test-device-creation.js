const axios = require('axios');

const API_BASE_URL = 'http://localhost:8080';

// Test data for different connection types
const testDevices = [
  {
    name: 'MQTT Temperature Sensor',
    type: 'SENSOR',
    location: 'Building A - Floor 1',
    protocol: 'MQTT',
    manufacturer: 'Test Manufacturer',
    description: 'Test MQTT device',
    mqttBroker: 'mqtt.broker.com',
    mqttTopic: 'sensors/temperature',
    mqttUsername: 'testuser',
    mqttPassword: 'testpass'
  },
  {
    name: 'HTTP Humidity Sensor',
    type: 'SENSOR',
    location: 'Building A - Floor 2',
    protocol: 'HTTP',
    manufacturer: 'Test Manufacturer',
    description: 'Test HTTP device',
    httpEndpoint: 'http://192.168.1.100:8080/api/data',
    httpMethod: 'GET',
    httpHeaders: '{"Content-Type": "application/json"}'
  },
  {
    name: 'COAP Light Sensor',
    type: 'SENSOR',
    location: 'Building B - Floor 1',
    protocol: 'COAP',
    manufacturer: 'Test Manufacturer',
    description: 'Test COAP device',
    coapHost: '192.168.1.101',
    coapPort: 5683,
    coapPath: 'sensors/light'
  }
];

async function testDeviceCreation() {
  try {
    console.log('Testing device creation with different connection types...\n');

    for (const deviceData of testDevices) {
      console.log(`Creating ${deviceData.protocol} device: ${deviceData.name}`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/api/devices/simple`, deviceData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
          }
        });

        console.log(`✅ Successfully created device with ID: ${response.data.id}`);
        console.log(`   Protocol: ${response.data.protocol}`);
        console.log(`   Status: ${response.data.status}`);
        
        // Log connection details based on protocol
        if (deviceData.protocol === 'MQTT') {
          console.log(`   MQTT Broker: ${response.data.mqttBroker}`);
          console.log(`   MQTT Topic: ${response.data.mqttTopic}`);
        } else if (deviceData.protocol === 'HTTP') {
          console.log(`   HTTP Endpoint: ${response.data.httpEndpoint}`);
          console.log(`   HTTP Method: ${response.data.httpMethod}`);
        } else if (deviceData.protocol === 'COAP') {
          console.log(`   COAP Host: ${response.data.coapHost}`);
          console.log(`   COAP Port: ${response.data.coapPort}`);
          console.log(`   COAP Path: ${response.data.coapPath}`);
        }
        
        console.log('');
      } catch (error) {
        console.error(`❌ Failed to create ${deviceData.protocol} device:`, error.response?.data || error.message);
        console.log('');
      }
    }

    console.log('Device creation test completed!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testDeviceCreation();
