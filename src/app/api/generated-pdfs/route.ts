import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const pdfs = await prisma.generatedPdf.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ pdfs });
  } catch (error) {
    console.error("Failed to fetch generated PDFs:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDFs" },
      { status: 500 }
    );
  }
}
