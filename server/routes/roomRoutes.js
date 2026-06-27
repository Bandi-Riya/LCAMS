const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomAssets,
} = require("../controllers/roomController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize(["Admin"]), createRoom);
router.get("/", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getAllRooms);
router.get("/:id", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getRoomById);
router.put("/:id", authorize(["Admin"]), updateRoom);
router.delete("/:id", authorize(["Admin"]), deleteRoom);
router.get("/:id/assets", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getRoomAssets);

module.exports = router;
