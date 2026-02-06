/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: "widget",
  name: "GreenStreakWidgets",

  // Bundle identifier suffix (appended to main app bundle ID)
  // Results in: com.green-streak.app.GreenStreakWidgets
  bundleIdentifier: ".GreenStreakWidgets",

  // Minimum iOS version (widgets require iOS 14+, interactive widgets require iOS 17+)
  deploymentTarget: "15.0",

  // Required frameworks
  frameworks: [
    "SwiftUI",
    "WidgetKit",
  ],

  // Entitlements for App Group data sharing
  entitlements: {
    "com.apple.security.application-groups": [
      "group.com.greenstreak.shared"
    ]
  },
};
