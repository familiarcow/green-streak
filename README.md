# Green Streak - GitHub-style Habit Tracker

A privacy-first mobile habit tracker with beautiful contribution graph visualization, inspired by GitHub's commit calendar.

## ✨ Features

- **GitHub-style contribution graph** with adaptive scaling (5 days → weeks → months)
- **Privacy-first design** - all data stays on your device
- **Beautiful UI** inspired by US Graphics design aesthetic
- **Smart logging** with quick ticker controls for multi-completion habits
- **Development seeding** system for testing with realistic data
- **Comprehensive logging** for debugging and development

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- React Native development environment

### Installation

```bash
# Clone and install dependencies
cd green-streak
npm install

# Start development server with seeded data
npm run dev -- --tasks 5 --days 30

# Or start without seeded data
npm start
```

### Development CLI Options

The app includes a powerful development CLI for testing:

```bash
# Basic usage
npm run dev                           # Default: 5 tasks, 30 days
npm run dev -- --tasks 3 --days 7    # 3 tasks, 1 week
npm run dev -- --tasks 10 --days 90  # 10 tasks, 3 months
npm run dev -- --reset --verbose     # Clear data, verbose logging

# Options:
# --tasks <n>    Number of sample tasks (1-15)
# --days <n>     Days of historical data (1-365)
# --reset        Clear existing data first
# --seed <n>     Random seed for reproducible data
# --verbose      Enable debug logging
```

## 🏗 Architecture

### Core Components

- **ContributionGraph**: Adaptive GitHub-style calendar visualization
- **TaskRepository/LogRepository**: Local SQLite data persistence
- **DevSeed**: Realistic test data generation
- **Logger**: Structured logging with categories and levels
- **Zustand**: Lightweight state management

### File Structure

```
src/
├── components/
│   ├── ContributionGraph/     # Main graph visualization
│   ├── TaskCard/             # Individual task components
│   └── common/               # Shared UI components
├── screens/
│   ├── HomeScreen.tsx        # Main dashboard
│   ├── DailyLogScreen.tsx    # Task completion logging
│   └── TaskDetailScreen.tsx  # Individual task analytics
├── database/
│   ├── schema.ts             # SQLite table definitions
│   └── repositories/         # Data access layer
├── store/                    # Zustand state management
├── utils/
│   ├── logger.ts            # Structured logging utility
│   ├── devSeed.ts           # Test data generation
│   └── dateHelpers.ts       # Date manipulation utilities
└── theme/                   # Design system (colors, typography, spacing)
```

## 📱 Current Status

### ✅ Completed Features

- [x] Project structure and TypeScript configuration
- [x] Core dependency installation and configuration
- [x] Logger utility with categorized, leveled logging
- [x] Database schema and repository architecture
- [x] Development seeding system with realistic data patterns
- [x] Complete design system (colors, typography, spacing)
- [x] Zustand state management setup
- [x] ContributionGraph component with adaptive scaling
- [x] HomeScreen with all core UI components
- [x] Jest testing framework with utility tests
- [x] GitHub contribution-style color gradients
- [x] US Graphics inspired eggshell theme

### 🚧 In Progress

- [ ] TypeScript compilation fixes (expo-sqlite API updates)
- [ ] Basic working app demo

### 📋 Upcoming Features

- [ ] Task management screens (create, edit, archive)
- [ ] Daily logging interface with quick ticker
- [ ] Individual task analytics and history
- [ ] Push notification system
- [ ] Smooth animations throughout
- [ ] Onboarding flow
- [ ] Manual data export functionality

## 🧪 Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Generate coverage report
npm run typecheck          # TypeScript type checking
```

## 📊 Data Model

### Tasks
- Unique ID, name, description, icon, color
- Multi-completion support (1x vs 5x per day)
- Custom reminder schedules
- Archive functionality

### Logs
- Daily completion tracking per task
- Count-based (0, 1, 2, 3+)
- Efficient date-based querying
- Contribution graph data aggregation

### Development Features
- Realistic completion pattern simulation
- Configurable data volumes (1-365 days)
- Reproducible seeding with custom seeds
- Detailed logging for debugging

## 🎨 Design Philosophy

- **Privacy-first**: No cloud services, no accounts, no data tracking
- **Beautiful simplicity**: Clean US Graphics inspired aesthetic
- **Long-term motivation**: GitHub-style progress visualization
- **Realistic usage**: Support for both binary and counted habits
- **Developer-friendly**: Comprehensive logging and testing tools

## 🔧 Development Tools

The app includes extensive development and debugging tools:

- **CLI seeding**: Generate realistic test data with configurable parameters
- **Structured logging**: Categorized logs (DATA, UI, STATE, etc.) with filtering
- **TypeScript strict mode**: Catch errors early in development
- **Comprehensive testing**: Unit tests for utilities and core logic
- **Hot reloading**: Instant feedback during development

This is the foundation for a comprehensive habit tracking app that respects user privacy while providing beautiful, motivating visualizations of progress over time.