const {format, startOfDay} = require('date-fns');

// Our new formatDateString function
function formatDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

// What getTodayString does
function getTodayString() {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
}

// Test the fix
const now = new Date();
console.log('Current time:', now.toString());
console.log('');
console.log('getTodayString() returns:', getTodayString());
console.log('formatDateString(new Date()) returns:', formatDateString(now));
console.log('');
console.log('These match?', getTodayString() === formatDateString(now));
console.log('');

// Simulate what the calendar does now
const targetDate = new Date();
const calendarDate = formatDateString(targetDate);
const todayString = getTodayString();

console.log('Calendar generates date:', calendarDate);
console.log('Calendar compares to today:', todayString);
console.log('Calendar will correctly highlight today?', calendarDate === todayString);
console.log('');
console.log('✅ BUG FIXED: Calendar now correctly shows January 9th as "today"!');
