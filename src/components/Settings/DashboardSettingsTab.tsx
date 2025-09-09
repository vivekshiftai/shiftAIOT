import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Layout, 
  Palette, 
  Eye,
  EyeOff,
  Save,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Grid,
  List,
  Monitor,
  Smartphone,
  Tablet,
  Settings,
  Zap
} from 'lucide-react';
import { userAPI } from '../../services/api';
import Button from '../UI/Button';
import { logInfo, logError } from '../../utils/logger';

interface DashboardSettings {
  theme: 'light' | 'dark' | 'auto';
  layout: 'grid' | 'list' | 'compact';
  defaultView: 'overview' | 'devices' | 'intelligence' | 'maintenance';
  refreshInterval: number; // in seconds
  showCharts: boolean;
  showNotifications: boolean;
  showQuickActions: boolean;
  showDeviceStatus: boolean;
  showPerformanceMetrics: boolean;
  showMaintenanceAlerts: boolean;
  autoRefresh: boolean;
  compactMode: boolean;
  responsiveLayout: boolean;
  widgetOrder: string[];
  hiddenWidgets: string[];
}

export const DashboardSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<DashboardSettings>({
    theme: 'auto',
    layout: 'grid',
    defaultView: 'overview',
    refreshInterval: 30,
    showCharts: true,
    showNotifications: true,
    showQuickActions: true,
    showDeviceStatus: true,
    showPerformanceMetrics: true,
    showMaintenanceAlerts: true,
    autoRefresh: true,
    compactMode: false,
    responsiveLayout: true,
    widgetOrder: ['overview', 'devices', 'intelligence', 'maintenance'],
    hiddenWidgets: []
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await userAPI.getDashboardSettings();
      setSettings(response.data);
      
      logInfo('DashboardSettingsTab', 'Settings loaded successfully');
    } catch (err: any) {
      logError('DashboardSettingsTab', 'Failed to load settings', err);
      setError(err.response?.data?.message || 'Failed to load dashboard settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await userAPI.updateDashboardSettings(settings);
      
      setSuccess('Dashboard settings saved successfully!');
      logInfo('DashboardSettingsTab', 'Settings saved successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      logError('DashboardSettingsTab', 'Failed to save settings', err);
      setError(err.response?.data?.message || 'Failed to save dashboard settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof DashboardSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectChange = (key: keyof DashboardSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRefreshIntervalChange = (value: string) => {
    const interval = parseInt(value);
    if (!isNaN(interval) && interval >= 5) {
      setSettings(prev => ({
        ...prev,
        refreshInterval: interval
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Settings</h2>
          <p className="text-gray-600 mt-1">
            Customize your dashboard appearance and behavior
          </p>
        </div>
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="flex items-center gap-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {/* Appearance Settings */}
      <div className="card glass">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-secondary-500" />
          Appearance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleSelectChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto (System)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Layout Style
            </label>
            <select
              value={settings.layout}
              onChange={(e) => handleSelectChange('layout', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="compact">Compact</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default View
            </label>
            <select
              value={settings.defaultView}
              onChange={(e) => handleSelectChange('defaultView', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
            >
              <option value="overview">Overview</option>
              <option value="devices">Devices</option>
              <option value="intelligence">Intelligence</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={settings.refreshInterval}
              onChange={(e) => handleRefreshIntervalChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500"
            />
            <p className="text-sm text-gray-600 mt-1">Minimum 5 seconds</p>
          </div>
        </div>
      </div>

      {/* Display Options */}
      <div className="card glass">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-secondary-500" />
          Display Options
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Charts</p>
              <p className="text-sm text-gray-600">Display data visualizations</p>
            </div>
            <button
              onClick={() => handleToggle('showCharts')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showCharts ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.showCharts ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Notifications</p>
              <p className="text-sm text-gray-600">Display notification panel</p>
            </div>
            <button
              onClick={() => handleToggle('showNotifications')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showNotifications ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.showNotifications ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Quick Actions</p>
              <p className="text-sm text-gray-600">Display action buttons</p>
            </div>
            <button
              onClick={() => handleToggle('showQuickActions')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showQuickActions ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.showQuickActions ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Device Status</p>
              <p className="text-sm text-gray-600">Display device status indicators</p>
            </div>
            <button
              onClick={() => handleToggle('showDeviceStatus')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showDeviceStatus ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.showDeviceStatus ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Performance Metrics</p>
              <p className="text-sm text-gray-600">Display performance data</p>
            </div>
            <button
              onClick={() => handleToggle('showPerformanceMetrics')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showPerformanceMetrics ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.showPerformanceMetrics ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Show Maintenance Alerts</p>
              <p className="text-sm text-gray-600">Display maintenance notifications</p>
            </div>
            <button
              onClick={() => handleToggle('showMaintenanceAlerts')}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                settings.showMaintenanceAlerts ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  settings.showMaintenanceAlerts ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Behavior Settings */}
      <div className="card glass">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-secondary-500" />
          Behavior
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Auto Refresh</p>
              <p className="text-sm text-gray-600">Automatically refresh dashboard data</p>
            </div>
            <button
              onClick={() => handleToggle('autoRefresh')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoRefresh ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Compact Mode</p>
              <p className="text-sm text-gray-600">Use compact layout for more information</p>
            </div>
            <button
              onClick={() => handleToggle('compactMode')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.compactMode ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Responsive Layout</p>
              <p className="text-sm text-gray-600">Adapt layout to screen size</p>
            </div>
            <button
              onClick={() => handleToggle('responsiveLayout')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.responsiveLayout ? 'bg-secondary-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.responsiveLayout ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Device Preview */}
      <div className="card glass">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5 text-secondary-500" />
          Device Preview
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 border-2 rounded-lg text-center cursor-pointer transition-colors ${
            settings.layout === 'grid' ? 'border-secondary-500 bg-secondary-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => handleSelectChange('layout', 'grid')}>
            <Grid className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">Grid Layout</p>
            <p className="text-sm text-gray-600">Card-based view</p>
          </div>

          <div className={`p-4 border-2 rounded-lg text-center cursor-pointer transition-colors ${
            settings.layout === 'list' ? 'border-secondary-500 bg-secondary-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => handleSelectChange('layout', 'list')}>
            <List className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">List Layout</p>
            <p className="text-sm text-gray-600">Table-based view</p>
          </div>

          <div className={`p-4 border-2 rounded-lg text-center cursor-pointer transition-colors ${
            settings.layout === 'compact' ? 'border-secondary-500 bg-secondary-50' : 'border-gray-200 hover:border-gray-300'
          }`} onClick={() => handleSelectChange('layout', 'compact')}>
            <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="font-medium text-gray-900">Compact Layout</p>
            <p className="text-sm text-gray-600">Minimal view</p>
          </div>
        </div>
      </div>
    </div>
  );
};
