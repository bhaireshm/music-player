/**
 * Create placeholder icon files
 * This creates simple colored square PNGs as placeholders until proper icons are generated
 */

const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../public/icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create a simple 1x1 blue pixel PNG (base64)
// This is a minimal valid PNG file
const bluePNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

console.log('Creating placeholder icons...\n');

// Create placeholder for each size
sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, bluePNG);
  console.log(`✓ Created ${filename}`);
});

// Create maskable icon
const maskableFilename = 'icon-512x512-maskable.png';
const maskableFilepath = path.join(outputDir, maskableFilename);
fs.writeFileSync(maskableFilepath, bluePNG);
console.log(`✓ Created ${maskableFilename}`);

console.log('\n✅ Placeholder icons created!');
console.log('📝 Note: These are minimal placeholders. Generate proper icons using:');
console.log('   - Open frontend/scripts/generate-icons.html in a browser');
console.log('   - Or use ImageMagick with generate-icons.ps1\n');
