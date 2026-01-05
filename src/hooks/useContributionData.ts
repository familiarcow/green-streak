import { useMemo } from 'react';
import { useLogsStore } from '../store/logsStore';
import { ContributionData } from '../types';

/**
 * Custom hook for contribution data management
 * Provides processed contribution data and related utilities
 */
export const useContributionData = (selectedDate: string) => {
  const { contributionData, loading } = useLogsStore();

  const selectedDateData = useMemo(() => {
    return contributionData.find(d => d.date === selectedDate);
  }, [contributionData, selectedDate]);

  const hasDataForDate = useMemo(() => {
    return selectedDateData && selectedDateData.count > 0;
  }, [selectedDateData]);

  const taskCompletionsForDate = useMemo(() => {
    if (!selectedDateData || !hasDataForDate) {
      return [];
    }
    return selectedDateData.tasks;
  }, [selectedDateData, hasDataForDate]);

  const totalCompletionsForDate = useMemo(() => {
    return selectedDateData?.count || 0;
  }, [selectedDateData]);

  const contributionStats = useMemo(() => {
    const totalDays = contributionData.length;
    const activeDays = contributionData.filter(d => d.count > 0).length;
    const totalCompletions = contributionData.reduce((sum, d) => sum + d.count, 0);
    const averagePerDay = totalDays > 0 ? totalCompletions / totalDays : 0;
    const currentStreak = calculateCurrentStreak(contributionData);
    
    return {
      totalDays,
      activeDays,
      totalCompletions,
      averagePerDay: Math.round(averagePerDay * 100) / 100,
      currentStreak,
      completionRate: totalDays > 0 ? Math.round((activeDays / totalDays) * 100) : 0,
    };
  }, [contributionData]);

  return {
    contributionData,
    selectedDateData,
    hasDataForDate,
    taskCompletionsForDate,
    totalCompletionsForDate,
    contributionStats,
    loading,
  };
};

/**
 * Helper function to calculate current streak
 */
function calculateCurrentStreak(data: ContributionData[]): number {
  if (data.length === 0) return 0;
  
  // Sort data by date descending (most recent first)
  const sortedData = [...data].sort((a, b) => b.date.localeCompare(a.date));
  
  let streak = 0;
  for (const day of sortedData) {
    if (day.count > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}