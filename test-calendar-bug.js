const {startOfDay, format} = require('date-fns');

// What getTodayString does (LOCAL timezone)
function getTodayString() {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
}

// What LiveCalendar does (UTC conversion)
function getCalendarDate() {
  const targetDate = new Date();
  return targetDate.toISOString().split('T')[0];
}

const now = new Date();
console.log('Current time:', now.toString());
console.log('');
console.log('getTodayString() returns:', getTodayString(), '(Local date - CORRECT)');
console.log('Calendar generates date:', getCalendarDate(), '(UTC date - WRONG after 7 PM EST)');
console.log('');
console.log('Calendar thinks "today" is:', getTodayString());
console.log('But calendar is generating dates like:', getCalendarDate());
console.log('');
console.log('These match?', getTodayString() === getCalendarDate());
console.log('');
console.log('Result: After 7 PM EST, the calendar will highlight YESTERDAY as "today"');
console.log('because it generates tomorrow\'s date (UTC) but compares against today\'s date (local)');
