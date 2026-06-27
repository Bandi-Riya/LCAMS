const mongoose = require("mongoose");

const ROOM_TYPES = [
  "Classroom",
  "Smart Classroom",
  "Laboratory",
  "HOD Office",
  "Faculty Room",
  "Auditorium",
  "Conference Room",
  "Store Room",
  "Other",
];

const roomSchema = new mongoose.Schema(
  {
    room_number: { type: String, required: true, trim: true, maxlength: 20 },
    room_name: { type: String, trim: true, maxlength: 150 },
    room_type: { type: String, enum: ROOM_TYPES, default: "Other" },
    seating_capacity: { type: Number },
    has_projector: { type: Boolean, default: false },
    has_ac: { type: Boolean, default: false },
    landmark: { type: String, trim: true, maxlength: 200 },
    floor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Floor",
      required: true,
      index: true,
    },
  },
  { timestamps: false }
);

roomSchema.index({ room_number: 1, floor_id: 1 }, { unique: true });

module.exports = {
  Room: mongoose.model("Room", roomSchema),
  ROOM_TYPES,
};
