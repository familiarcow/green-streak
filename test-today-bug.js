const {format, startOfDay} = require('date-fns');

// Exactly what's in dateHelpers.ts
const getToday = () => {
  return startOfDay(new Date());
};

const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

const getTodayString = () => {
  return formatDate(getToday());
};

// Test
const now = new Date();
console.log('Current system time:', now.toString());
console.log('Current system date (local):', now.toLocaleDateString());
console.log('');
console.log('What getToday() returns:', getToday().toString());
console.log('What getTodayString() returns:', getTodayString());
console.log('');
console.log('Expected: 2026-01-09 (January 9th)');
console.log('Actual:  ', getTodayString());
console.log('Match?', getTodayString() === '2026-01-09');
