/**
 * Expo Config Plugin for Widget Bridge Native Module
 *
 * This plugin copies the WidgetBridge native module files to the iOS project
 * and adds them to the Xcode project during prebuild.
 *
 * The widget extension itself is handled by @bacons/apple-targets.
 */

const {
  withXcodeProject,
  withDangerousMod,
  IOSConfig,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const WIDGET_BRIDGE_FILES = ["WidgetBridge.swift", "WidgetBridge.m"];

/**
 * Copy WidgetBridge files to the iOS project
 */
const withWidgetBridgeFiles = (config) => {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const platformProjectRoot = config.modRequest.platformProjectRoot;

      // Source directory (modules/widget-bridge/ios)
      const sourceDir = path.join(projectRoot, "modules", "widget-bridge", "ios");

      // Get the main app target name
      const appName = IOSConfig.XcodeUtils.sanitizedName(config.modRequest.projectName);

      // Destination directory (ios/<AppName>)
      const destDir = path.join(platformProjectRoot, appName);

      // Ensure destination directory exists
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy each file
      for (const file of WIDGET_BRIDGE_FILES) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, destPath);
          console.log(`[withWidgetBridge] Copied ${file} to ${destDir}`);
        } else {
          console.warn(`[withWidgetBridge] Source file not found: ${sourcePath}`);
        }
      }

      return config;
    },
  ]);
};

/**
 * Add WidgetBridge files to the Xcode project
 */
const withWidgetBridgeXcodeProject = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const appName = IOSConfig.XcodeUtils.sanitizedName(config.modRequest.projectName);

    // Find the main app target
    const targetKey = xcodeProject.findTargetKey(appName);
    if (!targetKey) {
      console.warn(`[withWidgetBridge] Could not find target: ${appName}`);
      return config;
    }

    // Get the main group for the app
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
    const appGroupKey = Object.keys(xcodeProject.hash.project.objects.PBXGroup).find(
      (key) => {
        const group = xcodeProject.hash.project.objects.PBXGroup[key];
        return group && group.name === appName;
      }
    );

    // Add files to the project
    for (const file of WIDGET_BRIDGE_FILES) {
      const filePath = `${appName}/${file}`;

      // Check if file is already in project
      const existingFile = xcodeProject.hasFile(filePath);
      if (!existingFile) {
        if (file.endsWith(".swift")) {
          xcodeProject.addSourceFile(filePath, { target: targetKey }, appGroupKey);
          console.log(`[withWidgetBridge] Added ${file} to Xcode project`);
        } else if (file.endsWith(".m")) {
          xcodeProject.addSourceFile(filePath, { target: targetKey }, appGroupKey);
          console.log(`[withWidgetBridge] Added ${file} to Xcode project`);
        }
      } else {
        console.log(`[withWidgetBridge] ${file} already in Xcode project`);
      }
    }

    return config;
  });
};

/**
 * Main plugin function
 */
const withWidgetBridge = (config) => {
  // Copy the WidgetBridge files
  config = withWidgetBridgeFiles(config);

  // Add files to Xcode project
  config = withWidgetBridgeXcodeProject(config);

  console.log("[withWidgetBridge] Widget bridge configured for main app");

  return config;
};

module.exports = withWidgetBridge;
