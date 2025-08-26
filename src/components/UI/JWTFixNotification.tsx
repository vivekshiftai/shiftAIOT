import React, { useState } from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

interface JWTFixNotificationProps {
  onClearAuth: () => void;
  onDismiss: () => void;
}

export const JWTFixNotification: React.FC<JWTFixNotificationProps> = ({ onClearAuth, onDismiss }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          
          <div className="flex-1">
            <h3 className="text-sm font-medium text-yellow-800 mb-1">
              JWT Authentication Issue Detected
            </h3>
            
            <p className="text-sm text-yellow-700 mb-3">
              Your authentication token appears to be invalid. This usually happens when the backend configuration has changed.
            </p>

            {showDetails && (
              <div className="mb-3 p-3 bg-yellow-100 rounded text-xs text-yellow-800">
                <p className="mb-2"><strong>Technical Details:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>JWT signature mismatch detected</li>
                  <li>Token was signed with different secret key</li>
                  <li>Backend configuration has been updated</li>
                  <li>Fresh token required for authentication</li>
                </ul>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClearAuth}
                className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Clear & Re-login
              </button>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-3 py-1.5 text-yellow-700 text-xs hover:bg-yellow-100 rounded transition-colors"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
              
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
