const bcrypt = require("bcryptjs");

const User = require("../models/User");
const createError = require("../utils/createError");

async function getAllUsers(req, res, next) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
      count: users.length,
      data: users
    });
  } catch (error) {
    next(createError("Could not fetch users"));
  }
}

async function createUserByAdmin(req, res, next) {
  try {
    const { name, email, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(createError("User with this email already exists", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Viewer",
      status: status || "active"
    });

    res.status(201).json({
      message: "User created successfully",
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    next(createError("Could not create user"));
  }
}

async function updateUserRole(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError("User not found", 404));
    }

    user.role = req.body.role;
    await user.save();

    res.json({
      message: "User role updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(createError("Could not update user role", 400));
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(createError("User not found", 404));
    }

    user.status = req.body.status;
    await user.save();

    res.json({
      message: "User status updated successfully",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    next(createError("Could not update user status", 400));
  }
}

module.exports = {
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
  updateUserStatus
};
