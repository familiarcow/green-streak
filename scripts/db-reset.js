#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function showHelp() {
  console.log(`
Green Streak Database Reset Utility

Usage: npm run db:reset [options]

Options:
  --confirm        Skip confirmation prompt
  --help, -h       Show this help message

Examples:
  npm run db:reset              # Reset with confirmation
  npm run db:reset -- --confirm # Reset without confirmation

⚠️  This will permanently delete ALL data in the app!
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    confirm: args.includes('--confirm'),
    help: args.includes('--help') || args.includes('-h'),
  };
}

async function resetDatabase() {
  return new Promise((resolve, reject) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('⚠️  This will delete ALL app data. Are you sure? (yes/no): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 'yes') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

async function main() {
  const config = parseArgs();
  
  if (config.help) {
    showHelp();
    process.exit(0);
  }

  console.log('🗄️  Green Streak Database Reset Utility');
  
  // Check if we need confirmation
  let shouldReset = config.confirm;
  
  if (!shouldReset) {
    shouldReset = await resetDatabase();
  }
  
  if (!shouldReset) {
    console.log('❌ Database reset cancelled');
    process.exit(0);
  }

  // Create a reset flag file that the app can detect
  const resetFlagPath = path.join(__dirname, '..', 'reset-flag.json');
  const resetFlag = {
    timestamp: Date.now(),
    reason: 'CLI reset command',
  };
  
  fs.writeFileSync(resetFlagPath, JSON.stringify(resetFlag, null, 2));
  
  console.log('✅ Database reset flag created');
  console.log('🚀 Start the app to complete the reset process:');
  console.log('   npm run dev -- --reset');
  
  // Clean up after a delay
  setTimeout(() => {
    if (fs.existsSync(resetFlagPath)) {
      fs.unlinkSync(resetFlagPath);
    }
  }, 30000); // 30 seconds
}

if (require.main === module) {
  main().catch(console.error);
}