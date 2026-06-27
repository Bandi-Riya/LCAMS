const mongoose = require("mongoose");

const floorSchema = new mongoose.Schema(
  {
    floor_number: { type: Number, required: true },
    floor_label: { type: String, trim: true, maxlength: 50 },
    block_id: { type: mongoose.Schema.Types.ObjectId, ref: "Block", required: true, index: true },
  },
  { timestamps: false }
);

floorSchema.index({ floor_number: 1, block_id: 1 }, { unique: true });

module.exports = mongoose.model("Floor", floorSchema);
