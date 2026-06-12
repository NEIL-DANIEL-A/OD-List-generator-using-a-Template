import type { Participant, TemplateConfig } from "./types";

const ROWS_PER_PAGE = 17;

function buildTableRows(participants: Participant[]): string {
  let rows = "";
  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    const bg = i % 2 === 0 ? "#f8f9fa" : "#ffffff";
    rows += `
      <tr style="background:${bg};">
        <td style="width:6%; text-align:center;">${p.sno}</td>
        <td style="width:18%; text-align:center;">${p.rollNumber}</td>
        <td style="width:42%; text-align:left; padding-left:8px;">${p.name}</td>
        <td style="width:14%; text-align:center;">${p.year}</td>
        <td style="width:20%; text-align:center;">${p.department}</td>
      </tr>`;
  }
  return rows;
}

export interface TemplateLogos {
  headerLeft: string;
  headerRight: string;
  footerLeft: string;
  footerRight: string;
  watermark: string;
  defaultTemplate?: string;
}

export function buildAttendanceHtml(
  participants: Participant[],
  logos: TemplateLogos,
  config?: TemplateConfig
): string {
  const PX_TO_MM = 0.264583;
  const tableXmm = config ? (config.tableX * PX_TO_MM).toFixed(2) : "16";
  const tableYmm = config ? (config.tableY * PX_TO_MM).toFixed(2) : "52";
  const tableWidthMm = config ? (config.tableWidth * PX_TO_MM).toFixed(2) : "189";
  const rowHeightMm = config ? (config.rowHeight * PX_TO_MM).toFixed(2) : "8";
  const rowsPerPage = config?.rowsPerPage || 17;
  const stripHeightMm = ((rowsPerPage + 1) * (config?.rowHeight || 30) * PX_TO_MM).toFixed(2);
  const colW = config?.columnWidths || [6, 18, 42, 14, 20];
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    width: 210mm;
    height: 297mm;
    background: white;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow: hidden;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 0;
    position: relative;
    overflow: hidden;
  }

  /* ---- TEMPLATE BACKGROUND ---- */
  .template-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }

  /* ---- WATERMARK ---- */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    opacity: 0.12;
    pointer-events: none;
    z-index: 3;
  }
  .watermark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* ---- TABLE ---- */
  .table-strip {
    position: absolute;
    left: 0;
    top: calc(${tableYmm}mm - 2mm);
    width: 210mm;
    height: calc(${stripHeightMm}mm + 3mm);
    background: white;
    z-index: 1;
  }
  .table-overlay {
    position: absolute;
    left: ${tableXmm}mm;
    top: ${tableYmm}mm;
    width: ${tableWidthMm}mm;
    z-index: 2;
  }
  .table-overlay table {
    width: 100%;
    border-collapse: collapse;
  }
  .table-overlay thead tr {
    height: ${rowHeightMm}mm;
  }
  .table-overlay thead th {
    background: #eef0f2;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    padding: 0 4px;
    border: 1px solid #d0d0d0;
    color: #333;
  }
  .table-overlay tbody tr {
    height: ${rowHeightMm}mm;
  }
  .table-overlay tbody td {
    font-size: 12px;
    padding: 0 4px;
    border: 1px solid #d0d0d0;
    vertical-align: middle;
  }
</style>
</head>
<body>
<div class="page">

  <!-- TEMPLATE BACKGROUND -->
  <img class="template-bg" src="${logos.defaultTemplate}" alt="">

  <!-- WHITE STRIP behind table -->
  <div class="table-strip"></div>

  <!-- WATERMARK -->
  <div class="watermark">
    <img src="${logos.watermark}" alt="">
  </div>

  <!-- TABLE -->
  <div class="table-overlay">
    <table>
      <thead>
        <tr>
          <th style="width:${colW[0]}%">S.NO</th>
          <th style="width:${colW[1]}%">ROLL NUMBER</th>
          <th style="width:${colW[2]}%">NAME</th>
          <th style="width:${colW[3]}%">YEAR</th>
          <th style="width:${colW[4]}%">DEPT</th>
        </tr>
      </thead>
      <tbody>
        ${buildTableRows(participants)}
      </tbody>
    </table>
  </div>

