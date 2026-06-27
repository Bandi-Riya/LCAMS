require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const blockRoutes = require("./routes/blockRoutes");
const floorRoutes = require("./routes/floorRoutes");
const roomRoutes = require("./routes/roomRoutes");
const assetRoutes = require("./routes/assetRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const searchRoutes = require("./routes/searchRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/blocks", blockRoutes);
app.use("/api/v1/floors", floorRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/assets", assetRoutes);
app.use("/api/v1/maintenance", maintenanceRoutes);
app.use("/api/v1/search", searchRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/reports", reportRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

start();
