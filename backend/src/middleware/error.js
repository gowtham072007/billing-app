function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred. Please try again.';

  res.status(statusCode).json({
    error: message,
    status: statusCode
  });
}

module.exports = { errorHandler };
