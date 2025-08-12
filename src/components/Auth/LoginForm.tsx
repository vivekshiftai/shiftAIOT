import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../UI/Toast';
import { Eye, EyeOff, Mail, Lock, Loader2, Zap, Shield, Cpu, ArrowRight } from 'lucide-react';
import Button from '../UI/Button';

export const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!credentials.email || !credentials.password) {
      showError('Validation Error', 'Please enter both email and password');
      setIsLoading(false);
      return;
    }
    
    try {
      await login(credentials.email, credentials.password);
      success('Welcome back!', 'Successfully logged in to your IoT platform');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      if (errorMessage.includes('Bad credentials')) {
        showError('Authentication Failed', 'Invalid email or password. Please try again.');
      } else if (errorMessage.includes('User not found')) {
        showError('User Not Found', 'Please check your email address.');
      } else {
        showError('Login Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-700">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left Side - Visual */}
          <div className="hidden lg:block bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8 flex flex-col justify-center relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-indigo-700/20 animate-pulse"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-bounce"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full animate-bounce"></div>
            
            <div className="text-center text-white relative z-10">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-sm hover:scale-110 transition-transform duration-300">
                <Cpu className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 gradient-text">Welcome Back</h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-md mx-auto">
                Sign in to your AI-powered IoT platform and unlock the future of device management.
              </p>
              
              {/* Feature highlights */}
              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">Enterprise-grade security</span>
                </div>
                <div className="flex items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">Real-time monitoring</span>
                </div>
                <div className="flex items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-colors">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Cpu className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">AI-powered insights</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/80 dark:bg-gray-800/80">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">shiftAIOT</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Platform Login</p>
                  </div>
                </div>
                
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? '🌞' : '🌙'}
                </button>
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Sign in to your account to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    className="input pl-10"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="input pl-10 pr-10"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Demo credentials
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">Demo Credentials:</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Email: admin@example.com | Password: admin123
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};