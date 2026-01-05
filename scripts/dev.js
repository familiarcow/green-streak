#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    tasks: 5,
    days: 30,
    reset: false,
    seed: null,
    verbose: false,
    logLevel: 'INFO',
    platform: null,
    clear: false,
    tunnel: false,
    minify: false,
    offline: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--tasks':
        if (nextArg && !isNaN(nextArg)) {
          config.tasks = parseInt(nextArg, 10);
          i++; // Skip next argument
        }
        break;
      case '--days':
        if (nextArg && !isNaN(nextArg)) {
          config.days = parseInt(nextArg, 10);
          i++; // Skip next argument
        }
        break;
      case '--seed':
        if (nextArg && !isNaN(nextArg)) {
          config.seed = parseInt(nextArg, 10);
          i++; // Skip next argument
        }
        break;
      case '--reset':
        config.reset = true;
        break;
      case '--verbose':
        config.verbose = true;
        config.logLevel = 'DEBUG';
        break;
      case '--log-level':
        if (nextArg && ['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(nextArg.toUpperCase())) {
          config.logLevel = nextArg.toUpperCase();
          i++;
        }
        break;
      case '--android':
        config.platform = 'android';
        break;
      case '--ios':
        config.platform = 'ios';
        break;
      case '--web':
        config.platform = 'web';
        break;
      case '--clear':
      case '-c':
        config.clear = true;
        break;
      case '--tunnel':
        config.tunnel = true;
        break;
      case '--minify':
        config.minify = true;
        break;
      case '--offline':
        config.offline = true;
        break;
      case '--no-seed':
        config.tasks = 0;
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

function showHelp() {
  console.log(`
Green Streak Development CLI

Usage: npm run dev [options]

🌱 Data Seeding Options:
  --tasks <n>        Number of sample tasks to create (default: 5)
  --days <n>         Number of days of historical data (default: 30)
  --reset            Clear all existing data before seeding
  --seed <n>         Random seed for reproducible data
  --no-seed          Skip data seeding entirely

🔧 Development Options:
  --verbose          Enable debug logging (sets log level to DEBUG)
  --log-level <lvl>  Set log level: DEBUG, INFO, WARN, ERROR (default: INFO)
  --clear, -c        Clear Metro bundler cache
  --tunnel           Use Expo tunnel for external access
  --minify           Enable JavaScript minification
  --offline          Work in offline mode

📱 Platform Options:
  --android          Start Android development build
  --ios              Start iOS development build  
  --web              Start web development build

ℹ️  General:
  --help, -h         Show this help message

Examples:
  npm run dev                                    # Default: 5 tasks, 30 days
  npm run dev -- --tasks 3 --days 7            # 3 tasks, 1 week
  npm run dev -- --tasks 10 --days 90          # 10 tasks, 3 months
  npm run dev -- --reset --verbose             # Clear data, debug logging
  npm run dev -- --no-seed --android           # No seeding, Android only
  npm run dev -- --clear --log-level ERROR     # Clear cache, error logs only
  npm run dev -- --tunnel --minify             # External access, minified
  npm run dev -- --seed 12345 --days 365       # Reproducible full year data
`);
}

function createSeedConfig(config) {
  const configPath = path.join(__dirname, '..', 'seed-config.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log('🌱 Seed configuration created:', config);
  
  // Set environment variable for the app to know it should seed
  process.env.DEV_SEED = 'true';
  
  return configPath;
}

function buildExpoCommand(config) {
  const args = ['expo', 'start'];
  
  // Add platform-specific flags
  if (config.platform) {
    args.push(`--${config.platform}`);
  }
  
  // Add development flags
  if (config.clear) {
    args.push('--clear');
  }
  
  if (config.tunnel) {
    args.push('--tunnel');
  }
  
  if (config.minify) {
    args.push('--minify');
  }
  
  if (config.offline) {
    args.push('--offline');
  }
  
  return args;
}

function main() {
  const config = parseArgs();
  
  // Validate configuration
  if (config.tasks < 0 || config.tasks > 15) {
    console.error('❌ Tasks must be between 0 and 15');
    process.exit(1);
  }
  
  if (config.days < 1 || config.days > 365) {
    console.error('❌ Days must be between 1 and 365');
    process.exit(1);
  }

  // Create seed configuration file (even if no seeding for consistency)
  createSeedConfig(config);

  // Build Expo command with flags
  const expoArgs = buildExpoCommand(config);
  
  // Log what we're doing
  if (config.tasks === 0) {
    console.log('🚀 Starting Expo development server (no seeding)...');
  } else {
    console.log(`🚀 Starting Expo development server with ${config.tasks} tasks and ${config.days} days of data...`);
    if (config.reset) console.log('🔄 Will reset existing data');
    if (config.seed) console.log(`🌰 Using seed: ${config.seed}`);
    if (config.verbose) console.log('🔍 Debug logging enabled');
  }
  
  if (config.platform) {
    console.log(`📱 Platform: ${config.platform}`);
  }
  
  const expo = spawn('npx', expoArgs, {
    stdio: 'inherit',
    env: { 
      ...process.env, 
      DEV_SEED: config.tasks > 0 ? 'true' : 'false',
      DEV_LOG_LEVEL: config.logLevel,
      DEV_SEED_TASKS: config.tasks.toString(),
      DEV_SEED_DAYS: config.days.toString(),
      DEV_SEED_RESET: config.reset ? 'true' : 'false',
      DEV_SEED_RANDOM: config.seed ? config.seed.toString() : '',
      DEV_SEED_VERBOSE: config.verbose ? 'true' : 'false'
    }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development server...');
    expo.kill('SIGINT');
    
    // Clean up seed config file
    const configPath = path.join(__dirname, '..', 'seed-config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    process.exit(0);
  });

  expo.on('exit', (code) => {
    // Clean up seed config file
    const configPath = path.join(__dirname, '..', 'seed-config.json');
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    process.exit(code);
  });
}

if (require.main === module) {
  main();
}