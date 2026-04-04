const bcrypt = require("bcryptjs");

const User = require("../models/User");

async function getAllUsers(req, res) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.json({
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not fetch users"
    });
  }
}

async function createUserByAdmin(req, res) {
  try {
    const { name, email, password, role, status } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists"
      });
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
    res.status(500).json({
      message: "Could not create user"
    });
  }
}

async function updateUserRole(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
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
    res.status(400).json({
      message: "Could not update user role"
    });
  }
}

async function updateUserStatus(req, res) {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
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
    res.status(400).json({
      message: "Could not update user status"
    });
  }
}

module.exports = {
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
  updateUserStatus
};
