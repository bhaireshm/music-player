/**
 * Generate PWA Icons
 * This script generates all required icon sizes for the PWA
 * 
 * Note: This requires the 'canvas' package. Install with:
 * npm install canvas --save-dev
 * 
 * Or use the generate-icons.html file in a browser to generate icons manually
 */

const fs = require('fs');
const path = require('path');

// Check if canvas is available
let Canvas;
try {
  Canvas = require('canvas');
} catch (e) {
  console.log('Canvas package not found. Using fallback method...');
  console.log('\nTo generate icons:');
  console.log('1. Open frontend/scripts/generate-icons.html in a browser');
  console.log('2. Click "Download All Icons"');
  console.log('3. Save the icons to frontend/public/icons/\n');
  process.exit(0);
}

const { createCanvas } = Canvas;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outputDir = path.join(__dirname, '../public/icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateIcon(size, isMaskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#339af0';
  ctx.fillRect(0, 0, size, size);

  // Add safe zone for maskable icons
  const padding = isMaskable ? size * 0.1 : 0;

  // Music note icon (simplified)
  ctx.fillStyle = '#ffffff';
  
  // Note stem
  const stemWidth = size * 0.08;
  const stemHeight = size * 0.5;
  const stemX = size * 0.55 - padding;
  const stemY = size * 0.25 + padding;
  ctx.fillRect(stemX, stemY, stemWidth, stemHeight);

  // Note head (circle)
  const headRadius = size * 0.12;
  const headX = stemX + stemWidth / 2;
  const headY = stemY + stemHeight;
  
  ctx.beginPath();
  ctx.ellipse(headX, headY, headRadius * 1.3, headRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Second note
  const stem2X = stemX - size * 0.15;
  ctx.fillRect(stem2X, stemY + size * 0.1, stemWidth, stemHeight * 0.8);
  
  ctx.beginPath();
  ctx.ellipse(stem2X + stemWidth / 2, stemY + size * 0.1 + stemHeight * 0.8, headRadius * 1.3, headRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Connecting beam
  ctx.fillRect(stem2X + stemWidth, stemY + size * 0.1, stemX - stem2X, stemWidth);

  return canvas;
}

console.log('Generating PWA icons...\n');

// Generate regular icons
sizes.forEach(size => {
  const canvas = generateIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  
  console.log(`✓ Generated ${filename}`);
});

// Generate maskable icon
const maskableCanvas = generateIcon(512, true);
const maskableFilename = 'icon-512x512-maskable.png';
const maskableFilepath = path.join(outputDir, maskableFilename);

const maskableBuffer = maskableCanvas.toBuffer('image/png');
fs.writeFileSync(maskableFilepath, maskableBuffer);

console.log(`✓ Generated ${maskableFilename}`);

console.log('\n✅ All icons generated successfully!');
console.log(`📁 Icons saved to: ${outputDir}\n`);
