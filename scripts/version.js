#!/usr/bin/env node

/**
 * Version Management Script
 *
 * Synchronizes version numbers across all config files:
 * - package.json
 * - app.json
 * - ios/GreenStreak/Info.plist
 *
 * Usage:
 *   node scripts/version.js patch    # 1.0.0 -> 1.0.1
 *   node scripts/version.js minor    # 1.0.0 -> 1.1.0
 *   node scripts/version.js major    # 1.0.0 -> 2.0.0
 *   node scripts/version.js 1.2.3    # Set specific version
 *   node scripts/version.js          # Show current version
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// File paths
const FILES = {
  package: path.join(ROOT_DIR, 'package.json'),
  appJson: path.join(ROOT_DIR, 'app.json'),
  infoPlist: path.join(ROOT_DIR, 'ios', 'GreenStreak', 'Info.plist'),
};

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync(FILES.package, 'utf8'));
  return packageJson.version;
}

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpVersion(current, type) {
  const parsed = parseVersion(current);

  switch (type) {
    case 'major':
      return formatVersion({ major: parsed.major + 1, minor: 0, patch: 0 });
    case 'minor':
      return formatVersion({ major: parsed.major, minor: parsed.minor + 1, patch: 0 });
    case 'patch':
      return formatVersion({ major: parsed.major, minor: parsed.minor, patch: parsed.patch + 1 });
    default:
      // Assume it's a specific version string
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(`Invalid version type: ${type}. Use major, minor, patch, or a version like 1.2.3`);
  }
}

function updatePackageJson(version) {
  const content = JSON.parse(fs.readFileSync(FILES.package, 'utf8'));
  content.version = version;
  fs.writeFileSync(FILES.package, JSON.stringify(content, null, 2) + '\n');
  console.log(`  Updated package.json to ${version}`);
}

function updateAppJson(version) {
  const content = JSON.parse(fs.readFileSync(FILES.appJson, 'utf8'));
  content.expo.version = version;
  fs.writeFileSync(FILES.appJson, JSON.stringify(content, null, 2) + '\n');
  console.log(`  Updated app.json to ${version}`);
}

function updateInfoPlist(version) {
  let content = fs.readFileSync(FILES.infoPlist, 'utf8');

  // Update CFBundleShortVersionString
  content = content.replace(
    /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
    `$1${version}$2`
  );

  fs.writeFileSync(FILES.infoPlist, content);
  console.log(`  Updated Info.plist to ${version}`);
}

function incrementBuildNumber() {
  let content = fs.readFileSync(FILES.infoPlist, 'utf8');

  // Extract and increment CFBundleVersion
  const buildMatch = content.match(/<key>CFBundleVersion<\/key>\s*<string>(\d+)<\/string>/);
  if (buildMatch) {
    const currentBuild = parseInt(buildMatch[1], 10);
    const newBuild = currentBuild + 1;
    content = content.replace(
      /(<key>CFBundleVersion<\/key>\s*<string>)\d+(<\/string>)/,
      `$1${newBuild}$2`
    );
    fs.writeFileSync(FILES.infoPlist, content);
    console.log(`  Incremented build number to ${newBuild}`);
    return newBuild;
  }
  return null;
}

function showCurrentVersions() {
  console.log('\nCurrent versions:');

  // package.json
  const pkg = JSON.parse(fs.readFileSync(FILES.package, 'utf8'));
  console.log(`  package.json: ${pkg.version}`);

  // app.json
  const app = JSON.parse(fs.readFileSync(FILES.appJson, 'utf8'));
  console.log(`  app.json: ${app.expo.version}`);

  // Info.plist
  const plist = fs.readFileSync(FILES.infoPlist, 'utf8');
  const versionMatch = plist.match(/<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/);
  const buildMatch = plist.match(/<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/);
  console.log(`  Info.plist version: ${versionMatch ? versionMatch[1] : 'not found'}`);
  console.log(`  Info.plist build: ${buildMatch ? buildMatch[1] : 'not found'}`);
  console.log('');
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    showCurrentVersions();
    console.log('Usage:');
    console.log('  npm run version patch    # Bump patch version (1.0.0 -> 1.0.1)');
    console.log('  npm run version minor    # Bump minor version (1.0.0 -> 1.1.0)');
    console.log('  npm run version major    # Bump major version (1.0.0 -> 2.0.0)');
    console.log('  npm run version 1.2.3    # Set specific version');
    console.log('  npm run version:build    # Increment build number only');
    return;
  }

  if (command === 'build') {
    console.log('\nIncrementing build number...');
    const newBuild = incrementBuildNumber();
    if (newBuild) {
      console.log(`\nBuild number updated to ${newBuild}`);
    }
    return;
  }

  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, command);

  console.log(`\nUpdating version from ${currentVersion} to ${newVersion}...\n`);

  updatePackageJson(newVersion);
  updateAppJson(newVersion);
  updateInfoPlist(newVersion);
  incrementBuildNumber();

  console.log(`\nVersion updated to ${newVersion}`);
  console.log('\nNext steps:');
  console.log('  1. Review the changes');
  console.log('  2. Commit: git add -A && git commit -m "Bump version to ' + newVersion + '"');
  console.log('  3. Tag: git tag v' + newVersion);
  console.log('  4. Build: eas build --platform ios --profile production');
}

main();
