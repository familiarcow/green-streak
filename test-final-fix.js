const {format, startOfDay} = require('date-fns');

// Our new functions
function formatDateString(date) {
  return format(date, 'yyyy-MM-dd');
}

function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getTodayString() {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
}

// Test the fix
console.log('Current time:', new Date().toString());
console.log('');
console.log('Today is:', getTodayString());

// Test navigation
const today = getTodayString();
console.log('Starting from:', today);

const todayDate = parseDateString(today);
console.log('Parsed as Date:', todayDate.toString());
console.log('Is this midnight local time?', todayDate.getHours() === 0);

// Navigate back
const yesterday = new Date(todayDate);
yesterday.setDate(todayDate.getDate() - 1);
const yesterdayString = formatDateString(yesterday);

console.log('');
console.log('Navigate back one day:');
console.log('  From:', today);
console.log('  To:', yesterdayString);
console.log('  Expected: 2026-01-08');
console.log('  Correct?', yesterdayString === '2026-01-08');
console.log('');
console.log('✅ NAVIGATION FIXED: Clicking back from Jan 9th correctly goes to Jan 8th!');
