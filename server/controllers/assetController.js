const mongoose = require("mongoose");
const { Asset, ASSET_CATEGORIES, ASSET_STATUSES } = require("../models/Asset");
const { MaintenanceLog } = require("../models/MaintenanceLog");
const { Room } = require("../models/Room");
const Floor = require("../models/Floor");
// Block is not needed directly here (populated via Floor->Block chain)
const { createDamageLog } = require("../utils/autoLog");

const populateAssetChain = (query) =>
  query.populate({
    path: "room_id",
    select: "room_number room_name floor_id",
    populate: {
      path: "floor_id",
      select: "floor_label floor_number block_id",
      populate: { path: "block_id", select: "block_name block_code" },
    },
  });

const createAsset = async (req, res, next) => {
  try {
    const {
      asset_name,
      asset_code,
      category,
      brand,
      model_number,
      serial_number,
      purchase_date,
      purchase_cost,
      warranty_expiry,
      room_id,
    } = req.body;

    if (!asset_name || !room_id) {
      return res.status(400).json({ success: false, message: "asset_name and room_id are required." });
    }
    if (!asset_code) {
      return res.status(400).json({ success: false, message: "asset_code is required." });
    }
    if (!category) {
      return res.status(400).json({ success: false, message: "category is required." });
    }
    if (!ASSET_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: "Invalid category value." });
    }

    const room = await Room.findById(room_id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found." });
    }

    const dupCode = await Asset.findOne({ asset_code: asset_code.trim() });
    if (dupCode) {
      return res.status(400).json({ success: false, message: "asset_code already exists." });
    }

    if (serial_number) {
      const dupSerial = await Asset.findOne({ serial_number: serial_number.trim() });
      if (dupSerial) {
        return res.status(400).json({ success: false, message: "serial_number already exists." });
      }
    }

    const created = await Asset.create({
      asset_name: asset_name.trim(),
      asset_code: asset_code.trim(),
      category,
      brand,
      model_number,
      serial_number: serial_number?.trim(),
      purchase_date,
      purchase_cost,
      warranty_expiry,
      room_id,
      added_by: req.user._id,
      last_updated_by: req.user._id,
    });

    const populated = await populateAssetChain(Asset.findById(created._id));
    return res.status(201).json({ success: true, data: populated, message: "Asset created successfully." });
  } catch (error) {
    return next(error);
  }
};

const getAllAssets = async (req, res, next) => {
  try {
    const { status, category, room_id, block_id, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;
    if (room_id) query.room_id = room_id;
    if (search) {
      query.$or = [
        { asset_name: { $regex: search, $options: "i" } },
        { asset_code: { $regex: search, $options: "i" } },
      ];
    }

    if (block_id) {
      const floorIds = (await Floor.find({ block_id }).select("_id")).map((f) => f._id);
      const roomIds = (await Room.find({ floor_id: { $in: floorIds } }).select("_id")).map((r) => r._id);
      query.room_id = { $in: roomIds };
    }

    const assets = await populateAssetChain(Asset.find(query));

    assets.sort((a, b) => {
      const aBlock = a.room_id?.floor_id?.block_id?.block_name || "";
      const bBlock = b.room_id?.floor_id?.block_id?.block_name || "";
      if (aBlock !== bBlock) return aBlock.localeCompare(bBlock);

      const aRoom = a.room_id?.room_number || "";
      const bRoom = b.room_id?.room_number || "";
      if (aRoom !== bRoom) return aRoom.localeCompare(bRoom);

      return (a.asset_name || "").localeCompare(b.asset_name || "");
    });

    return res.status(200).json({ success: true, data: assets });
  } catch (error) {
    return next(error);
  }
};

const getAssetById = async (req, res, next) => {
  try {
    const asset = await populateAssetChain(Asset.findById(req.params.id));
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    const maintenance_history = await MaintenanceLog.find({ asset_id: asset._id })
      .sort({ reported_at: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      data: { asset, maintenance_history },
    });
  } catch (error) {
    return next(error);
  }
};

const updateAsset = async (req, res, next) => {
  try {
    if (req.body.status !== undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Use PATCH /assets/:id/status to update status." });
    }

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    const updates = { ...req.body };

    if (updates.category !== undefined && !ASSET_CATEGORIES.includes(updates.category)) {
      return res.status(400).json({ success: false, message: "Invalid category value." });
    }

    if (updates.room_id) {
      const room = await Room.findById(updates.room_id);
      if (!room) {
        return res.status(404).json({ success: false, message: "Room not found." });
      }
    }

    if (updates.asset_code !== undefined && updates.asset_code.trim() !== asset.asset_code) {
      const dup = await Asset.findOne({ asset_code: updates.asset_code.trim(), _id: { $ne: asset._id } });
      if (dup) {
        return res.status(400).json({ success: false, message: "asset_code already exists." });
      }
      updates.asset_code = updates.asset_code.trim();
    }

    if (updates.serial_number !== undefined) {
      const normalized = updates.serial_number ? updates.serial_number.trim() : undefined;
      if (normalized) {
        const dup = await Asset.findOne({ serial_number: normalized, _id: { $ne: asset._id } });
        if (dup) {
          return res.status(400).json({ success: false, message: "serial_number already exists." });
        }
      }
      updates.serial_number = normalized;
    }

    updates.last_updated_by = req.user._id;

    const updated = await populateAssetChain(
      Asset.findByIdAndUpdate(asset._id, updates, { new: true, runValidators: true })
    );

    return res.status(200).json({ success: true, data: updated, message: "Asset updated successfully." });
  } catch (error) {
    return next(error);
  }
};

const updateAssetStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "status is required." });
    }
    if (!ASSET_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value." });
    }

    let responsePayload = null;

    await session.withTransaction(async () => {
      const asset = await Asset.findById(req.params.id).session(session);
      if (!asset) {
        responsePayload = { http: 404, body: { success: false, message: "Asset not found." } };
        return;
      }

      if (asset.status === status) {
        responsePayload = {
          http: 400,
          body: { success: false, message: `Asset status is already '${status}'. No update made.` },
        };
        return;
      }

      asset.status = status;
      asset.last_updated_by = req.user._id;
      await asset.save({ session });

      if (status === "Damaged") {
        const maintenanceLog = await createDamageLog(asset._id, req.user._id, req.user.username, session);
        const populatedAsset = await populateAssetChain(Asset.findById(asset._id).session(session));

        responsePayload = {
          http: 200,
          body: {
            success: true,
            message: "Asset status updated to Damaged. Maintenance log auto-created.",
            data: { asset: populatedAsset, maintenanceLog },
          },
        };
      } else {
        const populatedAsset = await populateAssetChain(Asset.findById(asset._id).session(session));
        responsePayload = {
          http: 200,
          body: { success: true, data: populatedAsset, message: "Status updated." },
        };
      }
    });

    if (!responsePayload) {
      return res.status(500).json({ success: false, message: "Transaction failed." });
    }
    return res.status(responsePayload.http).json(responsePayload.body);
  } catch (error) {
    return next(error);
  } finally {
    session.endSession();
  }
};

const deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    asset.status = "Discarded";
    asset.last_updated_by = req.user._id;
    await asset.save();

    const populated = await populateAssetChain(Asset.findById(asset._id));
    return res.status(200).json({ success: true, message: "Asset marked as Discarded.", data: populated });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAsset,
  getAllAssets,
  getAssetById,
  updateAsset,
  updateAssetStatus,
  deleteAsset,
};
