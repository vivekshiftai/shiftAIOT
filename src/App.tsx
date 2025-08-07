import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IoTProvider } from './contexts/IoTContext';
import { LoginForm } from './components/Auth/LoginForm';
import { SignupForm } from './components/Auth/SignupForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardSection } from './sections/DashboardSection';
import { DevicesSection } from './sections/DevicesSection';
import { DeviceDetailsSection } from './sections/DeviceDetailsSection';
import { KnowledgeSection } from './sections/KnowledgeSection';
import { NotificationsSection } from './sections/NotificationsSection';
import { DebugInfo } from './components/DebugInfo';
import { BarChart3, Bell, Users, Settings, AlertTriangle } from 'lucide-react';
import { 
  AppLoadingScreen, 
  DevicesEmptyLoading, 
  AnalyticsEmptyLoading, 
  UsersEmptyLoading, 
  SettingsEmptyLoading 
} from './components/Loading/LoadingComponents';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  console.log('ProtectedRoute - user:', user, 'isLoading:', isLoading);
  
  if (isLoading) {
    return <AppLoadingScreen />;
  }
  
  if (!user) {
    console.log('ProtectedRoute - redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main App Layout Component
const MainAppLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle section change
  const handleSectionChange = (section: string) => {
    console.log('Navigating to section:', section);
    navigate(`/${section}`);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex ${darkMode ? 'dark' : ''}`}>
      <Sidebar
        activeSection={section}
        onSectionChange={handleSectionChange}
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
          
          <Routes>
            <Route path="/dashboard" element={<DashboardSection />} />
            <Route path="/devices" element={<DevicesSection />} />
            <Route path="/devices/:deviceId" element={<DeviceDetailsSection />} />
            <Route path="/knowledge" element={<KnowledgeSection />} />
            <Route path="/notifications" element={<NotificationsSection />} />
            <Route path="/analytics" element={<AnalyticsEmptyLoading />} />
            <Route path="/users" element={<UsersEmptyLoading />} />
            <Route path="/settings" element={<SettingsEmptyLoading />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      
      <DebugInfo />
    </div>
  );
};

function App() {
  console.log('App component rendering');
  
  return (
    <Router>
      <AuthProvider>
        <IoTProvider>
          <Routes>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignupForm />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <MainAppLayout />
              </ProtectedRoute>
            } />
          </Routes>
        </IoTProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;