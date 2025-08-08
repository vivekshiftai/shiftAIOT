import React from 'react';
import { Cpu, Wifi, Bell, Database } from 'lucide-react';

interface IoTLoadingScreenProps {
  message?: string;
  subtitle?: string;
}

export const IoTLoadingScreen: React.FC<IoTLoadingScreenProps> = ({ 
  message = "Loading IoT Platform Data...",
  subtitle = "Connecting to devices, loading notifications, and initializing knowledge base"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Cpu className="w-10 h-10 text-white" />
        </div>
        
        {/* Loading animation with IoT icons */}
        <div className="flex justify-center items-center gap-4 mb-6">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin">
            <Wifi className="w-4 h-4 text-blue-600 absolute inset-0 m-auto" />
          </div>
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}>
            <Bell className="w-4 h-4 text-green-600 absolute inset-0 m-auto" />
          </div>
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.4s' }}>
            <Database className="w-4 h-4 text-purple-600 absolute inset-0 m-auto" />
          </div>
        </div>
        
        <p className="text-slate-700 text-xl font-semibold mb-3">{message}</p>
        <p className="text-slate-500 text-sm leading-relaxed">{subtitle}</p>
        
        {/* Progress indicators */}
        <div className="mt-8 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Loading Devices</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Loading Notifications</span>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Loading Knowledge Base</span>
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const IoTDataLoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <p className="text-slate-600 text-sm font-medium">Loading IoT data...</p>
      </div>
    </div>
  );
};
