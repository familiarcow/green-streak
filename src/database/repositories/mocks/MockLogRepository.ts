import { TaskLog, ContributionData } from '../../../types';
import { ILogRepository } from '../interfaces/ILogRepository';

/**
 * Mock Log Repository for testing
 * 
 * Provides an in-memory implementation of the log repository
 * interface for use in unit tests and development.
 */
export class MockLogRepository implements ILogRepository {
  private logs: Map<string, TaskLog> = new Map();
  private idCounter = 1;

  private generateId(): string {
    return `mock-log-${this.idCounter++}`;
  }

  private generateKey(taskId: string, date: string): string {
    return `${taskId}:${date}`;
  }

  async getAll(): Promise<TaskLog[]> {
    return Array.from(this.logs.values()).sort((a, b) => b.date.localeCompare(a.date));
  }

  async getByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null> {
    return this.findByTaskAndDate(taskId, date);
  }

  async create(logData: { taskId: string; date: string; count: number }): Promise<TaskLog> {
    return this.createOrUpdate(logData.taskId, logData.date, logData.count);
  }

  async createOrUpdate(taskId: string, date: string, count: number): Promise<TaskLog> {
    const key = this.generateKey(taskId, date);
    const existingLog = this.logs.get(key);

    const log: TaskLog = {
      id: existingLog?.id || this.generateId(),
      taskId,
      date,
      count,
      updatedAt: new Date().toISOString(),
    };

    this.logs.set(key, log);
    return log;
  }

  async findByTask(taskId: string): Promise<TaskLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.taskId === taskId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async findByDateRange(startDate: string, endDate: string): Promise<TaskLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.date >= startDate && log.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async findByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null> {
    const key = this.generateKey(taskId, date);
    return this.logs.get(key) || null;
  }

  async getContributionData(dates: string[]): Promise<ContributionData[]> {
    // Group logs by date
    const logsByDate = new Map<string, TaskLog[]>();
    
    // Initialize all dates
    dates.forEach(date => logsByDate.set(date, []));
    
    // Populate with actual logs
    Array.from(this.logs.values())
      .filter(log => dates.includes(log.date) && log.count > 0)
      .forEach(log => {
        const dateLogs = logsByDate.get(log.date) || [];
        dateLogs.push(log);
        logsByDate.set(log.date, dateLogs);
      });

    // Convert to ContributionData format
    const contributionData: ContributionData[] = dates.map(date => {
      const dateLogs = logsByDate.get(date) || [];
      const totalCount = dateLogs.reduce((sum, log) => sum + log.count, 0);
      
      return {
        date,
        count: totalCount,
        tasks: dateLogs.map(log => ({
          taskId: log.taskId,
          name: `Mock Task ${log.taskId}`, // Mock name
          count: log.count,
          color: '#00aa00', // Mock color
        })),
      };
    });

    return contributionData.sort((a, b) => a.date.localeCompare(b.date));
  }

  async deleteByTask(taskId: string): Promise<void> {
    const keysToDelete = Array.from(this.logs.keys())
      .filter(key => key.startsWith(`${taskId}:`));
    
    keysToDelete.forEach(key => this.logs.delete(key));
  }

  // Test utilities
  clear(): void {
    this.logs.clear();
    this.idCounter = 1;
  }

  seed(logs: TaskLog[]): void {
    this.clear();
    logs.forEach(log => {
      const key = this.generateKey(log.taskId, log.date);
      this.logs.set(key, log);
    });
  }

  getLogCount(): number {
    return this.logs.size;
  }
}

export default MockLogRepository;