</div>
</body>
</html>`;
}

function buildCustomTableRows(participants: Participant[], colWidths: number[]): string {
  let rows = "";
  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    rows += `
      <tr>
        <td style="width:${colWidths[0]}%; text-align:center;">${p.sno}</td>
        <td style="width:${colWidths[1]}%; text-align:center;">${p.rollNumber}</td>
        <td style="width:${colWidths[2]}%; text-align:left; padding-left:8px;">${p.name}</td>
        <td style="width:${colWidths[3]}%; text-align:center;">${p.year}</td>
        <td style="width:${colWidths[4]}%; text-align:center;">${p.department}</td>
      </tr>`;
  }
  return rows;
}

export function buildCustomTemplateHtml(
  participants: Participant[],
  templateImage: string,
  config: TemplateConfig,
  rowCount: number,
  watermark?: string
): string {
  const PX_TO_MM = 0.264583;
  const tableXmm = (config.tableX * PX_TO_MM).toFixed(2);
  const tableYmm = (config.tableY * PX_TO_MM).toFixed(2);
  const tableWidthMm = (config.tableWidth * PX_TO_MM).toFixed(2);
  const rowHeightMm = (config.rowHeight * PX_TO_MM).toFixed(2);
  const stripHeightMm = ((rowCount + 1) * config.rowHeight * PX_TO_MM).toFixed(2);
  const colW = config.columnWidths;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    width: 210mm;
    height: 297mm;
    background: white;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    overflow: hidden;
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 0;
    position: relative;
    overflow: hidden;
  }
  .template-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
    z-index: 0;
  }
  .table-strip {
    position: absolute;
    left: 0;
    top: calc(${tableYmm}mm - 2mm);
    width: 210mm;
    height: calc(${stripHeightMm}mm + 3mm);
    background: white;
    z-index: 1;
  }
  .table-overlay {
    position: absolute;
    left: ${tableXmm}mm;
    top: ${tableYmm}mm;
    width: ${tableWidthMm}mm;
    z-index: 2;
  }
  .table-overlay table {
    width: 100%;
    border-collapse: collapse;
  }
  .table-overlay thead tr {
    height: ${rowHeightMm}mm;
  }
  .table-overlay thead th {
    background: #eef0f2;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    padding: 0 4px;
    border: 1px solid #d0d0d0;
    color: #333;
  }
  .table-overlay tbody tr {
    height: ${rowHeightMm}mm;
  }
  .table-overlay tbody td {
    font-size: 12px;
    padding: 0 4px;
    border: 1px solid #d0d0d0;
    vertical-align: middle;
  }
  .watermark-custom {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 350px;
    height: 350px;
    opacity: 0.12;
    pointer-events: none;
    z-index: 3;
  }
  .watermark-custom img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
</head>
<body>
<div class="page">
  <img class="template-bg" src="${templateImage}" alt="">
  <div class="table-strip"></div>
  <div class="table-overlay">
    <table>
      <thead>
        <tr>
          <th style="width:${config.columnWidths[0]}%">S.NO</th>
          <th style="width:${config.columnWidths[1]}%">ROLL NUMBER</th>
          <th style="width:${config.columnWidths[2]}%">NAME</th>
          <th style="width:${config.columnWidths[3]}%">YEAR</th>
          <th style="width:${config.columnWidths[4]}%">DEPT</th>
        </tr>
      </thead>
      <tbody>
        ${buildCustomTableRows(participants, config.columnWidths)}
      </tbody>
    </table>
  </div>
  ${watermark ? `<div class="watermark-custom"><img src="${watermark}" alt=""></div>` : ""}
</div>
</body>
</html>`;
}
