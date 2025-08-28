import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  User, 
  Bell, 
  BarChart3, 
  Mail, 
  Calendar,
  Save,
  Edit,
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
import { NotificationSettingsTab } from '../components/Settings/NotificationSettingsTab';
import { DashboardSettingsTab } from '../components/Settings/DashboardSettingsTab';


export const SettingsSection: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  // Handle URL parameters for tab switching
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'notifications', 'dashboard', 'conversation', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

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
    { id: 'conversation', label: 'Conversation Platforms', icon: MessageSquare }
  ];

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
          {activeTab === 'profile' && <ComprehensiveProfileEditor />}
          {activeTab === 'notifications' && <NotificationSettingsTab />}
          {activeTab === 'dashboard' && <DashboardSettingsTab />}
          {activeTab === 'conversation' && <ConversationConfigTab />}
        </div>
      </div>
    </div>
  );
};
