/**
 * Crops auth/splash hero images to photo-only regions (no baked-in text/logos).
 * Run: node scripts/process-auth-heroes.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const assetsDir = path.join(__dirname, '..', 'resources', 'views', 'assets');

async function crop(inputName, outputName, region) {
  const inputPath = path.join(assetsDir, inputName);
  const outputPath = path.join(assetsDir, outputName);
  if (!fs.existsSync(inputPath)) {
    console.warn(`Skip ${inputName} (not found)`);
    return;
  }
  const meta = await sharp(inputPath).metadata();
  const left = Math.round(meta.width * region.left);
  const top = Math.round(meta.height * region.top);
  const width = Math.round(meta.width * region.width);
  const height = Math.round(meta.height * region.height);
  await sharp(inputPath)
    .extract({
      left: Math.min(left, meta.width - 1),
      top: Math.min(top, meta.height - 1),
      width: Math.min(width, meta.width - left),
      height: Math.min(height, meta.height - top),
    })
    .toFile(outputPath);
  console.log(`✓ ${outputName} (${width}x${height})`);
}

async function main() {
  // Living room scene — right side only, no header text
  await crop('auth-hero-login.png', 'auth-photo-login.png', {
    left: 0.38,
    top: 0.08,
    width: 0.62,
    height: 0.92,
  });

  // Couple photo — below baked header text
  await crop('auth-hero-register.png', 'auth-photo-register.png', {
    left: 0.05,
    top: 0.28,
    width: 0.9,
    height: 0.72,
  });

  // OTP — shield/phone area without top branding
  await crop('auth-hero-otp.png', 'auth-photo-otp.png', {
    left: 0.1,
    top: 0.2,
    width: 0.8,
    height: 0.75,
  });

  // Splash — bottom houses/waves strip only
  await crop('splash-bg.png', 'splash-houses.png', {
    left: 0,
    top: 0.58,
    width: 1,
    height: 0.42,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
