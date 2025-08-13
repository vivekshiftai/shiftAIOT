import React from 'react';

type IconType = React.ComponentType<{ className?: string }>;

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: IconType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  onClick?: () => void;
  className?: string;
}

const colorClasses = {
  blue: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    icon: 'text-primary-600 dark:text-primary-400',
    text: 'text-primary-600 dark:text-primary-400'
  },
  green: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    icon: 'text-success-600 dark:text-success-400',
    text: 'text-success-600 dark:text-success-400'
  },
  yellow: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    icon: 'text-warning-600 dark:text-warning-400',
    text: 'text-warning-600 dark:text-warning-400'
  },
  red: {
    bg: 'bg-error-50 dark:bg-error-900/20',
    icon: 'text-error-600 dark:text-error-400',
    text: 'text-error-600 dark:text-error-400'
  },
  purple: {
    bg: 'bg-secondary-50 dark:bg-secondary-900/20',
    icon: 'text-secondary-600 dark:text-secondary-400',
    text: 'text-secondary-600 dark:text-secondary-400'
  }
};

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
  onClick,
  className = ''
}) => {
  const colors = colorClasses[color];

  return (
    <div
      onClick={onClick}
      className={`card p-6 ${
        onClick ? 'cursor-pointer hover-lift' : ''
      } ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-secondary text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-primary mt-2">{value}</p>
          <p className="text-tertiary text-sm mt-1">{subtitle}</p>
          
          {trend && (
            <div className="mt-3">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-success-600' : 'text-error-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-tertiary text-sm ml-1">
                vs last month
              </span>
            </div>
          )}
        </div>
        
        <div className={`${colors.bg} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};