import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { User } from '../types';

interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  handleAuthFailure: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Mock user data
const mockUser: User = {
  id: '1',
  name: 'John Smith',
  email: 'john.smith@iotplatform.com',
  role: 'org_admin',
  avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
  lastLogin: '2025-01-13T10:30:00Z',
  permissions: ['device:read', 'device:write', 'rule:read', 'rule:write', 'user:read']
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        // Validate token by making a test request
        // For now, we'll just check if token exists
        setUser(JSON.parse(savedUser));
      } catch (error) {
        // If token is invalid, clear storage and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    } else {
      // No saved session, ensure user is null
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.login({ email, password });
      const { token, id, name, email: userEmail, role, organizationId } = response.data;
      
      const userData: User = {
        id,
        name,
        email: userEmail,
        role: role.toLowerCase(),
        organizationId,
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
        lastLogin: new Date().toISOString(),
        permissions: ['device:read', 'device:write', 'rule:read', 'rule:write', 'user:read']
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      const errorMessage = error.response?.data || 'Login failed';
      // Extract the actual error message from the response
      const message = typeof errorMessage === 'string' && errorMessage.includes('Error: ') 
        ? errorMessage.replace('Error: ', '') 
        : errorMessage;
      
      // Clear any existing invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupData) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber,
        role: 'VIEWER',
        organizationId: 'default'
      });
      
      // After successful signup, automatically log in the user
      await login(data.email, data.password);
    } catch (error: any) {
      const errorMessage = error.response?.data || 'Signup failed';
      // Extract the actual error message from the response
      const message = typeof errorMessage === 'string' && errorMessage.includes('Error: ') 
        ? errorMessage.replace('Error: ', '') 
        : errorMessage;
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    window.history.pushState({}, '', '/login');
    window.location.reload();
  };

  const handleAuthFailure = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page with error message
    window.history.pushState({}, '', '/login');
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, handleAuthFailure, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};