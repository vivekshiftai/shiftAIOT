import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Bell, 
  User, 
  Zap,
  BarChart3,
  Cpu,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  collapsed?: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/dashboard' },
  { id: 'devices', label: 'Devices', icon: Cpu, path: '/devices' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'knowledge', label: 'Knowledge Base', icon: Bell, path: '/knowledge' },
  { id: 'process', label: 'Process', icon: Layers, path: '/process' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'users', label: 'Users', icon: User, path: '/users' },
];



const Sidebar: React.FC<SidebarProps> = ({ collapsed = false }) => {
  const location = useLocation();

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/devices') return 'devices';
    if (path === '/analytics') return 'analytics';
    if (path === '/knowledge') return 'knowledge';
    if (path === '/process') return 'process';
    if (path === '/notifications') return 'notifications';
    if (path === '/users') return 'users';
    if (path === '/settings') return 'settings';
    if (path === '/device-care') return 'device-care';
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const isDeviceCareActive = currentPage === 'device-care';

  return (
    <div className="bg-white border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">IoT Platform</h1>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}

        {/* DeviceCare Center */}
        <div className="pt-2">
          <Link
            to="/device-care"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDeviceCareActive
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Zap className="w-5 h-5" />
            DeviceCare Center
          </Link>
        </div>

        {/* Settings Button */}
        <div className="pt-2">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'settings'
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;