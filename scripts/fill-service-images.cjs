/**
 * Fill zero-byte service images by copying from related category assets.
 * Run after fetch-service-images.cjs if some downloads failed.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'resources', 'views', 'assets', 'services');

const copies = {
  'dry-cleaning.jpg': 'cleaning.jpg',
  'pest-control.jpg': 'cleaning.jpg',
  'kitchen-appliances.jpg': 'home-appliances.jpg',
  'ac.jpg': 'home-appliances.jpg',
  'washing-machine.jpg': 'home-appliances.jpg',
  'fans.jpg': 'home-appliances.jpg',
  'stove.jpg': 'home-appliances.jpg',
  'microwave.jpg': 'home-appliances.jpg',
  'bath.jpg': 'plumber.jpg',
  'toilet.jpg': 'plumber.jpg',
  'basin.jpg': 'plumber.jpg',
  'bed.jpg': 'furniture.jpg',
  'sofa.jpg': 'furniture.jpg',
  'table.jpg': 'furniture.jpg',
  'cabinet.jpg': 'furniture.jpg',
  'sofa-fabric.jpg': 'cleaning.jpg',
  'carpet.jpg': 'cleaning.jpg',
  'headboard.jpg': 'furniture.jpg',
  'cockroach.jpg': 'cleaning.jpg',
  'termite.jpg': 'cleaning.jpg',
  'bedbugs.jpg': 'cleaning.jpg',
  'bathroom-clean.jpg': 'cleaning.jpg',
  'kitchen-clean.jpg': 'cleaning.jpg',
  'fan-clean.jpg': 'cleaning.jpg',
  'glass.jpg': 'cleaning.jpg',
  'other.jpg': 'home-appliances.jpg',
};

for (const [target, source] of Object.entries(copies)) {
  const targetPath = path.join(dir, target);
  const sourcePath = path.join(dir, source);
  const size = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;
  if (size === 0 && fs.existsSync(sourcePath) && fs.statSync(sourcePath).size > 0) {
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`copied ${source} -> ${target}`);
  }
}
