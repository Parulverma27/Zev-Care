/**
 * Global Error Handler Middleware (like Laravel exception handler).
 */

export function errorHandler(err, req, res, next) {
  console.error(err);

  const status = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : (err.message || 'Internal server error');

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack && { stack: err.stack }),
  });
}
