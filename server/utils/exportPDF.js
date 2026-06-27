const PDFDocument = require("pdfkit");

const drawTableRow = (doc, row, y, colWidths, style = "data", index = 0) => {
  const rowHeight = 22;
  const xStart = doc.page.margins.left;
  const tableWidth = colWidths.reduce((sum, w) => sum + w, 0);
  const bgColor =
    style === "header" ? "#e0e0e0" : index % 2 === 0 ? "#ffffff" : "#f9f9f9";

  doc.rect(xStart, y, tableWidth, rowHeight).fill(bgColor);
  doc.fillColor("#000000");
  doc.lineWidth(0.3).rect(xStart, y, tableWidth, rowHeight).stroke("#d0d0d0");

  let x = xStart;
  row.forEach((cell, i) => {
    doc
      .font(style === "header" ? "Helvetica-Bold" : "Helvetica")
      .fontSize(style === "header" ? 10 : 9)
      .fillColor("#000000")
      .text(String(cell ?? ""), x + 4, y + 6, {
        width: colWidths[i] - 8,
        align: "left",
        ellipsis: true,
      });
    x += colWidths[i];
  });
};

const ensurePageForTable = (doc, currentY, neededHeight) => {
  const bottomBoundary = doc.page.height - doc.page.margins.bottom - 30;
  if (currentY + neededHeight > bottomBoundary) {
    doc.addPage();
    return doc.page.margins.top + 10;
  }
  return currentY;
};

const generatePDF = (title, columns, rows, filters, res) => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    bufferPages: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / columns.length;
  const colWidths = columns.map(() => colWidth);

  doc.font("Helvetica-Bold").fontSize(18).text(title, 0, 40, { align: "center" });
  const generatedOn = new Date().toLocaleString();
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(`Generated on: ${generatedOn}`, doc.page.margins.left, 78, { align: "left" })
    .text(`Filters: ${filters || "None"}`, doc.page.margins.left, 94, { align: "left" });

  let y = 132;
  drawTableRow(doc, columns, y, colWidths, "header");
  y += 22;

  rows.forEach((row, idx) => {
    y = ensurePageForTable(doc, y, 22);
    if (y === doc.page.margins.top + 10) {
      drawTableRow(doc, columns, y, colWidths, "header");
      y += 22;
    }
    drawTableRow(doc, row, y, colWidths, "data", idx);
    y += 22;
  });

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#444444")
      .text(`Total: ${rows.length} records | Page ${i + 1} of ${range.count}`, doc.page.margins.left, doc.page.height - 30, {
        align: "right",
      });
  }

  doc.end();
};

module.exports = generatePDF;
