const fs = require('fs');
const path = require('path');

// Simple PNG encoder for creating basic icons
function createMusicIconPNG(size) {
  // Create a simple SVG and convert to data URL
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
  <rect width="${size}" height="${size}" rx="${size * 0.1875}" fill="#b08968"/>
  <path d="M${size * 0.71875} ${size * 0.1875}v${size * 0.4375}c0 ${size * 0.06914}-${size * 0.05596} ${size * 0.125}-${size * 0.125} ${size * 0.125}s-${size * 0.125}-${size * 0.05596}-${size * 0.125}-${size * 0.125} ${size * 0.05596}-${size * 0.125} ${size * 0.125}-${size * 0.125}c${size * 0.02285} 0 ${size * 0.04414} ${size * 0.00625} ${size * 0.0625} ${size * 0.0168}V${size * 0.33125}l-${size * 0.25} ${size * 0.0625}v${size * 0.3125}c0 ${size * 0.06914}-${size * 0.05596} ${size * 0.125}-${size * 0.125} ${size * 0.125}s-${size * 0.125}-${size * 0.05596}-${size * 0.125}-${size * 0.125} ${size * 0.05596}-${size * 0.125} ${size * 0.125}-${size * 0.125}c${size * 0.02285} 0 ${size * 0.04414} ${size * 0.00625} ${size * 0.0625} ${size * 0.0168}V${size * 0.25}l${size * 0.375}-${size * 0.0625}z" fill="#ede0d4" stroke="#ede0d4" stroke-width="${size * 0.015625}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  
  return Buffer.from(svg);
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

console.log('Creating music note icons...\n');

sizes.forEach(size => {
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // Create SVG content
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" fill="none">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}" fill="#b08968"/>
  <path d="M${Math.round(size * 0.71875)} ${Math.round(size * 0.1875)}v${Math.round(size * 0.4375)}c0 ${Math.round(size * 0.06914)}-${Math.round(size * 0.05596)} ${Math.round(size * 0.125)}-${Math.round(size * 0.125)} ${Math.round(size * 0.125)}s-${Math.round(size * 0.125)}-${Math.round(size * 0.05596)}-${Math.round(size * 0.125)}-${Math.round(size * 0.125)} ${Math.round(size * 0.05596)}-${Math.round(size * 0.125)} ${Math.round(size * 0.125)}-${Math.round(size * 0.125)}c${Math.round(size * 0.02285)} 0 ${Math.round(size * 0.04414)} ${Math.round(size * 0.00625)} ${Math.round(size * 0.0625)} ${Math.round(size * 0.0168)}V${Math.round(size * 0.33125)}l-${Math.round(size * 0.25)} ${Math.round(size * 0.0625)}v${Math.round(size * 0.3125)}c0 ${Math.round(size * 0.06914)}-${Math.round(size * 0.05596)} ${Math.round(size * 0.125)}-${Math.round(size * 0.125)} ${Math.round(size * 0.125)}s-${Math.round(size * 0.125)}-${Math.round(size * 0.05596)}-${Math.round(size * 0.125)}-${Math.round(size * 0.125)} ${Math.round(size * 0.05596)}-${Math.round(size * 0.125)} ${Math.round(size * 0.125)}-${Math.round(size * 0.125)}c${Math.round(size * 0.02285)} 0 ${Math.round(size * 0.04414)} ${Math.round(size * 0.00625)} ${Math.round(size * 0.0625)} ${Math.round(size * 0.0168)}V${Math.round(size * 0.25)}l${Math.round(size * 0.375)}-${Math.round(size * 0.0625)}z" fill="#ede0d4" stroke="#ede0d4" stroke-width="${Math.round(size * 0.015625)}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
  
  // Save as SVG (browsers will render it)
  const svgFilepath = filepath.replace('.png', '.svg');
  fs.writeFileSync(svgFilepath, svg);
  console.log(`✓ Created ${filename.replace('.png', '.svg')}`);
});

// Create maskable icon
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="96" fill="#b08968"/>
  <path d="M368 96v224c0 35.35-28.65 64-64 64s-64-28.65-64-64 28.65-64 64-64c11.68 0 22.56 3.2 32 8.64V169.6l-128 32v160c0 35.35-28.65 64-64 64s-64-28.65-64-64 28.65-64 64-64c11.68 0 22.56 3.2 32 8.64V128l192-32z" fill="#ede0d4" stroke="#ede0d4" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

fs.writeFileSync(path.join(iconsDir, 'icon-512x512-maskable.svg'), maskableSvg);
console.log(`✓ Created icon-512x512-maskable.svg`);

console.log('\n✓ All icons created successfully!');
console.log('\nNote: SVG icons are being used. For PNG icons, please use:');
console.log('1. Open frontend/scripts/generate-icons.html in a browser');
console.log('2. Or install ImageMagick and run: .\\frontend\\scripts\\generate-icons.ps1');
