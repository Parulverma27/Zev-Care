/**
 * 404 Not Found Handler (like Laravel fallback).
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({ success: false, message: 'Route not found' });
}
