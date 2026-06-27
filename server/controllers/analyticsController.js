const Block = require("../models/Block");
const Floor = require("../models/Floor");
const { Room, ROOM_TYPES } = require("../models/Room");
const { Asset, ASSET_STATUSES, ASSET_CATEGORIES } = require("../models/Asset");
const { MaintenanceLog, REPAIR_STATUSES } = require("../models/MaintenanceLog");
const User = require("../models/User");

const withDefaults = (items, key, value, defaults) =>
  items.reduce((acc, item) => ({ ...acc, [item[key]]: item[value] }), { ...defaults });

const getAnalyticsSummary = async (_req, res, next) => {
  try {
    const statusDefaults = ASSET_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
    const categoryDefaults = ASSET_CATEGORIES.reduce((acc, c) => ({ ...acc, [c]: 0 }), {});
    const roomTypeDefaults = ROOM_TYPES.reduce((acc, t) => ({ ...acc, [t]: 0 }), {});
    const maintenanceDefaults = REPAIR_STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});

    const [
      total_blocks,
      total_floors,
      total_rooms,
      total_assets,
      total_users,
      pending_maintenance_count,
      active_maintenance_count,
      assetsByStatusAgg,
      assetsByCategoryAgg,
      roomsByTypeAgg,
      topDamagedBlocksAgg,
      maintenanceByStatusAgg,
      recentMaintenanceRaw,
    ] = await Promise.all([
      Block.countDocuments(),
      Floor.countDocuments(),
      Room.countDocuments(),
      Asset.countDocuments(),
      User.countDocuments(),
      MaintenanceLog.countDocuments({ repair_status: "Pending" }),
      MaintenanceLog.countDocuments({ repair_status: "In Progress" }),
      Asset.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Asset.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
      Room.aggregate([{ $group: { _id: "$room_type", count: { $sum: 1 } } }]),
      Asset.aggregate([
        { $match: { status: "Damaged" } },
        {
          $lookup: {
            from: "rooms",
            localField: "room_id",
            foreignField: "_id",
            as: "room",
          },
        },
        { $unwind: "$room" },
        {
          $lookup: {
            from: "floors",
            localField: "room.floor_id",
            foreignField: "_id",
            as: "floor",
          },
        },
        { $unwind: "$floor" },
        {
          $lookup: {
            from: "blocks",
            localField: "floor.block_id",
            foreignField: "_id",
            as: "block",
          },
        },
        { $unwind: "$block" },
        {
          $group: {
            _id: "$block._id",
            block_name: { $first: "$block.block_name" },
            damaged_count: { $sum: 1 },
          },
        },
        { $sort: { damaged_count: -1 } },
        { $limit: 5 },
        { $project: { _id: 0, block_name: 1, damaged_count: 1 } },
      ]),
      MaintenanceLog.aggregate([{ $group: { _id: "$repair_status", count: { $sum: 1 } } }]),
      MaintenanceLog.find({})
        .sort({ reported_at: -1 })
        .limit(5)
        .populate("asset_id", "asset_name")
        .populate("reported_by", "username"),
    ]);

    const assets_by_status = withDefaults(
      assetsByStatusAgg.map((x) => ({ key: x._id, count: x.count })),
      "key",
      "count",
      statusDefaults
    );
    const assets_by_category = withDefaults(
      assetsByCategoryAgg.map((x) => ({ key: x._id, count: x.count })),
      "key",
      "count",
      categoryDefaults
    );
    const rooms_by_type = withDefaults(
      roomsByTypeAgg.map((x) => ({ key: x._id, count: x.count })),
      "key",
      "count",
      roomTypeDefaults
    );
    const maintenance_by_status = withDefaults(
      maintenanceByStatusAgg.map((x) => ({ key: x._id, count: x.count })),
      "key",
      "count",
      maintenanceDefaults
    );

    const recent_maintenance = recentMaintenanceRaw.map((log) => ({
      _id: log._id,
      issue_title: log.issue_title,
      repair_status: log.repair_status,
      priority: log.priority,
      asset_name: log.asset_id?.asset_name || null,
      reported_by_username: log.reported_by?.username || null,
      reported_at: log.reported_at,
    }));

    return res.status(200).json({
      success: true,
      data: {
        total_blocks,
        total_floors,
        total_rooms,
        total_assets,
        total_users,
        pending_maintenance_count,
        active_maintenance_count,
        assets_by_status,
        assets_by_category,
        rooms_by_type,
        top_damaged_blocks: topDamagedBlocksAgg,
        maintenance_by_status,
        recent_maintenance,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getAnalyticsSummary };
