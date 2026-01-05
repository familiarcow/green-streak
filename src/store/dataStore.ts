import { create } from 'zustand';
import DataExportService, { ImportResult } from '../services/DataExportService';
import logger from '../utils/logger';

interface DataState {
  isExporting: boolean;
  isImporting: boolean;
  lastExportDate?: string;
  lastImportDate?: string;
  exportData: (onComplete?: (success: boolean, filePath?: string, error?: string) => void) => Promise<void>;
  importData: (onComplete?: (result: ImportResult) => void) => Promise<void>;
}

export const useDataStore = create<DataState>((set, get) => ({
  isExporting: false,
  isImporting: false,
  lastExportDate: undefined,
  lastImportDate: undefined,

  exportData: async (onComplete) => {
    const { isExporting, isImporting } = get();
    
    if (isExporting || isImporting) {
      logger.warn('DATA', 'Export/import already in progress');
      onComplete?.(false, undefined, 'Another operation is already in progress');
      return;
    }

    set({ isExporting: true });
    logger.info('DATA', 'Starting data export process');

    try {
      const result = await DataExportService.exportData();
      
      if (result.success) {
        set({ 
          lastExportDate: new Date().toISOString(),
          isExporting: false,
        });
        logger.info('DATA', 'Data export completed successfully');
        onComplete?.(true, result.filePath);
      } else {
        set({ isExporting: false });
        logger.error('DATA', 'Data export failed', { error: result.error });
        onComplete?.(false, undefined, result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      set({ isExporting: false });
      logger.error('DATA', 'Data export error', { error: errorMessage });
      onComplete?.(false, undefined, errorMessage);
    }
  },

  importData: async (onComplete) => {
    const { isExporting, isImporting } = get();
    
    if (isExporting || isImporting) {
      logger.warn('DATA', 'Export/import already in progress');
      onComplete?.({
        success: false,
        message: 'Another operation is already in progress',
      });
      return;
    }

    set({ isImporting: true });
    logger.info('DATA', 'Starting data import process');

    try {
      const result = await DataExportService.importData();
      
      if (result.success) {
        set({ 
          lastImportDate: new Date().toISOString(),
          isImporting: false,
        });
        logger.info('DATA', 'Data import completed successfully');
      } else {
        set({ isImporting: false });
        logger.error('DATA', 'Data import failed', { message: result.message });
      }
      
      onComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      set({ isImporting: false });
      logger.error('DATA', 'Data import error', { error: errorMessage });
      onComplete?.({
        success: false,
        message: `Import failed: ${errorMessage}`,
      });
    }
  },
}));