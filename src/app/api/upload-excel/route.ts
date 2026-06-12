import { NextResponse } from "next/server";
import { parseExcelFile } from "@/lib/excel-parser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
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

    return NextResponse.json({ participants });
  } catch (error) {
    console.error("Failed to parse Excel:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to parse Excel file",
      },
      { status: 400 }
    );
  }
}
