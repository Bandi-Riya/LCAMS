const ExcelJS = require("exceljs");

const getColumnWidth = (header, rows, colIndex) => {
  let max = String(header || "").length;
  rows.forEach((row) => {
    const val = row[colIndex] ?? "";
    max = Math.max(max, String(val).length);
  });
  return Math.min(max + 4, 40);
};

const generateExcel = async (sheetName, columns, rows, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.addRow(columns);
  const header = worksheet.getRow(1);
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2C5F8A" } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  rows.forEach((row, idx) => {
    const rowRef = worksheet.addRow(row);
    rowRef.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: idx % 2 === 0 ? "FFFFFFFF" : "FFEBF3FB" },
      };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
  });

  worksheet.columns = columns.map((headerValue, colIndex) => ({
    width: getColumnWidth(headerValue, rows, colIndex),
  }));
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  res.end(buffer);
};

module.exports = generateExcel;
