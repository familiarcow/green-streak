import { SeedConfig, Task } from '../types';
import TaskRepository from '../database/repositories/TaskRepository';
import LogRepository from '../database/repositories/LogRepository';
import { SAMPLE_TASK_NAMES, SAMPLE_TASK_ICONS, COLOR_PALETTE, DROP_TABLES, CREATE_TABLES } from '../database/schema';
import { formatDate, getToday, subDays } from './dateHelpers';
import logger from './logger';
import { getDatabase } from '../database';

class DevSeedUtility {
  private rng: () => number;

  constructor(seed?: number) {
    if (seed) {
      this.rng = this.seedRandom(seed);
    } else {
      this.rng = Math.random;
    }
  }

  private seedRandom(seed: number): () => number {
    let m = 0x80000000; // 2**31;
    let a = 1103515245;
    let c = 12345;
    let state = seed;
    
    return function() {
      state = (a * state + c) % m;
      return state / (m - 1);
    };
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(this.rng() * array.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(this.rng() * (max - min + 1)) + min;
  }

  private generateRandomTasks(count: number): Omit<Task, 'id' | 'createdAt' | 'sortOrder'>[] {
    const tasks: Omit<Task, 'id' | 'createdAt' | 'sortOrder'>[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
      let name: string;
      do {
        name = this.randomChoice(SAMPLE_TASK_NAMES);
      } while (usedNames.has(name) && usedNames.size < SAMPLE_TASK_NAMES.length);
      
      usedNames.add(name);
      
      const isMultiCompletion = this.rng() > 0.7; // 30% chance of multi-completion
      const hasDescription = this.rng() > 0.6; // 40% chance of description
      const hasReminder = this.rng() > 0.8; // 20% chance of reminder

      tasks.push({
        name,
        description: hasDescription ? `Daily ${name.toLowerCase()} practice` : undefined,
        icon: SAMPLE_TASK_ICONS[SAMPLE_TASK_NAMES.indexOf(name)],
        color: this.randomChoice(COLOR_PALETTE),
        isMultiCompletion,
        reminderEnabled: hasReminder,
        reminderTime: hasReminder ? `${this.randomInt(7, 22)}:00` : undefined,
        reminderFrequency: hasReminder ? 'daily' : undefined,
      });
    }

    return tasks;
  }

  private generateRealisticCompletionData(
    tasks: Task[], 
    dayCount: number
  ): Array<{ taskId: string; date: string; count: number }> {
    const logs: Array<{ taskId: string; date: string; count: number }> = [];
    const today = getToday();

    for (let dayOffset = 0; dayOffset < dayCount; dayOffset++) {
      const date = formatDate(subDays(today, dayOffset));
      
      // Recent days have higher completion probability
      const recencyBonus = Math.max(0, 1 - dayOffset / dayCount);
      const baseCompletionRate = 0.3 + (recencyBonus * 0.4); // 30-70% base rate

      tasks.forEach((task) => {
        // Each task has its own "habit strength" that varies over time
        const taskConsistency = 0.5 + this.rng() * 0.3; // 50-80% personal consistency
        const dailyMotivation = 0.7 + this.rng() * 0.6; // Daily variation 70-130%
        
        const completionProbability = baseCompletionRate * taskConsistency * dailyMotivation;
        
        if (this.rng() < completionProbability) {
          let count: number;
          
          if (task.isMultiCompletion) {
            // Multi-completion tasks: weighted toward 1-3, occasionally higher
            const roll = this.rng();
            if (roll < 0.6) count = 1;
            else if (roll < 0.85) count = 2;
            else if (roll < 0.95) count = 3;
            else count = this.randomInt(4, 8);
          } else {
            count = 1;
          }

          logs.push({
            taskId: task.id,
            date,
            count,
          });
        }
      });
    }

    return logs;
  }

  async clearAllData(): Promise<void> {
    const db = getDatabase();
    
    try {
      await db.execAsync(DROP_TABLES);
      logger.info('DEV', 'All data cleared');
      
      // Recreate tables
      await db.execAsync(CREATE_TABLES);
      logger.info('DEV', 'Tables recreated');
    } catch (error: any) {
      logger.error('DEV', 'Failed to clear and recreate data', { error: error.message });
      throw error;
    }
  }

  async seed(config: SeedConfig): Promise<void> {
    logger.info('DEV', 'Starting development seed', config);

    try {
      if (config.reset) {
        await this.clearAllData();
      }

      if (config.verbose) {
        logger.setLogLevel('DEBUG');
      }

      // Generate and create tasks
      const taskData = this.generateRandomTasks(config.tasks);
      const createdTasks: Task[] = [];

      for (const data of taskData) {
        const task = await TaskRepository.create(data);
        createdTasks.push(task);
      }

      logger.info('DEV', 'Tasks created', { count: createdTasks.length });

      // Generate completion data
      const completionData = this.generateRealisticCompletionData(createdTasks, config.days);
      
      // Create logs
      for (const log of completionData) {
        await LogRepository.createOrUpdate(log.taskId, log.date, log.count);
      }

      logger.info('DEV', 'Seed completed successfully', {
        tasks: createdTasks.length,
        days: config.days,
        logs: completionData.length,
        averageLogsPerDay: Math.round(completionData.length / config.days * 10) / 10,
      });

    } catch (error) {
      logger.error('DEV', 'Seeding failed', { error, config });
      throw error;
    }
  }
}

export const runSeed = async (config: SeedConfig): Promise<void> => {
  const seeder = new DevSeedUtility(config.seed);
  await seeder.seed(config);
};

export default DevSeedUtility;