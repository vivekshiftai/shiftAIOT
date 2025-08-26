import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logInfo } from '../../utils/logger';

export const AuthDebugger: React.FC = () => {
  const { user, clearAuthData, logout } = useAuth();

  const handleClearAuthData = () => {
    logInfo('AuthDebugger', '🧹 Clearing authentication data to fix JWT issues');
    clearAuthData();
    alert('Authentication data cleared! Please log in again to get a fresh token.');
  };

  const handleLogout = () => {
    logInfo('AuthDebugger', '🚪 Logging out user');
    logout();
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Authentication Debug</h3>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h4 className="text-lg font-medium text-slate-800 mb-4">Current User</h4>
        
        {user ? (
          <div className="space-y-2 text-sm">
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Organization ID:</strong> {user.organizationId}</p>
            <p><strong>Enabled:</strong> {user.enabled ? 'Yes' : 'No'}</p>
            <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
            <p><strong>Last Login:</strong> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
          </div>
        ) : (
          <p className="text-slate-600">No user logged in</p>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h4 className="text-lg font-medium text-slate-800 mb-4">Authentication Actions</h4>
        
        <div className="space-y-3">
          <button
            onClick={handleClearAuthData}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            🧹 Clear Auth Data (Fix JWT Issues)
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            🚪 Logout
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> If you're experiencing JWT validation errors, click "Clear Auth Data" 
            to remove old tokens and then log in again to get fresh tokens.
          </p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h4 className="text-lg font-medium text-slate-800 mb-4">Local Storage</h4>
        
        <div className="space-y-2 text-sm">
          <p><strong>Token:</strong> {localStorage.getItem('token') ? 'Present' : 'Not found'}</p>
          <p><strong>Refresh Token:</strong> {localStorage.getItem('refreshToken') ? 'Present' : 'Not found'}</p>
          <p><strong>User Data:</strong> {localStorage.getItem('user') ? 'Present' : 'Not found'}</p>
        </div>
      </div>
    </div>
  );
};
