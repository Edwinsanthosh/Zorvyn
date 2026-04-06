const jwt = require("jsonwebtoken");
const User = require("../models/User");
const createError = require("../utils/createError");

const JWT_SECRET = process.env.JWT_SECRET || "Edwin_santhosh";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(createError("Token is required", 401));
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return next(createError("Invalid token format", 401));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const foundUser = await User.findById(decoded.id);

    if (!foundUser) {
      return next(createError("User not found", 401));
    }

    if (foundUser.status === "inactive") {
      return next(createError("User account is inactive", 403));
    }

    req.user = foundUser;
    next();
  } catch (error) {
    return next(createError("Token is invalid or expired", 401));
  }
}

module.exports = authMiddleware;
