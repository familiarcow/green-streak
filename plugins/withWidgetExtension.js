/**
 * Expo Config Plugin for iOS Widget Extension
 *
 * This plugin configures the main app's entitlements for App Groups,
 * which is required for widget data sharing.
 *
 * Note: The widget extension target must be added manually in Xcode.
 * See docs/widget-setup.md for detailed instructions.
 *
 * Usage in app.json:
 * {
 *   "plugins": [
 *     "./plugins/withWidgetExtension"
 *   ]
 * }
 */

const { withEntitlementsPlist } = require("expo/config-plugins");

const APP_GROUP_IDENTIFIER = "group.com.greenstreak.shared";

/**
 * Add App Groups entitlement to the main app
 */
const withAppGroupsEntitlement = (config) => {
  return withEntitlementsPlist(config, (config) => {
    // Add App Groups capability
    const existingGroups = config.modResults["com.apple.security.application-groups"] || [];
    if (!existingGroups.includes(APP_GROUP_IDENTIFIER)) {
      config.modResults["com.apple.security.application-groups"] = [
        ...existingGroups,
        APP_GROUP_IDENTIFIER,
      ];
    }

    console.log(`[withWidgetExtension] Added App Group: ${APP_GROUP_IDENTIFIER}`);
    return config;
  });
};

/**
 * Main plugin function
 */
const withWidgetExtension = (config) => {
  // Add App Groups entitlement to main app
  config = withAppGroupsEntitlement(config);

  console.log("[withWidgetExtension] Main app configured for widget sharing");
  console.log("[withWidgetExtension] To complete setup, add the widget extension target in Xcode");
  console.log("[withWidgetExtension] See docs/widget-setup.md for instructions");

  return config;
};

module.exports = withWidgetExtension;
