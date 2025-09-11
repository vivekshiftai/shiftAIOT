// Logging utility for the ActiveOps Hub application
// 
// This logger stores logs in actual files on the user's machine using the File System Access API.
// It automatically creates a 'logs' directory in the user-selected location and stores daily log files.
// 
// Features:
// - Stores logs in JSON files on the local machine (not in browser storage)
// - Automatic cleanup of logs older than 3 days
// - Fallback to localStorage if File System Access API is not available
// - No console output - logs are stored silently
// - Browser console access for debugging
//
// Usage in browser console:
// - requestLogDirectory() - Select a directory for log storage
// - getStoredLogs(3) - Get logs from last 3 days
// - exportStoredLogs() - Export logs as JSON
// - getLogStats() - Get log statistics
// - clearStoredLogs() - Clear all stored logs
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory
  private retentionDays = 3; // Keep logs for 3 days

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO;
    
    // Initialize file logging and cleanup old logs
    this.initializeFileLogging();
    this.cleanupOldLogs();
  }

  private initializeFileLogging(): void {
    try {
      // Try to use the File System Access API for modern browsers
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        this.setupFileSystemLogging();
      } else {
        // Fallback to localStorage for older browsers
        this.setupBrowserLogging();
      }
    } catch (error) {
      // Silently fail if logging setup fails
    }
  }

  private setupFileSystemLogging(): void {
    // Use File System Access API to create log files
    // This will prompt user to select a directory for logs
    this.requestLogDirectory();
  }

  private async requestLogDirectory(): Promise<void> {
    try {
      // Request permission to access a directory for logs
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      
      // Store the directory handle for later use
      (window as any).logDirectoryHandle = dirHandle;
      
      // Create logs directory if it doesn't exist
      await this.ensureLogsDirectory(dirHandle);
    } catch (error) {
      // User cancelled or permission denied, fallback to localStorage
      this.setupBrowserLogging();
    }
  }

  private async ensureLogsDirectory(dirHandle: any): Promise<void> {
    try {
      // Check if 'logs' directory exists, create if not
      try {
        await dirHandle.getDirectoryHandle('logs');
      } catch {
        await dirHandle.getDirectoryHandle('logs', { create: true });
      }
    } catch (error) {
      // Silently fail if directory creation fails
    }
  }

  private setupBrowserLogging(): void {
    // Fallback: Store logs in localStorage with date-based keys
    const today = new Date().toISOString().split('T')[0];
    const logKey = `frontend_logs_${today}`;
    
    // Initialize today's log array if it doesn't exist
    if (!localStorage.getItem(logKey)) {
      localStorage.setItem(logKey, JSON.stringify([]));
    }
  }

  private async cleanupOldLogs(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      // Clean up file system logs if available
      if ((window as any).logDirectoryHandle) {
        await this.cleanupFileSystemLogs(cutoffDate);
      }
      
      // Clean up localStorage entries older than retention period
      this.cleanupLocalStorageLogs(cutoffDate);
    } catch (error) {
      // Silently fail if cleanup fails
    }
  }

  private async cleanupFileSystemLogs(cutoffDate: Date): Promise<void> {
    try {
      const dirHandle = (window as any).logDirectoryHandle;
      const logsDir = await dirHandle.getDirectoryHandle('logs');
      
      // Get all files in the logs directory
      const files = [];
      for await (const [name, handle] of logsDir.entries()) {
        if (handle.kind === 'file' && name.startsWith('frontend-logs-') && name.endsWith('.json')) {
          const dateStr = name.replace('frontend-logs-', '').replace('.json', '');
          const logDate = new Date(dateStr);
          
          if (logDate < cutoffDate) {
            files.push(name);
          }
        }
      }
      
      // Remove old log files
      for (const fileName of files) {
        try {
          await logsDir.removeEntry(fileName);
        } catch (error) {
          // Silently fail if file removal fails
        }
      }
    } catch (error) {
      // Silently fail if file system cleanup fails
    }
  }

  private cleanupLocalStorageLogs(cutoffDate: Date): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('frontend_logs_')) {
          const dateStr = key.replace('frontend_logs_', '');
          const logDate = new Date(dateStr);
          
          if (logDate < cutoffDate) {
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove old log entries
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // Silently fail if localStorage cleanup fails
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }


  private addLog(entry: LogEntry): void {
    // Add to in-memory logs
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
    
    // Store in file (localStorage for browser)
    this.storeLogToFile(entry);
  }

  private async storeLogToFile(entry: LogEntry): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Try to use File System Access API first
      if ((window as any).logDirectoryHandle) {
        await this.writeToFileSystem(entry);
      } else {
        // Fallback to localStorage
        this.writeToLocalStorage(entry);
      }
    } catch (error) {
      // Silently fail if file storage fails
    }
  }

  private async writeToFileSystem(entry: LogEntry): Promise<void> {
    try {
      const dirHandle = (window as any).logDirectoryHandle;
      const logsDir = await dirHandle.getDirectoryHandle('logs');
      
      const today = new Date().toISOString().split('T')[0];
      const fileName = `frontend-logs-${today}.json`;
      
      // Get existing logs for today
      let logs: LogEntry[] = [];
      try {
        const fileHandle = await logsDir.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        logs = content ? JSON.parse(content) : [];
      } catch {
        // File doesn't exist yet, create new array
        logs = [];
      }
      
      // Add new log entry
      logs.push(entry);
      
      // Write back to file
      const fileHandle = await logsDir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(logs, null, 2));
      await writable.close();
    } catch (error) {
      // Fallback to localStorage if file system fails
      this.writeToLocalStorage(entry);
    }
  }

  private writeToLocalStorage(entry: LogEntry): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logKey = `frontend_logs_${today}`;
      
      // Get existing logs for today
      const existingLogs = localStorage.getItem(logKey);
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      // Add new log entry
      logs.push(entry);
      
      // Store back to localStorage
      localStorage.setItem(logKey, JSON.stringify(logs));
    } catch (error) {
      // Silently fail if localStorage fails
    }
  }

  debug(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      category,
      message,
      data
    };
    
    this.addLog(entry);
    // Logs are now stored in file only - no console output
  }

  info(category: string, message: string, data?: any): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      data
    };
    
    this.addLog(entry);
    // Logs are now stored in file only - no console output
  }

  warn(category: string, message: string, data?: any, error?: Error): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      data,
      error
    };
    
    this.addLog(entry);
    // Logs are now stored in file only - no console output
  }

  error(category: string, message: string, error?: Error, data?: any): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      data,
      error
    };
    
    this.addLog(entry);
    // Logs are now stored in file only - no console output
  }

  // API-specific logging methods
  apiRequest(endpoint: string, method: string, data?: any): void {
    this.info('API', `${method} ${endpoint}`, data);
  }

  apiResponse(endpoint: string, method: string, status: number, data?: any): void {
    if (status >= 400) {
      this.error('API', `${method} ${endpoint} failed with status ${status}`, undefined, data);
    } else {
      this.info('API', `${method} ${endpoint} succeeded with status ${status}`, data);
    }
  }

  apiError(endpoint: string, method: string, error: Error, data?: any): void {
    this.error('API', `${method} ${endpoint} failed`, error, data);
  }

  // Component-specific logging methods
  componentMount(componentName: string, props?: any): void {
    this.debug('Component', `${componentName} mounted`, props);
  }

  componentUnmount(componentName: string): void {
    this.debug('Component', `${componentName} unmounted`);
  }

  componentError(componentName: string, error: Error, context?: any): void {
    this.error('Component', `${componentName} error`, error, context);
  }

  // State management logging
  stateChange(store: string, action: string, data?: any): void {
    this.debug('State', `${store} - ${action}`, data);
  }

  // User action logging
  userAction(action: string, data?: any): void {
    this.info('User', action, data);
  }

  // Authentication logging
  authSuccess(userId: string, method: string): void {
    this.info('Auth', `User ${userId} authenticated via ${method}`);
  }

  authFailure(method: string, error: Error): void {
    this.error('Auth', `Authentication failed via ${method}`, error);
  }

  // Get logs for debugging (from in-memory)
  getLogs(level?: LogLevel, category?: string): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    
    return filteredLogs;
  }

  // Get logs from file storage (last 3 days)
  async getStoredLogs(days: number = 3): Promise<LogEntry[]> {
    if (typeof window === 'undefined') return [];
    
    const allLogs: LogEntry[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    try {
      // Try to get logs from file system first
      if ((window as any).logDirectoryHandle) {
        const fileSystemLogs = await this.getFileSystemLogs(cutoffDate);
        allLogs.push(...fileSystemLogs);
      }
      
      // Also get logs from localStorage as fallback
      const localStorageLogs = this.getLocalStorageLogs(cutoffDate);
      allLogs.push(...localStorageLogs);
    } catch (error) {
      // Silently fail if retrieval fails
    }
    
    // Sort by timestamp
    return allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  private async getFileSystemLogs(cutoffDate: Date): Promise<LogEntry[]> {
    const logs: LogEntry[] = [];
    
    try {
      const dirHandle = (window as any).logDirectoryHandle;
      const logsDir = await dirHandle.getDirectoryHandle('logs');
      
      // Get all log files
      for await (const [name, handle] of logsDir.entries()) {
        if (handle.kind === 'file' && name.startsWith('frontend-logs-') && name.endsWith('.json')) {
          const dateStr = name.replace('frontend-logs-', '').replace('.json', '');
          const logDate = new Date(dateStr);
          
          if (logDate >= cutoffDate) {
            try {
              const fileHandle = await logsDir.getFileHandle(name);
              const file = await fileHandle.getFile();
              const content = await file.text();
              if (content) {
                const parsedLogs = JSON.parse(content);
                logs.push(...parsedLogs);
              }
            } catch (error) {
              // Silently fail if file reading fails
            }
          }
        }
      }
    } catch (error) {
      // Silently fail if file system access fails
    }
    
    return logs;
  }

  private getLocalStorageLogs(cutoffDate: Date): LogEntry[] {
    const logs: LogEntry[] = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('frontend_logs_')) {
          const dateStr = key.replace('frontend_logs_', '');
          const logDate = new Date(dateStr);
          
          if (logDate >= cutoffDate) {
            const logData = localStorage.getItem(key);
            if (logData) {
              const parsedLogs = JSON.parse(logData);
              logs.push(...parsedLogs);
            }
          }
        }
      }
    } catch (error) {
      // Silently fail if localStorage access fails
    }
    
    return logs;
  }

  // Clear in-memory logs
  clearLogs(): void {
    this.logs = [];
  }

  // Clear all stored logs
  async clearStoredLogs(): Promise<void> {
    if (typeof window === 'undefined') return;
    
    try {
      // Clear file system logs if available
      if ((window as any).logDirectoryHandle) {
        await this.clearFileSystemLogs();
      }
      
      // Clear localStorage logs
      this.clearLocalStorageLogs();
    } catch (error) {
      // Silently fail if cleanup fails
    }
  }

  private async clearFileSystemLogs(): Promise<void> {
    try {
      const dirHandle = (window as any).logDirectoryHandle;
      const logsDir = await dirHandle.getDirectoryHandle('logs');
      
      // Get all log files and remove them
      const filesToRemove: string[] = [];
      for await (const [name, handle] of logsDir.entries()) {
        if (handle.kind === 'file' && name.startsWith('frontend-logs-') && name.endsWith('.json')) {
          filesToRemove.push(name);
        }
      }
      
      // Remove all log files
      for (const fileName of filesToRemove) {
        try {
          await logsDir.removeEntry(fileName);
        } catch (error) {
          // Silently fail if file removal fails
        }
      }
    } catch (error) {
      // Silently fail if file system access fails
    }
  }

  private clearLocalStorageLogs(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('frontend_logs_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      // Silently fail if localStorage cleanup fails
    }
  }

  // Export logs for debugging (from in-memory)
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Export stored logs for debugging
  async exportStoredLogs(days: number = 3): Promise<string> {
    const storedLogs = await this.getStoredLogs(days);
    return JSON.stringify(storedLogs, null, 2);
  }

  // Get log statistics
  async getLogStats(): Promise<{ total: number; byLevel: Record<string, number>; byCategory: Record<string, number> }> {
    const storedLogs = await this.getStoredLogs(3);
    const stats = {
      total: storedLogs.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };
    
    storedLogs.forEach(log => {
      const levelName = LogLevel[log.level];
      const category = log.category;
      
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    return stats;
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience functions
export const logDebug = (category: string, message: string, data?: any) => logger.debug(category, message, data);
export const logInfo = (category: string, message: string, data?: any) => logger.info(category, message, data);
export const logWarn = (category: string, message: string, data?: any, error?: Error) => logger.warn(category, message, data, error);
export const logError = (category: string, message: string, error?: Error, data?: any) => logger.error(category, message, error, data);

// Export API logging functions
export const logApiRequest = (endpoint: string, method: string, data?: any) => logger.apiRequest(endpoint, method, data);
export const logApiResponse = (endpoint: string, method: string, status: number, data?: any) => logger.apiResponse(endpoint, method, status, data);
export const logApiError = (endpoint: string, method: string, error: Error, data?: any) => logger.apiError(endpoint, method, error, data);

// Export component logging functions
export const logComponentMount = (componentName: string, props?: any) => logger.componentMount(componentName, props);
export const logComponentUnmount = (componentName: string) => logger.componentUnmount(componentName);
export const logComponentError = (componentName: string, error: Error, context?: any) => logger.componentError(componentName, error, context);

// Export state logging functions
export const logStateChange = (store: string, action: string, data?: any) => logger.stateChange(store, action, data);

// Export user action logging functions
export const logUserAction = (action: string, data?: any) => logger.userAction(action, data);

// Export auth logging functions
export const logAuthSuccess = (userId: string, method: string) => logger.authSuccess(userId, method);
export const logAuthFailure = (method: string, error: Error) => logger.authFailure(method, error);

// Export log management functions
export const getStoredLogs = (days: number = 3) => logger.getStoredLogs(days);
export const clearStoredLogs = () => logger.clearStoredLogs();
export const exportStoredLogs = (days: number = 3) => logger.exportStoredLogs(days);
export const getLogStats = () => logger.getLogStats();

// Make logger accessible from browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
  (window as any).getStoredLogs = getStoredLogs;
  (window as any).exportStoredLogs = exportStoredLogs;
  (window as any).getLogStats = getLogStats;
  (window as any).clearStoredLogs = clearStoredLogs;
  
  // Add a helper function to request log directory
  (window as any).requestLogDirectory = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'documents'
      });
      (window as any).logDirectoryHandle = dirHandle;
      console.log('Log directory set successfully!');
      return dirHandle;
    } catch (error) {
      console.log('Failed to set log directory:', error);
    }
  };
}

export default logger;
