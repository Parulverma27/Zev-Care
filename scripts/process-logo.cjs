/**
 * Crops logo.jpeg to the blue icon region and removes gray/black padding.
 * Run: node scripts/process-logo.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.join(__dirname, '..');
const inputPath = path.join(rootDir, 'logo.jpeg');
const outputViews = path.join(rootDir, 'resources', 'views', 'assets', 'logo.png');
const outputPublic = path.join(rootDir, 'public', 'logo.png');

function isBlue(r, g, b) {
  return b > r + 30 && b > g + 10 && b > 80;
}

function isBackground(r, g, b) {
  if (r < 20 && g < 20 && b < 20) return true;
  if (r <= 35 && g <= 35 && b <= 35) return true;
  const neutral = Math.abs(r - g) < 18 && Math.abs(g - b) < 18;
  return neutral && r > 120;
}

function findBlueBounds(pixels, width, height) {
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      if (isBlue(r, g, b)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 4;
  return {
    left: Math.max(0, minX - pad),
    top: Math.max(0, minY - pad),
    width: Math.min(width, maxX - minX + 1 + pad * 2),
    height: Math.min(height, maxY - minY + 1 + pad * 2),
  };
}

async function processLogo() {
  if (!fs.existsSync(inputPath)) {
    console.error(`Logo not found: ${inputPath}`);
    process.exit(1);
  }

  const { data, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    if (isBackground(r, g, b)) {
      pixels[i + 3] = 0;
    }
  }

  const bounds = findBlueBounds(pixels, info.width, info.height);

  if (!bounds.width || !bounds.height) {
    console.error('Could not detect logo bounds in image');
    process.exit(1);
  }

  const extracted = await sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .extract(bounds)
    .png()
    .toBuffer();

  const pngBuffer = await sharp(extracted).trim().png().toBuffer();

  const meta = await sharp(pngBuffer).metadata();

  fs.mkdirSync(path.dirname(outputViews), { recursive: true });
  fs.mkdirSync(path.dirname(outputPublic), { recursive: true });
  fs.writeFileSync(outputViews, pngBuffer);
  fs.writeFileSync(outputPublic, pngBuffer);

  console.log(`✓ Transparent logo saved (${meta.width}x${meta.height})`);
  console.log(`  → ${outputViews}`);
  console.log(`  → ${outputPublic}`);
}

processLogo().catch((err) => {
  console.error(err);
  process.exit(1);
});
