const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "simple_secret_key";

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Token is required"
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid token format"
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const foundUser = await User.findById(decoded.id);

    if (!foundUser) {
      return res.status(401).json({
        message: "User not found"
      });
    }

    if (foundUser.status === "inactive") {
      return res.status(403).json({
        message: "User account is inactive"
      });
    }

    req.user = foundUser;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Token is invalid or expired"
    });
  }
}

module.exports = authMiddleware;
