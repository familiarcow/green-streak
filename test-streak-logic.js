// Test the streak continuation logic

class TestStreakRulesEngine {
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

    // Check each day between last completion and current
    const dayAfterLast = new Date(lastDate);
    dayAfterLast.setDate(dayAfterLast.getDate() + 1);

    console.log(`  Checking days from ${dayAfterLast.toISOString().split('T')[0]} to ${currentDate}`);

    while (dayAfterLast <= current) {
      const dateStr = dayAfterLast.toISOString().split('T')[0];
      
      // For this test, no skip days
      console.log(`    Checking ${dateStr}: dayAfterLast < current? ${dayAfterLast < current}`);
      
      // BUG: This condition is always true when we're inside the loop!
      if (dayAfterLast < current) {
        console.log(`    Streak broken at ${dateStr}`);
        return false;
      }

      dayAfterLast.setDate(dayAfterLast.getDate() + 1);
    }

    return true;
  }
}

// Test cases
const engine = new TestStreakRulesEngine();

console.log('\nTest 1: Same day completion');
console.log('Result:', engine.checkStreakContinuation('2026-01-09', '2026-01-09'));

console.log('\nTest 2: Next day completion (should continue)');
console.log('Result:', engine.checkStreakContinuation('2026-01-08', '2026-01-09'));

console.log('\nTest 3: Two days gap (should break)');
console.log('Result:', engine.checkStreakContinuation('2026-01-07', '2026-01-09'));

console.log('\nTest 4: Three days gap (should break)');
console.log('Result:', engine.checkStreakContinuation('2026-01-06', '2026-01-09'));

console.log('\n--- CORRECT LOGIC ---\n');

class CorrectStreakRulesEngine {
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

    // Calculate days between
    const daysDiff = Math.floor((current - lastDate) / (1000 * 60 * 60 * 24));
    console.log(`  Days between last and current: ${daysDiff}`);
    
    // Streak continues if it's the next day (1 day difference)
    // In real implementation, we'd check for skip days here
    if (daysDiff === 1) {
      console.log('  Next day - streak continues');
      return true;
    } else if (daysDiff > 1) {
      console.log('  Gap detected - streak broken');
      return false;
    } else {
      // Current date is before last date - shouldn't happen
      console.log('  Current date before last date - invalid');
      return false;
    }
  }
}

const correctEngine = new CorrectStreakRulesEngine();

console.log('\nTest 1: Same day completion');
console.log('Result:', correctEngine.checkStreakContinuation('2026-01-09', '2026-01-09'));

console.log('\nTest 2: Next day completion (should continue)');
console.log('Result:', correctEngine.checkStreakContinuation('2026-01-08', '2026-01-09'));

console.log('\nTest 3: Two days gap (should break)');
console.log('Result:', correctEngine.checkStreakContinuation('2026-01-07', '2026-01-09'));

console.log('\nTest 4: Three days gap (should break)');
console.log('Result:', correctEngine.checkStreakContinuation('2026-01-06', '2026-01-09'));