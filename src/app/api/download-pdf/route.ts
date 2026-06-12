import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readFile, unlink } from "fs/promises";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "PDF ID is required" },
        { status: 400 }
      );
    }

    const pdf = await prisma.generatedPdf.findUnique({ where: { id } });
    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    const pdfBytes = await readFile(pdf.filepath);

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${pdf.filename}"`,
      },
    });
  } catch (error) {
    console.error("Failed to download PDF:", error);
    return NextResponse.json(
      { error: "Failed to download PDF" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "PDF ID is required" },
        { status: 400 }
      );
    }

    const pdf = await prisma.generatedPdf.findUnique({ where: { id } });
    if (!pdf) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 });
    }

    try {
      await unlink(pdf.filepath);
    } catch {
      // File might already be deleted
    }

    await prisma.generatedPdf.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete PDF:", error);
    return NextResponse.json(
      { error: "Failed to delete PDF" },
      { status: 500 }
    );
  }
}
