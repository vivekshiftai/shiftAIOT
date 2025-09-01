import React, { useState } from 'react';
import { Bell, Send, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { notificationAPI } from '../../services/api';

interface NotificationTestPanelProps {
  userId: string;
}

export const NotificationTestPanel: React.FC<NotificationTestPanelProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testNotifications = [
    {
      type: 'device_offline',
      title: 'Device Offline Test',
      message: 'Test notification for device going offline',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      type: 'critical_alert',
      title: 'Critical Alert Test',
      message: 'Test notification for critical system issue',
      icon: Zap,
      color: 'text-red-600'
    },
    {
      type: 'maintenance_alert',
      title: 'Maintenance Alert Test',
      message: 'Test notification for scheduled maintenance',
      icon: Info,
      color: 'text-orange-600'
    },
    {
      type: 'security_alert',
      title: 'Security Alert Test',
      message: 'Test notification for security warning',
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      type: 'performance_alert',
      title: 'Performance Alert Test',
      message: 'Test notification for performance issue',
      icon: Zap,
      color: 'text-orange-600'
    },
    {
      type: 'system_update',
      title: 'System Update Test',
      message: 'Test notification for system update',
      icon: Info,
      color: 'text-blue-600'
    },
    {
      type: 'rule_triggered',
      title: 'Rule Trigger Test',
      message: 'Test notification for automation rule trigger',
      icon: Bell,
      color: 'text-purple-600'
    },
    {
      type: 'device_online',
      title: 'Device Online Test',
      message: 'Test notification for device coming online',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const sendTestNotification = async (notification: any) => {
    setIsLoading(true);
    setTestResult(null);

    try {
      const testNotification = {
        title: notification.title,
        message: notification.message,
        category: notification.type === 'critical_alert' || notification.type === 'security_alert' ? 'SECURITY_ALERT' :
                 notification.type === 'maintenance_alert' ? 'MAINTENANCE_ALERT' :
                 notification.type === 'performance_alert' ? 'PERFORMANCE_ALERT' :
                 notification.type === 'device_offline' ? 'DEVICE_OFFLINE' :
                 notification.type === 'device_online' ? 'DEVICE_ONLINE' :
                 notification.type === 'rule_triggered' ? 'RULE_TRIGGERED' :
                 notification.type === 'system_update' ? 'SYSTEM_UPDATE' : 'CUSTOM',
        userId: userId,
        organizationId: '1'
      };

      const response = await notificationAPI.create(testNotification);
      
      if (response.status === 200) {
        setTestResult(`✅ Test notification sent successfully! Check if it appears based on your preferences.`);
      } else if (response.status === 204) {
        setTestResult(`🚫 Test notification blocked by user preferences. This notification type is disabled.`);
      }
    } catch (error: any) {
      if (error.response?.status === 204) {
        setTestResult(`🚫 Test notification blocked by user preferences. This notification type is disabled.`);
      } else {
        setTestResult(`❌ Error sending test notification: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
      <h4 className="text-lg font-medium text-slate-800 mb-4">Test Notification Types</h4>
      <p className="text-sm text-slate-600 mb-4">
        Test different notification types to see how your preferences work. 
        Notifications will only be sent if the corresponding preference is enabled.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {testNotifications.map((notification, index) => {
          const Icon = notification.icon;
          return (
            <button
              key={index}
              onClick={() => sendTestNotification(notification)}
              disabled={isLoading}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md disabled:opacity-50 ${
                notification.color === 'text-red-600' ? 'border-red-200 hover:bg-red-50' :
                notification.color === 'text-orange-600' ? 'border-orange-200 hover:bg-orange-50' :
                notification.color === 'text-blue-600' ? 'border-blue-200 hover:bg-blue-50' :
                notification.color === 'text-green-600' ? 'border-green-200 hover:bg-green-50' :
                'border-purple-200 hover:bg-purple-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${notification.color}`} />
              <div className="text-left">
                <div className="font-medium text-slate-800 text-sm">{notification.title}</div>
                <div className="text-xs text-slate-600">{notification.message}</div>
              </div>
              <Send className="w-4 h-4 text-slate-400 ml-auto" />
            </button>
          );
        })}
      </div>

      {testResult && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          testResult.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' :
          testResult.includes('🚫') ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {testResult}
        </div>
      )}
    </div>
  );
};
