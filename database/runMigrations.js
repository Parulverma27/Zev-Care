/**
 * Run Migrations (like php artisan migrate).
 */

import dotenv from 'dotenv';
dotenv.config();

import { sequelize } from '../config/db.js';
import { readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.js')).sort();

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(migrationsDir, file)).href);
    const migration = mod.default;
    if (typeof migration.up === 'function') {
      const queryInterface = sequelize.getQueryInterface();
      await migration.up(queryInterface);
      console.log(`✓ Migrated: ${file}`);
    }
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
