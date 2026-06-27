const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  createBlock,
  getAllBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
  getBlockFloors,
} = require("../controllers/blockController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize(["Admin"]), createBlock);
router.get("/", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getAllBlocks);
router.get("/:id", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getBlockById);
router.put("/:id", authorize(["Admin"]), updateBlock);
router.delete("/:id", authorize(["Admin"]), deleteBlock);
router.get("/:id/floors", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getBlockFloors);

module.exports = router;
