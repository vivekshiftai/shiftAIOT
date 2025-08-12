import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  lines?: number;
  gap?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  rounded = 'md',
  lines = 1,
  gap = 'gap-2'
}) => {
  const getRoundedClass = () => {
    switch (rounded) {
      case 'sm': return 'rounded-sm';
      case 'md': return 'rounded-md';
      case 'lg': return 'rounded-lg';
      case 'xl': return 'rounded-xl';
      case 'full': return 'rounded-full';
      default: return 'rounded-md';
    }
  };

  const getWidth = () => {
    if (typeof width === 'number') return `${width}px`;
    if (typeof width === 'string') return width;
    return 'w-full';
  };

  const getHeight = () => {
    if (typeof height === 'number') return `${height}px`;
    if (typeof height === 'string') return height;
    return 'h-4';
  };

  if (lines > 1) {
    return (
      <div className={`flex flex-col ${gap} ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`
              animate-pulse bg-gray-200 dark:bg-gray-700
              ${getRoundedClass()}
              ${index === lines - 1 ? 'w-3/4' : 'w-full'}
            `}
            style={{
              width: index === lines - 1 ? '75%' : getWidth(),
              height: getHeight()
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`
        animate-pulse bg-gray-200 dark:bg-gray-700
        ${getRoundedClass()}
        ${className}
      `}
      style={{
        width: getWidth(),
        height: getHeight()
      }}
    />
  );
};

// Specialized skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-6 space-y-4 ${className}`}>
    <div className="flex items-center space-x-4">
      <Skeleton width={48} height={48} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={16} />
      </div>
    </div>
    <Skeleton lines={3} />
    <div className="flex justify-between">
      <Skeleton width={80} height={32} />
      <Skeleton width={100} height={32} />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number; className?: string }> = ({
  rows = 5,
  columns = 4,
  className = ''
}) => (
  <div className={`space-y-3 ${className}`}>
    {/* Header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} width="100%" height={20} />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} width="100%" height={16} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 5,
  className = ''
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        <Skeleton width={40} height={40} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={14} />
        </div>
        <Skeleton width={60} height={32} />
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    <div className="flex justify-between items-center">
      <Skeleton width={120} height={24} />
      <Skeleton width={80} height={32} />
    </div>
    <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-end justify-center space-x-2 p-4">
      {Array.from({ length: 7 }).map((_, index) => (
        <Skeleton
          key={index}
          width={40}
          height={`${Math.random() * 60 + 20}%`}
          className="bg-gray-200 dark:bg-gray-600"
        />
      ))}
    </div>
  </div>
);

export default Skeleton;
