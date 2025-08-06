import React from 'react';
import { Cpu, Wifi, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RealtimeChart } from '../components/Dashboard/RealtimeChart';
import { useIoT } from '../contexts/IoTContext';

export const DashboardSection: React.FC = () => {
  const { devices, notifications } = useIoT();

  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const totalDevices = devices.length;
  const warningDevices = devices.filter(d => d.status === 'warning').length;
  const errorDevices = devices.filter(d => d.status === 'error').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Monitor your IoT devices and system performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Devices"
          value={totalDevices}
          subtitle={`${onlineDevices} online`}
          icon={Cpu}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        
        <StatsCard
          title="Active Connections"
          value={onlineDevices}
          subtitle="Real-time monitoring"
          icon={Wifi}
          trend={{ value: 8, isPositive: true }}
          color="green"
        />
        
        <StatsCard
          title="Alerts"
          value={warningDevices + errorDevices}
          subtitle={`${unreadNotifications} unread`}
          icon={AlertTriangle}
          trend={{ value: -15, isPositive: false }}
          color="yellow"
        />
        
        <StatsCard
          title="Data Points"
          value="2.4M"
          subtitle="Last 24 hours"
          icon={TrendingUp}
          trend={{ value: 23, isPositive: true }}
          color="red"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealtimeChart
          deviceId="1"
          metric="temperature"
          title="Temperature Sensor A1"
          color="#3b82f6"
        />
        
        <RealtimeChart
          metric="humidity"
          title="Humidity Levels"
          color="#10b981"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        
        <div className="space-y-4">
          {notifications.slice(0, 5).map((notification) => (
            <div key={notification.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                notification.type === 'success' ? 'bg-green-500' :
                'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {notification.title}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {notification.message}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                  {new Date(notification.timestamp).toLocaleString()}
                </p>
              </div>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};