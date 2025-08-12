import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto dismiss
    const dismissTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => onClose(id), 300);
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = () => {
    const baseStyles = "flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800`;
    }
  };

  return (
    <div
      className={`
        ${getStyles()}
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? 'translate-x-full opacity-0' : ''}
        min-w-[320px] max-w-[420px]
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h4>
        {message && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>
        )}
      </div>
      
      <button
        onClick={handleClose}
        className="flex-shrink-0 ml-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Toast Container
interface ToastContainerProps {
  toasts: Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>;
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-[1080] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};

// Toast Hook
interface ToastOptions {
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  }>>([]);

  const addToast = (type: ToastType, title: string, message?: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type,
      title,
      message,
      duration: options?.duration
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (title: string, message?: string, options?: ToastOptions) => 
    addToast('success', title, message, options);
  
  const error = (title: string, message?: string, options?: ToastOptions) => 
    addToast('error', title, message, options);
  
  const warning = (title: string, message?: string, options?: ToastOptions) => 
    addToast('warning', title, message, options);
  
  const info = (title: string, message?: string, options?: ToastOptions) => 
    addToast('info', title, message, options);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    removeToast
  };
};

export default Toast;
