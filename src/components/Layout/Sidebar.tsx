import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Home, 
  Cpu, 
  BarChart3, 
  Settings, 
  Bell, 
  Users, 
  BookOpen,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  collapsed: boolean;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
  { id: 'devices', label: 'Devices', icon: Cpu, path: '/devices' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, path: '/knowledge' },
  { id: 'notifications', label: 'Notifications', icon: Bell, path: '/notifications' },
  { id: 'users', label: 'Users', icon: Users, path: '/users' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeSection, 
  onSectionChange, 
  collapsed 
}) => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className={`bg-card text-primary transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } h-screen flex flex-col shadow-sm border-r border-light flex-shrink-0`}>
      <div className="p-4 border-b border-light">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-sm">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-primary">shiftAIOT Platform</h1>
              <p className="text-secondary text-xs">Enterprise Edition</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-primary-500 text-white shadow-sm' 
                      : 'text-secondary hover:bg-tertiary hover:text-primary'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left font-medium">{item.label}</span>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-light">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-white text-sm font-medium">
              {user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-primary">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}` 
                  : user?.email || 'User'
                }
              </p>
              <p className="text-xs text-secondary truncate capitalize">
                {user?.role?.toLowerCase() || 'User'}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};