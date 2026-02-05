# Green Streak

A privacy-first habit tracker for iOS that visualizes your progress with GitHub-style contribution graphs.

[![App Store](https://img.shields.io/badge/App_Store-Download-blue?style=flat&logo=apple)](https://apps.apple.com/us/app/green-streak/id6758182576)
![Platform](https://img.shields.io/badge/platform-iOS-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

<p align="center">
  <img src="assets/icon.png" alt="Green Streak" width="120" />
</p>

## About

Green Streak transforms daily habits into beautiful visual records. Watch your consistency grow as green squares fill in over time—just like a developer's contribution graph.

**Your data never leaves your device.** No accounts, no cloud sync, no tracking.

🌐 **Website**: [greenstreak.app](https://greenstreak.app)

## Features

### 📊 Contribution Graph
- GitHub-style visualization of your habit history
- Multiple time views: Live (35 days), 2 months, 4 months, 6 months, 1 year, or all time
- Filter by individual habits or view all combined
- Customizable color themes

### 🔒 Privacy First
- All data stored locally using SQLite
- No accounts or sign-up required
- No analytics or tracking
- Full data export/import with encryption

### 🏆 Achievements
- Unlock achievements as you build consistency
- Streak milestones, perfect weeks, and more
- Celebratory confetti animations
- Achievement library to track progress

### 📱 iOS Widgets
- Home screen widgets showing recent activity
- Quick-add widget for fast logging
- Dynamic app icon that updates based on your last 4 days

### ⚡ Smart Features
- Multi-completion habits (e.g., "8 glasses of water")
- Customizable reminders and notifications
- Streak tracking with detailed analytics
- Habit templates to get started quickly
- Drag-and-drop habit reordering

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript (strict mode)
- **Database**: SQLite via expo-sqlite
- **State**: Zustand
- **Animations**: React Native Reanimated
- **Architecture**: Layered (Repository → Service → Hooks → UI)

## Development

### Prerequisites

- Node.js 18+
- Expo CLI
- Xcode (for iOS development)

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run on iOS simulator
npm run dev:ios

# Type checking
npm run typecheck

# Run tests
npm test
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Expo with development tools |
| `npm run dev:ios` | Start on iOS simulator |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run test suite |
| `npm run lint` | ESLint code checking |
| `npm run build:ios` | Production build via EAS |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ContributionGraph/   # Main calendar visualization
│   ├── HomeScreen/          # Home screen components
│   └── common/              # Shared components (Icon, etc.)
├── screens/             # App screens
│   ├── HomeScreen.tsx       # Main dashboard
│   ├── DailyLogScreen.tsx   # Log completions
│   ├── SettingsScreen.tsx   # App settings
│   └── ...
├── services/            # Business logic layer
│   ├── AchievementService.ts
│   ├── StreakService.ts
│   ├── NotificationService.ts
│   └── ...
├── store/               # Zustand state stores
├── database/            # SQLite repositories
├── hooks/               # Custom React hooks
├── theme/               # Design system
└── types/               # TypeScript definitions
```

## Privacy Policy

Green Streak does not collect any personal data. All habit data is stored locally on your device and never transmitted. See our full [Privacy Policy](https://greenstreak.app/privacy.html).

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- 🌐 [Website](https://greenstreak.app)
- 📱 [App Store](https://apps.apple.com/us/app/green-streak/id6758182576)
- 📜 [Privacy Policy](https://greenstreak.app/privacy.html)
- 🐛 [Report Issues](https://github.com/familiarcow/green-streak/issues)
