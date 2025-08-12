import React from 'react';
import { Loader2 } from 'lucide-react';

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
    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95';
    
    switch (variant) {
      case 'primary':
        return `${baseClasses} bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 text-white shadow-lg hover:shadow-xl hover:shadow-indigo-500/25 focus:ring-indigo-500 animate-gradient-shift`;
      case 'secondary':
        return `${baseClasses} bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 focus:ring-gray-500 shadow-md hover:shadow-lg`;
      case 'success':
        return `${baseClasses} bg-gradient-to-r from-emerald-500 via-green-600 to-lime-600 text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/25 focus:ring-emerald-500`;
      case 'warning':
        return `${baseClasses} bg-gradient-to-r from-orange-500 via-yellow-600 to-amber-600 text-white shadow-lg hover:shadow-xl hover:shadow-orange-500/25 focus:ring-orange-500`;
      case 'danger':
        return `${baseClasses} bg-gradient-to-r from-red-500 via-pink-600 to-rose-600 text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25 focus:ring-red-500`;
      case 'ghost':
        return `${baseClasses} bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500 hover:shadow-md`;
      case 'outline':
        return `${baseClasses} bg-transparent text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:ring-indigo-500 hover:shadow-md`;
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
        <Loader2 className="animate-spin" />
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
