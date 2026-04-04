const express = require("express");

const {
  getAllRecords,
  getSingleRecord,
  createRecord,
  updateRecord,
  deleteRecord
} = require("../controllers/recordController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { validateRecord } = require("../middleware/validationMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", roleMiddleware(["Viewer", "Analyst", "Admin"]), getAllRecords);
router.get("/:id", roleMiddleware(["Viewer", "Analyst", "Admin"]), getSingleRecord);
router.post("/", roleMiddleware(["Analyst", "Admin"]), validateRecord, createRecord);
router.put("/:id", roleMiddleware(["Analyst", "Admin"]), validateRecord, updateRecord);
router.delete("/:id", roleMiddleware(["Admin"]), deleteRecord);

module.exports = router;
