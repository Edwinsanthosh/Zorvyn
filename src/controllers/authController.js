const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "Edwin_santhosh";

async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

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
      role: role || "Viewer"
    });

    const token = jwt.sign(
      {
        id: newUser.id,
        role: newUser.role
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "User registration failed"
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        message: "User account is inactive. Please contact administrator"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed"
    });
  }
}

module.exports = {
  registerUser,
  loginUser
};
