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
        return `${baseClasses} bg-primary-500 text-white shadow-md hover:shadow-lg hover:shadow-primary-500/25 focus:ring-primary-500 hover:bg-primary-600`;
      case 'secondary':
        return `${baseClasses} bg-neutral-100 text-neutral-700 border border-neutral-300 hover:bg-neutral-200 focus:ring-neutral-500 shadow-sm hover:shadow-md`;
      case 'success':
        return `${baseClasses} bg-success-500 text-white shadow-md hover:shadow-lg hover:shadow-success-500/25 focus:ring-success-500 hover:bg-success-600`;
      case 'warning':
        return `${baseClasses} bg-warning-500 text-white shadow-md hover:shadow-lg hover:shadow-warning-500/25 focus:ring-warning-500 hover:bg-warning-600`;
      case 'danger':
        return `${baseClasses} bg-error-500 text-white shadow-md hover:shadow-lg hover:shadow-error-500/25 focus:ring-error-500 hover:bg-error-600`;
      case 'ghost':
        return `${baseClasses} bg-transparent text-neutral-600 hover:bg-neutral-100/80 focus:ring-neutral-500 hover:shadow-sm`;
      case 'outline':
        return `${baseClasses} bg-transparent text-primary-500 border-2 border-primary-500 hover:bg-primary-50 focus:ring-primary-500 hover:shadow-sm`;
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
