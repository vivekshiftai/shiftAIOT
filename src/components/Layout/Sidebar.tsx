import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Bell, 
  User, 
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  Target,
  Wrench,
  Shield,
  BarChart3,
  Cpu,
  BookOpen,
  Home
} from 'lucide-react';

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
  collapsed?: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'devices', label: 'Devices', icon: Cpu, path: '/devices' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, path: '/knowledge' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'users', label: 'Users', icon: User, path: '/users' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const moreMenuItems = [
  { id: 'rules', label: 'Rules', icon: Target, path: '/rules' },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench, path: '/maintenance' },
  { id: 'safety', label: 'Safety Info', icon: Shield, path: '/safety' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange, collapsed = false }) => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/devices') return 'devices';
    if (path === '/analytics') return 'analytics';
    if (path === '/knowledge') return 'knowledge';
    if (path === '/notifications') return 'notifications';
    if (path === '/users') return 'users';
    if (path === '/settings') return 'settings';
    if (path === '/rules') return 'rules';
    if (path === '/maintenance') return 'maintenance';
    if (path === '/safety') return 'safety';
    return 'dashboard';
  };

  const currentPage = getCurrentPage();
  const isMoreActive = moreMenuItems.some(item => item.id === currentPage);

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

        {/* More Dropdown */}
        <div className="pt-2">
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isMoreActive
                ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <MoreHorizontal className="w-5 h-5" />
              More
            </div>
            {isMoreOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {isMoreOpen && (
            <div className="ml-6 mt-2 space-y-1">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;