import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Clock, 
  Thermometer, 
  Wifi, 
  Battery,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { analyticsAPI } from '../../services/api';

interface DeviceAnalytics {
  id: string;
  deviceId: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  batteryLevel: number;
  signalStrength: number;
  uptime: number;
  dataTransmitted: number;
  alertsCount: number;
  status: string;
}

interface DeviceAnalyticsDisplayProps {
  deviceId: string;
}

const DeviceAnalyticsDisplay: React.FC<DeviceAnalyticsDisplayProps> = ({ deviceId }) => {
  const [analytics, setAnalytics] = useState<DeviceAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24h');

  useEffect(() => {
    loadAnalytics();
  }, [deviceId, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('Loading analytics for device:', deviceId);
      const response = await analyticsAPI.getByDevice(deviceId, timeRange);
      console.log('Analytics response:', response.data);
      setAnalytics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error loading analytics:', err);
      setError('Failed to load device analytics');
    } finally {
      setLoading(false);
    }
  };

  const getLatestMetrics = () => {
    if (analytics.length === 0) return null;
    return analytics[analytics.length - 1];
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSignalColor = (strength: number) => {
    if (strength > 80) return 'text-green-600';
    if (strength > 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDataSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const latestMetrics = getLatestMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Device Analytics</h3>
          <p className="text-sm text-gray-600">
            Real-time metrics and performance data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Current Status */}
      {latestMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-semibold ${getStatusColor(latestMetrics.status)}`}>
                  {latestMetrics.status}
                </p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temperature</p>
                <p className="text-lg font-semibold text-gray-900">
                  {latestMetrics.temperature}°C
                </p>
              </div>
              <Thermometer className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Battery</p>
                <p className={`text-lg font-semibold ${getBatteryColor(latestMetrics.batteryLevel)}`}>
                  {latestMetrics.batteryLevel}%
                </p>
              </div>
              <Battery className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signal</p>
                <p className={`text-lg font-semibold ${getSignalColor(latestMetrics.signalStrength)}`}>
                  {latestMetrics.signalStrength}%
                </p>
              </div>
              <Wifi className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Uptime</span>
              </div>
              <span className="font-medium text-gray-900">
                {latestMetrics ? formatUptime(latestMetrics.uptime) : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Data Transmitted</span>
              </div>
              <span className="font-medium text-gray-900">
                {latestMetrics ? formatDataSize(latestMetrics.dataTransmitted) : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Alerts</span>
              </div>
              <span className="font-medium text-gray-900">
                {latestMetrics ? latestMetrics.alertsCount : 'N/A'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <span className="text-gray-700">Humidity</span>
              </div>
              <span className="font-medium text-gray-900">
                {latestMetrics ? `${latestMetrics.humidity}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg border">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h4>
          <div className="space-y-3">
            {analytics.slice(-5).reverse().map((metric, index) => (
              <div key={metric.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    metric.status.toLowerCase() === 'online' ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {metric.status} - {metric.temperature}°C
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(metric.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{metric.batteryLevel}%</p>
                  <p className="text-xs text-gray-500">{formatDataSize(metric.dataTransmitted)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white p-6 rounded-lg border">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h4>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceAnalyticsDisplay;
