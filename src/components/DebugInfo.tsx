import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const DebugInfo: React.FC = () => {
  const { user, isLoading } = useAuth();
  
  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border text-xs">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
      <div>User: {user ? user.email : 'None'}</div>
      <div>Token: {localStorage.getItem('token') ? 'Exists' : 'None'}</div>
    </div>
  );
};
