import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IoTProvider } from './contexts/IoTContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardSection } from './sections/DashboardSection';
import { DevicesSection } from './sections/DevicesSection';
import { RulesSection } from './sections/RulesSection';
import { KnowledgeSection } from './sections/KnowledgeSection';
import { DebugInfo } from './components/DebugInfo';
import { BarChart3, Bell, Users, Settings, AlertTriangle } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState<'login' | 'signup'>('login');
  const [error, setError] = useState<string | null>(null);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle URL changes for routing
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/signup') {
      setCurrentPage('signup');
    } else {
      setCurrentPage('login');
    }
  }, []);

  // Add timeout to prevent infinite loading
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setLoadingTimeout(true);
        setError('Loading timeout - please check your connection and try again.');
      }
    }, 10000); // 10 second timeout
    
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Loading shiftAIOT Platform...</p>
          <p className="text-slate-500 text-sm mt-2">Please wait while we initialize your dashboard</p>
        </div>
      </div>
    );
  }

  // If loading timeout, show login page
  if (loadingTimeout) {
    return <LoginForm />;
  }

  if (!user) {
    if (currentPage === 'signup') {
      return <SignupForm />;
    }
    return <LoginForm />;
  }

  const renderSection = () => {
    try {
      switch (activeSection) {
        case 'dashboard':
          return <DashboardSection />;
        case 'devices':
          return <DevicesSection />;
        case 'rules':
          return <RulesSection />;
        case 'knowledge':
          return <KnowledgeSection />;
        case 'analytics':
          return (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Analytics Coming Soon</h2>
                <p className="text-slate-600 mb-6">Advanced analytics and reporting features are under development.</p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Real-time metrics
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Performance insights
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Predictive analytics
                  </span>
                </div>
              </div>
            </div>
          );
        case 'notifications':
          return (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bell className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Notifications Coming Soon</h2>
                <p className="text-slate-600 mb-6">Advanced notification management and alerting system.</p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Multi-channel alerts
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Smart filtering
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Priority management
                  </span>
                </div>
              </div>
            </div>
          );
        case 'users':
          return (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">User Management Coming Soon</h2>
                <p className="text-slate-600 mb-6">Comprehensive user management and role-based access control.</p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Role management
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Permission control
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Team collaboration
                  </span>
                </div>
              </div>
            </div>
          );
        case 'settings':
          return (
            <div className="text-center py-12">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-slate-200">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Settings className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Settings Coming Soon</h2>
                <p className="text-slate-600 mb-6">Advanced configuration and system settings management.</p>
                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    System preferences
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    Integration settings
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Security options
                  </span>
                </div>
              </div>
            </div>
          );
        default:
          return <DashboardSection />;
      }
         } catch (error) {
       console.error('Error rendering section:', error);
       const errorMessage = error instanceof Error ? error.message : 'Failed to load this section. Please try refreshing the page.';
       setError(errorMessage);
       return (
         <div className="text-center py-12">
           <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
             <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <AlertTriangle className="w-8 h-8 text-red-600" />
             </div>
             <h2 className="text-2xl font-bold text-red-800 mb-2">Something went wrong</h2>
             <p className="text-red-600 mb-6">{errorMessage}</p>
             <button
               onClick={() => window.location.reload()}
               className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
             >
               Refresh Page
             </button>
           </div>
         </div>
       );
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        collapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
        
        <main className="flex-1 p-6 overflow-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          {renderSection()}
        </main>
      </div>
      
      <DebugInfo />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <IoTProvider>
        <MainApp />
      </IoTProvider>
    </AuthProvider>
  );
}

export default App;