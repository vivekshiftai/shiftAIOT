import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IoTProvider, useIoT } from './contexts/IoTContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardSection } from './sections/DashboardSection';
import { DevicesSection } from './sections/DevicesSection';
import { DeviceDetailsSection } from './sections/DeviceDetailsSection';
import { KnowledgeSection } from './sections/KnowledgeSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { UsersSection } from './sections/UsersSection';
import { ToastContainer, useToast } from './components/UI/Toast';

import { BarChart3, Bell, Users, Settings, AlertTriangle } from 'lucide-react';
import { 
  AppLoadingScreen, 
  DevicesEmptyLoading, 
  AnalyticsEmptyLoading, 
  UsersEmptyLoading, 
  SettingsEmptyLoading,
  IoTLoadingScreen
} from './components/Loading/LoadingComponents';
import { SettingsSection } from './sections/SettingsSection';

// Error Boundary Component
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h1 className="text-xl font-semibold text-slate-800">Something went wrong</h1>
            </div>
            <p className="text-slate-600 mb-4">
              The application encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-slate-500 cursor-pointer">Error Details</summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 rounded border overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const { loading: iotLoading } = useIoT();
  
  console.log('ProtectedRoute - user:', user, 'authLoading:', authLoading, 'iotLoading:', iotLoading);
  console.log('ProtectedRoute - localStorage token:', localStorage.getItem('token') ? 'exists' : 'not found');
  console.log('ProtectedRoute - localStorage user:', localStorage.getItem('user') ? 'exists' : 'not found');
  
  // Wait for AuthContext to finish loading first
  if (authLoading) {
    console.log('ProtectedRoute - AuthContext still loading, showing loading screen');
    return <AppLoadingScreen />;
  }
  
  // After AuthContext is done, check if we have a user
  if (!user) {
    console.log('ProtectedRoute - No user after auth finished, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // We have a user, but wait for IoTContext to finish loading if it's still loading
  if (iotLoading) {
    console.log('ProtectedRoute - IoTContext still loading, showing loading screen');
    return <AppLoadingScreen />;
  }
  
  console.log('ProtectedRoute - User authenticated and IoT loaded, rendering children');
  return <>{children}</>;
};

// Main App Layout Component
const MainAppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('MainAppLayout - user:', user, 'location:', location.pathname);

  // Get current section from URL
  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'dashboard';
    if (path.startsWith('/devices/')) return 'devices'; // Device details are part of devices section
    if (path === '/devices') return 'devices';
    if (path === '/knowledge') return 'knowledge';
    if (path === '/analytics') return 'analytics';
    if (path === '/notifications') return 'notifications';
    if (path === '/users') return 'users';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };

  const section = getCurrentSection();

  // Theme is now handled by ThemeContext

  // Handle section change
  const handleSectionChange = (section: string) => {
    console.log('Navigating to section:', section);
    navigate(`/${section}`);
  };

  console.log('MainAppLayout - Rendering main layout');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex">
      <Sidebar
        activeSection={section}
        onSectionChange={handleSectionChange}
        collapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
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
          
          <Routes>
            <Route path="/dashboard" element={<DashboardSection />} />
            <Route path="/devices" element={<DevicesSection />} />
            <Route path="/devices/:deviceId" element={<DeviceDetailsSection />} />
            <Route path="/knowledge" element={<KnowledgeSection />} />
            <Route path="/notifications" element={<NotificationsSection />} />
            <Route path="/analytics" element={<AnalyticsSection />} />
            <Route path="/users" element={<UsersSection />} />
            <Route path="/settings" element={<SettingsSection />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      
      
    </div>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <IoTProvider>
              <AppWithToast />
            </IoTProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Component to handle toast notifications
const AppWithToast: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainAppLayout />
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default App;