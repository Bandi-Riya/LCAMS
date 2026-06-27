const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 150 },
    password_hash: { type: String, required: true, maxlength: 255 },
    department: { type: String, trim: true, maxlength: 100 },
    role_id: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true, index: true },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

module.exports = mongoose.model("User", userSchema);
