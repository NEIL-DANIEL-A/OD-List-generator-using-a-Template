import puppeteer from "puppeteer-core";
import { readFile } from "fs/promises";
import { join } from "path";
import { buildAttendanceHtml, buildCustomTemplateHtml, type TemplateLogos } from "./html-template";
import type { Participant, TemplateConfig } from "./types";

const CHROME_PATH =
  process.env.CHROME_PATH ||
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const ROWS_PER_PAGE = 17;

async function loadLogoDataUri(filename: string): Promise<string> {
  const filepath = join(process.cwd(), "public", filename);
  const content = await readFile(filepath, "utf-8");
  return `data:image/svg+xml;base64,${Buffer.from(content).toString("base64")}`;
}

async function loadPngDataUri(filename: string): Promise<string> {
  const filepath = join(process.cwd(), "public", filename);
  const content = await readFile(filepath);
  return `data:image/png;base64,${content.toString("base64")}`;
}

async function loadLogos(): Promise<TemplateLogos> {
  const [watermark, defaultTemplate] = await Promise.all([
    loadLogoDataUri("sbg_logo.svg"),
    loadPngDataUri("attendance_template.png"),
  ]);
  return { headerLeft: "", headerRight: "", footerLeft: "", footerRight: "", watermark, defaultTemplate };
}

export async function generateAttendancePdf(
  participants: Participant[],
  templateImage?: string,
  templateConfig?: TemplateConfig,
  rowCount?: number
): Promise<Uint8Array> {
  const rowsPerPage = (templateConfig?.rowsPerPage && templateConfig.rowsPerPage > 0) ? templateConfig.rowsPerPage : (rowCount || ROWS_PER_PAGE);
  const totalPages = Math.ceil(participants.length / rowsPerPage) || 1;
  const logos = await loadLogos();
  const useCustomTemplate = templateImage && templateConfig;

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    const allHtmlPages: string[] = [];
    for (let i = 0; i < totalPages; i++) {
      const start = i * rowsPerPage;
      const end = Math.min(start + rowsPerPage, participants.length);
      const pageParticipants = participants.slice(start, end);
      if (useCustomTemplate) {
        allHtmlPages.push(buildCustomTemplateHtml(pageParticipants, templateImage, templateConfig, rowsPerPage, logos.watermark));
      } else {
        allHtmlPages.push(buildAttendanceHtml(pageParticipants, logos, templateConfig));
      }
    }

    const combinedHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
</style>
</head>
<body>
${allHtmlPages.join('\n<div style="page-break-before: always;"></div>\n')}
</body>
</html>`;

    await page.setContent(combinedHtml, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    return new Uint8Array(pdfBuffer);
  } finally {
    await browser.close();
  }
}
