# PWA Icons

This directory contains the icons for the Progressive Web App.

## Generating Icons

### Option 1: Using the HTML Generator (Recommended)
1. Open `frontend/scripts/generate-icons.html` in a web browser
2. Click "Download All Icons"
3. Save all downloaded icons to this directory

### Option 2: Using Node.js Script
If you have the `canvas` package installed:
```bash
npm install canvas --save-dev
node frontend/scripts/generate-icons.js
```

### Option 3: Using Online Tools
1. Use the `icon.svg` file as a base
2. Convert to PNG using online tools like:
   - https://cloudconvert.com/svg-to-png
   - https://www.iloveimg.com/svg-to-jpg
3. Generate the following sizes:
   - 72x72
   - 96x96
   - 128x128
   - 144x144
   - 152x152
   - 192x192
   - 384x384
   - 512x512
   - 512x512 (maskable - with 10% padding)

### Option 4: Using ImageMagick
If you have ImageMagick installed:
```bash
# Install ImageMagick first: https://imagemagick.org/

# Generate all sizes
magick icon.svg -resize 72x72 icon-72x72.png
magick icon.svg -resize 96x96 icon-96x96.png
magick icon.svg -resize 128x128 icon-128x128.png
magick icon.svg -resize 144x144 icon-144x144.png
magick icon.svg -resize 152x152 icon-152x152.png
magick icon.svg -resize 192x192 icon-192x192.png
magick icon.svg -resize 384x384 icon-384x384.png
magick icon.svg -resize 512x512 icon-512x512.png
magick icon.svg -resize 512x512 icon-512x512-maskable.png
```

## Required Icons

The following icon files are required for the PWA:

- `icon-72x72.png` - Small icon
- `icon-96x96.png` - Small icon
- `icon-128x128.png` - Medium icon
- `icon-144x144.png` - Medium icon
- `icon-152x152.png` - Apple touch icon
- `icon-192x192.png` - Standard PWA icon
- `icon-384x384.png` - Large icon
- `icon-512x512.png` - Extra large icon
- `icon-512x512-maskable.png` - Maskable icon (with safe zone)

## Temporary Placeholder

Until proper icons are generated, the app will use the SVG icon as a fallback.
