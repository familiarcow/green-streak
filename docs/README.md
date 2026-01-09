# Green Streak - GitHub-style Habit Tracker

*Created: January 3, 2026*  
*Last Modified: January 3, 2026*

## Overview

Green Streak is a privacy-first mobile habit tracker that transforms your daily progress into beautiful GitHub-style contribution graphs. Built with React Native and TypeScript, it provides an intuitive way to visualize habit formation and maintain motivation through visual progress tracking.

### Key Principles

- **Privacy-First**: All data remains on your device - no cloud storage, no accounts, no tracking
- **Beautiful Visualization**: GitHub-inspired contribution graphs that make progress tangible
- **Developer-Friendly**: Comprehensive tooling, logging, and testing infrastructure
- **Long-term Motivation**: Visual streaks encourage consistency over time
- **Realistic Usage**: Supports both binary (done/not done) and multi-completion habits

## Features

### Core Functionality
- **GitHub-style Contribution Graph**: Adaptive visualization (5 days → weeks → months → year)
- **Habit Management**: Create, edit, and archive habits with customization options
- **Daily Logging**: Quick ticker-style interface for logging completions
- **Multi-completion Support**: Track habits that can be done multiple times per day
- **Local Data Storage**: Privacy-focused SQLite database storage

### User Experience
- **Adaptive UI**: Responsive design that scales across device sizes
- **Quick Actions**: Fast logging with intuitive touch interactions
- **Progress Analytics**: View completion patterns and streaks over time
- **Customization**: Personal colors, icons, and descriptions for each habit

### Developer Features
- **Development Seeding**: Generate realistic test data with configurable parameters
- **Comprehensive Logging**: Structured logging with categories and filtering
- **Testing Infrastructure**: Jest setup with utility and component coverage
- **TypeScript Strict Mode**: Type safety throughout the application
- **Hot Reloading**: Instant development feedback

## Technology Stack

### Frontend
- **React Native 0.81.5**: Cross-platform mobile development
- **TypeScript 5.9.2**: Type safety and developer experience
- **Expo 54**: Development platform and deployment tooling
- **React 19.1.0**: Latest React features and performance improvements

### State Management
- **Zustand 5.0.9**: Lightweight, performant state management
- **Custom Repository Pattern**: Clean separation between data access and UI

### Data & Storage
- **expo-sqlite 16.0.10**: Local SQLite database for privacy
- **Custom Schema Design**: Optimized for habit tracking use cases
- **Migration System**: Future-proof database evolution

### Development Tools
- **Jest 30.2.0**: Testing framework with extensive mocking
- **ts-jest 29.4.6**: TypeScript integration for tests
- **Babel**: JavaScript transformation and optimization
- **Custom CLI**: Development seeding and configuration

### Design System
- **US Graphics Inspired**: Clean, minimalist aesthetic
- **Custom Theme System**: Consistent colors, typography, and spacing
- **Responsive Components**: Adaptive to different screen sizes

## Project Structure

```
green-streak/
├── docs/                    # Comprehensive documentation
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ContributionGraph/   # Main visualization component
│   │   ├── TaskCard/           # Individual task components
│   │   └── common/             # Shared UI primitives
│   ├── screens/             # App screens and navigation
│   │   ├── HomeScreen.tsx      # Main dashboard
│   │   ├── DailyLogScreen.tsx  # Task completion interface
│   │   └── EditTaskModal.tsx   # Task creation/editing
│   ├── database/            # Data persistence layer
│   │   ├── repositories/       # Data access objects
│   │   ├── schema.ts          # Database structure
│   │   └── migrations/        # Schema evolution
│   ├── store/               # State management
│   │   ├── tasksStore.ts      # Task-related state
│   │   └── logsStore.ts       # Completion data state
│   ├── utils/               # Utility functions
│   │   ├── logger.ts          # Structured logging system
│   │   ├── devSeed.ts         # Development data generation
│   │   └── dateHelpers.ts     # Date manipulation utilities
│   ├── theme/               # Design system
│   │   ├── colors.ts          # Color palette and semantic colors
│   │   ├── typography.ts      # Text styles and hierarchy
│   │   └── spacing.ts         # Layout spacing and dimensions
│   └── types/               # TypeScript type definitions
├── tests/                   # Test suites and utilities
├── scripts/                 # Development and build scripts
└── assets/                  # Static assets and icons
```

## Quick Start

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn package manager
- Expo CLI installed globally
- React Native development environment

### Installation

```bash
# Clone the repository
cd green-streak

# Install dependencies
npm install

# Start with development data
npm run dev -- --tasks 5 --days 30

# Or start without seeded data
npm start
```

### Development Commands

```bash
# Development with realistic data
npm run dev                    # 5 tasks, 30 days (default)
npm run dev -- --tasks 10 --days 90   # Custom configuration
npm run dev -- --reset --verbose      # Clear data, debug logging

# Testing
npm test                       # Run all tests
npm run test:watch            # Watch mode for development
npm run test:coverage         # Generate coverage report

# Type checking and linting
npm run typecheck             # TypeScript validation
npm run lint                  # ESLint analysis

# Platform-specific development
npm run ios                   # iOS simulator
npm run android              # Android emulator
npm run web                  # Web browser (limited functionality)
```

## Documentation Index

- **[Architecture Guide](./architecture.md)**: Technical architecture and design decisions
- **[API Reference](./api.md)**: Component props, store methods, and utility functions
- **[Development Guide](./development.md)**: Setup, tooling, and contribution guidelines
- **[Testing Guide](./testing.md)**: Testing strategies and running test suites
- **[Deployment Guide](./deployment.md)**: Building and distributing the app
- **[Implementation Status](./status.md)**: Feature completion and known issues
- **[Roadmap](./roadmap.md)**: Planned features and future development

## Key Concepts

### Habit Tracking Philosophy
Green Streak focuses on consistency over perfection. The GitHub-style visualization makes it easy to see patterns and maintain motivation without being overwhelming.

### Privacy-First Design
All data remains on the user's device. There are no analytics, no cloud sync, and no data collection. Users maintain complete control over their habit tracking data.

### Developer Experience
The app includes extensive development tooling to make debugging, testing, and extending functionality straightforward for developers of all experience levels.

## Support and Contribution

This is an open-source project designed to be educational and extensible. The codebase includes comprehensive documentation, testing, and tooling to support learning and contribution.

### Getting Help
- Review the documentation in `/docs/`
- Check the implementation status in `/docs/status.md`
- Examine the test files for usage examples
- Use the development CLI for realistic test data

### Contributing
- Follow the development setup guide in `/docs/development.md`
- Run tests with `npm test` before submitting changes
- Maintain TypeScript strict mode compliance
- Add tests for new functionality

---

Green Streak represents a complete implementation of a privacy-focused habit tracker with production-quality code organization, testing, and documentation. It serves as both a functional application and a reference for React Native development best practices.