import { LogLevel, LogCategory } from '../types';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  stack?: string;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private currentLevel: LogLevel = __DEV__ ? 'DEBUG' : 'WARN';
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];
    const currentIndex = levels.indexOf(this.currentLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  private getColor(level: LogLevel): string {
    switch (level) {
      case 'DEBUG': return '\x1b[36m'; // cyan
      case 'INFO': return '\x1b[32m';  // green
      case 'WARN': return '\x1b[33m';  // yellow
      case 'ERROR': return '\x1b[31m'; // red
      case 'FATAL': return '\x1b[35m'; // magenta
      default: return '\x1b[0m';       // reset
    }
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level,
      category,
      message,
      data,
      stack: level === 'ERROR' || level === 'FATAL' ? new Error().stack : undefined,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (__DEV__) {
      const color = this.getColor(level);
      const reset = '\x1b[0m';
      const dataStr = data ? ` ${JSON.stringify(data)}` : '';
      console.log(`${color}[${timestamp}] [${level}] [${category}]${reset} ${message}${dataStr}`);
      
      if (entry.stack && (level === 'ERROR' || level === 'FATAL')) {
        console.log(color + entry.stack + reset);
      }
    }
  }

  debug(category: LogCategory, message: string, data?: any): void {
    this.log('DEBUG', category, message, data);
  }

  info(category: LogCategory, message: string, data?: any): void {
    this.log('INFO', category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any): void {
    this.log('WARN', category, message, data);
  }

  error(category: LogCategory, message: string, data?: any): void {
    this.log('ERROR', category, message, data);
  }

  fatal(category: LogCategory, message: string, data?: any): void {
    this.log('FATAL', category, message, data);
  }

  setLogLevel(level: LogLevel): void {
    this.currentLevel = level;
    this.info('DEV', 'Log level changed', { newLevel: level });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    this.info('DEV', 'Logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = Logger.getInstance();
export default logger;