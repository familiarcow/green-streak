/**
 * App Icon Generator
 *
 * Generates a 3x3 grid app icon mimicking the contribution graph.
 * Uses sample data to display a variety of green gradient colors.
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
  level2: '#40C463',  // Light-medium green
  level3: '#30A14E',  // Medium-dark green
  level4: '#216E39',  // Dark green (full intensity)
  background: '#FFFFFF',
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

// Main execution
console.log('🎨 Generating Green Streak app icons...\n');

const assetsDir = path.join(__dirname, '..', 'assets');

// Ensure assets directory exists
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate all required icon sizes
generateIcon(1024, path.join(assetsDir, 'icon.png'));
generateIcon(1024, path.join(assetsDir, 'adaptive-icon.png'));
generateIcon(48, path.join(assetsDir, 'favicon.png'));

console.log('\n✨ All icons generated successfully!');
console.log('\nIcon previews:');
console.log('  - assets/icon.png (1024x1024) - Main app icon');
console.log('  - assets/adaptive-icon.png (1024x1024) - Android adaptive icon');
console.log('  - assets/favicon.png (48x48) - Web favicon');
