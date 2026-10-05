import { sequelize } from '../config/db.js';
import '../app/models/index.js';

export default async () => {
  try {
    await sequelize.authenticate();
    console.log(`✓ Database connection established (${sequelize.options.dialect}).`);
    await sequelize.sync();
  } catch (err) {
    console.error('✗ Database connection failed:', err.message);
    throw err;
  }
};
