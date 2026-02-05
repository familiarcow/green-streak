# Deployment Guide

*Created: January 3, 2026*  
*Last Modified: January 3, 2026*

## Table of Contents

1. [Overview](#overview)
2. [Pre-deployment Checklist](#pre-deployment-checklist)
3. [Build Configuration](#build-configuration)
4. [Platform-Specific Deployment](#platform-specific-deployment)
5. [App Store Submission](#app-store-submission)
6. [Testing Builds](#testing-builds)
7. [Release Management](#release-management)
8. [Monitoring and Analytics](#monitoring-and-analytics)

## Overview

Green Streak is built with Expo, providing multiple deployment options:
- **Development Builds**: For testing and development
- **EAS Build**: Managed cloud builds for production
- **Standalone Apps**: Self-contained applications for app stores
- **Web Deployment**: PWA for web browsers

### Deployment Architecture

```
Source Code → Build Process → Distribution
     ↓              ↓              ↓
  Git Repo    →  EAS Build   →   App Stores
                     ↓              ↓
              Internal Testing  Production
```

## Pre-deployment Checklist

### 1. Code Quality Verification

```bash
# Run complete test suite
npm test

# Generate and verify coverage
npm run test:coverage

# TypeScript validation
npm run typecheck

# Code linting
npm run lint

# Verify no console.log statements in production code
grep -r "console\." src/ --exclude-dir=__tests__
```

### 2. App Configuration Review

#### app.json Validation

```json
{
  "expo": {
    "name": "Green Streak",
    "slug": "green-streak",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#fefefe"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.greenstreak",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#fefefe"
      },
      "package": "com.yourcompany.greenstreak",
      "versionCode": 1
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "name": "Green Streak",
      "shortName": "GreenStreak"
    }
  }
}
```

### 3. Privacy and Security Review

- [ ] No hardcoded secrets or API keys
- [ ] Local-only data storage verified
- [ ] Privacy policy reviewed
- [ ] Data collection practices documented
- [ ] App permissions justified and minimal

### 4. Assets and Resources

- [ ] App icon in all required sizes
- [ ] Splash screen optimized
- [ ] Screenshots for store listings
- [ ] App description and metadata

## Build Configuration

### EAS Build Setup

Install and configure EAS CLI:

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo account
eas login

# Configure project
eas build:configure
```

### eas.json Configuration

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "NODE_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Environment Configuration

Create environment-specific configurations:

```javascript
// app.config.js
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export default {
  expo: {
    name: IS_PRODUCTION ? "Green Streak" : "Green Streak Dev",
    slug: "green-streak",
    version: "1.0.0",
    // ... other config
    extra: {
      isProduction: IS_PRODUCTION,
      buildTime: new Date().toISOString(),
    },
  },
};
```

## Platform-Specific Deployment

### iOS Deployment

#### 1. Development Build

```bash
# Build for iOS simulator (testing)
eas build --platform ios --profile preview

# Build for physical device (internal testing)
eas build --platform ios --profile development
```

#### 2. App Store Build

```bash
# Production build for App Store
eas build --platform ios --profile production
```

#### 3. iOS Configuration

Update app.json for iOS specifics:

```json
{
  "expo": {
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.yourcompany.greenstreak",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Not used in this app",
        "NSMicrophoneUsageDescription": "Not used in this app",
        "NSPhotoLibraryUsageDescription": "Not used in this app"
      }
    }
  }
}
```

### Android Deployment

#### 1. Development Build

```bash
# Build APK for testing
eas build --platform android --profile preview

# Build for development
eas build --platform android --profile development
```

#### 2. Production Build

```bash
# Build AAB for Google Play Store
eas build --platform android --profile production
```

#### 3. Android Configuration

```json
{
  "expo": {
    "android": {
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "buildToolsVersion": "34.0.0",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#fefefe"
      },
      "package": "com.yourcompany.greenstreak",
      "versionCode": 1,
      "permissions": []
    }
  }
}
```

### Web Deployment

#### 1. Build for Web

```bash
# Build web version
npx expo export:web

# Serve locally for testing
npx serve web-build
```

#### 2. Deploy to Hosting Platform

**Netlify Deployment:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy to Netlify
netlify deploy --dir=web-build --prod
```

**Vercel Deployment:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod web-build
```

**GitHub Pages Deployment:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build for web
      run: npx expo export:web
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./web-build
```

## App Store Submission

### Apple App Store

#### 1. App Store Connect Setup

1. Create app record in App Store Connect
2. Configure app information:
   - App name: "Green Streak"
   - Bundle ID: com.yourcompany.greenstreak
   - SKU: greenstreak-ios
   - Category: Health & Fitness

#### 2. App Information

```
Name: Green Streak
Subtitle: GitHub-style Habit Tracker
Description: 
Transform your daily habits into beautiful GitHub-style contribution graphs. Green Streak is a privacy-first habit tracker that keeps all your data on your device while providing motivating visual feedback for your progress.

Features:
• GitHub-style contribution graph visualization
• Privacy-first design - all data stays on your device
• Track multiple habits with custom colors and icons
• Quick daily logging with ticker controls
• Multi-completion support for habits you do multiple times per day
• Beautiful, minimalist design inspired by US Graphics aesthetics
• No accounts, no cloud storage, no data tracking

Keywords: habit, tracker, github, contribution, graph, privacy, daily, routine, progress, motivation
```

#### 3. Privacy Information

```
Privacy Policy: Not applicable - app doesn't collect data
Data Collection: None
Third-party SDKs: None that collect data
```

#### 4. App Review Information

```
Demo Account: Not needed
Review Notes: 
This app uses local SQLite storage only. No network requests are made. 
All user data remains on device. The app includes a development seeding 
system that can be demonstrated by starting the app in development mode.
```

#### 5. Submission Process

```bash
# Build and submit to App Store
eas submit --platform ios
```

### Google Play Store

#### 1. Google Play Console Setup

1. Create new application
2. Configure store listing:
   - App name: Green Streak
   - Short description: Privacy-first GitHub-style habit tracker
   - Full description: [Same as iOS description]
   - Category: Health & Fitness

#### 2. App Bundle Upload

```bash
# Submit to Google Play
eas submit --platform android
```

#### 3. Release Configuration

- **Release type**: Production
- **Countries**: Worldwide
- **Pricing**: Free
- **Content rating**: Everyone
- **Target API level**: 34 (Android 14)

## Testing Builds

### Internal Testing

#### 1. Development Builds

```bash
# Install development build on device
npx expo install:ios    # For iOS
npx expo install:android # For Android
```

#### 2. TestFlight (iOS)

```bash
# Submit to TestFlight for beta testing
eas submit --platform ios --profile preview
```

#### 3. Internal Testing (Android)

```bash
# Upload to Google Play Console internal testing track
eas submit --platform android --profile preview
```

### Testing Checklist

- [ ] App launches successfully on fresh install
- [ ] All core features work without crashes
- [ ] Contribution graph displays correctly
- [ ] Task creation and editing functions
- [ ] Daily logging works as expected
- [ ] Data persists between app launches
- [ ] Performance is acceptable on target devices
- [ ] Accessibility features work correctly

### Device Testing

Test on various devices and OS versions:

**iOS Testing:**
- iPhone SE (small screen)
- iPhone 13/14 (standard size)
- iPhone 13/14 Plus (large screen)
- iOS 15.0+ compatibility

**Android Testing:**
- Various screen sizes (phone, tablet)
- Different Android versions (API 21+)
- Different manufacturers (Samsung, Google, etc.)

## Release Management

### Version Numbering

Follow semantic versioning (SemVer):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backwards compatible
- **Patch** (1.0.1): Bug fixes, backwards compatible

### Release Process

1. **Code Freeze**: Stop feature development
2. **Testing**: Comprehensive testing phase
3. **Build**: Create production builds
4. **Review**: Final review of builds and store listings
5. **Submit**: Upload to app stores
6. **Monitor**: Track submission status and user feedback

### Release Notes Template

```
Version 1.1.0 - [Release Date]

🆕 New Features
• Added weekly view for contribution graph
• New habit categories and icons

🐛 Bug Fixes
• Fixed crash when creating tasks with special characters
• Improved performance with large datasets

🔧 Improvements
• Enhanced accessibility support
• Updated UI animations
```

### Rollback Plan

If issues are discovered post-release:

1. **Immediate**: Pull app from stores if critical issue
2. **Hotfix**: Prepare emergency patch release
3. **Communication**: Notify users of known issues
4. **Recovery**: Restore functionality with minimum downtime

## Monitoring and Analytics

### Error Monitoring (Future)

Consider integrating error monitoring:

```bash
# Add Sentry for error tracking
npm install @sentry/react-native
```

### Performance Monitoring

Monitor key metrics:
- App launch time
- Memory usage
- Crash rates
- User engagement

### App Store Metrics

Track important store metrics:
- Download numbers
- User ratings and reviews
- Conversion rates
- Update adoption

### User Feedback Collection

```typescript
// Simple feedback mechanism (future feature)
const collectFeedback = (rating: number, feedback: string) => {
  // Store locally for manual review
  logger.info('FEEDBACK', 'User feedback received', { rating, feedback });
};
```

## Deployment Automation

### CI/CD Pipeline (Future)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    tags: ['v*']

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build iOS
      run: eas build --platform ios --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
    
    - name: Build Android
      run: eas build --platform android --profile production --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
    
    - name: Submit to stores
      run: |
        eas submit --platform ios --non-interactive
        eas submit --platform android --non-interactive
      env:
        EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### Deployment Scripts

```bash
#!/bin/bash
# deploy.sh - Automated deployment script

set -e

echo "🚀 Starting Green Streak deployment..."

# Verify environment
npm run typecheck
npm test

# Build for all platforms
echo "📱 Building iOS..."
eas build --platform ios --profile production

echo "🤖 Building Android..."
eas build --platform android --profile production

echo "🌐 Building Web..."
npx expo export:web

echo "✅ Builds completed successfully!"
echo "📋 Next steps:"
echo "1. Test builds on devices"
echo "2. Submit to app stores using 'eas submit'"
echo "3. Deploy web version to hosting platform"
```

---

This deployment guide provides comprehensive instructions for building, testing, and releasing the Green Streak application across all supported platforms. Follow these procedures to ensure reliable and successful deployments.