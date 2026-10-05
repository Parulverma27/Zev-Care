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

// Stable (unhashed) catalog images for API / server catalog
const catalogSrc = path.join(viewsDir, 'assets', 'services', 'catalog');
const catalogDest = path.join(targetDir, 'assets', 'services', 'catalog');
if (fs.existsSync(catalogSrc)) {
  copyRecursive(catalogSrc, catalogDest);
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
  if (!html.includes('maps.googleapis.com')) {
    html = html.replace(
      '</head>',
      '    <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBXe2rzucyPoB-lR4Oe8c5DY0ORp7Sq1iU&libraries=places"></script>\n  </head>'
    );
  }
  fs.writeFileSync(indexPath, html);
}

console.log(`✓ Web build copied to ${targetDir}`);
