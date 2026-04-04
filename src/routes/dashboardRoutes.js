const express = require("express");

const {
  getDashboardSummary,
  getCategoryTotals,
  getRecentActivity,
  getTrendData
} = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", roleMiddleware(["Viewer", "Analyst", "Admin"]), getDashboardSummary);
router.get("/categories", roleMiddleware(["Viewer", "Analyst", "Admin"]), getCategoryTotals);
router.get("/recent-activity", roleMiddleware(["Viewer", "Analyst", "Admin"]), getRecentActivity);
router.get("/trends", roleMiddleware(["Viewer", "Analyst", "Admin"]), getTrendData);

module.exports = router;
