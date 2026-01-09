import { TaskStreak } from '../../../types';

export interface IStreakRepository {
  getAll(): Promise<TaskStreak[]>;
  getByTaskId(taskId: string): Promise<TaskStreak | null>;
  create(streakData: Omit<TaskStreak, 'id' | 'updatedAt'>): Promise<TaskStreak>;
  update(taskId: string, updates: Partial<Omit<TaskStreak, 'id' | 'taskId' | 'updatedAt'>>): Promise<TaskStreak>;
  delete(taskId: string): Promise<void>;
  createOrUpdate(
    taskId: string, 
    currentStreak: number, 
    bestStreak: number, 
    lastCompletionDate?: string,
    streakStartDate?: string
  ): Promise<TaskStreak>;
}