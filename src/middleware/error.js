// 404
function notFound(req, res, next) {
  res.status(404).json({ error: 'Route not found' });
}

function errorHandler(err, req, res, next) {
  console.error('error', err);
  const code = err.status || 500;
  res.status(code).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { notFound, errorHandler };
