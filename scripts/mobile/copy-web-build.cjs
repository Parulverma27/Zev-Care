/**
 * Copies Expo web export (dist/) to public/ for Express to serve.
 */
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const viewsDir = path.join(rootDir, 'resources', 'views');
const distDir = path.join(viewsDir, 'dist');
const targetDir = path.join(rootDir, 'public');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Build output not found: ${src}`);
    console.error('Run "expo export --platform web" first.');
    process.exit(1);
  }

  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

fs.mkdirSync(targetDir, { recursive: true });

for (const entry of fs.readdirSync(distDir)) {
  const targetPath = path.join(targetDir, entry);
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

copyRecursive(distDir, targetDir);

// Stable (unhashed) catalog images for API / server catalog and static serving
const catalogSrc = path.join(viewsDir, 'assets', 'services', 'catalog');
if (fs.existsSync(catalogSrc)) {
  copyRecursive(catalogSrc, path.join(distDir, 'assets', 'services', 'catalog'));
  copyRecursive(catalogSrc, path.join(targetDir, 'assets', 'services', 'catalog'));
}

const complaintsSrc = path.join(viewsDir, 'assets', 'services', 'complaints');
if (fs.existsSync(complaintsSrc)) {
  copyRecursive(complaintsSrc, path.join(distDir, 'assets', 'services', 'complaints'));
  copyRecursive(complaintsSrc, path.join(targetDir, 'assets', 'services', 'complaints'));
}

// Ensure hero banners and key static assets are directly available unhashed
const bannerFiles = [
  'hero-banner-1.png',
  'hero-banner-2.png',
  'hero-banner-3.png',
  'home-hero-banner.png',
  'home-header-bg.jpg',
  'my-appliances-hero.jpg',
  'login-1.png',
  'login-2.png',
  'login-3.png',
  'login-4.png',
];

for (const f of bannerFiles) {
  const src = path.join(viewsDir, 'assets', f);
  if (fs.existsSync(src)) {
    // Top-level /assets/
    fs.mkdirSync(path.join(distDir, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'assets'), { recursive: true });
    fs.copyFileSync(src, path.join(distDir, 'assets', f));
    fs.copyFileSync(src, path.join(targetDir, 'assets', f));

    // Nested /assets/assets/ for bundle-style fallback
    fs.mkdirSync(path.join(distDir, 'assets', 'assets'), { recursive: true });
    fs.mkdirSync(path.join(targetDir, 'assets', 'assets'), { recursive: true });
    fs.copyFileSync(src, path.join(distDir, 'assets', 'assets', f));
    fs.copyFileSync(src, path.join(targetDir, 'assets', 'assets', f));
  }
}

const serveJsonSrc = path.join(viewsDir, 'serve.json');
if (fs.existsSync(serveJsonSrc)) {
  fs.copyFileSync(serveJsonSrc, path.join(distDir, 'serve.json'));
  fs.copyFileSync(serveJsonSrc, path.join(targetDir, 'serve.json'));
}

const faviconSrc = path.join(viewsDir, 'assets', 'favicon.png');
const faviconDest = path.join(targetDir, 'favicon.png');
if (fs.existsSync(faviconSrc)) {
  fs.copyFileSync(faviconSrc, faviconDest);
}

const silverSilkSrc = path.join(viewsDir, 'assets', 'silver_silk_bg.jpg');
if (fs.existsSync(silverSilkSrc)) {
  fs.copyFileSync(silverSilkSrc, path.join(distDir, 'silver_silk_bg.jpg'));
  fs.copyFileSync(silverSilkSrc, path.join(targetDir, 'silver_silk_bg.jpg'));
}

const goldSilkSrc = path.join(viewsDir, 'assets', 'gold_silk_bg.jpg');
if (fs.existsSync(goldSilkSrc)) {
  fs.copyFileSync(goldSilkSrc, path.join(distDir, 'gold_silk_bg.jpg'));
  fs.copyFileSync(goldSilkSrc, path.join(targetDir, 'gold_silk_bg.jpg'));
}


const platinumSilkSrc = path.join(viewsDir, 'assets', 'platinum_silk_bg.jpg');
if (fs.existsSync(platinumSilkSrc)) {
  fs.copyFileSync(platinumSilkSrc, path.join(distDir, 'platinum_silk_bg.jpg'));
  fs.copyFileSync(platinumSilkSrc, path.join(targetDir, 'platinum_silk_bg.jpg'));
}

const indexPath = path.join(targetDir, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html.replace(/<title>.*?<\/title>/, '<title>Zevota Care</title>');
  if (!html.includes('rel="icon"')) {
    html = html.replace('</head>', '    <link rel="icon" type="image/png" href="/favicon.png" />\n  </head>');
  }
  if (!html.includes('theme-color')) {
    html = html.replace(
      '<meta name="viewport"',
      '<meta name="theme-color" content="#2563eb" />\n    <meta name="viewport"'
    );
  }
  if (!html.includes('family=Outfit')) {
    html = html.replace(
      '</head>',
      '    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">\n  </head>'
    );
  }
  if (!html.includes('maps.googleapis.com')) {
    html = html.replace(
      '</head>',
      '    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBXe2rzucyPoB-lR4Oe8c5DY0ORp7Sq1iU&libraries=places"></script>\n  </head>'
    );
  }
  fs.writeFileSync(indexPath, html);
}

console.log(`✓ Web build copied to ${targetDir}`);
