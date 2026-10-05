/**
 * Main Entry Point (like Laravel public/index.php + bootstrap).
 */

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import loadDatabase from './loaders/database.js';
import loadExpress from './loaders/express.js';

const app = express();
const PORT = process.env.PORT || 3000;

async function start() {
  await loadDatabase();
  loadExpress(app);

  app.listen(PORT, () => {
    console.log(`✓ Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
