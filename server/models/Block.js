const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema(
  {
    block_name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    block_code: { type: String, trim: true, maxlength: 20 },
    description: { type: String, trim: true },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

module.exports = mongoose.model("Block", blockSchema);
