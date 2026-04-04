const express = require("express");

const {
  getAllUsers,
  createUserByAdmin,
  updateUserRole,
  updateUserStatus
} = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  validateRegister,
  validateUserRoleUpdate,
  validateUserStatusUpdate
} = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(["Admin"]));

router.get("/", getAllUsers);
router.post("/", validateRegister, createUserByAdmin);
router.patch("/:id/role", validateUserRoleUpdate, updateUserRole);
router.patch("/:id/status", validateUserStatusUpdate, updateUserStatus);

module.exports = router;
