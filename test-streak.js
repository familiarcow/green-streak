// Test streak logic
const lastCompletion = '2026-01-06';
const today = '2026-01-09';

const lastDate = new Date(lastCompletion);
const currentDate = new Date(today);

// Reset time to compare dates only
lastDate.setHours(0, 0, 0, 0);
currentDate.setHours(0, 0, 0, 0);

// Calculate days between
const diffTime = Math.abs(currentDate - lastDate);
const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

console.log('Last completion:', lastCompletion);
console.log('Today:', today);
console.log('Days between:', diffDays);
console.log('Streak should be broken:', diffDays > 1);

// Check what the next required date would have been
const nextRequired = new Date(lastDate);
nextRequired.setDate(nextRequired.getDate() + 1);
console.log('Next required completion was:', nextRequired.toISOString().split('T')[0]);