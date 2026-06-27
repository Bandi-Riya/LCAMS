const { MaintenanceLog } = require("../models/MaintenanceLog");

const createDamageLog = async (assetId, userId, username, session) => {
  const log = await MaintenanceLog.create(
    [
      {
        asset_id: assetId,
        issue_title: "Auto-generated: Asset marked as Damaged",
        issue_description: `Status changed to Damaged by ${username}`,
        reported_by: userId,
        assigned_to: null,
        priority: "Medium",
        repair_status: "Pending",
        reported_at: new Date(),
      },
    ],
    session ? { session } : undefined
  );

  return Array.isArray(log) ? log[0] : log;
};

module.exports = { createDamageLog };
