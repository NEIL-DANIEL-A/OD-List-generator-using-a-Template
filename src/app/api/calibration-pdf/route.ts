import { NextResponse } from "next/server";
import { generateAttendancePdf } from "@/lib/pdf-generator";
import type { Participant } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { participants } = body as { participants: Participant[] };

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return NextResponse.json(
        { error: "No participants provided" },
        { status: 400 }
      );
    }

    const pdfBytes = await generateAttendancePdf(participants);

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="calibration-preview.pdf"',
      },
    });
  } catch (error) {
    console.error("Failed to generate calibration PDF:", error);
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
