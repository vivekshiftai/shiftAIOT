import React from 'react';
import { Cpu, Wifi, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RealtimeChart } from '../components/Dashboard/RealtimeChart';
import { useIoT } from '../contexts/IoTContext';

export const DashboardSection: React.FC = () => {
  const { devices, notifications } = useIoT();

  const onlineDevices = devices.filter(d => d.status === 'ONLINE').length;
  const totalDevices = devices.length;
  const warningDevices = devices.filter(d => d.status === 'WARNING').length;
  const errorDevices = devices.filter(d => d.status === 'ERROR').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600 mt-2">
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
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {devices.slice(0, 5).map((device) => (
              <div key={device.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className={`w-3 h-3 rounded-full ${
                  device.status === 'ONLINE' ? 'bg-green-500' :
                                     device.status === 'WARNING' ? 'bg-yellow-500' :
                   device.status === 'ERROR' ? 'bg-red-500' : 'bg-slate-400'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{device.name}</p>
                  <p className="text-sm text-slate-600">{device.location}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${
                    device.status === 'ONLINE' ? 'text-green-600' :
                                         device.status === 'WARNING' ? 'text-yellow-600' :
                     device.status === 'ERROR' ? 'text-red-600' : 'text-slate-600'
                  }`}>
                    {device.status}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(device.lastSeen).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};