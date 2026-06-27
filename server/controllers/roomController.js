const Floor = require("../models/Floor");
const { Room, ROOM_TYPES } = require("../models/Room");
const { Asset } = require("../models/Asset");

const createRoom = async (req, res, next) => {
  try {
    const {
      room_number,
      room_name,
      room_type,
      seating_capacity,
      has_projector,
      has_ac,
      landmark,
      floor_id,
    } = req.body;

    if (!room_number || !floor_id) {
      return res.status(400).json({ success: false, message: "room_number and floor_id are required." });
    }

    const floor = await Floor.findById(floor_id).populate("block_id", "block_name");
    if (!floor) {
      return res.status(404).json({ success: false, message: "Floor not found." });
    }

    if (room_type && !ROOM_TYPES.includes(room_type)) {
      return res.status(400).json({ success: false, message: "Invalid room_type value." });
    }

    const duplicate = await Room.findOne({ room_number: room_number.trim(), floor_id });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Room number already exists on this floor." });
    }

    const room = await Room.create({
      room_number: room_number.trim(),
      room_name,
      room_type,
      seating_capacity,
      has_projector,
      has_ac,
      landmark,
      floor_id,
    });

    const populated = await Room.findById(room._id).populate({
      path: "floor_id",
      select: "floor_number floor_label block_id",
      populate: { path: "block_id", select: "block_name block_code" },
    });

    return res.status(201).json({ success: true, data: populated, message: "Room created successfully." });
  } catch (error) {
    return next(error);
  }
};

const getAllRooms = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.type) {
      query.room_type = req.query.type;
    }
    if (req.query.floor_id) {
      query.floor_id = req.query.floor_id;
    }
    if (req.query.block_id) {
      const floorIds = (
        await Floor.find({ block_id: req.query.block_id }).select("_id")
      ).map((floor) => floor._id);
      query.floor_id = { $in: floorIds };
    }

    const rooms = await Room.find(query).populate({
      path: "floor_id",
      select: "floor_number floor_label block_id",
      populate: { path: "block_id", select: "block_name block_code" },
    });

    rooms.sort((a, b) => {
      const aBlockName = a.floor_id?.block_id?.block_name || "";
      const bBlockName = b.floor_id?.block_id?.block_name || "";
      if (aBlockName !== bBlockName) return aBlockName.localeCompare(bBlockName);

      const aFloorNumber = a.floor_id?.floor_number ?? 0;
      const bFloorNumber = b.floor_id?.floor_number ?? 0;
      if (aFloorNumber !== bFloorNumber) return aFloorNumber - bFloorNumber;

      return (a.room_number || "").localeCompare(b.room_number || "");
    });

    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    return next(error);
  }
};

const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate({
      path: "floor_id",
      select: "floor_number floor_label block_id",
      populate: { path: "block_id", select: "block_name block_code description" },
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    const asset_count = await Asset.countDocuments({ room_id: room._id });
    const roomObj = room.toObject();

    return res.status(200).json({
      success: true,
      data: { ...roomObj, asset_count },
    });
  } catch (error) {
    return next(error);
  }
};

const updateRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    const {
      room_number,
      room_name,
      room_type,
      seating_capacity,
      has_projector,
      has_ac,
      landmark,
      floor_id,
    } = req.body;

    if (room_type !== undefined && !ROOM_TYPES.includes(room_type)) {
      return res.status(400).json({ success: false, message: "Invalid room_type value." });
    }

    const targetFloorId = floor_id || room.floor_id;
    const targetRoomNumber = room_number !== undefined ? room_number.trim() : room.room_number;

    if (floor_id) {
      const floorExists = await Floor.findById(floor_id);
      if (!floorExists) {
        return res.status(404).json({ success: false, message: "Floor not found." });
      }
    }

    if (targetRoomNumber !== room.room_number || targetFloorId.toString() !== room.floor_id.toString()) {
      const duplicate = await Room.findOne({
        _id: { $ne: room._id },
        room_number: targetRoomNumber,
        floor_id: targetFloorId,
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Room number already exists on this floor." });
      }
    }

    if (room_number !== undefined) room.room_number = targetRoomNumber;
    if (room_name !== undefined) room.room_name = room_name;
    if (room_type !== undefined) room.room_type = room_type;
    if (seating_capacity !== undefined) room.seating_capacity = seating_capacity;
    if (has_projector !== undefined) room.has_projector = has_projector;
    if (has_ac !== undefined) room.has_ac = has_ac;
    if (landmark !== undefined) room.landmark = landmark;
    if (floor_id !== undefined) room.floor_id = floor_id;

    await room.save();

    const populated = await Room.findById(room._id).populate({
      path: "floor_id",
      select: "floor_number floor_label block_id",
      populate: { path: "block_id", select: "block_name block_code" },
    });

    return res.status(200).json({ success: true, data: populated, message: "Room updated successfully." });
  } catch (error) {
    return next(error);
  }
};

const deleteRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    const assetCount = await Asset.countDocuments({ room_id: room._id });
    if (assetCount > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete room. Remove or reassign its assets first.",
      });
    }

    await Room.deleteOne({ _id: room._id });
    return res.status(200).json({ success: true, data: null, message: "Room deleted successfully." });
  } catch (error) {
    return next(error);
  }
};

const getRoomAssets = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    const assets = await Asset.find({ room_id: room._id }).sort({ category: 1, asset_name: 1 });
    return res.status(200).json({ success: true, data: assets });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  getRoomAssets,
};
