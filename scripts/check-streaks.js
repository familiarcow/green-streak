#!/usr/bin/env node

const SQLite = require('expo-sqlite/legacy');

async function checkStreaksData() {
  console.log('=== Checking Streaks Database ===\n');
  
  try {
    const db = SQLite.openDatabase('green_streak.db');
    
    // Check tasks table columns
    await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          "PRAGMA table_info(tasks)",
          [],
          (_, result) => {
            console.log('Tasks table columns:');
            for (let i = 0; i < result.rows.length; i++) {
              const col = result.rows.item(i);
              if (col.name.includes('streak')) {
                console.log(`  - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
              }
            }
            console.log('');
            resolve();
          },
          (_, error) => reject(error)
        );
      });
    });
    
    // Check streaks table
    await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          "SELECT COUNT(*) as count FROM streaks",
          [],
          (_, result) => {
            console.log(`Streaks table has ${result.rows.item(0).count} records\n`);
            resolve();
          },
          (_, error) => {
            console.log('Streaks table does not exist or error:', error.message);
            resolve();
          }
        );
      });
    });
    
    // Check tasks with streak settings
    await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT id, name, streak_enabled, streak_skip_weekends, streak_skip_days, streak_minimum_count 
           FROM tasks WHERE archived_at IS NULL LIMIT 5`,
          [],
          (_, result) => {
            console.log('Sample tasks with streak settings:');
            for (let i = 0; i < result.rows.length; i++) {
              const task = result.rows.item(i);
              console.log(`Task: ${task.name}`);
              console.log(`  - ID: ${task.id}`);
              console.log(`  - Streak Enabled: ${task.streak_enabled}`);
              console.log(`  - Skip Weekends: ${task.streak_skip_weekends}`);
              console.log(`  - Skip Days: ${task.streak_skip_days}`);
              console.log(`  - Minimum Count: ${task.streak_minimum_count}`);
              console.log('');
            }
            resolve();
          },
          (_, error) => reject(error)
        );
      });
    });
    
    // Check if any streaks exist for tasks
    await new Promise((resolve, reject) => {
      db.transaction(tx => {
        tx.executeSql(
          `SELECT s.*, t.name 
           FROM streaks s 
           JOIN tasks t ON s.task_id = t.id 
           LIMIT 5`,
          [],
          (_, result) => {
            if (result.rows.length > 0) {
              console.log('Sample streak records:');
              for (let i = 0; i < result.rows.length; i++) {
                const streak = result.rows.item(i);
                console.log(`Task: ${streak.name}`);
                console.log(`  - Current Streak: ${streak.current_streak}`);
                console.log(`  - Best Streak: ${streak.best_streak}`);
                console.log(`  - Last Completion: ${streak.last_completion_date}`);
                console.log('');
              }
            } else {
              console.log('No streak records found in database');
            }
            resolve();
          },
          (_, error) => reject(error)
        );
      });
    });
    
    console.log('\n=== Check Complete ===');
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkStreaksData();