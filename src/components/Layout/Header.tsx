import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../UI/Toast';
import { NotificationDropdown } from './NotificationDropdown';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Settings, 
  User, 
  AlertTriangle,
  Trash2
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
  const navigate = useNavigate();
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await logout();
      success('Logged out successfully', 'You have been logged out of your account');
      navigate('/login');
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
            <header className="bg-card text-primary h-16 flex items-center justify-between px-6 shadow-sm sticky top-0 z-50 border-b border-light">
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <IconButton
          icon={<Settings className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
          className="text-secondary hover:text-primary transition-colors"
        />

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search devices, rules, users..."
            className="pl-10 pr-4 py-2 border border-light rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-card text-primary w-80 transition-all placeholder-secondary futuristic-input"
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
          icon={<Settings className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="text-secondary hover:text-primary transition-colors"
        />

        {/* Help */}
        <IconButton
          icon={<AlertTriangle className="w-5 h-5" />}
          variant="ghost"
          size="sm"
          onClick={() => {
            // Open help modal or navigate to help page
            alert('Help documentation will be available soon!');
          }}
          aria-label="Help"
          className="text-secondary hover:text-primary transition-colors"
        />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-tertiary transition-colors"
          >
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-primary">
                {user?.email || 'User'}
              </p>
              <p className="text-xs text-secondary capitalize">
                {user?.role?.toLowerCase() || 'User'}
              </p>
            </div>
            <Settings className={`w-4 h-4 text-secondary transition-transform ${
              userDropdownOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {/* User Dropdown */}
          {userDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border border-light py-2 z-50">
              <div className="px-4 py-3 border-b border-light">
                <p className="text-sm font-medium text-primary">
                  {user?.email}
                </p>
                <p className="text-xs text-secondary capitalize">
                  {user?.role?.toLowerCase() || 'User'}
                </p>
              </div>
              
              <div className="py-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/settings?tab=profile');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-primary hover:bg-tertiary transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-primary hover:bg-tertiary transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    navigate('/settings?tab=security');
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-primary hover:bg-tertiary transition-colors"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Security
                </button>
              </div>
              
              <div className="border-t border-light pt-1">
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-500 hover:bg-error-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search (visible only on mobile) */}
      <div className="md:hidden absolute top-16 left-0 right-0 bg-card border-b border-light p-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-light rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-card text-primary transition-all placeholder-secondary futuristic-input"
          />
        </form>
      </div>
    </header>
  );
};