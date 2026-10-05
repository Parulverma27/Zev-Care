/**
 * Express Loader (like Laravel HTTP kernel / service provider).
 * Serves API, static public assets, and SPA fallback for the Expo web build.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from '../routes/api.js';
import { errorHandler } from '../app/middlewares/errorHandler.js';
import { notFoundHandler } from '../app/middlewares/notFoundHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const webIndex = path.join(rootDir, 'public', 'index.html');

export default (app) => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    })
  );

  // Static assets (Expo web build + public files)
  app.use(express.static(path.join(rootDir, 'public')));

  // API routes (like Laravel api.php)
  app.use('/api', apiRoutes);

  // SPA fallback: serve Expo web build (public/index.html after npm run build:web)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(webIndex, (err) => {
      if (err) next();
    });
  });

  // 404 for unmatched /api routes
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
