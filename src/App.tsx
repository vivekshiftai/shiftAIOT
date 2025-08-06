import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { IoTProvider } from './contexts/IoTContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { DashboardSection } from './sections/DashboardSection';
import { DevicesSection } from './sections/DevicesSection';
import { RulesSection } from './sections/RulesSection';
import { KnowledgeSection } from './sections/KnowledgeSection';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Apply dark mode class to html element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading IoT Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderSection = () => {
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
        return <div className="text-center py-12"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Analytics Coming Soon</h2></div>;
      case 'notifications':
        return <div className="text-center py-12"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications Coming Soon</h2></div>;
      case 'users':
        return <div className="text-center py-12"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">User Management Coming Soon</h2></div>;
      case 'settings':
        return <div className="text-center py-12"><h2 className="text-xl font-semibold text-gray-900 dark:text-white">Settings Coming Soon</h2></div>;
      default:
        return <DashboardSection />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex ${darkMode ? 'dark' : ''}`}>
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
          {renderSection()}
        </main>
      </div>
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