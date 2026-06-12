import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [totalEvents, totalFiles, totalPdfs, recentEvents] =
      await Promise.all([
        prisma.event.count(),
        prisma.uploadedFile.count(),
        prisma.generatedPdf.count(),
        prisma.event.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalEvents,
        totalFiles,
        totalPdfs,
      },
      recentEvents,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
