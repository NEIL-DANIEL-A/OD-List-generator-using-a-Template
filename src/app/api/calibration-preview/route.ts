import { NextResponse } from "next/server";
import { generateAttendancePdf } from "@/lib/pdf-generator";
import type { Participant, TemplateConfig } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participants, templateImage, templateConfig, rowCount } = body as {
      participants: Participant[];
      templateImage?: string;
      templateConfig?: TemplateConfig;
      rowCount?: number;
    };

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json({ error: "No participants provided" }, { status: 400 });
    }

    const pdfBytes = await generateAttendancePdf(participants, templateImage, templateConfig, rowCount);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="calibration-preview.pdf"',
      },
    });
  } catch (error) {
    console.error("Failed to generate calibration preview:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate preview" },
      { status: 500 }
    );
  }
}
