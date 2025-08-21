// Logging utility for the IoT Platform application
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

  constructor() {
    // Set log level based on environment
    this.logLevel = process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, category: string, message: string, data?: any, error?: Error): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    let formattedMessage = `[${timestamp}] ${levelStr} [${category}] ${message}`;
    
    if (data) {
      formattedMessage += ` | Data: ${JSON.stringify(data)}`;
    }
    
    if (error) {
      formattedMessage += ` | Error: ${error.message}`;
      if (error.stack) {
        formattedMessage += ` | Stack: ${error.stack}`;
      }
    }
    
    return formattedMessage;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
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
    // In production, you might want to send this to a logging service instead of console
    if (process.env.NODE_ENV !== 'production') {
      console.debug(this.formatMessage(LogLevel.DEBUG, category, message, data));
    }
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
    // In production, you might want to send this to a logging service instead of console
    if (process.env.NODE_ENV !== 'production') {
      console.info(this.formatMessage(LogLevel.INFO, category, message, data));
    }
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
    // In production, you might want to send this to a logging service instead of console
    if (process.env.NODE_ENV !== 'production') {
      console.warn(this.formatMessage(LogLevel.WARN, category, message, data, error));
    }
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
    // In production, you might want to send this to a logging service instead of console
    if (process.env.NODE_ENV !== 'production') {
      console.error(this.formatMessage(LogLevel.ERROR, category, message, data, error));
    }
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

  // Get logs for debugging
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

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
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

export default logger;
