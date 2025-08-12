import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useToast } from '../UI/Toast';
import { Eye, EyeOff, Mail, Lock, Loader2, Zap, Shield, Cpu, ArrowRight, Sparkles } from 'lucide-react';
import Button from '../UI/Button';
import Modal from '../UI/Modal';

export const LoginForm: React.FC = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!credentials.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!credentials.password) {
      newErrors.password = 'Password is required';
    } else if (credentials.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('LoginForm - Starting login process');
    
    if (!validateForm()) {
      console.log('LoginForm - Form validation failed');
      return;
    }
    
    console.log('LoginForm - Form validation passed');
    setIsLoading(true);
    
    try {
      console.log('LoginForm - Calling login function');
      await login(credentials.email, credentials.password);
      console.log('LoginForm - Login successful');
      success('Welcome back!', 'Successfully logged in to your IoT platform');
      console.log('LoginForm - Navigating to dashboard');
      navigate('/dashboard');
    } catch (err) {
      console.error('LoginForm - Login failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      
      // Check for specific error types
      if (errorMessage.includes('Bad credentials') || errorMessage.includes('Invalid credentials')) {
        showError('Authentication Failed', 'Invalid email or password. Please try again.');
      } else if (errorMessage.includes('User not found')) {
        showError('User Not Found', 'Please check your email address.');
      } else if (errorMessage.includes('Network Error') || errorMessage.includes('timeout') || errorMessage.includes('ECONNREFUSED')) {
        showError('Connection Error', 'Unable to connect to the server. Please check if the backend server is running and try again.');
      } else if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
        showError('CORS Error', 'Cross-origin request blocked. Please check server configuration.');
      } else {
        showError('Login Error', `Login failed: ${errorMessage}`);
      }
    } finally {
      console.log('LoginForm - Login process completed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 dark:from-gray-900 dark:via-indigo-900 dark:to-purple-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-indigo-400 rounded-full animate-float opacity-60"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-float opacity-40" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-float opacity-50" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-indigo-300 rounded-full animate-float opacity-30" style={{ animationDelay: '0.5s' }}></div>
      </div>

      <div className="w-full max-w-6xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700/50 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          {/* Left Side - Enhanced Visual */}
          <div className="hidden lg:block bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-600 p-8 flex flex-col justify-center relative overflow-hidden animate-gradient-shift">
            {/* Enhanced animated background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-purple-600/30 to-cyan-600/30 animate-pulse"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-bounce"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/10 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/4 left-1/4 w-20 h-20 bg-white/5 rounded-full animate-float"></div>
            
            <div className="text-center text-white relative z-10">
              <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl backdrop-blur-sm hover:scale-110 transition-transform duration-300 animate-float">
                <Cpu className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">Welcome Back</h2>
              <p className="text-lg text-white/90 mb-8 leading-relaxed max-w-md mx-auto">
                Sign in to your AI-powered IoT platform and unlock the future of device management.
              </p>
              
              {/* Enhanced feature highlights */}
              <div className="space-y-4 text-left max-w-sm mx-auto">
                <div className="flex items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Shield className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">Enterprise-grade security</span>
                </div>
                <div className="flex items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">Real-time monitoring</span>
                </div>
                <div className="flex items-center bg-white/10 p-4 rounded-2xl backdrop-blur-sm hover:bg-white/15 transition-all duration-300 hover:scale-105">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/90 text-sm font-medium">AI-powered insights</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Enhanced Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg animate-gradient-shift">
                    <Cpu className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">shiftAIOT</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Platform Login</p>
                  </div>
                </div>
                
                {/* Enhanced theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all duration-300 shadow-md hover:shadow-lg"
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
                    onChange={(e) => {
                      setCredentials({ ...credentials, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    className={`input pl-10 ${errors.email ? 'error' : ''}`}
                    placeholder="Enter your email"
                    required
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-in-up">
                      {errors.email}
                    </p>
                  )}
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
                    onChange={(e) => {
                      setCredentials({ ...credentials, password: e.target.value });
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={`input pl-10 pr-10 ${errors.password ? 'error' : ''}`}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-xl transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400 animate-slide-in-up">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
                >
                  Forgot password?
                </button>
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
                  className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="Reset Password"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          <input
            type="email"
            placeholder="Enter your email"
            className="input w-full"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowForgotPasswordModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1"
            >
              Send Reset Link
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};