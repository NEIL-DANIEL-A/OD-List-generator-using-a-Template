import { NextResponse } from "next/server";
import { parseExcelFile } from "@/lib/excel-parser";
import { generateAttendancePdf } from "@/lib/pdf-generator";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import type { TemplateConfig } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const eventName = formData.get("eventName") as string | null;
    const templateImageFile = formData.get("templateImage") as File | null;
    const templateConfigStr = formData.get("templateConfig") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.xlsx?$/i)) {
      return NextResponse.json(
        { error: "Invalid file type. Only .xlsx and .xls files are accepted" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const participants = parseExcelFile(buffer);

    let templateImage: string | undefined;
    let templateConfig: TemplateConfig | undefined;

    if (templateImageFile && templateConfigStr) {
      const imgBuffer = Buffer.from(await templateImageFile.arrayBuffer());
      const ext = templateImageFile.name.split(".").pop()?.toLowerCase() || "png";
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext}`;
      templateImage = `data:${mime};base64,${imgBuffer.toString("base64")}`;
      templateConfig = JSON.parse(templateConfigStr);
    }

    const pdfBytes = await generateAttendancePdf(participants, templateImage, templateConfig, templateConfig?.rowsPerPage);

    const uploadsDir = join(process.cwd(), "uploads", "generated-pdfs");
    await mkdir(uploadsDir, { recursive: true });

    const name = eventName || "attendance";
    const filename = `${name.replace(/[^a-zA-Z0-9]/g, "-")}-${uuidv4().slice(0, 8)}.pdf`;
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, pdfBytes);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}
