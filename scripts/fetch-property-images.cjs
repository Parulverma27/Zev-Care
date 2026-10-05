/**
 * Downloads property type banner images into resources/views/assets/.
 * Run: node scripts/fetch-property-images.cjs
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const outDir = path.join(__dirname, '..', 'resources', 'views', 'assets');
const publicDir = path.join(__dirname, '..', 'public');

const images = {
  'property_home.png':
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=85',
  'property_villa.png':
    'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=900&q=85',
  'property_pg.png':
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=900&q=85',
};

function download(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          download(res.headers.location).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      })
      .on('error', reject);
  });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });

  for (const [name, url] of Object.entries(images)) {
    const buf = await download(url);
    const assetPath = path.join(outDir, name);
    const publicPath = path.join(publicDir, name);
    fs.writeFileSync(assetPath, buf);
    fs.writeFileSync(publicPath, buf);
    console.log(`✓ ${name} (${buf.length} bytes)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
