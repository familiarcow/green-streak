const {format, startOfDay} = require('date-fns');

// Simulate getTodayString
function getTodayString() {
  const today = startOfDay(new Date());
  return format(today, 'yyyy-MM-dd');
}

// Check what happens when we navigate back
const today = getTodayString();
const todayDate = new Date(today);
const yesterday = new Date(todayDate);
yesterday.setDate(todayDate.getDate() - 1);

console.log('Current actual time:', new Date().toString());
console.log('');
console.log('getTodayString() returns:', today);
console.log('When parsed as Date:', new Date(today).toString());
console.log('');
console.log('If you navigate back one day from', today);
console.log('You get:', format(yesterday, 'yyyy-MM-dd'));
console.log('');

// Check timezone issue with date parsing
const dateString = '2026-01-09';
const parsedDate = new Date(dateString);
console.log('Parsing "2026-01-09" as new Date():', parsedDate.toString());
console.log('Is this midnight local time?', parsedDate.getHours() === 0);
