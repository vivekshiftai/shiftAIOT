import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useIoT } from '../../contexts/IoTContext';

export const AuthDebug: React.FC = () => {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { loading: iotLoading, devices } = useIoT();
  const [testResult, setTestResult] = useState<string>('');

  const testAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    let result = '=== AUTH DEBUG ===\n';
    result += `Token exists: ${!!token}\n`;
    result += `User data exists: ${!!userData}\n`;
    result += `Auth context user: ${user ? 'exists' : 'null'}\n`;
    result += `Auth loading: ${authLoading}\n`;
    result += `IoT loading: ${iotLoading}\n`;
    
    if (token) {
      result += `Token preview: ${token.substring(0, 20)}...\n`;
    }
    
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        result += `User email: ${parsed.email}\n`;
        result += `User role: ${parsed.role}\n`;
      } catch (e) {
        result += `Failed to parse user data: ${e}\n`;
      }
    }
    
    // Test API call
    try {
      const response = await fetch('/api/devices', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      result += `API call status: ${response.status}\n`;
      
      if (response.ok) {
        const data = await response.json();
        result += `API call successful, devices: ${data.length}\n`;
      } else {
        const errorText = await response.text();
        result += `API call failed: ${errorText}\n`;
      }
    } catch (error) {
      result += `API call error: ${error}\n`;
    }
    
    setTestResult(result);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4">Authentication Debug</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Auth Context</h3>
            <p>User: {user ? 'Logged in' : 'Not logged in'}</p>
            <p>Loading: {authLoading ? 'Yes' : 'No'}</p>
            {user && (
              <p>Email: {user.email}</p>
            )}
          </div>
        
          <div>
            <h3 className="font-semibold">IoT Context</h3>
            <p>Loading: {iotLoading ? 'Yes' : 'No'}</p>
            <p>Devices: {devices.length}</p>
          </div>
        </div>
        
        <div className="space-x-2">
          <button
            onClick={testAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Authentication
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
        
        {testResult && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Test Results:</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
              {testResult}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
