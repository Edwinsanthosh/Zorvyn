const express = require("express");

const {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser
} = require("../controllers/authController");
const {
  validateLogin,
  validateRegister
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", logoutUser);

module.exports = router;
