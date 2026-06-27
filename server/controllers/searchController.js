const { Room } = require("../models/Room");
const { Asset } = require("../models/Asset");

const search = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res
        .status(400)
        .json({ success: false, message: "Search query must be at least 2 characters." });
    }

    const [roomsRaw, assetsRaw] = await Promise.all([
      Room.find({
        $or: [
          { room_number: { $regex: q, $options: "i" } },
          { room_name: { $regex: q, $options: "i" } },
          { room_type: { $regex: q, $options: "i" } },
          { landmark: { $regex: q, $options: "i" } },
        ],
      })
        .limit(20)
        .populate({
          path: "floor_id",
          select: "floor_label block_id",
          populate: { path: "block_id", select: "block_name" },
        }),
      Asset.find({
        $or: [
          { asset_name: { $regex: q, $options: "i" } },
          { asset_code: { $regex: q, $options: "i" } },
          { category: { $regex: q, $options: "i" } },
          { brand: { $regex: q, $options: "i" } },
          { model_number: { $regex: q, $options: "i" } },
        ],
      })
        .limit(20)
        .populate({
          path: "room_id",
          select: "room_number room_name floor_id",
          populate: {
            path: "floor_id",
            select: "floor_label block_id",
            populate: { path: "block_id", select: "block_name" },
          },
        }),
    ]);

    const rooms = roomsRaw.map((room) => ({
      type: "room",
      id: room._id,
      name: room.room_name || room.room_number,
      room_number: room.room_number,
      room_type: room.room_type,
      breadcrumb: `${room.floor_id?.block_id?.block_name || "Unknown Block"} > ${
        room.floor_id?.floor_label || "Unknown Floor"
      } > ${room.room_number}`,
      seating_capacity: room.seating_capacity,
      has_projector: room.has_projector,
      has_ac: room.has_ac,
    }));

    const assets = assetsRaw.map((asset) => ({
      type: "asset",
      id: asset._id,
      name: asset.asset_name,
      asset_code: asset.asset_code,
      category: asset.category,
      status: asset.status,
      breadcrumb: `${asset.room_id?.floor_id?.block_id?.block_name || "Unknown Block"} > ${
        asset.room_id?.floor_id?.floor_label || "Unknown Floor"
      } > ${asset.room_id?.room_number || "Unknown Room"}`,
      room_name: asset.room_id?.room_name,
      brand: asset.brand,
    }));

    const total = rooms.length + assets.length;
    if (total === 0) {
      return res.status(200).json({
        success: true,
        data: { query: q, total: 0, rooms: [], assets: [] },
        message: "No results found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { query: q, total, rooms, assets },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { search };
