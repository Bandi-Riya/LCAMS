const mongoose = require("mongoose");
const { MaintenanceLog, PRIORITIES, REPAIR_STATUSES } = require("../models/MaintenanceLog");
const { Asset } = require("../models/Asset");
const User = require("../models/User");

const createMaintenanceLog = async (req, res, next) => {
  try {
    const { asset_id, issue_title, issue_description, priority } = req.body;

    if (!asset_id || !issue_title) {
      return res.status(400).json({ success: false, message: "asset_id and issue_title are required." });
    }

    const asset = await Asset.findById(asset_id);
    if (!asset) {
      return res.status(404).json({ success: false, message: "Asset not found." });
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority value." });
    }

    const log = await MaintenanceLog.create({
      asset_id,
      issue_title,
      issue_description,
      priority: priority || "Medium",
      reported_by: req.user._id,
      repair_status: "Pending",
      reported_at: new Date(),
    });

    const populated = await MaintenanceLog.findById(log._id)
      .populate("asset_id", "asset_name asset_code status")
      .populate("reported_by", "username email");

    return res.status(201).json({ success: true, data: populated, message: "Maintenance log created successfully." });
  } catch (error) {
    return next(error);
  }
};

const getAllMaintenanceLogs = async (req, res, next) => {
  try {
    const { asset_id, repair_status, priority, assigned_to, from_date, to_date } = req.query;
    const query = {};

    if (asset_id) query.asset_id = asset_id;
    if (repair_status) query.repair_status = repair_status;
    if (priority) query.priority = priority;
    if (assigned_to) query.assigned_to = assigned_to;

    if (from_date || to_date) {
      query.reported_at = {};
      if (from_date) query.reported_at.$gte = new Date(from_date);
      if (to_date) query.reported_at.$lte = new Date(to_date);
    }

    const logs = await MaintenanceLog.find(query)
      .populate("asset_id", "asset_name asset_code status")
      .populate("reported_by", "username email")
      .populate("assigned_to", "username email");

    const order = { Pending: 0, "In Progress": 1, Resolved: 2, Closed: 3 };
    logs.sort((a, b) => {
      const ao = order[a.repair_status] ?? 99;
      const bo = order[b.repair_status] ?? 99;
      if (ao !== bo) return ao - bo;
      return new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime();
    });

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    return next(error);
  }
};

const getMaintenanceLogById = async (req, res, next) => {
  try {
    const log = await MaintenanceLog.findById(req.params.id)
      .populate({
        path: "asset_id",
        populate: {
          path: "room_id",
          select: "room_number room_name floor_id",
          populate: {
            path: "floor_id",
            select: "floor_label floor_number block_id",
            populate: { path: "block_id", select: "block_name block_code" },
          },
        },
      })
      .populate("reported_by", "username email")
      .populate("assigned_to", "username email");

    if (!log) {
      return res.status(404).json({ success: false, message: "Maintenance log not found." });
    }

    return res.status(200).json({ success: true, data: log });
  } catch (error) {
    return next(error);
  }
};

const updateMaintenanceLog = async (req, res, next) => {
  try {
    const allowed = [
      "issue_title",
      "issue_description",
      "priority",
      "assigned_to",
      "resolution_notes",
      "cost_of_repair",
    ];

    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (updates.priority !== undefined && !PRIORITIES.includes(updates.priority)) {
      return res.status(400).json({ success: false, message: "Invalid priority value." });
    }

    if (updates.assigned_to !== undefined && updates.assigned_to) {
      const assignedUser = await User.findById(updates.assigned_to).populate("role_id", "role_name");
      if (!assignedUser) {
        return res.status(404).json({ success: false, message: "Assigned user not found." });
      }
      if (assignedUser.role_id?.role_name !== "Maintenance") {
        return res.status(400).json({ success: false, message: "Assigned user must have Maintenance role." });
      }
    }

    if (updates.cost_of_repair !== undefined) {
      const value = Number(updates.cost_of_repair);
      if (Number.isNaN(value) || value <= 0) {
        return res.status(400).json({ success: false, message: "cost_of_repair must be a positive number." });
      }
      updates.cost_of_repair = value;
    }

    const log = await MaintenanceLog.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate("asset_id", "asset_name asset_code status")
      .populate("reported_by", "username email")
      .populate("assigned_to", "username email");

    if (!log) {
      return res.status(404).json({ success: false, message: "Maintenance log not found." });
    }

    return res.status(200).json({ success: true, data: log, message: "Maintenance log updated successfully." });
  } catch (error) {
    return next(error);
  }
};

const updateMaintenanceStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { repair_status, resolution_notes } = req.body;

    if (!repair_status) {
      return res.status(400).json({ success: false, message: "repair_status is required." });
    }
    if (!REPAIR_STATUSES.includes(repair_status)) {
      return res.status(400).json({ success: false, message: "Invalid repair_status value." });
    }

    let responsePayload = null;

    await session.withTransaction(async () => {
      const log = await MaintenanceLog.findById(req.params.id).session(session);
      if (!log) {
        responsePayload = { http: 404, body: { success: false, message: "Maintenance log not found." } };
        return;
      }

      if (log.repair_status === "Resolved" || log.repair_status === "Closed") {
        responsePayload = {
          http: 400,
          body: { success: false, message: `This maintenance log is already ${log.repair_status} and cannot be updated.` },
        };
        return;
      }

      if (repair_status === "Resolved") {
        if (!resolution_notes) {
          responsePayload = { http: 400, body: { success: false, message: "resolution_notes is required to resolve." } };
          return;
        }

        log.repair_status = "Resolved";
        log.resolved_at = new Date();
        log.resolution_notes = resolution_notes;
        await log.save({ session });

        const asset = await Asset.findById(log.asset_id).session(session);
        if (asset) {
          asset.status = "Working";
          asset.last_updated_by = req.user._id;
          await asset.save({ session });
        }

        responsePayload = {
          http: 200,
          body: {
            success: true,
            message: "Maintenance resolved. Asset status restored to Working.",
            data: { log, asset },
          },
        };
        return;
      }

      if (repair_status === "In Progress") {
        log.repair_status = "In Progress";
        await log.save({ session });

        const asset = await Asset.findById(log.asset_id).session(session);
        if (asset && asset.status !== "Under Maintenance") {
          asset.status = "Under Maintenance";
          asset.last_updated_by = req.user._id;
          await asset.save({ session });
        }

        responsePayload = {
          http: 200,
          body: { success: true, data: log, message: "Status updated to In Progress." },
        };
        return;
      }

      if (repair_status === "Closed") {
        log.repair_status = "Closed";
        await log.save({ session });
        responsePayload = { http: 200, body: { success: true, data: log, message: "Log closed." } };
      } else {
        log.repair_status = repair_status;
        await log.save({ session });
        responsePayload = { http: 200, body: { success: true, data: log, message: "Status updated." } };
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

module.exports = {
  createMaintenanceLog,
  getAllMaintenanceLogs,
  getMaintenanceLogById,
  updateMaintenanceLog,
  updateMaintenanceStatus,
};
