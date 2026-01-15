/**
 * App Icon Generator
 *
 * Generates app icons for Green Streak:
 * 1. Static 3x3 grid icon (default) - shows sample activity pattern
 * 2. Dynamic 2x2 grid icons (16 variants) - for activity-based icon switching
 *
 * Usage: npm run generate-icons
 *
 * Requirements:
 * - canvas package: npm install --save-dev canvas
 * - On macOS: brew install pkg-config cairo pango libpng jpeg giflib librsvg
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Color palette from the app's colorUtils.ts
const COLORS = {
  empty: '#EBEDF0',   // Light gray - no activity
  level1: '#9BE9A8',  // Very light green
  level2: '#40C463',  // Light-medium green (used for dynamic icons)
  level3: '#30A14E',  // Medium-dark green
  level4: '#216E39',  // Dark green (full intensity)
  background: '#FFFFFF',
  // For dynamic icons, use a single "active" color
  active: '#40C463',  // Medium green - visible and recognizable at small sizes
};

// Sample data: 2 empty days, good gradient variety
// Shows the app's personality with a realistic activity pattern
const GRID_DATA = [
  [0, 3, 2],  // Row 1: empty, medium-dark, light-medium
  [4, 1, 3],  // Row 2: full, very light, medium-dark
  [2, 0, 4],  // Row 3: light-medium, empty, full
];

/**
 * Get color for intensity level
 */
function getColorForLevel(level) {
  switch (level) {
    case 0: return COLORS.empty;
    case 1: return COLORS.level1;
    case 2: return COLORS.level2;
    case 3: return COLORS.level3;
    case 4: return COLORS.level4;
    default: return COLORS.empty;
  }
}

/**
 * Draw a rounded rectangle path
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Generate an app icon at the specified size
 */
function generateIcon(size, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, size, size);

  // Calculate grid dimensions
  // Grid takes up 60% of the icon size
  const gridSize = size * 0.6;
  const gap = size * 0.024;
  const totalGaps = gap * 2; // 2 gaps for 3 boxes
  const boxSize = (gridSize - totalGaps) / 3;
  const cornerRadius = Math.max(size * 0.012, 1); // At least 1px radius

  // Center the grid
  const startX = (size - gridSize) / 2;
  const startY = (size - gridSize) / 2;

  // Draw each box
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const level = GRID_DATA[row][col];
      const color = getColorForLevel(level);
      const x = startX + col * (boxSize + gap);
      const y = startY + row * (boxSize + gap);

      ctx.fillStyle = color;
      roundRect(ctx, x, y, boxSize, boxSize, cornerRadius);
      ctx.fill();
    }
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Generated: ${outputPath} (${size}x${size})`);
}

/**
 * Generate a 2x2 dynamic icon for a specific binary pattern
 * Pattern is a 4-character string like "0101" where:
 * - Position 0 = top-left (4 days ago)
 * - Position 1 = top-right (3 days ago)
 * - Position 2 = bottom-left (2 days ago)
 * - Position 3 = bottom-right (yesterday)
 * - '0' = no activity (gray), '1' = activity (green)
 */
function generateDynamicIcon(size, pattern, outputPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fill background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, size, size);

  // Calculate grid dimensions for 2x2
  // Grid takes up 55% of the icon size (slightly smaller for 2x2 to look balanced)
  const gridSize = size * 0.55;
  const gap = size * 0.03; // Slightly larger gap for 2x2
  const totalGaps = gap; // 1 gap for 2 boxes
  const boxSize = (gridSize - totalGaps) / 2;
  const cornerRadius = Math.max(size * 0.02, 1); // Slightly larger radius for 2x2

  // Center the grid
  const startX = (size - gridSize) / 2;
  const startY = (size - gridSize) / 2;

  // Draw each box based on the pattern
  const positions = [
    { row: 0, col: 0 }, // top-left (index 0)
    { row: 0, col: 1 }, // top-right (index 1)
    { row: 1, col: 0 }, // bottom-left (index 2)
    { row: 1, col: 1 }, // bottom-right (index 3)
  ];

  for (let i = 0; i < 4; i++) {
    const { row, col } = positions[i];
    const hasActivity = pattern[i] === '1';
    const color = hasActivity ? COLORS.active : COLORS.empty;
    const x = startX + col * (boxSize + gap);
    const y = startY + row * (boxSize + gap);

    ctx.fillStyle = color;
    roundRect(ctx, x, y, boxSize, boxSize, cornerRadius);
    ctx.fill();
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
}

/**
 * Generate all 16 dynamic icon patterns
 */
function generateAllDynamicIcons(iconsDir) {
  console.log('\n📱 Generating 16 dynamic 2x2 icons...\n');

  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // Generate all 16 patterns (0000 to 1111)
  for (let i = 0; i < 16; i++) {
    const pattern = i.toString(2).padStart(4, '0');
    const iconName = `icon_${pattern}`;
    const outputPath = path.join(iconsDir, `${iconName}.png`);

    generateDynamicIcon(1024, pattern, outputPath);

    // Visual representation of the pattern
    const visual = pattern
      .split('')
      .map(c => c === '1' ? '█' : '░')
      .join('');
    const topRow = visual.slice(0, 2);
    const bottomRow = visual.slice(2, 4);

    console.log(`  ${iconName}: ${topRow}`);
    console.log(`            ${bottomRow}`);
  }

  console.log(`\n✅ Generated 16 dynamic icons in assets/icons/`);
}

// Main execution
console.log('🎨 Generating Green Streak app icons...\n');

const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate static icons (3x3 grid - default app icon)
console.log('📦 Generating static 3x3 icons (default)...\n');
generateIcon(1024, path.join(assetsDir, 'icon.png'));
generateIcon(1024, path.join(assetsDir, 'adaptive-icon.png'));
generateIcon(48, path.join(assetsDir, 'favicon.png'));

// Generate dynamic icons (2x2 grid - 16 patterns)
const iconsDir = path.join(assetsDir, 'icons');
generateAllDynamicIcons(iconsDir);

console.log('\n✨ All icons generated successfully!');
console.log('\nGenerated files:');
console.log('  Static (default):');
console.log('    - assets/icon.png (1024x1024) - Main app icon');
console.log('    - assets/adaptive-icon.png (1024x1024) - Android adaptive icon');
console.log('    - assets/favicon.png (48x48) - Web favicon');
console.log('  Dynamic (2x2 patterns):');
console.log('    - assets/icons/icon_0000.png through icon_1111.png (16 variants)');
