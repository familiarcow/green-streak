// Test the validation logic

const completions = [
  { date: '2026-01-09', count: 8 },
  { date: '2026-01-08', count: 4 },
  { date: '2026-01-07', count: 5 },
  { date: '2026-01-06', count: 4 },
  { date: '2026-01-05', count: 1 },
  { date: '2026-01-04', count: 2 }
];

console.log('Completion history:');
completions.forEach(c => console.log(`  ${c.date}: ${c.count} completions`));

console.log('\nCalculating streak (working backwards from most recent):');

let currentStreak = 1;
let streakStartDate = completions[0].date;

for (let i = 1; i < completions.length; i++) {
  const prevLog = completions[i - 1];  // More recent
  const currLog = completions[i];       // Older
  
  const prevDate = new Date(prevLog.date);
  const currDate = new Date(currLog.date);
  prevDate.setHours(0, 0, 0, 0);
  currDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (24 * 60 * 60 * 1000));
  
  console.log(`  Checking ${currLog.date} to ${prevLog.date}: ${daysDiff} day(s) apart`);
  
  if (daysDiff === 1) {
    currentStreak++;
    streakStartDate = currLog.date;
    console.log(`    ✓ Consecutive - streak now ${currentStreak}`);
  } else {
    console.log(`    ✗ Not consecutive - streak stops at ${currentStreak}`);
    break;
  }
}

console.log(`\nFinal streak: ${currentStreak} days`);
console.log(`Streak started: ${streakStartDate}`);
console.log(`Last completion: ${completions[0].date}`);

// Check if streak is still active
const today = new Date('2026-01-09');
const lastDate = new Date(completions[0].date);
today.setHours(0, 0, 0, 0);
lastDate.setHours(0, 0, 0, 0);

const daysSinceLastCompletion = Math.floor((today.getTime() - lastDate.getTime()) / (24 * 60 * 60 * 1000));
console.log(`\nDays since last completion: ${daysSinceLastCompletion}`);

if (daysSinceLastCompletion === 0) {
  console.log('Last completion was today - streak is active!');
} else if (daysSinceLastCompletion === 1) {
  console.log('Last completion was yesterday - today is still available to continue');
} else {
  console.log(`Gap of ${daysSinceLastCompletion} days - need to check if any were required`);
}