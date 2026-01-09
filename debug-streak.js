// Debug the actual streak calculation issue

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { execSync } = require('child_process');

// Find the database
const dbPath = execSync("find ~/Library -name 'green_streak.db' 2>/dev/null | head -1").toString().trim();
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

// Get logs
db.all(`
  SELECT date, count 
  FROM logs 
  WHERE task_id = '7e71bc5d-87bc-4e41-b677-cad86397c6d8' 
  ORDER BY date DESC
`, (err, logs) => {
  if (err) {
    console.error('Error fetching logs:', err);
    return;
  }
  
  console.log('\nCompletion history:');
  logs.forEach(log => console.log(`  ${log.date}: ${log.count} completions`));
  
  // Get current streak record
  db.get(`
    SELECT * FROM streaks 
    WHERE task_id = '7e71bc5d-87bc-4e41-b677-cad86397c6d8'
  `, (err, streak) => {
    if (err) {
      console.error('Error fetching streak:', err);
      return;
    }
    
    console.log('\nCurrent streak record:');
    console.log('  Current streak:', streak.current_streak);
    console.log('  Best streak:', streak.best_streak);
    console.log('  Last completion:', streak.last_completion_date);
    console.log('  Streak start:', streak.streak_start_date);
    
    // Calculate what the streak SHOULD be
    console.log('\nCalculating expected streak:');
    let expectedStreak = 1;
    for (let i = 1; i < logs.length; i++) {
      const prevDate = new Date(logs[i-1].date);
      const currDate = new Date(logs[i].date);
      const daysDiff = Math.floor((prevDate - currDate) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === 1) {
        expectedStreak++;
      } else {
        break;
      }
    }
    
    console.log('Expected streak:', expectedStreak);
    console.log('\nDISCREPANCY:', streak.current_streak, 'vs', expectedStreak);
    
    db.close();
  });
});