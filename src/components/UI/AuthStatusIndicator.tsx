import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';

interface AuthStatusIndicatorProps {
  className?: string;
}

export const AuthStatusIndicator: React.FC<AuthStatusIndicatorProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'stale' | 'error'>('checking');
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!user) {
        setAuthStatus('error');
        return;
      }

      try {
        // Use the centralized API instance which handles token management
        await userAPI.getProfile();
        setAuthStatus('authenticated');
      } catch (error: any) {
        if (error.response?.status === 401) {
          setAuthStatus('stale');
        } else {
          setAuthStatus('error');
        }
      }

      setLastCheck(new Date());
    };

    checkAuthStatus();

    // Check auth status every 3 minutes (reduced from 5 minutes)
    const interval = setInterval(checkAuthStatus, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const getStatusInfo = () => {
    switch (authStatus) {
      case 'checking':
        return {
          icon: RefreshCw,
          color: 'text-blue-500',
          bgColor: 'bg-blue-50',
          text: 'Checking authentication...',
          className: 'animate-spin'
        };
      case 'authenticated':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          text: 'Authenticated',
          className: ''
        };
      case 'stale':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          text: 'Session may be stale',
          className: ''
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          text: 'Authentication error',
          className: ''
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${statusInfo.bgColor} border`}>
        <Icon className={`w-4 h-4 ${statusInfo.color} ${statusInfo.className}`} />
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.text}
        </span>
      </div>
    </div>
  );
};
