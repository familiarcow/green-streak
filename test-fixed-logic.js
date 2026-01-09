// Test the FIXED streak logic

class FixedStreakRulesEngine {
  checkStreakContinuation(lastCompletionDate, currentDate) {
    if (!lastCompletionDate) {
      return false;
    }

    const lastDate = new Date(lastCompletionDate);
    const current = new Date(currentDate);
    
    // Reset time to compare dates only
    lastDate.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    // If same day, continue streak
    if (lastDate.getTime() === current.getTime()) {
      console.log('  Same day - streak continues');
      return true;
    }

    // If current date is before last date, invalid
    if (current < lastDate) {
      console.log('  Current date before last date - invalid');
      return false;
    }

    // Calculate the difference in days
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.floor((current.getTime() - lastDate.getTime()) / msPerDay);
    
    console.log(`  Days difference: ${daysDiff}`);

    // If it's the next day, streak continues
    if (daysDiff === 1) {
      console.log('  Next day - streak continues');
      return true;
    }
    
    // For gaps larger than 1 day, check if all intermediate days can be skipped
    if (daysDiff > 1) {
      // For this test, assume no skip days
      console.log(`  Gap of ${daysDiff} days - streak broken`);
      return false;
    }

    return false;
  }
}

const engine = new FixedStreakRulesEngine();

console.log('Testing FIXED logic:\n');

console.log('Test 1: Same day (Jan 9 to Jan 9)');
console.log('Result:', engine.checkStreakContinuation('2026-01-09', '2026-01-09'), '\n');

console.log('Test 2: Next day (Jan 8 to Jan 9) - should CONTINUE');
console.log('Result:', engine.checkStreakContinuation('2026-01-08', '2026-01-09'), '\n');

console.log('Test 3: 2 day gap (Jan 7 to Jan 9) - should BREAK');
console.log('Result:', engine.checkStreakContinuation('2026-01-07', '2026-01-09'), '\n');

console.log('Test 4: 3 day gap (Jan 6 to Jan 9) - should BREAK');
console.log('Result:', engine.checkStreakContinuation('2026-01-06', '2026-01-09'), '\n');

console.log('Test 5: Backwards date (Jan 10 to Jan 9) - should be INVALID');
console.log('Result:', engine.checkStreakContinuation('2026-01-10', '2026-01-09'), '\n');

console.log('CRITICAL TEST: Database scenario');
console.log('Last completion: Jan 6, Today: Jan 9 (3 day gap)');
console.log('Result:', engine.checkStreakContinuation('2026-01-06', '2026-01-09'));
console.log('This should return FALSE and break the streak!');