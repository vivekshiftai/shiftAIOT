import React from 'react';
import { Cpu } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subtitle?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading shiftAIOT Platform...",
  subtitle = "Please wait while we initialize your dashboard"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg font-medium mb-2">{message}</p>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>
    </div>
  );
};

export const TabLoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 text-sm font-medium">Loading content...</p>
      </div>
    </div>
  );
};

export const ModalLoadingScreen: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-slate-600 text-xs">Loading...</p>
      </div>
    </div>
  );
};
