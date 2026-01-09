// The ACTUAL bug in the current implementation

class BuggyStreakRulesEngine {
  checkStreakContinuation(lastCompletionDate, currentDate) {
    if (!lastCompletionDate) {
      return false;
    }

    const lastDate = new Date(lastCompletionDate);
    const current = new Date(currentDate);
    
    lastDate.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    if (lastDate.getTime() === current.getTime()) {
      return true;
    }

    // Start with day after last completion
    const dayAfterLast = new Date(lastDate);
    dayAfterLast.setDate(dayAfterLast.getDate() + 1);

    console.log(`Checking from ${dayAfterLast.toISOString().split('T')[0]} to ${current.toISOString().split('T')[0]}`);

    while (dayAfterLast <= current) {
      const dateStr = dayAfterLast.toISOString().split('T')[0];
      console.log(`  Checking ${dateStr}`);
      console.log(`    dayAfterLast (${dateStr}) < current (${currentDate})? ${dayAfterLast < current}`);
      
      // THE BUG: This checks if dayAfterLast < current
      // But we're iterating THROUGH all days between last and current
      // So this will be true for ALL days except the last one!
      if (dayAfterLast < current) {
        console.log(`    Returns FALSE (streak broken)`);
        return false;
      }

      dayAfterLast.setDate(dayAfterLast.getDate() + 1);
    }

    return true;
  }
}

console.log('Testing the ACTUAL bug:\n');
console.log('Scenario: Last completion Jan 8, checking Jan 9 (next day - should continue)');
const engine = new BuggyStreakRulesEngine();
const result = engine.checkStreakContinuation('2026-01-08', '2026-01-09');
console.log(`Result: ${result}\n`);

console.log('The bug is that when checking Jan 9:');
console.log('- We start loop at Jan 9 (day after Jan 8)');  
console.log('- First iteration: Jan 9 <= Jan 9? YES, enter loop');
console.log('- Check: Jan 9 < Jan 9? NO');
console.log('- So it returns true (correct by accident!)\n');

console.log('Now test with 2 day gap (Jan 7 to Jan 9):');
const result2 = engine.checkStreakContinuation('2026-01-07', '2026-01-09');
console.log(`Result: ${result2}\n`);

console.log('The bug shows here:');
console.log('- We start loop at Jan 8 (day after Jan 7)');
console.log('- First iteration: Jan 8 <= Jan 9? YES, enter loop');
console.log('- Check: Jan 8 < Jan 9? YES');
console.log('- Returns false (correct!)\n');

console.log('WAIT - the logic actually works! Let me re-examine...\n');

console.log('The REAL issue is the INTENT of the algorithm:');
console.log('- It checks if ANY day between last and current was missed');
console.log('- If we find a non-skip day that is before current date, we missed it');
console.log('- So dayAfterLast < current means "this day should have been completed but wasn\'t"');
console.log('\nActually... this logic is CORRECT for basic cases!');
console.log('The only issue is when dayAfterLast === current (the completion day itself)');
console.log('That should NOT break the streak.\n');

// Let's test edge case
console.log('Edge case test - completing on the exact next day:');
const result3 = engine.checkStreakContinuation('2026-01-08', '2026-01-09');
console.log(`From Jan 8 to Jan 9: ${result3} (should be true)`);

// The real issue might be elsewhere
console.log('\nThe issue might be in how we CALL this function...');
console.log('Or in the validation logic that runs on app start.');