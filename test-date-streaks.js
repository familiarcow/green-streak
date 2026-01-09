// Test date-aware streak calculation

const logs = [
  { date: '2026-01-09', count: 8 },
  { date: '2026-01-08', count: 4 },
  { date: '2026-01-07', count: 5 },
  { date: '2026-01-06', count: 4 },
  { date: '2026-01-05', count: 1 },
  { date: '2026-01-04', count: 2 }
];

function calculateStreakAsOfDate(logs, targetDate, minimumCount = 1) {
  // Filter logs up to and including the target date
  const relevantLogs = logs
    .filter(log => log.date <= targetDate && log.count >= minimumCount)
    .sort((a, b) => b.date.localeCompare(a.date));
  
  if (relevantLogs.length === 0) {
    return {
      streakCount: 0,
      hasCompletedToday: false
    };
  }
  
  const mostRecentCompletion = relevantLogs[0].date;
  const hasCompletedToday = mostRecentCompletion === targetDate;
  
  // Calculate the streak
  let streakCount = 1;
  
  for (let i = 1; i < relevantLogs.length; i++) {
    const prevDate = new Date(relevantLogs[i - 1].date);
    const currDate = new Date(relevantLogs[i].date);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysDiff === 1) {
      streakCount++;
    } else {
      break;
    }
  }
  
  // Check if streak is still active as of target date
  const targetDateObj = new Date(targetDate);
  const lastCompletionDateObj = new Date(mostRecentCompletion);
  targetDateObj.setHours(0, 0, 0, 0);
  lastCompletionDateObj.setHours(0, 0, 0, 0);
  
  const daysSinceLastCompletion = Math.floor((targetDateObj.getTime() - lastCompletionDateObj.getTime()) / (24 * 60 * 60 * 1000));
  
  // If more than 1 day has passed, streak is broken
  if (daysSinceLastCompletion > 1) {
    streakCount = 0;
  }
  
  return {
    streakCount,
    hasCompletedToday,
    daysSince: daysSinceLastCompletion
  };
}

console.log('Testing date-aware streak calculation:\n');

const testDates = [
  '2026-01-09', // Today
  '2026-01-08', // Yesterday
  '2026-01-07', // 2 days ago
  '2026-01-06', // 3 days ago
  '2026-01-05', // 4 days ago
  '2026-01-10', // Tomorrow
  '2026-01-03', // Before streak started
];

testDates.forEach(date => {
  const result = calculateStreakAsOfDate(logs, date);
  console.log(`Date: ${date}`);
  console.log(`  Streak count: ${result.streakCount}`);
  console.log(`  Has completed today: ${result.hasCompletedToday}`);
  console.log(`  Days since last: ${result.daysSince !== undefined ? result.daysSince : 'N/A'}`);
  console.log('');
});