import React from 'react';
import { Clock } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const getVariantClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/25 focus:ring-blue-500`;
      case 'secondary':
        return `${baseClasses} bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 border border-slate-300 hover:from-slate-200 hover:to-slate-300 focus:ring-slate-500 shadow-sm hover:shadow-md`;
      case 'success':
        return `${baseClasses} bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-md hover:shadow-lg hover:shadow-emerald-500/25 focus:ring-emerald-500`;
      case 'warning':
        return `${baseClasses} bg-gradient-to-r from-orange-400 to-yellow-500 text-white shadow-md hover:shadow-lg hover:shadow-orange-500/25 focus:ring-orange-500`;
      case 'danger':
        return `${baseClasses} bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-md hover:shadow-lg hover:shadow-red-500/25 focus:ring-red-500`;
      case 'ghost':
        return `${baseClasses} bg-transparent text-slate-600 hover:bg-slate-100/80 focus:ring-slate-500 hover:shadow-sm`;
      case 'outline':
        return `${baseClasses} bg-transparent text-blue-600 border-2 border-blue-600 hover:bg-blue-50 focus:ring-blue-500 hover:shadow-sm`;
      default:
        return baseClasses;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm gap-1.5';
      case 'md':
        return 'px-4 py-2 text-sm gap-2';
      case 'lg':
        return 'px-6 py-3 text-base gap-2';
      case 'xl':
        return 'px-8 py-4 text-lg gap-3';
      default:
        return 'px-4 py-2 text-sm gap-2';
    }
  };

  return (
    <button
      className={`${getVariantClasses()} ${getSizeClasses()} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Clock className="animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

// Icon Button variant
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 'md',
  variant = 'ghost',
  className = '',
  ...props
}) => {
  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'p-1.5';
      case 'md':
        return 'p-2';
      case 'lg':
        return 'p-3';
      case 'xl':
        return 'p-4';
      default:
        return 'p-2';
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`${getIconSizeClasses()} ${className}`}
      {...props}
    >
      {icon}
    </Button>
  );
};

export default Button;
