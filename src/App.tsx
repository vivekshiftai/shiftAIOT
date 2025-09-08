import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IoTProvider, useIoT } from './contexts/IoTContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { logError } from './utils/logger';

// Clear old authentication data on app start to fix JWT issues
const clearOldAuthData = () => {
  const token = localStorage.getItem('token');
  if (token) {
    // Check if token looks like it might be old (basic check)
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const tokenAge = Date.now() - (payload.iat * 1000);
        const oneDay = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        
        // If token is older than 1 day, clear it
        if (tokenAge > oneDay) {
          console.log('🧹 Clearing old authentication data to fix JWT issues');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('refreshToken');
          return true;
        }
      }
    } catch (error) {
      // If we can't parse the token, it might be corrupted, so clear it
      console.log('🧹 Clearing corrupted authentication data');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      return true;
    }
  }
  return false;
};

import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import Sidebar from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardSection } from './sections/DashboardSection';
import { DevicesSection } from './sections/DevicesSection';
import { DeviceDetailsSection } from './sections/DeviceDetailsSection';
import { KnowledgeSection } from './sections/KnowledgeSection';
import { ProcessSection } from './sections/ProcessSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { UsersSection } from './sections/UsersSection';
import { ToastContainer, useToast } from './components/UI/Toast';
import './styles/colors.css';

import { AlertTriangle } from 'lucide-react';
import RulesPage from './sections/RulesPage';
import { SettingsSection } from './sections/SettingsSection';

import { AppLoadingScreen, TabLoadingScreen } from './components/Loading/LoadingComponents';

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
    logError('App', 'ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-secondary flex items-center justify-center">
          <div className="card p-8 max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-error-500" />
              <h1 className="text-xl font-semibold text-primary">Something went wrong</h1>
            </div>
            <p className="text-secondary mb-4">
              The application encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full btn-primary px-4 py-2"
            >
              Refresh Page
            </button>
            {this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-tertiary cursor-pointer">Error Details</summary>
                <pre className="text-xs text-error-500 mt-2 p-2 bg-error-50 rounded border overflow-auto">
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
  
  if (authLoading) {
    return <AppLoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main App Layout Component
const MainAppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading: iotLoading } = useIoT();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentSection = () => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') return 'dashboard';
    if (path.startsWith('/devices/')) return 'devices';
    if (path === '/devices') return 'devices';
    if (path === '/knowledge') return 'knowledge';
    if (path === '/analytics') return 'analytics';
    if (path === '/notifications') return 'notifications';
    if (path === '/users') return 'users';
    if (path === '/settings') return 'settings';
    if (path === '/device-care') return 'device-care';
    if (path === '/maintenance') return 'maintenance';
    if (path === '/safety') return 'safety';
    return 'dashboard';
  };

  const section = getCurrentSection();

  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };

  // Show loading screen while IoT data is being loaded
  if (iotLoading) {
    return <TabLoadingScreen />;
  }

  return (
    <div className="h-screen bg-secondary flex overflow-hidden">
      <Sidebar
        activeSection={section}
        onSectionChange={handleSectionChange}
        collapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 p-4 overflow-auto">
          {error && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-xl">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-error-400 mr-3" />
                <p className="text-error-600">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-error-400 hover:text-error-600"
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
            <Route path="/process" element={<ProcessSection />} />
            <Route path="/notifications" element={<NotificationsSection />} />
            <Route path="/analytics" element={<AnalyticsSection />} />
            <Route path="/users" element={<UsersSection />} />
            <Route path="/settings" element={<SettingsSection />} />
            <Route path="/device-care" element={<RulesPage />} />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          

        </main>
      </div>
      
      
    </div>
  );
};

function App() {
  // Clear old authentication data on app start
  React.useEffect(() => {
    const wasCleared = clearOldAuthData();
    if (wasCleared) {
      console.log('🔄 Old authentication data cleared. Please log in again.');
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router basename="/">
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