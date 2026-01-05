#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function showHelp() {
  console.log(`
Green Streak Data Seeding Utility

Usage: npm run seed [options]

Options:
  --tasks <n>      Number of sample tasks to create (default: 5)
  --days <n>       Number of days of historical data (default: 30)
  --reset          Clear all existing data before seeding
  --seed <n>       Random seed for reproducible data
  --verbose        Enable debug logging
  --help, -h       Show this help message

Examples:
  npm run seed                              # Default: 5 tasks, 30 days
  npm run seed -- --tasks 3 --days 7       # 3 tasks, 1 week
  npm run seed -- --tasks 10 --days 90     # 10 tasks, 3 months
  npm run seed -- --reset --verbose        # Clear data, debug logging
  npm run seed -- --seed 12345 --days 365  # Reproducible full year
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    tasks: 5,
    days: 30,
    reset: false,
    seed: null,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--tasks':
        if (nextArg && !isNaN(nextArg)) {
          config.tasks = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--days':
        if (nextArg && !isNaN(nextArg)) {
          config.days = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--seed':
        if (nextArg && !isNaN(nextArg)) {
          config.seed = parseInt(nextArg, 10);
          i++;
        }
        break;
      case '--reset':
        config.reset = true;
        break;
      case '--verbose':
        config.verbose = true;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
    }
  }

  return config;
}

function main() {
  const config = parseArgs();
  
  // Validate configuration
  if (config.tasks < 1 || config.tasks > 15) {
    console.error('❌ Tasks must be between 1 and 15');
    process.exit(1);
  }
  
  if (config.days < 1 || config.days > 365) {
    console.error('❌ Days must be between 1 and 365');
    process.exit(1);
  }

  // Create seed configuration file
  const configPath = path.join(__dirname, '..', 'seed-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  console.log('🌱 Seed configuration created:', config);
  console.log('📁 Config saved to:', configPath);
  console.log('🚀 Run the app to apply seeding:');
  console.log('   npm run dev');
  
  // Clean up after a delay
  setTimeout(() => {
    if (fs.existsSync(configPath)) {
      console.log('🧹 Cleaning up seed configuration file...');
      fs.unlinkSync(configPath);
    }
  }, 60000); // 60 seconds
}

if (require.main === module) {
  main();
}