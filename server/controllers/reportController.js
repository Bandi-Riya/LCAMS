const { Asset } = require("../models/Asset");
const { MaintenanceLog } = require("../models/MaintenanceLog");
const Floor = require("../models/Floor");
const { Room } = require("../models/Room");
const Block = require("../models/Block");
const generatePDF = require("../utils/exportPDF");
const generateExcel = require("../utils/exportExcel");

const buildFilterLabel = (entries) => {
  const parts = entries.filter((item) => item && item.value).map((item) => `${item.label}: ${item.value}`);
  return parts.length ? parts.join(" | ") : "None";
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const fetchAssetsForReport = async (query) => {
  const { block_id, status, category, from_date, to_date } = query;
  const dbQuery = {};
  if (status) dbQuery.status = status;
  if (category) dbQuery.category = category;

  if (from_date || to_date) {
    dbQuery.created_at = {};
    if (from_date) dbQuery.created_at.$gte = new Date(from_date);
    if (to_date) dbQuery.created_at.$lte = new Date(to_date);
  }

  if (block_id) {
    const floorIds = (await Floor.find({ block_id }).select("_id")).map((f) => f._id);
    const roomIds = (await Room.find({ floor_id: { $in: floorIds } }).select("_id")).map((r) => r._id);
    dbQuery.room_id = { $in: roomIds };
  }

  const assets = await Asset.find(dbQuery).populate({
    path: "room_id",
    select: "room_number room_name floor_id",
    populate: {
      path: "floor_id",
      select: "floor_label block_id",
      populate: { path: "block_id", select: "block_name" },
    },
  });

  let blockName = "";
  if (block_id) {
    const block = await Block.findById(block_id);
    blockName = block?.block_name || block_id;
  }

  const filters = buildFilterLabel([
    { label: "Block", value: blockName },
    { label: "Status", value: status },
    { label: "Category", value: category },
    { label: "From Date", value: from_date },
    { label: "To Date", value: to_date },
  ]);

  return { assets, filters };
};

const fetchMaintenanceForReport = async (query) => {
  const { repair_status, priority, from_date, to_date } = query;
  const dbQuery = {};
  if (repair_status) dbQuery.repair_status = repair_status;
  if (priority) dbQuery.priority = priority;
  if (from_date || to_date) {
    dbQuery.reported_at = {};
    if (from_date) dbQuery.reported_at.$gte = new Date(from_date);
    if (to_date) dbQuery.reported_at.$lte = new Date(to_date);
  }

  const logs = await MaintenanceLog.find(dbQuery)
    .populate("asset_id", "asset_name asset_code")
    .populate("reported_by", "username");

  const filters = buildFilterLabel([
    { label: "Status", value: repair_status },
    { label: "Priority", value: priority },
    { label: "From Date", value: from_date },
    { label: "To Date", value: to_date },
  ]);

  return { logs, filters };
};

const exportAssetsPDF = async (req, res, next) => {
  try {
    const { assets, filters } = await fetchAssetsForReport(req.query);
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Disposition", `attachment; filename="asset-report-${today}.pdf"`);

    const columns = [
      "Asset Code",
      "Asset Name",
      "Category",
      "Brand",
      "Status",
      "Room",
      "Floor",
      "Block",
      "Purchase Date",
      "Warranty Expiry",
    ];
    const rows = assets.map((a) => [
      a.asset_code || "",
      a.asset_name || "",
      a.category || "",
      a.brand || "",
      a.status || "",
      a.room_id?.room_number || "",
      a.room_id?.floor_id?.floor_label || "",
      a.room_id?.floor_id?.block_id?.block_name || "",
      formatDate(a.purchase_date),
      formatDate(a.warranty_expiry),
    ]);

    generatePDF("LCAMS - Asset Inventory Report", columns, rows, filters, res);
  } catch (error) {
    return next(error);
  }
};

const exportAssetsExcel = async (req, res, next) => {
  try {
    const { assets } = await fetchAssetsForReport(req.query);
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="asset-report-${today}.xlsx"`);

    const columns = [
      "Asset Code",
      "Asset Name",
      "Category",
      "Brand",
      "Status",
      "Room",
      "Floor",
      "Block",
      "Purchase Date",
      "Warranty Expiry",
    ];
    const rows = assets.map((a) => [
      a.asset_code || "",
      a.asset_name || "",
      a.category || "",
      a.brand || "",
      a.status || "",
      a.room_id?.room_number || "",
      a.room_id?.floor_id?.floor_label || "",
      a.room_id?.floor_id?.block_id?.block_name || "",
      formatDate(a.purchase_date),
      formatDate(a.warranty_expiry),
    ]);

    await generateExcel("Asset Inventory", columns, rows, res);
  } catch (error) {
    return next(error);
  }
};

const exportMaintenancePDF = async (req, res, next) => {
  try {
    const { logs, filters } = await fetchMaintenanceForReport(req.query);
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Disposition", `attachment; filename="maintenance-report-${today}.pdf"`);

    const columns = [
      "Log ID",
      "Asset Code",
      "Asset Name",
      "Issue Title",
      "Priority",
      "Status",
      "Reported By",
      "Reported At",
      "Resolved At",
    ];
    const rows = logs.map((l) => [
      String(l._id),
      l.asset_id?.asset_code || "",
      l.asset_id?.asset_name || "",
      l.issue_title || "",
      l.priority || "",
      l.repair_status || "",
      l.reported_by?.username || "",
      formatDate(l.reported_at),
      formatDate(l.resolved_at),
    ]);

    generatePDF("LCAMS - Maintenance Log Report", columns, rows, filters, res);
  } catch (error) {
    return next(error);
  }
};

const exportMaintenanceExcel = async (req, res, next) => {
  try {
    const { logs } = await fetchMaintenanceForReport(req.query);
    const today = new Date().toISOString().slice(0, 10);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="maintenance-report-${today}.xlsx"`);

    const columns = [
      "Log ID",
      "Asset Code",
      "Asset Name",
      "Issue Title",
      "Priority",
      "Status",
      "Reported By",
      "Reported At",
      "Resolved At",
    ];
    const rows = logs.map((l) => [
      String(l._id),
      l.asset_id?.asset_code || "",
      l.asset_id?.asset_name || "",
      l.issue_title || "",
      l.priority || "",
      l.repair_status || "",
      l.reported_by?.username || "",
      formatDate(l.reported_at),
      formatDate(l.resolved_at),
    ]);

    await generateExcel("Maintenance Logs", columns, rows, res);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  exportAssetsPDF,
  exportAssetsExcel,
  exportMaintenancePDF,
  exportMaintenanceExcel,
};
