import dotenv from 'dotenv';
dotenv.config();

import loadDatabase from '../loaders/database.js';
import '../app/models/index.js';
import { sequelize } from '../config/db.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  await loadDatabase();
  await sequelize.sync({ force: true });
  console.log('✓ Recreated database tables for all platform models.');

  const seedersDir = path.join(__dirname, 'seeders');
  const files = readdirSync(seedersDir).filter((f) => f.endsWith('.js')).sort();

  for (const file of files) {
    try {
      const mod = await import(pathToFileURL(path.join(seedersDir, file)).href);
      const seeder = mod.default;
      if (typeof seeder.up === 'function') {
        const queryInterface = sequelize.getQueryInterface();
        await seeder.up(queryInterface, sequelize.Sequelize);
        console.log(`✓ Seeded successfully: ${file}`);
      }
    } catch (err) {
      console.log(`⚠️ Seeder ${file} note: ${err.message}`);
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
