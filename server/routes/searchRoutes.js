const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const { search } = require("../controllers/searchController");

const router = express.Router();

router.use(authMiddleware);
router.get("/", authorize(["Admin", "Staff", "Maintenance", "Viewer"]), search);

module.exports = router;
