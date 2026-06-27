const Block = require("../models/Block");
const Floor = require("../models/Floor");
const { Room } = require("../models/Room");
const { Asset } = require("../models/Asset");
const { MaintenanceLog } = require("../models/MaintenanceLog");

const createBlock = async (req, res, next) => {
  try {
    const { block_name, block_code, description } = req.body;

    if (!block_name) {
      return res.status(400).json({ success: false, message: "block_name is required." });
    }

    const existingByName = await Block.findOne({ block_name: block_name.trim() });
    if (existingByName) {
      return res.status(400).json({ success: false, message: "Block name already exists." });
    }

    if (block_code) {
      const existingByCode = await Block.findOne({ block_code: block_code.trim() });
      if (existingByCode) {
        return res.status(400).json({ success: false, message: "Block code already exists." });
      }
    }

    const block = await Block.create({
      block_name: block_name.trim(),
      block_code: block_code?.trim(),
      description,
      created_by: req.user.id,
    });

    return res.status(201).json({ success: true, data: block, message: "Block created successfully." });
  } catch (error) {
    return next(error);
  }
};

const getAllBlocks = async (_req, res, next) => {
  try {
    const blocks = await Block.find({}).sort({ block_name: 1 });
    return res.status(200).json({ success: true, data: blocks });
  } catch (error) {
    return next(error);
  }
};

const getBlockById = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: "Block not found." });
    }

    return res.status(200).json({ success: true, data: block });
  } catch (error) {
    return next(error);
  }
};

const updateBlock = async (req, res, next) => {
  try {
    const { block_name, block_code, description } = req.body;
    const block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({ success: false, message: "Block not found." });
    }

    if (typeof block_name === "string" && block_name.trim() !== block.block_name) {
      const existingByName = await Block.findOne({
        block_name: block_name.trim(),
        _id: { $ne: block._id },
      });
      if (existingByName) {
        return res.status(400).json({ success: false, message: "Block name already exists." });
      }
      block.block_name = block_name.trim();
    }

    if (typeof block_code === "string") {
      const normalizedCode = block_code.trim();
      if (normalizedCode && normalizedCode !== (block.block_code || "")) {
        const existingByCode = await Block.findOne({
          block_code: normalizedCode,
          _id: { $ne: block._id },
        });
        if (existingByCode) {
          return res.status(400).json({ success: false, message: "Block code already exists." });
        }
      }
      block.block_code = normalizedCode || undefined;
    }

    if (description !== undefined) {
      block.description = description;
    }

    await block.save();
    return res.status(200).json({ success: true, data: block, message: "Block updated successfully." });
  } catch (error) {
    return next(error);
  }
};

const deleteBlock = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: "Block not found." });
    }

    const floors = await Floor.find({ block_id: block._id }).select("_id");
    const floorIds = floors.map((f) => f._id);
    const rooms = await Room.find({ floor_id: { $in: floorIds } }).select("_id");
    const roomIds = rooms.map((r) => r._id);
    const assets = await Asset.find({ room_id: { $in: roomIds } }).select("_id");
    const assetIds = assets.map((a) => a._id);

    if (assetIds.length > 0) {
      await MaintenanceLog.deleteMany({ asset_id: { $in: assetIds } });
      await Asset.deleteMany({ _id: { $in: assetIds } });
    }

    if (roomIds.length > 0) {
      await Room.deleteMany({ _id: { $in: roomIds } });
    }
    if (floorIds.length > 0) {
      await Floor.deleteMany({ _id: { $in: floorIds } });
    }
    await Block.deleteOne({ _id: block._id });

    return res
      .status(200)
      .json({ success: true, data: null, message: "Block and all associated data deleted." });
  } catch (error) {
    return next(error);
  }
};

const getBlockFloors = async (req, res, next) => {
  try {
    const block = await Block.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ success: false, message: "Block not found." });
    }

    const floors = await Floor.find({ block_id: block._id }).sort({ floor_number: 1 });
    return res.status(200).json({ success: true, data: floors });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createBlock,
  getAllBlocks,
  getBlockById,
  updateBlock,
  deleteBlock,
  getBlockFloors,
};
