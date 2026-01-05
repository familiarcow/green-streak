#!/usr/bin/env node

function showHelp() {
  console.log(`
🌱 Green Streak Development CLI

A comprehensive development toolkit for the Green Streak habit tracker app.

QUICK START COMMANDS:
  npm run dev                    Start development server with default seeding
  npm run dev:verbose            Start with debug logging enabled
  npm run dev:clean              Start with cleared Metro cache
  npm run dev:android            Start targeting Android
  npm run dev:no-seed            Start without any data seeding

PLATFORM COMMANDS:
  npm run dev:android            Start development server for Android
  npm run dev:ios                Start development server for iOS  
  npm run dev:web                Start development server for web

DATA MANAGEMENT:
  npm run seed                   Create seed data configuration
  npm run db:reset               Reset all app data (with confirmation)

TESTING & QUALITY:
  npm run test                   Run test suite
  npm run test:watch             Run tests in watch mode
  npm run test:coverage          Run tests with coverage report
  npm run lint                   Run ESLint
  npm run typecheck              Run TypeScript compiler check

DETAILED HELP:
  npm run dev -- --help         Detailed dev server options
  npm run seed -- --help        Detailed seeding options
  npm run db:reset -- --help    Database reset options

ADVANCED EXAMPLES:

📱 Platform-specific development:
  npm run dev:android                          # Android development
  npm run dev:ios                              # iOS development  
  npm run dev:web                              # Web development

🌱 Custom data seeding:
  npm run dev -- --tasks 10 --days 90         # 10 tasks, 3 months data
  npm run dev -- --seed 12345 --days 365      # Reproducible full year
  npm run dev -- --reset --verbose            # Reset data + debug logs
  npm run dev -- --no-seed --clear            # No seeding + clear cache

🔧 Development utilities:
  npm run dev -- --clear --log-level ERROR    # Clear cache, errors only
  npm run dev -- --tunnel --minify            # External access + minify
  npm run dev -- --offline --verbose          # Offline mode + debug

🗄️  Database management:
  npm run db:reset                             # Interactive reset
  npm run db:reset -- --confirm               # Skip confirmation
  npm run seed -- --tasks 5 --days 30         # Create seed config

⚡ Quick workflows:
  npm run dev:clean                            # Fresh start
  npm run dev:verbose                          # Debug everything
  npm run test:watch                           # Test-driven development

For detailed options on any command, add -- --help:
  npm run dev -- --help
  npm run seed -- --help
  npm run db:reset -- --help

Need more help? Check the documentation or use these resources:
- Project README.md
- Expo documentation: https://docs.expo.dev
- React Native docs: https://reactnative.dev
`);
}

if (require.main === module) {
  showHelp();
}

module.exports = { showHelp };