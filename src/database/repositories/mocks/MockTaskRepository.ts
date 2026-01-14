import { Task } from '../../../types';
import { ITaskRepository } from '../interfaces/ITaskRepository';

/**
 * Mock Task Repository for testing
 * 
 * Provides an in-memory implementation of the task repository
 * interface for use in unit tests and development.
 */
export class MockTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();
  private idCounter = 1;

  private generateId(): string {
    return `mock-task-${this.idCounter++}`;
  }

  async getAll(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => !task.archivedAt);
  }

  async getById(id: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return (task && !task.archivedAt) ? task : null;
  }

  async getByIds(ids: string[]): Promise<Task[]> {
    return ids
      .map(id => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined && !task.archivedAt);
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'sortOrder'>): Promise<Task> {
    const allTasks = Array.from(this.tasks.values());
    const maxSortOrder = allTasks.reduce((max, t) => Math.max(max, t.sortOrder ?? 0), -1);
    const task: Task = {
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      sortOrder: maxSortOrder + 1,
      ...taskData,
    };

    this.tasks.set(task.id, task);
    return task;
  }

  async updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    for (const { id, sortOrder } of updates) {
      const task = this.tasks.get(id);
      if (task) {
        this.tasks.set(id, { ...task, sortOrder });
      }
    }
  }

  async update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const existingTask = await this.findById(id);
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: Task = { ...existingTask, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async archive(id: string): Promise<void> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task with id ${id} not found`);
    }

    const archivedTask: Task = {
      ...task,
      archivedAt: new Date().toISOString(),
    };
    
    this.tasks.set(id, archivedTask);
  }

  async delete(id: string): Promise<void> {
    if (!this.tasks.has(id)) {
      throw new Error(`Task with id ${id} not found`);
    }
    
    this.tasks.delete(id);
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  // Test utilities
  clear(): void {
    this.tasks.clear();
    this.idCounter = 1;
  }

  seed(tasks: Task[]): void {
    this.clear();
    tasks.forEach(task => this.tasks.set(task.id, task));
  }
}

export default MockTaskRepository;