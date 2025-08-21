// Test script to verify onboarding flow and data storage
// Run this in the browser console after completing onboarding

async function testOnboardingDataStorage() {
  console.log('🔍 Testing onboarding data storage...');
  
  try {
    // Get the current user's token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('❌ No token found - user not authenticated');
      return;
    }
    
    console.log('✅ Token found, proceeding with tests...');
    
    // Test 1: Get all devices
    console.log('\n📱 Test 1: Getting all devices...');
    const devicesResponse = await fetch('/api/devices', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!devicesResponse.ok) {
      console.error('❌ Failed to get devices:', devicesResponse.status, devicesResponse.statusText);
      return;
    }
    
    const devices = await devicesResponse.json();
    console.log(`✅ Found ${devices.length} devices`);
    
    if (devices.length === 0) {
      console.log('⚠️ No devices found - run onboarding first');
      return;
    }
    
    // Test 2: Get debug data for the first device
    const firstDevice = devices[0];
    console.log(`\n🔍 Test 2: Getting debug data for device "${firstDevice.name}" (${firstDevice.id})...`);
    
    const debugResponse = await fetch(`/api/devices/${firstDevice.id}/debug-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!debugResponse.ok) {
      console.error('❌ Failed to get debug data:', debugResponse.status, debugResponse.statusText);
      return;
    }
    
    const debugData = await debugResponse.json();
    console.log('✅ Debug data retrieved:', debugData);
    
    // Test 3: Get specific data types
    console.log('\n📊 Test 3: Getting specific data types...');
    
    // Get rules
    const rulesResponse = await fetch(`/api/devices/${firstDevice.id}/rules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (rulesResponse.ok) {
      const rules = await rulesResponse.json();
      console.log(`✅ Found ${rules.length} rules for device`);
    } else {
      console.log('⚠️ Failed to get rules:', rulesResponse.status);
    }
    
    // Get maintenance
    const maintenanceResponse = await fetch(`/api/devices/${firstDevice.id}/maintenance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (maintenanceResponse.ok) {
      const maintenance = await maintenanceResponse.json();
      console.log(`✅ Found ${maintenance.length} maintenance tasks for device`);
    } else {
      console.log('⚠️ Failed to get maintenance:', maintenanceResponse.status);
    }
    
    // Get safety precautions
    const safetyResponse = await fetch(`/api/devices/${firstDevice.id}/safety-precautions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (safetyResponse.ok) {
      const safety = await safetyResponse.json();
      console.log(`✅ Found ${safety.length} safety precautions for device`);
    } else {
      console.log('⚠️ Failed to get safety precautions:', safetyResponse.status);
    }
    
    // Test 4: Get test data (comprehensive)
    console.log('\n🧪 Test 4: Getting comprehensive test data...');
    const testDataResponse = await fetch(`/api/devices/${firstDevice.id}/test-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (testDataResponse.ok) {
      const testData = await testDataResponse.json();
      console.log('✅ Test data retrieved:', {
        device: testData.device?.name,
        rulesCount: testData.rulesCount,
        maintenanceCount: testData.maintenanceCount,
        safetyCount: testData.safetyCount
      });
      
      // Show detailed breakdown
      console.log('\n📋 Detailed breakdown:');
      console.log(`- Device: ${testData.device?.name || 'Unknown'}`);
      console.log(`- Rules: ${testData.rulesCount || 0} items`);
      console.log(`- Maintenance: ${testData.maintenanceCount || 0} items`);
      console.log(`- Safety: ${testData.safetyCount || 0} items`);
      
      if (testData.rules && testData.rules.length > 0) {
        console.log('\n📜 Sample Rules:');
        testData.rules.slice(0, 3).forEach((rule, index) => {
          console.log(`  ${index + 1}. ${rule.name || 'Unnamed Rule'}`);
        });
      }
      
      if (testData.maintenance && testData.maintenance.length > 0) {
        console.log('\n🔧 Sample Maintenance:');
        testData.maintenance.slice(0, 3).forEach((task, index) => {
          console.log(`  ${index + 1}. ${task.taskName || 'Unnamed Task'}`);
        });
      }
      
      if (testData.safetyPrecautions && testData.safetyPrecautions.length > 0) {
        console.log('\n⚠️ Sample Safety:');
        testData.safetyPrecautions.slice(0, 3).forEach((safety, index) => {
          console.log(`  ${index + 1}. ${safety.title || 'Unnamed Safety'}`);
        });
      }
      
    } else {
      console.log('⚠️ Failed to get test data:', testDataResponse.status);
    }
    
    console.log('\n🎉 Testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Export for use in browser console
window.testOnboardingDataStorage = testOnboardingDataStorage;

console.log('🧪 Test script loaded! Run testOnboardingDataStorage() to verify data storage.');
