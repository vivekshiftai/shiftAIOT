import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

  return (
    <aside className={`bg-gradient-to-b from-primary-950 via-primary-900 to-secondary-900 text-white transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    } min-h-screen flex flex-col shadow-xl border-r border-secondary-500/20`}>
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-secondary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg text-white">shiftAIOT Platform</h1>
              <p className="text-secondary-300 text-xs">Enterprise Edition</p>
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
                      ? 'bg-gradient-to-r from-secondary-500 to-primary-600 text-white shadow-lg animate-glow' 
                      : 'text-secondary-200 hover:bg-secondary-500/10 hover:text-white'
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

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-secondary-400 to-primary-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-medium">JS</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">John Smith</p>
              <p className="text-xs text-secondary-300 truncate">Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};