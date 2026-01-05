# Green Streak Development Guide

This guide covers the development tools and workflows for the Green Streak habit tracker app.

## Quick Start

```bash
# Start development with default seeding (5 tasks, 30 days)
npm run dev

# Start with debug logging
npm run dev:verbose

# Start without seeding
npm run dev:no-seed

# Get help with all available options
npm run help
```

## Development CLI

The Green Streak development CLI provides comprehensive tools for managing your development environment.

### Basic Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with default seeding |
| `npm run dev:verbose` | Start with debug logging enabled |
| `npm run dev:clean` | Start with cleared Metro cache |
| `npm run dev:no-seed` | Start without data seeding |

### Platform-Specific Commands

| Command | Description |
|---------|-------------|
| `npm run dev:android` | Start targeting Android |
| `npm run dev:ios` | Start targeting iOS |
| `npm run dev:web` | Start targeting web |

### Advanced Development Options

The main `npm run dev` command accepts many options:

```bash
# Data seeding options
npm run dev -- --tasks 10 --days 90      # 10 tasks, 3 months of data
npm run dev -- --reset --verbose         # Reset data + debug logging
npm run dev -- --seed 12345 --days 365   # Reproducible full year data
npm run dev -- --no-seed                 # Skip seeding entirely

# Development options  
npm run dev -- --clear                   # Clear Metro bundler cache
npm run dev -- --tunnel                  # Use Expo tunnel for external access
npm run dev -- --minify                  # Enable JavaScript minification
npm run dev -- --offline                 # Work in offline mode
npm run dev -- --log-level ERROR         # Set specific log level

# Platform options
npm run dev -- --android                 # Start Android development build
npm run dev -- --ios                     # Start iOS development build
npm run dev -- --web                     # Start web development build
```

### Data Management

| Command | Description |
|---------|-------------|
| `npm run seed` | Create seed data configuration |
| `npm run db:reset` | Reset all app data (with confirmation) |

#### Seed Data Options

```bash
# Create custom seed configuration
npm run seed -- --tasks 5 --days 30      # 5 tasks, 30 days
npm run seed -- --tasks 10 --days 90     # 10 tasks, 3 months
npm run seed -- --reset --verbose        # Reset + debug mode
npm run seed -- --seed 12345             # Use specific random seed
```

#### Database Reset

```bash
# Interactive reset (asks for confirmation)
npm run db:reset

# Skip confirmation prompt
npm run db:reset -- --confirm
```

### Testing & Quality

| Command | Description |
|---------|-------------|
| `npm run test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript compiler check |

## Development Environment Configuration

### Log Levels

The app supports multiple log levels that can be set via CLI:

- **DEBUG**: Show all logs (most verbose)
- **INFO**: Show info, warnings, and errors (default)
- **WARN**: Show warnings and errors only
- **ERROR**: Show errors only

```bash
# Set specific log level
npm run dev -- --log-level DEBUG
npm run dev -- --log-level ERROR

# Verbose flag automatically sets DEBUG level
npm run dev -- --verbose
```

### Environment Variables

The CLI automatically sets these environment variables for the app:

| Variable | Description |
|----------|-------------|
| `DEV_SEED` | Whether to run data seeding (`true`/`false`) |
| `DEV_LOG_LEVEL` | Log level for the session |
| `DEV_SEED_TASKS` | Number of tasks to create |
| `DEV_SEED_DAYS` | Number of days of historical data |
| `DEV_SEED_RESET` | Whether to reset existing data |
| `DEV_SEED_RANDOM` | Random seed for reproducible data |
| `DEV_SEED_VERBOSE` | Whether to enable verbose seeding |

## Common Development Workflows

### Fresh Start Development

```bash
# Start completely fresh
npm run dev -- --reset --clear --verbose

# Or use the convenience command
npm run dev:clean
```

### Testing Data Scenarios

```bash
# Light data for quick testing
npm run dev -- --tasks 3 --days 7

# Heavy data for performance testing  
npm run dev -- --tasks 15 --days 365

# Reproducible data for debugging
npm run dev -- --seed 12345 --tasks 5 --days 30
```

### Platform-Specific Development

```bash
# Android development with fresh cache
npm run dev -- --android --clear

# iOS development with tunnel access
npm run dev -- --ios --tunnel

# Web development without seeding
npm run dev -- --web --no-seed
```

### Production-Like Testing

```bash
# Test with minification
npm run dev -- --minify --log-level ERROR

# Test offline capabilities
npm run dev -- --offline --no-seed
```

## Troubleshooting

### Common Issues

1. **Metro cache issues**: Use `--clear` flag or `npm run dev:clean`
2. **Too much logging**: Set log level to ERROR with `--log-level ERROR`
3. **Seeding errors**: Try `--reset` flag or `npm run db:reset`
4. **Platform-specific issues**: Use platform flags like `--android` or `--ios`

### Getting Help

```bash
# General CLI help
npm run help

# Specific command help
npm run dev -- --help
npm run seed -- --help
npm run db:reset -- --help
```

### Debug Information

When using `--verbose` or `--log-level DEBUG`, you'll see detailed information about:

- Database initialization
- Seed data generation
- Configuration loading
- App state changes
- Performance metrics

## File Structure

```
scripts/
├── dev.js          # Main development CLI
├── seed-data.js    # Data seeding utility
├── db-reset.js     # Database reset utility
└── help.js         # CLI help system

src/utils/
├── devConfig.ts    # Development configuration reader
├── devSeed.ts      # Development data seeding
└── logger.ts       # Logging system
```

## Best Practices

1. **Use seeded data for consistent testing**: `npm run dev -- --seed 12345`
2. **Start with clean cache when updating dependencies**: `npm run dev:clean`
3. **Use verbose logging when debugging**: `npm run dev:verbose`
4. **Test without seeding periodically**: `npm run dev:no-seed`
5. **Reset data when changing schema**: `npm run db:reset`

## Contributing

When adding new CLI features:

1. Add options to `scripts/dev.js`
2. Update environment variable handling in `devConfig.ts`
3. Document new options in this file
4. Add convenience scripts to `package.json` if needed
5. Update help text in relevant scripts

For questions or issues with the development CLI, check the help system or refer to the project documentation.