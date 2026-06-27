const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  exportAssetsPDF,
  exportAssetsExcel,
  exportMaintenancePDF,
  exportMaintenanceExcel,
} = require("../controllers/reportController");

const router = express.Router();

router.use(authMiddleware);

router.get("/assets/pdf", authorize(["Admin", "Staff"]), exportAssetsPDF);
router.get("/assets/excel", authorize(["Admin", "Staff"]), exportAssetsExcel);
router.get("/maintenance/pdf", authorize(["Admin", "Staff"]), exportMaintenancePDF);
router.get("/maintenance/excel", authorize(["Admin", "Staff"]), exportMaintenanceExcel);

module.exports = router;
