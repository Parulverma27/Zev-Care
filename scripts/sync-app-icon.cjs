/**
 * Sync branded app icon to all Expo / web asset paths.
 * Source: resources/views/assets/source/app-icon.png (1024-ready square PNG)
 * Run: node scripts/sync-app-icon.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = path.join(__dirname, '..');
const publicLogo = path.join(rootDir, 'public', 'logo.png');
const finalLogo = path.join(rootDir, 'final logo.png');
const sourcePath = fs.existsSync(publicLogo) ? publicLogo : finalLogo;

const outputs = [
  path.join(rootDir, 'resources', 'views', 'assets', 'logo.png'),
  path.join(rootDir, 'resources', 'views', 'assets', 'icon.png'),
  path.join(rootDir, 'resources', 'views', 'assets', 'favicon.png'),
  path.join(rootDir, 'resources', 'views', 'assets', 'source', 'app-icon.png'),
  path.join(rootDir, 'public', 'favicon.ico'),
];

const adaptiveOutput = path.join(rootDir, 'resources', 'views', 'assets', 'adaptive-icon.png');

async function syncAppIcon() {
  if (!fs.existsSync(sourcePath)) {
    console.error(`Source icon not found: ${sourcePath}`);
    process.exit(1);
  }

  const logoBuffer = await sharp(sourcePath)
    .png()
    .toBuffer();

  const iconBuffer = await sharp(sourcePath)
    .resize(1024, 1024, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const faviconBuffer = await sharp(iconBuffer).resize(48, 48).png().toBuffer();

  for (const out of outputs) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    if (out.endsWith('.ico')) {
      await sharp(faviconBuffer).toFile(out);
    } else {
      fs.writeFileSync(out, logoBuffer);
    }
    console.log(`✓ ${out}`);
  }

  fs.writeFileSync(adaptiveOutput, iconBuffer);
  console.log(`✓ ${adaptiveOutput}`);
}

syncAppIcon().catch((err) => {
  console.error(err);
  process.exit(1);
});
