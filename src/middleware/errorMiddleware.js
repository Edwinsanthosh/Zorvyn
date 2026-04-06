function notFoundMiddleware(req, res, next) {
  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
}

function errorMiddleware(error, req, res, next) {
  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Something went wrong"
  });
}

module.exports = {
  notFoundMiddleware,
  errorMiddleware
};
