# App Store Submission Checklist

**Green Streak - iOS App Store Submission Guide**

## Pre-Submission Requirements

### Apple Developer Account
- [ ] Active Apple Developer Program membership ($99/year)
- [ ] Developer Team ID: `974SWJKYUP` (already configured)

### App Store Connect Setup
- [ ] Create new app in App Store Connect
  - App name: **Green Streak**
  - Bundle ID: `com.greenstreak.app`
  - SKU: `greenstreak-ios-001`
  - Primary language: English (U.S.)

### EAS Setup
```bash
# Install EAS CLI (if not already installed)
npm install -g @expo/eas-cli

# Login to your Expo account
eas login

# Verify project configuration
eas build:configure
```

### Complete eas.json Credentials
Edit `eas.json` and fill in:
- `appleId`: Your Apple ID email
- `ascAppId`: App Store Connect App ID (found after creating app in ASC)

---

## Code Quality Checks

Run all checks before submission:

```bash
# TypeScript validation
npm run typecheck

# Run tests
npm test

# Lint code
npm run lint
```

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] No lint errors
- [ ] No `console.log` statements in production code

---

## App Configuration Verification

### Bundle Identifiers (Completed)
- [x] Main app: `com.greenstreak.app`
- [x] Widget: `com.greenstreak.app.GreenStreakWidgets`
- [x] App Group: `group.com.greenstreak.shared`

### Version Numbers
```bash
# Check current versions
npm run version
```

- [ ] Version synced across package.json, app.json, Info.plist

### App Name
- [x] Display name: "Green Streak"

---

## Required Assets

### App Icon
- [x] 1024x1024 App Store icon (`assets/icon.png`)
- [x] Dynamic icons configured (16 variants)

### Screenshots (Required for App Store)
Prepare screenshots for these device sizes:

**iPhone Screenshots (Required)**
- [ ] 6.7" display (iPhone 14 Pro Max) - 1290 x 2796 px
- [ ] 6.5" display (iPhone 11 Pro Max) - 1242 x 2688 px
- [ ] 5.5" display (iPhone 8 Plus) - 1242 x 2208 px

**iPad Screenshots (If supporting tablet)**
- [ ] 12.9" display - 2048 x 2732 px
- [ ] 11" display - 1668 x 2388 px

**Screenshot Content Suggestions:**
1. Main habit grid with contribution graph
2. Adding a new habit
3. Habit details/editing
4. Widget on home screen
5. Settings/customization

---

## App Store Listing Content

### App Information

**App Name:** Green Streak

**Subtitle:** GitHub-style Habit Tracker

**Category:** Health & Fitness (Primary), Productivity (Secondary)

**Description:**
```
Transform your daily habits into beautiful GitHub-style contribution graphs.

Green Streak is a privacy-first habit tracker that visualizes your progress like a developer's contribution graph. Watch your habits grow as green squares fill in, motivating you to maintain your streaks.

KEY FEATURES

Visual Progress Tracking
See your habits as contribution graphs, just like on GitHub. Each completion adds to your streak, creating a satisfying visual record of your consistency.

Privacy-First Design
Your data never leaves your device. No accounts, no cloud sync, no tracking - just you and your habits.

Multiple Habits
Track as many habits as you want. Customize each with different colors and icons to match your goals.

Home Screen Widgets
Quick-view widgets let you see your progress and log completions without opening the app.

Multi-Completion Support
Some habits need multiple daily completions. Track water glasses, medications, or any habit that happens more than once a day.

Beautiful, Minimal Design
A clean interface inspired by modern design principles keeps you focused on what matters - building better habits.

Your data is stored locally using SQLite. We never see it, we never sell it, we never track it.
```

**Keywords:**
```
habit,tracker,github,contribution,graph,streak,daily,routine,progress,motivation,privacy,local,widget
```

**Support URL:** [Your support page or GitHub repo]

**Privacy Policy URL:** [Host PRIVACY_POLICY.md and provide URL]

### Age Rating
- [ ] Rating: 4+ (no objectionable content)

### App Review Information

**Review Notes:**
```
This app stores all data locally on the device using SQLite. No network requests are made and no data is collected.

The app includes iOS widgets that display habit progress. Widget data is shared between the app and widgets using App Groups.

To test the app:
1. Create a new habit using the + button
2. Tap on a habit to log completions
3. View the contribution graph showing your progress
4. Add the widget to your home screen for quick access

No account or login is required.
```

---

## Build & Submit

### Build for App Store

```bash
# Ensure everything is ready
npm run prebuild

# Build production iOS app
npm run build:ios
# OR
eas build --platform ios --profile production
```

### Submit to App Store

```bash
# Submit the build
npm run submit:ios
# OR
eas submit --platform ios
```

### TestFlight (Recommended First)

Before public release, test via TestFlight:
1. Build completes in EAS
2. Build automatically uploads to App Store Connect
3. Add internal testers in TestFlight
4. Test thoroughly on multiple devices

---

## Post-Submission

### Monitor Status
- Check App Store Connect for review status
- Typical review time: 24-48 hours

### Common Rejection Reasons to Avoid
- [ ] App crashes or has major bugs
- [ ] Missing privacy policy
- [ ] Misleading screenshots or description
- [ ] Placeholder content
- [ ] Broken features

### After Approval
- [ ] Set release date (immediate or scheduled)
- [ ] Prepare marketing materials
- [ ] Monitor ratings and reviews
- [ ] Respond to user feedback

---

## Version Management

For future updates:

```bash
# Bump patch version (bug fixes): 1.0.0 -> 1.0.1
npm run version patch

# Bump minor version (new features): 1.0.0 -> 1.1.0
npm run version minor

# Bump major version (breaking changes): 1.0.0 -> 2.0.0
npm run version major

# Increment build number only
npm run version:build
```

Then commit, tag, and rebuild:
```bash
git add -A
git commit -m "Bump version to X.Y.Z"
git tag vX.Y.Z
npm run build:ios
```

---

## Quick Reference

| Item | Value |
|------|-------|
| Bundle ID | com.greenstreak.app |
| Team ID | 974SWJKYUP |
| App Name | Green Streak |
| Category | Health & Fitness |
| Current Version | 1.0.0 |
| Min iOS Version | 15.1 |
