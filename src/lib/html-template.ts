import type { Participant } from "./types";

const ROWS_PER_PAGE = 17;

function buildTableRows(participants: Participant[]): string {
  let rows = "";
  for (let i = 0; i < ROWS_PER_PAGE; i++) {
    const p = participants[i];
    const bg = i % 2 === 0 ? "#f8f9fa" : "#ffffff";
    rows += `
      <tr style="background:${bg};">
        <td style="width:6%; text-align:center;">${p ? p.sno : ""}</td>
        <td style="width:18%; text-align:center;">${p ? p.rollNumber : ""}</td>
        <td style="width:42%; text-align:left; padding-left:8px;">${p ? p.name : ""}</td>
        <td style="width:14%; text-align:center;">${p ? p.year : ""}</td>
        <td style="width:20%; text-align:center;">${p ? p.department : ""}</td>
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
}

export function buildAttendanceHtml(
  participants: Participant[],
  logos: TemplateLogos
): string {
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
  }
  .page {
    width: 210mm;
    height: 297mm;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
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
    z-index: 0;
  }
  .watermark img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  /* ---- HEADER ---- */
  .header {
    background: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 100px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .logo-r {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-r img {
    width: 70px;
    height: 70px;
    object-fit: contain;
  }
  .header-title {
    text-align: center;
    flex: 1;
  }
  .header-title h1 {
    font-size: 27px;
    font-weight: 800;
    color: #6f52df;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .header-title h2 {
    font-size: 20px;
    font-weight: 700;
    color: #000000ff;
    margin-top: 2px;
  }
  .logo-aws {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-aws img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }

  /* ---- DIVIDER ---- */
  .divider {
    height: 3px;
    background: #5b2d8e;
    width: 100%;
  }

  /* ---- PARTICIPANTS HEADING ---- */
  .participants-heading {
    text-align: center;
    padding: 8px 0 4px 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
  }

  /* ---- TABLE ---- */
  .table-wrapper {
    flex: 1;
    padding: 0 16px;
  }
  table {
    margin-left: auto;
    margin-right: auto;
    width: 95%;
    border-collapse: collapse;
  }
  thead th {
    background: #eef0f2;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    padding: 2px 4px;
    border: 1px solid #d0d0d0;
    color: #333;
  }
  tbody td {
    font-size: 16px;
    padding: 0 4px;
    border: 1px solid #d0d0d0;
    vertical-align: middle;
    line-height: 3.2;
  }

  /* ---- FOOTER ---- */
  .footer-divider {
    height: 3px;
    background: #5b2d8e;
    width: 100%;
    margin-top: auto;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 20px;
    font-size: 15px;
    color: #000000ff;
    background: #fff;
  }
  .footer-left {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .footer-right {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 600;
    color: #000000ff;
  }
</style>
</head>
<body>
<div class="page">

  <!-- WATERMARK -->
  <div class="watermark">
    <img src="${logos.watermark}" alt="">
  </div>

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <div class="logo-r"><img src="${logos.headerLeft}" alt="REC"></div>
    </div>
    <div class="header-title">
      <h1>AWS Student Builder Group REC</h1>
      <h2>RAJALAKSHMI ENGINEERING COLLEGE</h2>
    </div>
    <div class="logo-aws">
      <img src="${logos.headerRight}" alt="AWS">
    </div>
  </div>

  <div class="divider"></div>
  <br>
  <!-- PARTICIPANTS HEADING -->
  <div class="participants-heading">PARTICIPANTS</div>
  <br>
  <!-- TABLE -->
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>S.NO</th>
          <th>ROLL NUMBER</th>
          <th>NAME</th>
          <th>YEAR</th>
          <th>DEPT</th>
        </tr>
      </thead>
      <tbody>
        ${buildTableRows(participants)}
      </tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div class="footer-divider"></div>
  <div class="footer">
    <div class="footer-left">
      <img src="${logos.footerLeft}" alt="email" style="width:20px;height:20px;">
      <span>awscloudclub@rajalakshmi.edu.in</span>
    </div>
    <div class="footer-right">
      <img src="${logos.footerRight}" alt="AWS" style="width:20px;height:20px;">
      <span>AWS Student Builder Group</span>
    </div>
  </div>

</div>
</body>
</html>`;
}
