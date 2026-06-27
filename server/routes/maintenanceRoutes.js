const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  createMaintenanceLog,
  getAllMaintenanceLogs,
  getMaintenanceLogById,
  updateMaintenanceLog,
  updateMaintenanceStatus,
} = require("../controllers/maintenanceController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize(["Admin", "Staff"]), createMaintenanceLog);
router.get("/", authorize(["Admin", "Staff", "Maintenance"]), getAllMaintenanceLogs);
router.get("/:id", authorize(["Admin", "Staff", "Maintenance"]), getMaintenanceLogById);
router.put("/:id", authorize(["Admin"]), updateMaintenanceLog);
router.patch("/:id/status", authorize(["Admin", "Maintenance"]), updateMaintenanceStatus);

module.exports = router;
