const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const {
  createFloor,
  getAllFloors,
  getFloorById,
  updateFloor,
  deleteFloor,
  getFloorRooms,
} = require("../controllers/floorController");

const router = express.Router();

router.use(authMiddleware);

router.post("/", authorize(["Admin"]), createFloor);
router.get("/", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getAllFloors);
router.get("/:id", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getFloorById);
router.put("/:id", authorize(["Admin"]), updateFloor);
router.delete("/:id", authorize(["Admin"]), deleteFloor);
router.get("/:id/rooms", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), getFloorRooms);

module.exports = router;
