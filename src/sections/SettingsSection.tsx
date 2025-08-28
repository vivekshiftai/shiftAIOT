import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  BarChart3, 
  Shield, 
  Mail, 
  Calendar,
  Save,
  Edit,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { ConversationConfigTab } from '../components/Settings/ConversationConfigTab';
import { ComprehensiveProfileEditor } from '../components/Settings/ComprehensiveProfileEditor';
import { NotificationTestPanel } from '../components/Settings/NotificationTestPanel';
import { NotificationTemplateManager } from '../components/Settings/NotificationTemplateManager';
import { handleAuthError } from '../utils/authUtils';
import { AuthDebugger } from '../components/Debug/AuthDebugger';
import PushNotificationService, { PushNotificationStatus } from '../services/pushNotificationService';



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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushNotificationStatus, setPushNotificationStatus] = useState<PushNotificationStatus | null>(null);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [pushService] = useState(() => PushNotificationService.getInstance());



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

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      
      // Initialize push notifications
      try {
        setIsPushSupported(pushService.isPushSupported());
        if (pushService.isPushSupported()) {
          await pushService.initialize();
          const status = await pushService.getStatus();
          setPushNotificationStatus(status);
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
      
      try {
        // Try load preferences from backend first
        try {
          const prefRes = await userAPI.getPreferences();
          const p = prefRes.data;
          setNotificationSettings({
            emailNotifications: !!p.emailNotifications,
            pushNotifications: !!p.pushNotifications,
            deviceAlerts: !!p.deviceAlerts,
            systemUpdates: !!p.systemUpdates,
            weeklyReports: !!p.weeklyReports,
            criticalAlerts: !!p.criticalAlerts,
            performanceAlerts: !!p.performanceAlerts,
            securityAlerts: !!p.securityAlerts,
            maintenanceAlerts: !!p.maintenanceAlerts,
            dataBackupAlerts: !!p.dataBackupAlerts,
            userActivityAlerts: !!p.userActivityAlerts,
            ruleTriggerAlerts: !!p.ruleTriggerAlerts,
          });
          setDashboardSettings({
            showRealTimeCharts: !!p.dashboardShowRealTimeCharts,
            autoRefresh: !!p.dashboardAutoRefresh,
            refreshInterval: p.dashboardRefreshInterval ?? 30,
            showDeviceStatus: !!p.dashboardShowDeviceStatus,
            showAlerts: !!p.dashboardShowAlerts,
            showPerformanceMetrics: !!p.dashboardShowPerformanceMetrics,
          });
        } catch (prefError: any) {
          // Fallback to localStorage if backend prefs missing
          const notifKey = `settings:notifications:${user.id}`;
          const dashKey = `settings:dashboard:${user.id}`;
          const savedNotif = localStorage.getItem(notifKey);
          const savedDash = localStorage.getItem(dashKey);
          if (savedNotif) setNotificationSettings(JSON.parse(savedNotif));
          if (savedDash) setDashboardSettings(JSON.parse(savedDash));
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, [user]);

  const persistNotificationSettings = async () => {
    if (!user?.id) return;
    
    // Handle push notification subscription
    if (notificationSettings.pushNotifications && isPushSupported) {
      try {
        const permission = await pushService.requestPermission();
        if (permission === 'granted') {
          const subscribed = await pushService.subscribe();
          if (subscribed) {
            const status = await pushService.getStatus();
            setPushNotificationStatus(status);
          }
        } else {
          setError('Push notification permission denied. Please enable notifications in your browser settings.');
          return;
        }
      } catch (error) {
        console.error('Failed to subscribe to push notifications:', error);
        setError('Failed to enable push notifications. Please try again.');
        return;
      }
    } else if (!notificationSettings.pushNotifications && isPushSupported) {
      // Unsubscribe if push notifications are disabled
      try {
        await pushService.unsubscribe();
        const status = await pushService.getStatus();
        setPushNotificationStatus(status);
      } catch (error) {
        console.error('Failed to unsubscribe from push notifications:', error);
      }
    }
    
    try {
      await userAPI.savePreferences({
        ...notificationSettings,
        ...{
          dashboardShowRealTimeCharts: dashboardSettings.showRealTimeCharts,
          dashboardAutoRefresh: dashboardSettings.autoRefresh,
          dashboardRefreshInterval: dashboardSettings.refreshInterval,
          dashboardShowDeviceStatus: dashboardSettings.showDeviceStatus,
          dashboardShowAlerts: dashboardSettings.showAlerts,
          dashboardShowPerformanceMetrics: dashboardSettings.showPerformanceMetrics,
        },
      });
    } catch {
      localStorage.setItem(`settings:notifications:${user.id}`, JSON.stringify(notificationSettings));
    }
  };
  const persistDashboardSettings = async () => {
    if (!user?.id) return;
    try {
      await userAPI.savePreferences({
        ...notificationSettings,
        ...{
          dashboardShowRealTimeCharts: dashboardSettings.showRealTimeCharts,
          dashboardAutoRefresh: dashboardSettings.autoRefresh,
          dashboardRefreshInterval: dashboardSettings.refreshInterval,
          dashboardShowDeviceStatus: dashboardSettings.showDeviceStatus,
          dashboardShowAlerts: dashboardSettings.showAlerts,
          dashboardShowPerformanceMetrics: dashboardSettings.showPerformanceMetrics,
        },
      });
    } catch {
      localStorage.setItem(`settings:dashboard:${user.id}`, JSON.stringify(dashboardSettings));
    }
  };

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
    { id: 'conversation', label: 'Conversation Configuration', icon: MessageSquare },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'debug', label: 'Debug', icon: Info }
  ];



  const handleSaveNotifications = async () => {
    await persistNotificationSettings();
  };

  const handleSaveDashboard = async () => {
    await persistDashboardSettings();
  };

  const handleChangePassword = () => {
    // Placeholder: would call backend change-password endpoint if available
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const getNotificationDescription = (key: string) => {
    const descriptions = {
      emailNotifications: 'Receive notifications via email (backend handles sending)',
      pushNotifications: 'Receive push notifications in browser (backend handles sending)',
      deviceAlerts: 'Get alerts when devices go offline, online, or have issues',
      systemUpdates: 'Receive system update and maintenance notifications',
      weeklyReports: 'Get weekly performance and status reports',
      criticalAlerts: 'Immediate alerts for critical system issues and errors',
      performanceAlerts: 'Alerts when system performance drops or thresholds are exceeded',
      securityAlerts: 'Security-related notifications and warnings',
      maintenanceAlerts: 'Scheduled maintenance and service notifications',
      dataBackupAlerts: 'Backup completion, failure, and data protection alerts',
      userActivityAlerts: 'User login, logout, and activity notifications',
      ruleTriggerAlerts: 'Alerts when automation rules are triggered or conditions are met'
    } as const;
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
    } as const;
    return icons[key as keyof typeof icons] || Bell;
  };



  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-800">Notification Preferences</h3>
      
      {/* Information about backend handling */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">Backend Notification Logic</h4>
            <p className="text-sm text-blue-700">
              All notification logic is handled by the backend. When you toggle these settings, 
              the backend will automatically check your preferences before sending any notifications. 
              The frontend only displays these options and sends your preferences to the server.
            </p>
          </div>
        </div>
      </div>
      
      {/* Push Notification Status */}
      {isPushSupported && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
          <h4 className="text-lg font-medium text-slate-800 mb-4">Push Notification Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Browser Support:</span>
              <span className="text-sm font-medium text-green-600">Supported</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Permission:</span>
              <span className={`text-sm font-medium ${
                pushNotificationStatus?.pushEnabled ? 'text-green-600' : 'text-red-600'
              }`}>
                {pushNotificationStatus?.pushEnabled ? 'Granted' : 'Denied'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Subscription:</span>
              <span className={`text-sm font-medium ${
                pushNotificationStatus?.hasSubscription ? 'text-green-600' : 'text-orange-600'
              }`}>
                {pushNotificationStatus?.hasSubscription ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Server Configuration:</span>
              <span className={`text-sm font-medium ${
                pushNotificationStatus?.vapidConfigured ? 'text-green-600' : 'text-red-600'
              }`}>
                {pushNotificationStatus?.vapidConfigured ? 'Configured' : 'Not Configured'}
              </span>
            </div>
          </div>
        </div>
      )}
      
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

      {/* Notification Test Panel - Only show for admin users */}
      {user?.role === 'ADMIN' && (
        <NotificationTestPanel userId={user.id} />
      )}

      {/* Notification Template Manager - Only show for admin users */}
      {user?.role === 'ADMIN' && (
        <NotificationTemplateManager organizationId={user.organizationId} />
      )}
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
                  value={value as number}
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
                  onClick={() => setDashboardSettings(prev => ({ ...prev, [key]: !(value as boolean) }))}
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

  const renderConversationTab = () => (
    <ConversationConfigTab />
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
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
        <h1 className="text-3xl font-bold gradient-text">Settings</h1>
        <p className="text-secondary mt-2">
          Manage your account preferences and platform settings
        </p>
      </div>

      {/* Tabs */}
      <div className="card glass">
        <div className="flex border-b border-light">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'text-secondary-500 border-b-2 border-secondary-500 bg-secondary-500/10'
                    : 'text-secondary hover:text-secondary-300 hover:bg-secondary-500/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="text-sm text-slate-500 mb-3">Loading...</div>
          )}
          {activeTab === 'profile' && <ComprehensiveProfileEditor />}
          {activeTab === 'notifications' && renderNotificationsTab()}
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'conversation' && renderConversationTab()}
                     {activeTab === 'security' && renderSecurityTab()}
           {activeTab === 'debug' && <AuthDebugger />}
        </div>
      </div>
    </div>
  );
};
