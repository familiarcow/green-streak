#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Green Streak Testing Suite\n');

const commands = {
  'test': 'Run all tests',
  'test:watch': 'Run tests in watch mode',
  'test:coverage': 'Run tests with coverage report',
  'test:unit': 'Run unit tests only', 
  'test:components': 'Run component tests only',
  'test:e2e': 'Run end-to-end tests only',
};

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
  console.log('Available test commands:\n');
  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  npm run ${cmd.padEnd(15)} - ${desc}`);
  });
  console.log('\nExamples:');
  console.log('  npm run test                    # Run all tests');
  console.log('  npm run test:coverage           # Run tests with coverage');
  console.log('  npm run test:watch              # Run tests in watch mode');
  console.log('  npm test -- --testNamePattern="Button"  # Run specific tests');
  process.exit(0);
}

const command = args[0];

try {
  switch (command) {
    case 'unit':
      console.log('Running unit tests...\n');
      execSync('npm test -- --testPathPatterns="utils|store" --no-coverage', { stdio: 'inherit' });
      break;
      
    case 'components': 
      console.log('Running component tests...\n');
      execSync('npm test -- --testPathPatterns="components|screens" --no-coverage', { stdio: 'inherit' });
      break;
      
    case 'e2e':
      console.log('Running E2E tests...\n');
      execSync('npm test -- --testPathPatterns="e2e" --no-coverage', { stdio: 'inherit' });
      break;
      
    default:
      console.log(`Unknown command: ${command}`);
      console.log('Run "node scripts/test.js help" for available commands');
      process.exit(1);
  }
} catch (error) {
  console.error('Test execution failed:', error.message);
  process.exit(1);
}