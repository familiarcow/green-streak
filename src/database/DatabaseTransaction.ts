/**
 * Database Transaction Support
 * 
 * Provides atomic transaction capabilities for multi-entity operations
 * to ensure data consistency across related database operations.
 */

import { getDatabase } from './index';
import logger from '../utils/logger';

export class DatabaseTransaction {
  private database: any;
  private transactionActive: boolean = false;

  constructor() {
    this.database = getDatabase();
  }

  /**
   * Execute a function within a database transaction
   */
  async executeInTransaction<T>(
    operation: (tx: DatabaseTransaction) => Promise<T>
  ): Promise<T> {
    try {
      await this.begin();
      const result = await operation(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  /**
   * Begin a new transaction
   */
  private async begin(): Promise<void> {
    try {
      await this.database.execAsync('BEGIN TRANSACTION');
      this.transactionActive = true;
      logger.debug('DATA', 'Transaction started');
    } catch (error) {
      logger.error('DATA', 'Failed to begin transaction', { error });
      throw error;
    }
  }

  /**
   * Commit the current transaction
   */
  private async commit(): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction to commit');
    }

    try {
      await this.database.execAsync('COMMIT');
      this.transactionActive = false;
      logger.debug('DATA', 'Transaction committed');
    } catch (error) {
      logger.error('DATA', 'Failed to commit transaction', { error });
      throw error;
    }
  }

  /**
   * Rollback the current transaction
   */
  private async rollback(): Promise<void> {
    if (!this.transactionActive) {
      return; // No transaction to rollback
    }

    try {
      await this.database.execAsync('ROLLBACK');
      this.transactionActive = false;
      logger.debug('DATA', 'Transaction rolled back');
    } catch (error) {
      logger.error('DATA', 'Failed to rollback transaction', { error });
      // Don't throw here as we're already in error handling
    }
  }

  /**
   * Execute a SQL statement within the transaction
   */
  async runAsync(sql: string, ...params: any[]): Promise<void> {
    if (!this.transactionActive) {
      throw new Error('No active transaction');
    }

    try {
      await this.database.runAsync(sql, ...params);
    } catch (error) {
      logger.error('DATA', 'Failed to execute SQL in transaction', { error, sql });
      throw error;
    }
  }

  /**
   * Get a single row within the transaction
   */
  async getFirstAsync(sql: string, ...params: any[]): Promise<any> {
    if (!this.transactionActive) {
      throw new Error('No active transaction');
    }

    try {
      return await this.database.getFirstAsync(sql, ...params);
    } catch (error) {
      logger.error('DATA', 'Failed to get row in transaction', { error, sql });
      throw error;
    }
  }

  /**
   * Get all rows within the transaction
   */
  async getAllAsync(sql: string, ...params: any[]): Promise<any[]> {
    if (!this.transactionActive) {
      throw new Error('No active transaction');
    }

    try {
      return await this.database.getAllAsync(sql, ...params);
    } catch (error) {
      logger.error('DATA', 'Failed to get rows in transaction', { error, sql });
      throw error;
    }
  }
}

/**
 * Factory function to create a new transaction
 */
export const createTransaction = (): DatabaseTransaction => {
  return new DatabaseTransaction();
};

/**
 * Helper function to execute an operation in a transaction
 */
export const withTransaction = async <T>(
  operation: (tx: DatabaseTransaction) => Promise<T>
): Promise<T> => {
  const transaction = new DatabaseTransaction();
  return transaction.executeInTransaction(operation);
};