const Block = require("../models/Block");
const Floor = require("../models/Floor");
const { Room } = require("../models/Room");
const { Asset } = require("../models/Asset");
const { MaintenanceLog } = require("../models/MaintenanceLog");

const createFloor = async (req, res, next) => {
  try {
    const { floor_number, floor_label, block_id } = req.body;

    if (floor_number === undefined || !block_id) {
      return res.status(400).json({ success: false, message: "floor_number and block_id are required." });
    }

    const block = await Block.findById(block_id);
    if (!block) {
      return res.status(404).json({ success: false, message: "Block not found." });
    }

    const exists = await Floor.findOne({ floor_number, block_id });
    if (exists) {
      return res.status(400).json({ success: false, message: "Floor already exists in this block." });
    }

    const floor = await Floor.create({ floor_number, floor_label, block_id });
    const populated = await Floor.findById(floor._id).populate("block_id", "block_name");

    return res.status(201).json({ success: true, data: populated, message: "Floor created successfully." });
  } catch (error) {
    return next(error);
  }
};

const getAllFloors = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.block_id) {
      query.block_id = req.query.block_id;
    }

    const floors = await Floor.find(query).populate("block_id", "block_name").sort({ block_id: 1, floor_number: 1 });
    return res.status(200).json({ success: true, data: floors });
  } catch (error) {
    return next(error);
  }
};

const getFloorById = async (req, res, next) => {
  try {
    const floor = await Floor.findById(req.params.id).populate("block_id", "block_name block_code description");
    if (!floor) {
      return res.status(404).json({ success: false, message: "Floor not found." });
    }

    return res.status(200).json({ success: true, data: floor });
  } catch (error) {
    return next(error);
  }
};

const updateFloor = async (req, res, next) => {
  try {
    const { floor_number, floor_label, block_id } = req.body;
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({ success: false, message: "Floor not found." });
    }

    const targetBlockId = block_id || floor.block_id;
    const targetFloorNumber = floor_number !== undefined ? floor_number : floor.floor_number;

    if (block_id) {
      const block = await Block.findById(block_id);
      if (!block) {
        return res.status(404).json({ success: false, message: "Block not found." });
      }
    }

    if (targetBlockId.toString() !== floor.block_id.toString() || targetFloorNumber !== floor.floor_number) {
      const duplicate = await Floor.findOne({
        _id: { $ne: floor._id },
        block_id: targetBlockId,
        floor_number: targetFloorNumber,
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Floor already exists in this block." });
      }
    }

    if (floor_number !== undefined) floor.floor_number = floor_number;
    if (floor_label !== undefined) floor.floor_label = floor_label;
    if (block_id !== undefined) floor.block_id = block_id;

    await floor.save();
    const populated = await Floor.findById(floor._id).populate("block_id", "block_name");
    return res.status(200).json({ success: true, data: populated, message: "Floor updated successfully." });
  } catch (error) {
    return next(error);
  }
};

const deleteFloor = async (req, res, next) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ success: false, message: "Floor not found." });
    }

    const rooms = await Room.find({ floor_id: floor._id }).select("_id");
    const roomIds = rooms.map((room) => room._id);
    const assets = await Asset.find({ room_id: { $in: roomIds } }).select("_id");
    const assetIds = assets.map((asset) => asset._id);

    if (assetIds.length > 0) {
      await MaintenanceLog.deleteMany({ asset_id: { $in: assetIds } });
      await Asset.deleteMany({ _id: { $in: assetIds } });
    }
    if (roomIds.length > 0) {
      await Room.deleteMany({ _id: { $in: roomIds } });
    }
    await Floor.deleteOne({ _id: floor._id });

    return res
      .status(200)
      .json({ success: true, data: null, message: "Floor and all associated data deleted." });
  } catch (error) {
    return next(error);
  }
};

const getFloorRooms = async (req, res, next) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ success: false, message: "Floor not found." });
    }

    const rooms = await Room.find({ floor_id: floor._id }).sort({ room_number: 1 });
    return res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createFloor,
  getAllFloors,
  getFloorById,
  updateFloor,
  deleteFloor,
  getFloorRooms,
};
