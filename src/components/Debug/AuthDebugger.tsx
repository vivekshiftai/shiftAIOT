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
      // Get authentication status using tokenService
      const authStatus = tokenService.getAuthStatus();
      tokenService.logAuthStatus();
      
      console.log('🔍 Auth Debug Info:');
      console.log('Auth Status:', authStatus);
      
      // Test auth endpoint
      const response = await deviceAPI.testAuth();
      console.log('✅ Auth test successful:', response.data);
      
      setDebugInfo({
        authStatus,
        authTest: response.data,
        timestamp: new Date().toISOString()
      });
      
    } catch (err: any) {
      console.error('❌ Auth test failed:', err);
      setError(err.response?.data?.error || err.message || 'Unknown error');
      
      // Still show auth status even if test fails
      const authStatus = tokenService.getAuthStatus();
      setDebugInfo({
        authStatus,
        error: err.response?.data?.error || err.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    tokenService.removeToken();
    setDebugInfo(null);
    setError(null);
    console.log('🧹 Auth data cleared');
  };

  const checkAuthStatus = () => {
    const authStatus = tokenService.getAuthStatus();
    setDebugInfo({
      authStatus,
      timestamp: new Date().toISOString()
    });
    console.log('🔍 Current Auth Status:', authStatus);
  };

  return (
    <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
      <h3 className="text-lg font-semibold text-yellow-800 mb-4">🔍 Authentication Debugger</h3>
      
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={runAuthTest}
            disabled={loading}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Authentication'}
          </button>
          
          <button
            onClick={checkAuthStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Check Auth Status
          </button>
          
          <button
            onClick={clearAuth}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Clear Auth Data
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {debugInfo && (
          <div className="p-4 bg-white border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Debug Information:</h4>
            <pre className="text-sm text-slate-700 overflow-auto max-h-96">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
