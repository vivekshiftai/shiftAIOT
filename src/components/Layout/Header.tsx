import React from 'react';
import { Menu, Search, Bell, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useIoT } from '../../contexts/IoTContext';

interface HeaderProps {
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onToggleSidebar, 
  darkMode, 
  onToggleDarkMode 
}) => {
  const { user, logout } = useAuth();
  const { notifications } = useIoT();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search devices, rules, users..."
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 text-slate-900 w-80 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-slate-600" />
          ) : (
            <Moon className="w-5 h-5 text-slate-600" />
          )}
        </button>

        {/* Settings */}
        <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-slate-600" />
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white text-sm font-medium">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-slate-900">{user?.email || 'User'}</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};