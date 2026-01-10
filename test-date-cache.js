const {format, startOfDay} = require('date-fns');

// This simulates what the app does
function getTodayString() {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
}

// The app calls getTodayString() once on mount
const cachedToday = getTodayString();

console.log('App starts on January 9th:');
console.log('Cached "today":', cachedToday);
console.log('');

// Simulate time passing to January 10th
const jan10 = new Date('2026-01-10T00:30:00');
console.log('Now it\'s January 10th at 12:30 AM:');
console.log('New Date:', format(jan10, 'yyyy-MM-dd'));
console.log('But app still thinks today is:', cachedToday);
console.log('');

console.log('Problem: The app doesn\'t recalculate "today" when:');
console.log('1. The date changes at midnight');
console.log('2. The app returns from background after being suspended');
console.log('3. The user keeps the app open for multiple days');
