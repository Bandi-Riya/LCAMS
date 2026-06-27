const mongoose = require("mongoose");

const ROLE_NAMES = ["Admin", "Staff", "Maintenance", "Viewer"];

const roleSchema = new mongoose.Schema(
  {
    role_name: {
      type: String,
      required: true,
      unique: true,
      enum: ROLE_NAMES,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: false }
);

module.exports = {
  Role: mongoose.model("Role", roleSchema),
  ROLE_NAMES,
};
