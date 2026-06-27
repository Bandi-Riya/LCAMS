const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const { getAnalyticsSummary } = require("../controllers/analyticsController");

const router = express.Router();

router.use(authMiddleware);
router.get("/summary", authorize(["Admin", "Staff"]), getAnalyticsSummary);

module.exports = router;
