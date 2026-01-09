/**
 * Simple, correct streak calculator
 */

import { TaskLog } from '../types';
import logger from '../utils/logger';

/**
 * Calculate the streak as it would appear on a specific date
 * This is useful for showing historical streaks when navigating dates
 */
export function calculateStreakAsOfDate(
  logs: TaskLog[],
  targetDate: string,
  minimumCount: number = 1,
  skipWeekends: boolean = false,
  skipDays: string[] = []
): {
  streakCount: number;
  hasCompletedToday: boolean;
  isActiveStreak: boolean;
} {
  // Filter logs up to and including the target date
  const relevantLogs = logs
    .filter(log => log.date <= targetDate && log.count >= minimumCount)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (relevantLogs.length === 0) {
    return {
      streakCount: 0,
      hasCompletedToday: false,
      isActiveStreak: false
    };
  }
  
  const mostRecentCompletion = relevantLogs[0].date;
  const hasCompletedToday = mostRecentCompletion === targetDate;
  
  // If the most recent completion is after the target date, no streak
  if (mostRecentCompletion > targetDate) {
    return {
      streakCount: 0,
      hasCompletedToday: false,
      isActiveStreak: false
    };
  }
  
  // Calculate the streak counting backwards from most recent completion
  let streakCount = 1;
  
  for (let i = 1; i < relevantLogs.length; i++) {
    const prevDate = new Date(relevantLogs[i - 1].date);
    const currDate = new Date(relevantLogs[i].date);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
    
    let isConsecutive = false;
    if (daysDiff === 1) {
      isConsecutive = true;
    } else if (daysDiff > 1 && (skipWeekends || skipDays.length > 0)) {
      // Check if all intermediate days can be skipped
      isConsecutive = true;
      for (let j = 1; j < daysDiff; j++) {
        const checkDate = new Date(currDate);
        checkDate.setDate(checkDate.getDate() + j);
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayOfWeek = checkDate.getDay();
        
        const canSkip = (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) ||
                        skipDays.includes(dateStr);
        
        if (!canSkip) {
          isConsecutive = false;
          break;
        }
      }
    }
    
    if (isConsecutive) {
      streakCount++;
    } else {
      break;
    }
  }
  
  // Check if the streak is still active as of the target date
  const targetDateObj = new Date(targetDate);
  const lastCompletionDateObj = new Date(mostRecentCompletion);
  targetDateObj.setHours(0, 0, 0, 0);
  lastCompletionDateObj.setHours(0, 0, 0, 0);
  
  const daysSinceLastCompletion = Math.floor((targetDateObj.getTime() - lastCompletionDateObj.getTime()) / (24 * 60 * 60 * 1000));
  
  let isActiveStreak = true;
  
  // If more than 1 day has passed, check if any were required
  if (daysSinceLastCompletion > 1) {
    for (let i = 1; i < daysSinceLastCompletion; i++) {
      const checkDate = new Date(lastCompletionDateObj);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();
      
      const canSkip = (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) ||
                      skipDays.includes(dateStr);
      
      if (!canSkip) {
        // Required day was missed - streak is broken
        isActiveStreak = false;
        streakCount = 0;
        break;
      }
    }
  }
  
  return {
    streakCount: isActiveStreak ? streakCount : 0,
    hasCompletedToday,
    isActiveStreak
  };
}

export function calculateStreakFromLogs(
  logs: TaskLog[], 
  minimumCount: number = 1,
  skipWeekends: boolean = false,
  skipDays: string[] = [],
  today: string = new Date().toISOString().split('T')[0]
): {
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate: string | undefined;
  streakStartDate: string | undefined;
  isActive: boolean;
} {
  // Filter valid logs and sort by date descending
  const validLogs = logs
    .filter(log => log.count >= minimumCount)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (validLogs.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastCompletionDate: undefined,
      streakStartDate: undefined,
      isActive: false
    };
  }
  
  // Calculate all streaks in the history
  const streaks: number[] = [];
  let currentStreakLength = 1;
  let currentStreakStart = validLogs[0].date;
  
  for (let i = 1; i < validLogs.length; i++) {
    const prevDate = new Date(validLogs[i - 1].date);
    const currDate = new Date(validLogs[i].date);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
    
    let isConsecutive = false;
    if (daysDiff === 1) {
      isConsecutive = true;
    } else if (daysDiff > 1 && (skipWeekends || skipDays.length > 0)) {
      // Check if all intermediate days can be skipped
      isConsecutive = true;
      for (let j = 1; j < daysDiff; j++) {
        const checkDate = new Date(currDate);
        checkDate.setDate(checkDate.getDate() + j);
        const dateStr = checkDate.toISOString().split('T')[0];
        const dayOfWeek = checkDate.getDay();
        
        const canSkip = (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) ||
                        skipDays.includes(dateStr);
        
        if (!canSkip) {
          isConsecutive = false;
          break;
        }
      }
    }
    
    if (isConsecutive) {
      currentStreakLength++;
    } else {
      // Streak broken, save it and start new
      streaks.push(currentStreakLength);
      currentStreakLength = 1;
    }
    
    currentStreakStart = validLogs[i].date;
  }
  
  // Don't forget the last streak
  streaks.push(currentStreakLength);
  
  // The best streak is the maximum of all streaks
  const bestStreak = Math.max(...streaks);
  
  // Now determine if the most recent streak is still active
  const mostRecentDate = validLogs[0].date;
  const todayDate = new Date(today);
  const lastDate = new Date(mostRecentDate);
  todayDate.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  
  const daysSinceLastCompletion = Math.floor((todayDate.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
  
  let streakIsActive = true;
  let currentStreak = streaks[0]; // Most recent streak
  
  if (daysSinceLastCompletion === 0) {
    // Completed today - streak is definitely active
    streakIsActive = true;
  } else if (daysSinceLastCompletion === 1) {
    // Last completion was yesterday - still have today to continue
    streakIsActive = true;
  } else {
    // Check if any of the missed days (excluding today) were required
    for (let i = 1; i < daysSinceLastCompletion; i++) {
      const checkDate = new Date(lastDate);
      checkDate.setDate(checkDate.getDate() + i);
      const dateStr = checkDate.toISOString().split('T')[0];
      const dayOfWeek = checkDate.getDay();
      
      const canSkip = (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) ||
                      skipDays.includes(dateStr);
      
      if (!canSkip) {
        // Found a required day that was missed - streak is broken
        streakIsActive = false;
        currentStreak = 0;
        break;
      }
    }
  }
  
  logger.debug('SERVICES', 'Calculated streak from logs', {
    logsCount: logs.length,
    validLogsCount: validLogs.length,
    currentStreak,
    bestStreak,
    streakIsActive,
    daysSinceLastCompletion
  });
  
  return {
    currentStreak: streakIsActive ? currentStreak : 0,
    bestStreak,
    lastCompletionDate: mostRecentDate,
    streakStartDate: streakIsActive && currentStreak > 0 ? 
      validLogs[Math.min(currentStreak - 1, validLogs.length - 1)].date : 
      undefined,
    isActive: streakIsActive
  };
}