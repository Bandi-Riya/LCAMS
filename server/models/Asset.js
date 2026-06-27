const mongoose = require("mongoose");

const ASSET_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Laboratory Equipment",
  "Electrical",
  "IT Infrastructure",
  "Safety Equipment",
  "Other",
];

const ASSET_STATUSES = ["Working", "Damaged", "Under Maintenance", "Discarded", "Lost"];

const assetSchema = new mongoose.Schema(
  {
    asset_name: { type: String, required: true, trim: true, maxlength: 150 },
    asset_code: { type: String, unique: true, sparse: true, trim: true, maxlength: 50 },
    category: { type: String, enum: ASSET_CATEGORIES, default: "Other" },
    brand: { type: String, trim: true, maxlength: 100 },
    model_number: { type: String, trim: true, maxlength: 100 },
    serial_number: { type: String, unique: true, sparse: true, trim: true, maxlength: 150 },
    purchase_date: { type: Date },
    purchase_cost: { type: mongoose.Schema.Types.Decimal128 },
    warranty_expiry: { type: Date },
    status: { type: String, enum: ASSET_STATUSES, default: "Working", required: true },
    room_id: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    added_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    last_updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = {
  Asset: mongoose.model("Asset", assetSchema),
  ASSET_CATEGORIES,
  ASSET_STATUSES,
};
