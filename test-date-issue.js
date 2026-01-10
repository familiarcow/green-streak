const {startOfDay, format} = require('date-fns');

// Simulating what getTodayString() does
function getTodayString() {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
}

console.log('Current local time:', new Date().toString());
console.log('Current UTC time:', new Date().toUTCString());
console.log('');
console.log('getTodayString() result:', getTodayString());
console.log('Direct ISO split:', new Date().toISOString().split('T')[0]);
console.log('');
console.log('Are they equal?', getTodayString() === new Date().toISOString().split('T')[0]);
