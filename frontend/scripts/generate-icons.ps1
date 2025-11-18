# PowerShell script to generate PWA icons using ImageMagick
# Install ImageMagick from: https://imagemagick.org/script/download.php

$iconSvg = "frontend/public/icons/icon.svg"
$outputDir = "frontend/public/icons"
$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

# Check if ImageMagick is installed
$magickInstalled = Get-Command magick -ErrorAction SilentlyContinue

if (-not $magickInstalled) {
    Write-Host "ImageMagick not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use one of these alternatives:" -ForegroundColor Yellow
    Write-Host "1. Open frontend/scripts/generate-icons.html in a browser"
    Write-Host "2. Install ImageMagick from https://imagemagick.org/script/download.php"
    Write-Host ""
    exit 1
}

Write-Host "Generating PWA icons..." -ForegroundColor Cyan
Write-Host ""

# Generate regular icons
foreach ($size in $sizes) {
    $output = Join-Path $outputDir "icon-$($size)x$($size).png"
    magick $iconSvg -resize "$($size)x$($size)" $output
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Generated icon-$($size)x$($size).png" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Failed to generate icon-$($size)x$($size).png" -ForegroundColor Red
    }
}

# Generate maskable icon (512x512 with padding)
$maskableOutput = Join-Path $outputDir "icon-512x512-maskable.png"
magick $iconSvg -resize "512x512" -gravity center -extent "512x512" $maskableOutput

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Generated icon-512x512-maskable.png" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Failed to generate icon-512x512-maskable.png" -ForegroundColor Red
}

Write-Host ""
Write-Host "Icon generation complete!" -ForegroundColor Green
Write-Host "Icons saved to: $outputDir" -ForegroundColor Cyan
