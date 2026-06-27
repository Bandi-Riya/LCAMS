const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  updateAssetStatus,
  deleteAsset,
} = require("../controllers/assetController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize(["Admin", "Staff"]), createAsset);
router.get("/", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getAllAssets);
router.get("/:id", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getAssetById);
router.put("/:id", authorize(["Admin", "Staff"]), updateAsset);
router.patch("/:id/status", authorize(["Admin", "Staff", "Maintenance"]), updateAssetStatus);
router.delete("/:id", authorize(["Admin"]), deleteAsset);

module.exports = router;
