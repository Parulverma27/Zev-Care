import fs from 'fs';
import { sequelize } from '../config/db.js';
import * as models from '../app/models/index.js';

async function dump() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    const dumpData = {};
    
    // Get all model names, excluding the default export itself if it somehow got in
    const modelNames = Object.keys(models).filter(key => key !== 'default' && typeof models[key].findAll === 'function');
    
    for (const name of modelNames) {
      console.log(`Dumping ${name}...`);
      const data = await models[name].findAll({ raw: true });
      dumpData[name] = data;
    }

    const outputPath = './database_dump.json';
    fs.writeFileSync(outputPath, JSON.stringify(dumpData, null, 2), 'utf-8');
    
    console.log(`Dump successfully saved to ${outputPath}`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating dump:', err);
    process.exit(1);
  }
}

dump();
