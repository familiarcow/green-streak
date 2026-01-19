# iOS Widget Extension Setup Guide

This guide explains how to complete the Xcode project configuration for the Green Streak widgets.

## Prerequisites

- Xcode 14.0 or later
- macOS with iOS development tools installed
- Apple Developer account (for signing)

## Step 1: Open the Xcode Workspace

```bash
open ios/greenstreaktemp.xcworkspace
```

**Important**: Always open the `.xcworkspace` file, not the `.xcodeproj` file.

## Step 2: Add Widget Extension Target

1. In Xcode, go to **File > New > Target**
2. Select **iOS > Widget Extension**
3. Configure the target:
   - **Product Name**: `GreenStreakWidgets`
   - **Team**: Select your Apple Developer team
   - **Bundle Identifier**: `com.greenstreak.app.widgets`
   - **Language**: Swift
   - **Include Configuration App Intent**: No (we'll add this later for Phase 2+)
4. Click **Finish**
5. When prompted to activate the scheme, click **Activate**

## Step 3: Replace Generated Widget Files

Xcode creates a default widget template. Replace it with the files we've created:

1. In the Xcode Project Navigator, delete the auto-generated files in `GreenStreakWidgets/`:
   - `GreenStreakWidgets.swift`
   - `GreenStreakWidgetsBundle.swift` (if generated)

2. Add the existing widget files to the target:
   - Right-click on `GreenStreakWidgets` folder in Xcode
   - Select **Add Files to "greenstreaktemp"...**
   - Navigate to `ios/GreenStreakWidgets/`
   - Select all files and folders:
     - `GreenStreakWidgetsBundle.swift`
     - `Core/` folder
     - `Widgets/` folder
   - Ensure **Copy items if needed** is unchecked
   - Ensure **GreenStreakWidgets** target is checked
   - Click **Add**

## Step 4: Configure App Groups

### Main App Target

1. Select the **greenstreaktemp** target
2. Go to **Signing & Capabilities**
3. Click **+ Capability** and add **App Groups**
4. Add: `group.com.greenstreak.shared`

### Widget Extension Target

1. Select the **GreenStreakWidgets** target
2. Go to **Signing & Capabilities**
3. Click **+ Capability** and add **App Groups**
4. Add: `group.com.greenstreak.shared` (same as main app)

## Step 5: Configure Entitlements

### Widget Extension Entitlements

1. Select the **GreenStreakWidgets** target
2. In the Project Navigator, select `GreenStreakWidgets.entitlements`
3. Verify it contains:
   ```xml
   <key>com.apple.security.application-groups</key>
   <array>
       <string>group.com.greenstreak.shared</string>
   </array>
   ```

### Main App Entitlements

The main app's entitlements file has already been updated at:
`ios/greenstreaktemp/greenstreaktemp.entitlements`

## Step 6: Configure Build Settings

### Widget Extension

1. Select the **GreenStreakWidgets** target
2. Go to **Build Settings**
3. Search for **Deployment Target** and set to **iOS 14.0**
4. Verify **Swift Language Version** is **5.0** or later

## Step 7: Configure Info.plist

The widget's Info.plist has already been created at:
`ios/GreenStreakWidgets/Info.plist`

Verify it contains the WidgetKit extension point identifier:
```xml
<key>NSExtension</key>
<dict>
    <key>NSExtensionPointIdentifier</key>
    <string>com.apple.widgetkit-extension</string>
</dict>
```

## Step 8: Code Signing

1. Select the **GreenStreakWidgets** target
2. Go to **Signing & Capabilities**
3. Enable **Automatically manage signing**
4. Select your Team
5. Verify the Bundle Identifier is `com.greenstreak.app.widgets`

**Note**: The widget extension must be signed with the same team and provisioning profile as the main app.

## Step 9: Build and Test

### Build for Simulator

1. Select the **greenstreaktemp** scheme
2. Select an iOS 14+ simulator
3. Build and run (Cmd+R)

### Build for Device

1. Connect your iOS device
2. Select the **greenstreaktemp** scheme
3. Select your device
4. Build and run (Cmd+R)

### Test Widget

1. On the device/simulator, go to the Home Screen
2. Long press to enter jiggle mode
3. Tap the **+** button to add widgets
4. Search for "Green Streak"
5. Select the **Live Calendar** widget
6. Choose a size (Small, Medium, or Large)
7. Tap **Add Widget**

## Troubleshooting

### Widget Not Appearing

1. Ensure the widget extension builds without errors
2. Check that App Groups are configured correctly on both targets
3. Verify the bundle identifiers are correct
4. Try restarting the simulator/device

### Data Not Syncing

1. Check that the app has run at least once after installing
2. Verify App Group identifiers match between app and widget
3. Check console logs for sync errors

### Build Errors

1. Clean build folder (Cmd+Shift+K)
2. Delete derived data
3. Run `pod install` in the ios directory
4. Rebuild

## Widget Deep Links

The widget supports deep linking. Tapping the widget opens the app with:

```
greenstreak://calendar?date=YYYY-MM-DD
```

Deep link handling is implemented in `/src/hooks/useDeepLinks.ts`.

## Future Phases

This Phase 1 implementation establishes the foundation for future widget types:

- **Phase 2**: LiveCalendar + Quick Adds (Medium/Large)
- **Phase 3**: Single Habit Quick Add (Small) - iOS 17+ interactive
- **Phase 4**: Multi-Habit Quick Add (Medium/Large) - iOS 17+ interactive

The architecture supports these extensions through:
- Protocol-based widget structure
- Shared data models (`WidgetData.swift`)
- Pending actions array for interactive widget events
- Quick add configuration in sync data
