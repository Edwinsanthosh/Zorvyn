const requestStore = {};

function rateLimitMiddleware(options = {}) {
  const windowMs = options.windowMs || 60 * 1000;
  const maxRequests = options.maxRequests || 20;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || "unknown";
    const now = Date.now();

    if (!requestStore[ip]) {
      requestStore[ip] = [];
    }

    requestStore[ip] = requestStore[ip].filter((time) => now - time < windowMs);

    if (requestStore[ip].length >= maxRequests) {
      return res.status(429).json({
        message: "Too many requests. Please try again later."
      });
    }

    requestStore[ip].push(now);
    next();
  };
}

module.exports = rateLimitMiddleware;
