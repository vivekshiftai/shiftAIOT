import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../UI/Toast';
import { NotificationDropdown } from './NotificationDropdown';
import { 
  Menu, 
  Search, 
  Settings, 
  Sun, 
  Moon, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown,
  HelpCircle,
  Shield
} from 'lucide-react';
import Button from '../UI/Button';
import { IconButton } from '../UI/Button';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success } = useToast();
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully', 'You have been logged out of your account');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white h-16 flex items-center justify-between px-6 shadow-lg sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <IconButton
          icon={<Menu className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="text-blue-100 hover:text-white"
        />

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices, rules, users..."
            className="pl-10 pr-4 py-2 border border-blue-300/30 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/90 text-gray-900 w-80 transition-all placeholder-blue-200"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <NotificationDropdown 
          isOpen={notificationDropdownOpen}
          onToggle={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
        />

        {/* Theme Toggle */}
        <IconButton
          icon={theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="text-blue-100 hover:text-white"
        />

        {/* Help */}
        <IconButton
          icon={<HelpCircle className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={() => window.open('/help', '_blank')}
          aria-label="Help"
          className="text-blue-100 hover:text-white"
        />

        {/* Settings */}
        <IconButton
          icon={<Settings className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/settings'}
          aria-label="Settings"
          className="text-blue-100 hover:text-white"
        />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-white">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-blue-200 capitalize">
                {user?.role?.toLowerCase() || 'User'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-blue-200 transition-transform ${
              userDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {/* User Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user?.role?.toLowerCase() || 'User'}
                </p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    window.location.href = '/profile';
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    window.location.href = '/settings';
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    window.location.href = '/security';
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Security
                </button>
              </div>
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search (visible only on mobile) */}
      <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 dark:bg-gray-700/80 text-gray-900 dark:text-white transition-all placeholder-gray-500 dark:placeholder-gray-400"
          />
        </form>
      </div>
    </header>
  );
};