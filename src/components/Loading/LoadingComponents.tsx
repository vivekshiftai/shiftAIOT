import React from 'react';
import { Cpu, Bell, BarChart3, Settings, User, AlertTriangle } from 'lucide-react';

// Main Application Loading Screen
export const AppLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading ActiveOps Hub</h2>
      <p className="text-slate-600">Initializing your command center...</p>
    </div>
  </div>
);

// Tab/Section Loading Screen
export const TabLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-purple-50 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-slate-600 text-lg font-medium">Loading section...</p>
    </div>
  </div>
);

// Simple Loading Spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; color?: string }> = ({ 
  size = 'md', 
  color = 'text-pink-600' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${color} border-2 border-current border-t-transparent rounded-full animate-spin`} />
  );
};

// Section-specific loading screens
export const DashboardLoading: React.FC = () => (
  <div className="space-y-6">
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse"></div>
        <div className="h-8 bg-slate-200 rounded-lg w-24 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    </div>
  </div>
);

export const DevicesLoading: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 bg-slate-200 rounded-lg w-48 animate-pulse mb-2"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-64 animate-pulse"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
    </div>
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-slate-200 rounded-lg w-32 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-16 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded-lg w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const RulesLoading: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 bg-slate-200 rounded-lg w-32 animate-pulse mb-2"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-48 animate-pulse"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded-lg w-28 animate-pulse"></div>
    </div>
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-slate-200 rounded-lg w-40 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-20 animate-pulse"></div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded-lg w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-2/3 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const KnowledgeLoading: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 bg-slate-200 rounded-lg w-40 animate-pulse mb-2"></div>
        <div className="h-4 bg-slate-200 rounded-lg w-56 animate-pulse"></div>
      </div>
      <div className="h-10 bg-slate-200 rounded-lg w-36 animate-pulse"></div>
    </div>
    
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-slate-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div className="h-6 bg-slate-200 rounded-lg w-32 animate-pulse mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 rounded-lg w-full animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-3/4 animate-pulse"></div>
              <div className="h-4 bg-slate-200 rounded-lg w-1/2 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Modal Loading Screen
export const ModalLoadingScreen: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Processing...</h3>
        <p className="text-slate-600">Please wait while we process your request.</p>
      </div>
    </div>
  </div>
);

// Button Loading State
export const LoadingButton: React.FC<{
  children: React.ReactNode;
  loading: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, loading, onClick, className = '', disabled = false }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-all ${
      loading || disabled 
        ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
        : className
    }`}
  >
    {loading && <LoadingSpinner size="sm" />}
    {children}
  </button>
);

// Data Loading State
export const DataLoadingState: React.FC<{ message?: string }> = ({ 
  message = "Loading data..." 
}) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="text-slate-600 mt-4">{message}</p>
    </div>
  </div>
);

// Empty State with Loading
export const EmptyStateLoading: React.FC<{ 
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ icon, title, description }) => (
  <div className="text-center py-12 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-600 mb-6">{description}</p>
    <div className="flex items-center justify-center">
      <LoadingSpinner size="md" />
    </div>
  </div>
);

// Section-specific empty loading states
export const DevicesEmptyLoading: React.FC = () => (
  <EmptyStateLoading
    icon={<Cpu className="w-8 h-8 text-slate-400" />}
    title="Loading Assets"
    description="Fetching asset information from the platform..."
  />
);

export const RulesEmptyLoading: React.FC = () => (
  <EmptyStateLoading
    icon={<AlertTriangle className="w-8 h-8 text-slate-400" />}
    title="Loading Rules"
    description="Fetching automation rules and conditions..."
  />
);

export const NotificationsEmptyLoading: React.FC = () => (
  <EmptyStateLoading
    icon={<Bell className="w-8 h-8 text-slate-400" />}
    title="Loading Notifications"
    description="Fetching notification history and alerts..."
  />
);

export const AnalyticsEmptyLoading: React.FC = () => (
  <EmptyStateLoading
    icon={<BarChart3 className="w-8 h-8 text-slate-400" />}
    title="Loading Intelligence"
    description="Preparing charts and performance metrics..."
  />
);

export const UsersEmptyLoading: React.FC = () => (
  <EmptyStateLoading
    icon={<User className="w-8 h-8 text-slate-400" />}
    title="Loading Users"
    description="Fetching user management data..."
  />
);

export const SettingsEmptyLoading: React.FC = () => (
  <EmptyStateLoading
    icon={<Settings className="w-8 h-8 text-slate-400" />}
    title="Loading Settings"
    description="Loading system configuration options..."
  />
);
