import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  BarChart3, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Save,
  Edit,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  organization: string;
  location: string;
  timezone: string;
  avatar?: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  deviceAlerts: boolean;
  systemUpdates: boolean;
  weeklyReports: boolean;
  criticalAlerts: boolean;
  performanceAlerts: boolean;
  securityAlerts: boolean;
  maintenanceAlerts: boolean;
  dataBackupAlerts: boolean;
  userActivityAlerts: boolean;
  ruleTriggerAlerts: boolean;
}

interface DashboardSettings {
  showRealTimeCharts: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  showDeviceStatus: boolean;
  showAlerts: boolean;
  showPerformanceMetrics: boolean;
}

export const SettingsSection: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: 'John',
    lastName: 'Smith',
    email: user?.email || 'admin@shiftaiot.com',
    phone: '+1 (555) 123-4567',
    role: 'ORG_ADMIN',
    organization: 'shiftAIOT Platform',
    location: 'New York, NY',
    timezone: 'America/New_York'
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    deviceAlerts: true,
    systemUpdates: false,
    weeklyReports: true,
    criticalAlerts: true,
    performanceAlerts: true,
    securityAlerts: true,
    maintenanceAlerts: false,
    dataBackupAlerts: true,
    userActivityAlerts: false,
    ruleTriggerAlerts: true
  });

  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>({
    showRealTimeCharts: true,
    autoRefresh: true,
    refreshInterval: 30,
    showDeviceStatus: true,
    showAlerts: true,
    showPerformanceMetrics: true
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Update URL when tab changes
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['profile', 'notifications', 'dashboard', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.pushState({}, '', url.toString());
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  const handleSaveProfile = () => {
    // Save profile logic
    setIsEditing(false);
  };

  const handleSaveNotifications = () => {
    // Save notification settings logic
  };

  const handleSaveDashboard = () => {
    // Save dashboard settings logic
  };

  const handleChangePassword = () => {
    // Change password logic
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getNotificationDescription = (key: string) => {
    const descriptions = {
      emailNotifications: 'Receive notifications via email',
      pushNotifications: 'Receive push notifications in browser',
      deviceAlerts: 'Get alerts when devices go offline or have issues',
      systemUpdates: 'Receive system update notifications',
      weeklyReports: 'Get weekly performance reports via email',
      criticalAlerts: 'Immediate alerts for critical system issues',
      performanceAlerts: 'Alerts when system performance drops',
      securityAlerts: 'Security-related notifications and warnings',
      maintenanceAlerts: 'Scheduled maintenance notifications',
      dataBackupAlerts: 'Backup completion and failure alerts',
      userActivityAlerts: 'User login and activity notifications',
      ruleTriggerAlerts: 'Alerts when automation rules are triggered'
    };
    return descriptions[key as keyof typeof descriptions] || '';
  };

  const getNotificationIcon = (key: string) => {
    const icons = {
      emailNotifications: Mail,
      pushNotifications: Bell,
      deviceAlerts: AlertTriangle,
      systemUpdates: Info,
      weeklyReports: BarChart3,
      criticalAlerts: Zap,
      performanceAlerts: BarChart3,
      securityAlerts: Shield,
      maintenanceAlerts: Calendar,
      dataBackupAlerts: CheckCircle,
      userActivityAlerts: User,
      ruleTriggerAlerts: Zap
    };
    return icons[key as keyof typeof icons] || Bell;
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-slate-800">Personal Information</h3>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
        >
          <Edit className="w-4 h-4" />
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
            <input
              type="text"
              value={userProfile.firstName}
              onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
            <input
              type="text"
              value={userProfile.lastName}
              onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
            <input
              type="tel"
              value={userProfile.phone}
              onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
            <input
              type="text"
              value={userProfile.role}
              disabled
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-100 text-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
            <input
              type="text"
              value={userProfile.organization}
              onChange={(e) => setUserProfile(prev => ({ ...prev, organization: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
            <input
              type="text"
              value={userProfile.location}
              onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Timezone</label>
            <select
              value={userProfile.timezone}
              onChange={(e) => setUserProfile(prev => ({ ...prev, timezone: e.target.value }))}
              disabled={!isEditing}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 transition-all disabled:bg-slate-100"
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>

        {isEditing && (
          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Notification Preferences</h3>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="space-y-4">
          {Object.entries(notificationSettings).map(([key, value]) => {
            const Icon = getNotificationIcon(key);
            return (
              <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {getNotificationDescription(key)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationSettings(prev => ({ ...prev, [key]: !value }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveNotifications}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboardTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Dashboard Preferences</h3>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <div className="space-y-4">
          {Object.entries(dashboardSettings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <div>
                <h4 className="font-medium text-slate-800 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </h4>
                <p className="text-sm text-slate-600">
                  {key === 'showRealTimeCharts' && 'Display real-time data charts'}
                  {key === 'autoRefresh' && 'Automatically refresh dashboard data'}
                  {key === 'showDeviceStatus' && 'Show device status indicators'}
                  {key === 'showAlerts' && 'Display alert notifications'}
                  {key === 'showPerformanceMetrics' && 'Show performance metrics'}
                </p>
              </div>
              {key === 'refreshInterval' ? (
                <select
                  value={value}
                  onChange={(e) => setDashboardSettings(prev => ({ ...prev, [key]: parseInt(e.target.value) }))}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white/80 text-slate-900"
                >
                  <option value={15}>15 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              ) : (
                <button
                  onClick={() => setDashboardSettings(prev => ({ ...prev, [key]: !value }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    value ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Security Settings</h3>
      
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
        <h4 className="text-lg font-medium text-slate-800 mb-4">Change Password</h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900"
              placeholder="Enter new password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleChangePassword}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all"
          >
            <Shield className="w-4 h-4" />
            Change Password
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-2">
          Manage your account preferences and platform settings
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'profile' && renderProfileTab()}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </div>
      </div>
    </div>
  );
};
