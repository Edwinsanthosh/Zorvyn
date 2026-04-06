const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const createError = require("../utils/createError");

const JWT_SECRET = process.env.JWT_SECRET || "simple_secret_key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refresh_secret_key";

function getUserResponse(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id
    },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

async function registerUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(createError("User with this email already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Viewer"
    });

    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      token,
      refreshToken,
      user: getUserResponse(newUser)
    });
  } catch (error) {
    next(createError("User registration failed"));
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return next(createError("Invalid email or password", 401));
    }

    if (user.status === "inactive") {
      return next(createError("User account is inactive. Please contact administrator", 403));
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return next(createError("Invalid email or password", 401));
    }

    const token = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      message: "Login successful",
      token,
      refreshToken,
      user: getUserResponse(user)
    });
  } catch (error) {
    next(createError("Login failed"));
  }
}

async function refreshAccessToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError("Refresh token is required", 400));
    }

    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(createError("User not found", 401));
    }

    if (user.status === "inactive") {
      return next(createError("User account is inactive", 403));
    }

    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      return next(createError("Refresh token is invalid", 401));
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      message: "Token refreshed successfully",
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: getUserResponse(user)
    });
  } catch (error) {
    next(createError("Refresh token is invalid or expired", 401));
  }
}

async function logoutUser(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(createError("Refresh token is required", 400));
    }

    const user = await User.findOne({ refreshToken });

    if (user) {
      user.refreshToken = "";
      await user.save();
    }

    res.json({
      message: "Logout successful"
    });
  } catch (error) {
    next(createError("Logout failed"));
  }
}

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
};
