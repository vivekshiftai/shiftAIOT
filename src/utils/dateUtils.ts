/**
 * Utility functions for date formatting and validation
 */

import { logWarn, logError } from './logger';

/**
 * Safely formats a timestamp string to a readable date
 * Handles various timestamp formats and provides fallbacks for invalid dates
 */
export const formatTimestamp = (timestamp: string | null | undefined): { relative: string; full: string } => {
  if (!timestamp) {
    return {
      relative: 'Unknown',
      full: 'Date not available'
    };
  }

  try {
    // Handle different timestamp formats
    let date: Date;
    
    // If it's already a valid ISO string, use it directly
    if (timestamp.includes('T') && timestamp.includes('Z')) {
      date = new Date(timestamp);
    } else if (timestamp.includes('T')) {
      // Handle LocalDateTime format from backend (e.g., "2024-01-15T10:30:00")
      date = new Date(timestamp + 'Z'); // Add Z to treat as UTC
    } else {
      // Try parsing as is
      date = new Date(timestamp);
    }

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      logWarn('DateUtils', 'Invalid timestamp received', { timestamp });
      return {
        relative: 'Invalid Date',
        full: 'Invalid Date'
      };
    }

    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    let relative: string;
    if (diffInMinutes < 1) {
      relative = 'Just now';
    } else if (diffInMinutes < 60) {
      relative = `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      relative = `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      relative = date.toLocaleDateString();
    }

    const full = date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });

    return { relative, full };
  } catch (error) {
    logError('DateUtils', 'Error formatting timestamp', error instanceof Error ? error : new Error('Unknown error'), { timestamp });
    return {
      relative: 'Invalid Date',
      full: 'Invalid Date'
    };
  }
};

/**
 * Formats a timestamp to a simple relative time string
 */
export const formatRelativeTime = (timestamp: string | null | undefined): string => {
  return formatTimestamp(timestamp).relative;
};

/**
 * Formats a timestamp to a full date string
 */
export const formatFullDate = (timestamp: string | null | undefined): string => {
  return formatTimestamp(timestamp).full;
};

/**
 * Validates if a timestamp string is valid
 */
export const isValidTimestamp = (timestamp: string | null | undefined): boolean => {
  if (!timestamp) return false;
  
  try {
    const date = new Date(timestamp);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
};
