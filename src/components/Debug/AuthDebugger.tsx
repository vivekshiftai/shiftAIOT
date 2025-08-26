import React, { useState } from 'react';
import { deviceAPI } from '../../services/api';
import { tokenService } from '../../services/tokenService';

export const AuthDebugger: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAuthTest = async () => {
    setLoading(true);
    setError(null);
    setDebugInfo(null);

    try {
      // Get current token
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('🔍 Auth Debug Info:');
      console.log('Token exists:', !!token);
      console.log('Token length:', token?.length);
      console.log('User exists:', !!user);
      
      if (token) {
        console.log('Token preview:', token.substring(0, 50) + '...');
      }

      // Test auth endpoint
      const response = await deviceAPI.testAuth();
      console.log('✅ Auth test successful:', response.data);
      
      setDebugInfo({
        token: {
          exists: !!token,
          length: token?.length,
          preview: token ? token.substring(0, 50) + '...' : 'N/A'
        },
        user: user ? JSON.parse(user) : null,
        authTest: response.data
      });
      
    } catch (err: any) {
      console.error('❌ Auth test failed:', err);
      setError(err.response?.data?.error || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setDebugInfo(null);
    setError(null);
    console.log('🧹 Auth data cleared');
  };

  const refreshToken = async () => {
    try {
      setLoading(true);
      const currentToken = tokenService.getToken();
      if (!currentToken) {
        setError('No token to refresh');
        return;
      }

      const newToken = await tokenService.refreshToken();
      if (newToken) {
        console.log('✅ Token refreshed successfully');
        setDebugInfo((prev: any) => ({
          ...prev,
          tokenRefreshed: true,
          newTokenLength: newToken.length
        }));
      } else {
        setError('Token refresh failed');
      }
    } catch (err: any) {
      console.error('❌ Token refresh failed:', err);
      setError(err.message || 'Token refresh failed');
    } finally {
      setLoading(false);
    }
  };

  const checkTokenValidity = async () => {
    try {
      setLoading(true);
      const isValid = await tokenService.validateToken();
      console.log('🔍 Token validity check:', isValid);
      
      setDebugInfo((prev: any) => ({
        ...prev,
        tokenValid: isValid
      }));
    } catch (err: any) {
      console.error('❌ Token validation failed:', err);
      setError(err.message || 'Token validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Authentication Debugger</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={runAuthTest}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Auth'}
          </button>
          
          <button
            onClick={refreshToken}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Refresh Token
          </button>
          
          <button
            onClick={checkTokenValidity}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            Check Token
          </button>
          
          <button
            onClick={clearAuth}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Auth
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div className="p-4 bg-white border border-gray-200 rounded">
            <h4 className="font-semibold mb-2">Debug Information:</h4>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
