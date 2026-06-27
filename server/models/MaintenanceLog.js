const mongoose = require("mongoose");

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const REPAIR_STATUSES = ["Pending", "In Progress", "Resolved", "Closed"];

const maintenanceLogSchema = new mongoose.Schema(
  {
    asset_id: { type: mongoose.Schema.Types.ObjectId, ref: "Asset", required: true, index: true },
    issue_title: { type: String, required: true, trim: true, maxlength: 200 },
    issue_description: { type: String, trim: true },
    reported_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    priority: { type: String, enum: PRIORITIES, default: "Medium" },
    repair_status: { type: String, enum: REPAIR_STATUSES, required: true, default: "Pending" },
    reported_at: { type: Date, default: Date.now },
    resolved_at: { type: Date },
    resolution_notes: { type: String, trim: true },
    cost_of_repair: { type: mongoose.Schema.Types.Decimal128 },
  },
  { timestamps: false }
);

module.exports = {
  MaintenanceLog: mongoose.model("MaintenanceLog", maintenanceLogSchema),
  PRIORITIES,
  REPAIR_STATUSES,
};
