import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { tokenService } from '../../services/tokenService';

export const AuthStatus: React.FC = () => {
  const { user, isLoading } = useAuth();
  const token = tokenService.getToken();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-3 shadow-lg z-50">
      <div className="text-xs font-mono">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${token ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="font-semibold">Auth Status</span>
        </div>
        <div className="space-y-1 text-gray-600">
          <div>Token: {token ? '✅ Present' : '❌ Missing'}</div>
          <div>User: {user ? '✅ Logged In' : '❌ Not Logged In'}</div>
          <div>Loading: {isLoading ? '⏳ Yes' : '✅ No'}</div>
          {user && (
            <div className="text-xs">
              {user.firstName} {user.lastName} ({user.role})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
